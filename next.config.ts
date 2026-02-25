import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // 优化 serverless 构建
  serverExternalPackages: ['prisma', '@prisma/client'],
  
  // 确保清除构建缓存
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
};

export default nextConfig;
