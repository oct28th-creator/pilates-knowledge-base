/**
 * 文档处理模块
 * 
 * 注意：此模块在 Vercel serverless 环境中不可用
 * - pdf-parse 依赖 Canvas API（DOMMatrix 等）
 * - mammoth 在构建时可能导致问题
 * 
 * 生产环境建议：
 * 1. 使用外部文档处理服务（如 AWS Textract）
 * 2. 在本地预处理文档后上传文本
 * 3. 部署到支持完整 Node.js 环境的平台
 */

import prisma from "./db";

// 在 serverless 环境中禁用文档处理
const SERVERLESS_ENV = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

/**
 * 处理上传的文档，提取文本并生成向量
 */
export async function processDocument(
  materialId: string,
  filePath: string,
  fileType: string
): Promise<void> {
  if (SERVERLESS_ENV) {
    console.log(`文档处理在 serverless 环境中已禁用: ${materialId}`);
    return;
  }

  console.log(`文档处理功能暂时禁用: ${materialId}`);
  // 生产环境中，此函数不执行任何操作
  return;
}
