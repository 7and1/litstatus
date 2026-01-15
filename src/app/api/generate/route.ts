import { NextResponse } from "next/server";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { AFFILIATE_MAP } from "@/lib/affiliateMap";
import { getUserFromRequest } from "@/lib/auth";
import { MODES, type Mode } from "@/lib/constants";
import { getClientIp } from "@/lib/ip";
import { getOpenAIClient } from "@/lib/openai";
import {
  SYSTEM_PROMPT,
  isValidGenerateResponse,
  type GenerateResponse,
} from "@/lib/prompts";
import { consumeQuota, getQuotaStatus } from "@/lib/quota";
import {
  LIMITS,
  SECURITY_HEADERS,
  validateImageSize,
  validateTextLength,
} from "@/lib/security";

export const runtime = "nodejs";

const MODE_SET = new Set(MODES.map((mode) => mode.toLowerCase()));

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

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    const ip = getClientIp(request);

    if (!user && !ip) {
      return NextResponse.json(
        { error: "Unable to identify request." },
        { status: 400, headers: SECURITY_HEADERS },
      );
    }

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
        { status: 400, headers: SECURITY_HEADERS },
      );
    }

    // Validate text length to prevent DoS
    if (text && !validateTextLength(text, LIMITS.MAX_TEXT_LENGTH)) {
      return NextResponse.json(
        { error: t("Text too long.", "文本过长。") },
        { status: 400, headers: SECURITY_HEADERS },
      );
    }

    // Validate image size
    if (imageFile && !validateImageSize(imageFile)) {
      return NextResponse.json(
        { error: t("Image too large.", "图片过大。") },
        { status: 400, headers: SECURITY_HEADERS },
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
        { status: 403, headers: SECURITY_HEADERS },
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
        { status: 403, headers: SECURITY_HEADERS },
      );
    }

    if (status.remaining !== null && status.remaining <= 0) {
      return NextResponse.json(
        { error: t("Daily quota reached.", "今日配额已用完。"), quota: status },
        { status: 429, headers: SECURITY_HEADERS },
      );
    }

    const { allowed, status: updatedStatus } = await consumeQuota({ user, ip });

    if (!allowed) {
      return NextResponse.json(
        {
          error: t("Daily quota reached.", "今日配额已用完。"),
          quota: updatedStatus,
        },
        { status: 429, headers: SECURITY_HEADERS },
      );
    }

    const model = imageFile
      ? process.env.OPENAI_VISION_MODEL || "gpt-4o-mini"
      : process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";

    const languageLabel = lang === "zh" ? "Chinese" : "English";
    const userPrompt = imageFile
      ? `Language: ${languageLabel}. Mode: ${mode}. User text: ${text || "N/A"}. Analyze the image and respond.`
      : `Language: ${languageLabel}. Mode: ${mode}. User text: ${text}`;

    const systemMessage: ChatCompletionMessageParam = {
      role: "system",
      content: SYSTEM_PROMPT,
    };

    const userMessage: ChatCompletionMessageParam = imageFile
      ? {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${imageFile.type};base64,${Buffer.from(
                  await imageFile.arrayBuffer(),
                ).toString("base64")}`,
              },
            },
          ],
        }
      : { role: "user", content: userPrompt };

    const messages: ChatCompletionMessageParam[] = [systemMessage, userMessage];

    const openai = getOpenAIClient();

    const completion = await openai.chat.completions.create({
      model,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.9,
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() || "";
    const parsed = safeJsonParse(raw);

    if (!parsed || !isValidGenerateResponse(parsed)) {
      return NextResponse.json(
        {
          error: t(
            "Model returned invalid format. Please try again.",
            "模型返回格式异常，请重试。",
          ),
        },
        { status: 500, headers: SECURITY_HEADERS },
      );
    }

    const data = parsed as GenerateResponse;
    const affiliateCategory = data.affiliate_category;

    const affiliate =
      updatedStatus.isPro &&
      affiliateCategory &&
      AFFILIATE_MAP[affiliateCategory]
        ? AFFILIATE_MAP[affiliateCategory]
        : null;

    return NextResponse.json(
      {
        caption: data.caption ?? "",
        hashtags: data.hashtags ?? "",
        detected_object: data.detected_object ?? null,
        affiliate_category: affiliateCategory,
        affiliate,
        quota: updatedStatus,
      },
      { headers: SECURITY_HEADERS },
    );
  } catch (error) {
    console.error(
      "[Generate API Error]",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.json(
      { error: "Service error. Please try again later." },
      { status: 500, headers: SECURITY_HEADERS },
    );
  }
}
