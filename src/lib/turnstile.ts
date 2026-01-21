type TurnstileVerifyResponse = {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
  action?: string;
  cdata?: string;
};

type VerifyOptions = {
  token: string;
  ip?: string | null;
};

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstileToken({
  token,
  ip,
}: VerifyOptions): Promise<TurnstileVerifyResponse> {
  const secret =
    process.env.TURNSTILE_SECRET_KEY ||
    process.env.CF_TURNSTILE_SECRET_KEY ||
    "";

  if (!secret) {
    return { success: false, "error-codes": ["missing-input-secret"] };
  }

  const body = new URLSearchParams();
  body.append("secret", secret);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    body,
  });

  if (!response.ok) {
    return { success: false, "error-codes": ["bad-request"] };
  }

  const data = (await response.json()) as TurnstileVerifyResponse;
  return data;
}
