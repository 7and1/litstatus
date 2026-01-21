// Edge Runtime configuration for Cloudflare Pages compatibility
export const runtime = "edge";

export default function NotFound() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      padding: "20px",
      textAlign: "center",
    }}>
      <h1 style={{ fontSize: "72px", fontWeight: "bold", marginBottom: "16px" }}>404</h1>
      <p style={{ fontSize: "24px", marginBottom: "32px" }}>Page not found</p>
      <a href="/" style={{ color: "#2ceef0", textDecoration: "none" }}>
        Go Home
      </a>
    </div>
  );
}
