import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Expose environment variables to Edge Runtime
  experimental: {
    serverComponentsExternalPackages: ["@supabase/supabase-js"],
  },
  // Runtime environment variables for Edge
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
    OPENAI_TEXT_MODEL: process.env.OPENAI_TEXT_MODEL,
    OPENAI_VISION_MODEL: process.env.OPENAI_VISION_MODEL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    REDIS_URL: process.env.REDIS_URL,
  },
};

export default nextConfig;
