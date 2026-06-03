import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development", // 開発環境での無限ロードバグを防ぐため無効化
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSerwist(nextConfig);


