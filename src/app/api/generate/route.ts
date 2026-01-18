import { NextResponse } from "next/server";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { AFFILIATE_MAP } from "@/lib/affiliateMap";
import { getUserFromRequest } from "@/lib/auth";
import { LIMITS as INPUT_LIMITS, MODES, type Mode } from "@/lib/constants";
import { getClientIp } from "@/lib/ip";
import { getOpenAIClient, withCircuitBreaker } from "@/lib/openai";
import { getRedisClient } from "@/lib/redis";
import { logSecurityEvent } from "@/lib/securityEvents";
import {
  SYSTEM_PROMPT,
  isValidGenerateResponse,
  type GenerateResponse,
} from "@/lib/prompts";
import { consumeQuota, getQuotaStatus } from "@/lib/quota";
import {
  SECURITY_HEADERS,
  checkRateLimit,
  createRateLimitHeaders,
  validateImageSize,
  validateTextLength,
  validateImageContent,
  generateDeviceFingerprint,
} from "@/lib/security";
import { logError, createAppError } from "@/lib/errors";
import { generateRequestId, createResponseHeaders, logger } from "@/lib/requestContext";

export const runtime = "edge";
export const maxDuration = 60;

const MODE_SET = new Set(MODES.map((mode) => mode.toLowerCase()));
const CACHE_TTL_SECONDS = Number(process.env.GEN_CACHE_TTL_SECONDS ?? 3600);
const MAX_INFLIGHT = Number(process.env.GEN_MAX_INFLIGHT ?? 25);
const INFLIGHT_KEY = "gen:inflight";
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

// Request timeout (30 seconds for OpenAI)
const OPENAI_TIMEOUT = 30000;

function normalizeMode(input: string | null): Mode {
  const candidate = input?.trim().toLowerCase() || "standard";
  if (!MODE_SET.has(candidate)) return "Standard";
  const normalized = candidate[0].toUpperCase() + candidate.slice(1);
  return normalized as Mode;
}

function safeJsonParse(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

async function hashValue(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt += 1;
      const status = (error as { status?: number }).status;
      if (attempt > retries || (status && !RETRYABLE_STATUS.has(status))) {
        throw error;
      }
      const delay = 300 * 2 ** (attempt - 1) + Math.random() * 150;
      await sleep(delay);
    }
  }
}

