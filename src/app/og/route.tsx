import { ImageResponse } from "next/og";

// Use Edge Runtime for Cloudflare Pages compatibility
// Using system fonts to avoid Edge Function size limits
export const runtime = "edge";

const COPY = {
  en: {
    title: "LitStatus",
    subtitle: "AI Caption Generator",
    tagline: "Captions + hashtags in seconds",
    badge: "EN",
  },
  zh: {
    title: "LitStatus",
    subtitle: "AI 文案生成器",
    tagline: "文案与标签，几秒生成",
    badge: "中文",
  },
} as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") === "zh" ? "zh" : "en";
  const size = searchParams.get("size") === "square" ? "square" : "wide";
  const width = 1200;
  const height = size === "square" ? 1200 : 630;
  const copy = COPY[lang];

  const [regular, bold] = await Promise.all([regularFont, boldFont]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: size === "square" ? "80px" : "72px",
          background: "linear-gradient(135deg, #0b0b0f 0%, #0f1424 50%, #101522 100%)",
          color: "#f8fafc",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: size === "square" ? "520px" : "520px",
            height: size === "square" ? "520px" : "520px",
            borderRadius: "999px",
            background:
              "radial-gradient(circle at 30% 30%, rgba(44,238,240,0.45), rgba(11,11,15,0))",
            top: "-120px",
            right: "-120px",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: size === "square" ? "420px" : "420px",
            height: size === "square" ? "420px" : "420px",
            borderRadius: "999px",
            background:
              "radial-gradient(circle at 30% 30%, rgba(246,183,60,0.35), rgba(11,11,15,0))",
            bottom: "-140px",
            left: "-80px",
          }}
        />

        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "12px",
          padding: "8px 16px",
          borderRadius: "999px",
          border: "1px solid rgba(255,255,255,0.15)",
          background: "rgba(255,255,255,0.04)",
          fontSize: "24px",
          width: "fit-content",
        }}>
          <span style={{
            width: "12px",
            height: "12px",
            borderRadius: "999px",
            background: "#2ceef0",
          }} />
          <span>{copy.badge}</span>
        </div>

        <div style={{ marginTop: "28px", fontSize: "88px", fontWeight: 700 }}>
          {copy.title}
        </div>
        <div style={{ marginTop: "8px", fontSize: "40px", fontWeight: 600, color: "#d4d4d8" }}>
          {copy.subtitle}
        </div>
        <div style={{ marginTop: "20px", fontSize: "28px", color: "#a1a1aa" }}>
          {copy.tagline}
        </div>
        <div style={{ marginTop: "48px", fontSize: "24px", color: "#71717a" }}>
          litstatus.com
        </div>
      </div>
    ),
    {
      width,
      height,
      // Using system fonts for Edge Runtime compatibility
      fonts: [],
    },
  );
}
