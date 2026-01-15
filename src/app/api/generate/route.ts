import { NextResponse } from "next/server";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { AFFILIATE_MAP } from "@/lib/affiliateMap";
import { getUserFromRequest } from "@/lib/auth";
import { MODES, type Mode } from "@/lib/constants";
import { getClientIp } from "@/lib/ip";
import { getOpenAIClient } from "@/lib/openai";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import { consumeQuota, getQuotaStatus } from "@/lib/quota";

export const runtime = "edge";

// Edge-compatible base64 encoding
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

const MODE_SET = new Set(MODES.map((mode) => mode.toLowerCase()));

function normalizeMode(input: string | null): Mode {
  const candidate = input?.trim().toLowerCase() || "standard";
  if (!MODE_SET.has(candidate)) return "Standard";
  const normalized = candidate[0].toUpperCase() + candidate.slice(1);
  return normalized as Mode;
}

function safeJsonParse(input: string) {
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
        { error: "无法识别访客身份。" },
        { status: 400 },
      );
    }

    const formData = await request.formData();
    const textValue = formData.get("text");
    const modeValue = formData.get("mode");
    const imageValue = formData.get("image");

    const mode = normalizeMode(
      typeof modeValue === "string" ? modeValue : null,
    );
    const text = typeof textValue === "string" ? textValue.trim() : "";
    const imageFile = imageValue instanceof File ? imageValue : null;

    if (!text && !imageFile) {
      return NextResponse.json(
        { error: "请输入文本或上传图片。" },
        { status: 400 },
      );
    }

    const status = await getQuotaStatus({ user, ip });

    if (!status.isPro && mode !== "Standard") {
      return NextResponse.json(
        { error: "此模式仅对 Pro 开放。" },
        { status: 403 },
      );
    }

    if (!status.isPro && imageFile) {
      return NextResponse.json(
        { error: "识图功能仅对 Pro 开放。" },
        { status: 403 },
      );
    }

    if (status.remaining !== null && status.remaining <= 0) {
      return NextResponse.json(
        { error: "今日配额已用完。", quota: status },
        { status: 429 },
      );
    }

    const { allowed, status: updatedStatus } = await consumeQuota({ user, ip });

    if (!allowed) {
      return NextResponse.json(
        { error: "今日配额已用完。", quota: updatedStatus },
        { status: 429 },
      );
    }

    const model = imageFile
      ? process.env.OPENAI_VISION_MODEL || "gpt-4o-mini"
      : process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";

    const userPrompt = imageFile
      ? `Mode: ${mode}. User text: ${text || "N/A"}. Analyze the image and respond.`
      : `Mode: ${mode}. User text: ${text}`;

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
                url: `data:${imageFile.type};base64,${arrayBufferToBase64(
                  await imageFile.arrayBuffer(),
                )}`,
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

    if (!parsed) {
      return NextResponse.json(
        { error: "模型返回格式异常，请重试。" },
        { status: 500 },
      );
    }

    const affiliateCategory =
      typeof parsed.affiliate_category === "string" && parsed.affiliate_category
        ? parsed.affiliate_category
        : null;

    const affiliate =
      updatedStatus.isPro &&
      affiliateCategory &&
      AFFILIATE_MAP[affiliateCategory]
        ? AFFILIATE_MAP[affiliateCategory]
        : null;

    return NextResponse.json({
      caption: parsed.caption ?? "",
      hashtags: parsed.hashtags ?? "",
      detected_object: parsed.detected_object ?? null,
      affiliate_category: affiliateCategory,
      affiliate,
      quota: updatedStatus,
    });
  } catch {
    return NextResponse.json(
      { error: "服务异常，请稍后再试。" },
      { status: 500 },
    );
  }
}