export async function POST(request: Request) {
  const requestId = generateRequestId();
  let userId: string | null = null;
  let ipAddr: string | null = null;
  const startTime = Date.now();
  const pathname = new URL(request.url).pathname;

  try {
    const user = await getUserFromRequest(request);
    userId = user?.id ?? null;
    const ip = getClientIp(request);
    ipAddr = ip ?? null;

    logger.info("Generate request started", {
      requestId,
      userId,
      ip,
      path: pathname,
      metadata: { userAgent: request.headers.get("user-agent") },
    });

    if (!user && !ip) {
      return NextResponse.json(
        { error: "Unable to identify request." },
        { status: 400, headers: createResponseHeaders(requestId, SECURITY_HEADERS) },
      );
    }

    const rateLimitKey = user?.id ?? ip ?? "unknown";
    const rate = await checkRateLimit(rateLimitKey, 40, 60 * 1000);
    if (!rate.allowed) {
      await logSecurityEvent({
        event_type: "rate_limited",
        severity: "warn",
        user_id: user?.id ?? null,
        ip: ip ?? null,
        path: pathname,
        user_agent: request.headers.get("user-agent"),
        meta: { limit: rate.limit },
      });
      logger.warn("Generate request rate limited", {
        requestId,
        userId,
        ip,
        path: pathname,
        metadata: { limit: rate.limit },
      });
      return NextResponse.json(
        { error: "Too many requests. Please retry." },
        {
          status: 429,
          headers: createResponseHeaders(requestId, {
            ...SECURITY_HEADERS,
            ...createRateLimitHeaders(rate),
            "Retry-After": "10",
          }),
        },
      );
    }
    const responseHeaders = {
      ...SECURITY_HEADERS,
      ...createRateLimitHeaders(rate),
      "X-Request-ID": requestId,
    };

    const formData = await request.formData();
    const textValue = formData.get("text");
    const modeValue = formData.get("mode");
    const imageValue = formData.get("image");
    const langValue = formData.get("lang");

    const lang = langValue === "zh" ? "zh" : "en";
    const t = (en: string, zh: string) => (lang === "zh" ? zh : en);

    const mode = normalizeMode(
      typeof modeValue === "string" ? modeValue : null,
    );
    const text = typeof textValue === "string" ? textValue.trim() : "";
    const imageFile = imageValue instanceof File ? imageValue : null;

    if (!text && !imageFile) {
      return NextResponse.json(
        {
          error: t(
            "Please enter text or upload an image.",
            "请输入文本或上传图片。",
          ),
        },
        { status: 400, headers: responseHeaders },
      );
    }

    // Validate text length to prevent DoS
    if (text && !validateTextLength(text, INPUT_LIMITS.MAX_TEXT_LENGTH)) {
      return NextResponse.json(
        { error: t("Text too long.", "文本过长。") },
        { status: 400, headers: responseHeaders },
      );
    }

    // Validate image size
    if (imageFile && !validateImageSize(imageFile)) {
      return NextResponse.json(
        { error: t("Image too large.", "图片过大。") },
        { status: 400, headers: responseHeaders },
      );
    }

    if (
      imageFile &&
      !INPUT_LIMITS.ALLOWED_IMAGE_TYPES.includes(
        imageFile.type as (typeof INPUT_LIMITS.ALLOWED_IMAGE_TYPES)[number],
      )
    ) {
      return NextResponse.json(
        { error: t("Unsupported image type.", "图片格式不支持。") },
        { status: 400, headers: responseHeaders },
      );
    }

    const status = await getQuotaStatus({ user, ip });

    if (!status.isPro && mode !== "Standard") {
      return NextResponse.json(
        {
          error: t(
            "This mode is available for Pro only.",
            "此模式仅对 Pro 开放。",
          ),
        },
        { status: 403, headers: responseHeaders },
      );
    }

    if (!status.isPro && imageFile) {
      return NextResponse.json(
        {
          error: t(
            "Vision is available for Pro only.",
            "识图功能仅对 Pro 开放。",
          ),
        },
        { status: 403, headers: responseHeaders },
      );
    }

    if (status.remaining !== null && status.remaining <= 0) {
      return NextResponse.json(
        { error: t("Daily quota reached.", "今日配额已用完。"), quota: status },
        { status: 429, headers: responseHeaders },
      );
    }

    const { allowed, status: updatedStatus } = await consumeQuota({ user, ip });

    if (!allowed) {
      return NextResponse.json(
        {
          error: t("Daily quota reached.", "今日配额已用完。"),
          quota: updatedStatus,
        },
        { status: 429, headers: responseHeaders },
      );
    }

    const model = imageFile
      ? process.env.OPENAI_VISION_MODEL || "gpt-4o-mini"
      : process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";

    const redis = getRedisClient();
    const imageBuffer = imageFile
      ? Buffer.from(await imageFile.arrayBuffer())
      : null;
    const imageHash = imageBuffer
      ? await hashValue(imageBuffer.toString("base64"))
      : "no-img";
    const textHash = text ? await hashValue(text) : "no-text";
    const cacheKey = `gen:${lang}:${mode}:${model}:${textHash}:${imageHash}`;

    if (redis && CACHE_TTL_SECONDS > 0) {
      const cachedRaw = await redis.get<string>(cacheKey);
      if (cachedRaw) {
        const cached = safeJsonParse(cachedRaw);
        if (cached && isValidGenerateResponse(cached)) {
          const cachedData = cached as GenerateResponse;
          const cachedAffiliate =
            updatedStatus.isPro &&
            cachedData.affiliate_category &&
            AFFILIATE_MAP[cachedData.affiliate_category]
              ? AFFILIATE_MAP[cachedData.affiliate_category]
              : null;

          return NextResponse.json(
            {
              caption: cachedData.caption ?? "",
              hashtags: cachedData.hashtags ?? "",
              detected_object: cachedData.detected_object ?? null,
              affiliate_category: cachedData.affiliate_category,
              affiliate: cachedAffiliate,
              quota: updatedStatus,
              cached: true,
            },
            { headers: responseHeaders },
          );
        }
      }
    }

    let inflightIncremented = false;
    if (redis && MAX_INFLIGHT > 0) {
      const inflight = await redis.incr(INFLIGHT_KEY);
      if (inflight === 1) {
        await redis.expire(INFLIGHT_KEY, 30);
      }
      if (inflight > MAX_INFLIGHT) {
        await redis.decr(INFLIGHT_KEY);
        await logSecurityEvent({
          event_type: "high_load_reject",
          severity: "warn",
          user_id: user?.id ?? null,
          ip: ip ?? null,
          path: new URL(request.url).pathname,
          user_agent: request.headers.get("user-agent"),
          meta: { inflight, max: MAX_INFLIGHT },
        });
        return NextResponse.json(
          {
            error: t(
              "High traffic. Please retry in a few seconds.",
              "当前请求繁忙，请稍后再试。",
            ),
          },
          {
            status: 503,
            headers: { ...responseHeaders, "Retry-After": "5" },
          },
        );
      }
      inflightIncremented = true;
    }

    const languageLabel = lang === "zh" ? "Chinese" : "English";
    const userPrompt = imageFile
      ? `Language: ${languageLabel}. Mode: ${mode}. User text: ${text || "N/A"}. Analyze the image and respond.`
      : `Language: ${languageLabel}. Mode: ${mode}. User text: ${text}`;

    const systemMessage: ChatCompletionMessageParam = {
      role: "system",
      content: SYSTEM_PROMPT,
    };

    const userMessage: ChatCompletionMessageParam =
      imageFile && imageBuffer
        ? {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${imageFile.type};base64,${imageBuffer.toString(
                    "base64",
                  )}`,
                },
              },
            ],
          }
        : { role: "user", content: userPrompt };

    const messages: ChatCompletionMessageParam[] = [
      systemMessage,
      userMessage,
    ];

    const openai = getOpenAIClient();
    let parsed: GenerateResponse | null = null;

    try {
      const completion = await withCircuitBreaker(
        "openai.chat.completions",
        () =>
          withRetry(
            () =>
              openai.chat.completions.create({
                model,
                messages,
                response_format: { type: "json_object" },
                temperature: 0.9,
              }),
            2,
          ),
      );

      const raw = completion.choices?.[0]?.message?.content?.trim() || "";
      const candidate = safeJsonParse(raw);

      if (!candidate || !isValidGenerateResponse(candidate)) {
        await logSecurityEvent({
          event_type: "model_invalid_response",
          severity: "warn",
          user_id: user?.id ?? null,
          ip: ip ?? null,
          path: new URL(request.url).pathname,
          user_agent: request.headers.get("user-agent"),
          meta: { raw_length: raw.length },
        });
        return NextResponse.json(
          {
            error: t(
              "Model returned invalid format. Please try again.",
              "模型返回格式异常，请重试。",
            ),
          },
          { status: 500, headers: responseHeaders },
        );
      }

      parsed = candidate as GenerateResponse;

      if (redis && CACHE_TTL_SECONDS > 0) {
        await redis.set(cacheKey, JSON.stringify(parsed), {
          ex: CACHE_TTL_SECONDS,
        });
      }
    } finally {
      if (redis && inflightIncremented) {
        await redis.decr(INFLIGHT_KEY);
      }
    }

    if (!parsed) {
      return NextResponse.json(
        { error: t("Service error.", "服务异常。") },
        { status: 500, headers: responseHeaders },
      );
    }

    const data = parsed;
    const affiliateCategory = data.affiliate_category;

    const affiliate =
      updatedStatus.isPro &&
      affiliateCategory &&
      AFFILIATE_MAP[affiliateCategory]
        ? AFFILIATE_MAP[affiliateCategory]
        : null;

    const duration = Date.now() - startTime;
    logger.info("Generate request completed", {
      requestId,
      userId,
      ip: ipAddr,
      path: pathname,
      metadata: { duration, mode, hasImage: !!imageFile },
    });

    return NextResponse.json(
      {
        caption: data.caption ?? "",
        hashtags: data.hashtags ?? "",
        detected_object: data.detected_object ?? null,
        affiliate_category: affiliateCategory,
        affiliate,
        quota: updatedStatus,
      },
      { headers: responseHeaders },
    );
  } catch (error) {
    const appError = error instanceof Error ? error : new Error(String(error));
    const duration = Date.now() - startTime;

    logError(appError, {
      userId,
      ip: ipAddr,
      path: pathname,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    logger.error("Generate request failed", {
      requestId,
      userId,
      ip: ipAddr,
      path: pathname,
      metadata: { duration, message: appError.message },
      error: appError,
    });

    await logSecurityEvent({
      event_type: "generate_error",
      severity: "error",
      user_id: userId,
      ip: ipAddr,
      path: pathname,
      user_agent: request.headers.get("user-agent"),
      meta: { message: appError.message, duration },
    });

    return NextResponse.json(
      { error: "Service error. Please try again later." },
      { status: 500, headers: createResponseHeaders(requestId, SECURITY_HEADERS) },
    );
  }
}
