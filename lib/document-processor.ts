import { readFile } from "fs/promises";
import mammoth from "mammoth";
import prisma from "./db";
import { generateEmbedding, splitTextIntoChunks } from "./rag";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse");

/**
 * 处理上传的文档，提取文本并生成向量
 */
export async function processDocument(
  materialId: string,
  filePath: string,
  fileType: string
): Promise<void> {
  try {
    let textContent = "";

    switch (fileType) {
      case "pdf":
        textContent = await extractPdfText(filePath);
        break;
      case "doc":
        textContent = await extractDocText(filePath);
        break;
      case "image":
        // 图片暂时使用文件名作为描述
        // 后续可以集成图像识别API
        textContent = await extractImageDescription(materialId);
        break;
      default:
        console.log(`不支持的文件类型: ${fileType}`);
        return;
    }

    if (!textContent.trim()) {
      console.log(`文档内容为空: ${materialId}`);
      return;
    }

    // 将文本分割成块
    const chunks = splitTextIntoChunks(textContent);

    // 为每个块生成向量并保存
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await generateEmbedding(chunk);

      await prisma.materialChunk.create({
        data: {
          materialId,
          content: chunk,
          embedding: JSON.stringify(embedding),
          chunkIndex: i,
          metadata: JSON.stringify({
            fileType,
            chunkSize: chunk.length,
          }),
        },
      });
    }

    console.log(`文档处理完成: ${materialId}, 共 ${chunks.length} 个块`);
  } catch (error) {
    console.error(`处理文档失败 ${materialId}:`, error);
    throw error;
  }
}

/**
 * 从 PDF 文件中提取文本
 */
async function extractPdfText(filePath: string): Promise<string> {
  try {
    const dataBuffer = await readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error("PDF解析失败:", error);
    return "";
  }
}

/**
 * 从 Word 文档中提取文本
 */
async function extractDocText(filePath: string): Promise<string> {
  try {
    const dataBuffer = await readFile(filePath);
    const result = await mammoth.extractRawText({ buffer: dataBuffer });
    return result.value;
  } catch (error) {
    console.error("Word文档解析失败:", error);
    return "";
  }
}

/**
 * 获取图片描述（从数据库中获取标题和描述）
 */
async function extractImageDescription(materialId: string): Promise<string> {
  const material = await prisma.material.findUnique({
    where: { id: materialId },
  });
  
  if (!material) return "";
  
  return `${material.title} ${material.description || ""}`;
}
