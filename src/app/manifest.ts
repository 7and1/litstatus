import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LitStatus - AI Caption Generator for Social Media",
    short_name: "LitStatus",
    description:
      "Generate viral captions and hashtags in seconds with AI. Three tone modes and text or image input.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b0f",
    theme_color: "#2ceef0",
    orientation: "portrait",
    scope: "/",
    icons: [
      {
        src: "/icon-72.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-128.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-144.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-152.png",
        sizes: "152x152",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-384.png",
        sizes: "384x384",
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
      {
        src: "/screenshot-mobile.png",
        sizes: "750x1334",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "Generate Caption",
        short_name: "Generate",
        description: "Create a new caption",
        url: "/?action=generate",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
          },
        ],
      },
      {
        name: "View Examples",
        short_name: "Examples",
        description: "See caption examples",
        url: "/examples",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
          },
        ],
      },
    ],
  };
}
