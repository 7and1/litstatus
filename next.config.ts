import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Expose ONLY safe configuration to Edge Runtime (NEVER expose API keys)
  env: {
    OPENAI_TEXT_MODEL: process.env.OPENAI_TEXT_MODEL,
    OPENAI_VISION_MODEL: process.env.OPENAI_VISION_MODEL,
  },
};

export default nextConfig;
