import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LitStatus - AI Caption Generator for Social Media",
    short_name: "LitStatus",
    description:
      "Generate viral captions and hashtags instantly with AI. 3 tone modes: Standard, Savage, Rizz. Supports text and image input. English & Chinese.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b0f",
    theme_color: "#2ceef0",
    orientation: "portrait",
    scope: "/",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["productivity", "social", "utilities"],
    screenshots: [
      {
        src: "/screenshot-wide.png",
        sizes: "1280x720",
        type: "image/png",
      },
    ],
  };
}
