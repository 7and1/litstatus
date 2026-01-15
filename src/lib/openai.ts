import OpenAI from "openai";

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 2;

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  return new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
    timeout: DEFAULT_TIMEOUT,
    maxRetries: MAX_RETRIES,
  });
}
