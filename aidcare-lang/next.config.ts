import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Disabled — Strict Mode double-invokes effects in dev,
                          // causing greeting TTS to fire twice on every mount
};

export default nextConfig;
