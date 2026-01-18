import type { NextConfig } from "next";

const isAnalyzer = process.env.ANALYZE === "true";

const nextConfig: NextConfig = {
  // Expose ONLY safe configuration to Edge Runtime (NEVER expose API keys)
  env: {
    OPENAI_TEXT_MODEL: process.env.OPENAI_TEXT_MODEL,
    OPENAI_VISION_MODEL: process.env.OPENAI_VISION_MODEL,
    APP_VERSION: process.env.APP_VERSION || "0.1.0",
    BUILD_TIME: process.env.BUILD_TIME || new Date().toISOString(),
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,

  // Output configuration
  // Note: "standalone" is incompatible with Edge Runtime (Cloudflare Pages)
  // Use "standalone" only for Docker/VPS deployments

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Bundle optimization
  experimental: {
    optimizePackageImports: ["next/image", "next/link"],
  },

  // Bundle analyzer configuration
  ...(isAnalyzer && {
    webpack: (config, { isServer }) => {
      const bundleAnalyzer = require("@next/bundle-analyzer")({
        enabled: isAnalyzer,
      });

      if (!isServer) {
        config.plugins.push(
          new bundleAnalyzer.WebpackBundleAnalyzerPlugin({
            analyzerMode: "static",
            reportFilename: "./analyze/client.html",
            openAnalyzer: false,
          })
        );
      }

      return config;
    },
  }),
};

export default nextConfig;
