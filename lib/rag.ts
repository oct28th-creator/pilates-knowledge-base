import { google } from "@ai-sdk/google";
import { embed } from "ai";
import prisma from "./db";

/**
 * 生成文本的向量嵌入
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { embedding } = await embed({
      model: google.textEmbeddingModel("text-embedding-004"),
      value: text,
    });
    return embedding;
  } catch (error) {
    console.error("生成向量失败:", error);
    // 返回简单的词袋模型作为后备方案
    return simpleEmbedding(text);
  }
}

/**
 * 简单的词袋向量（后备方案）
 */
function simpleEmbedding(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const vector = new Array(256).fill(0);
  
  words.forEach((word, i) => {
    const hash = word.split("").reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    vector[Math.abs(hash) % 256] += 1;
  });
  
  // 归一化
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map((val) => magnitude > 0 ? val / magnitude : 0);
}

/**
 * 将文本分割成块
 */
export function splitTextIntoChunks(
  text: string,
  chunkSize: number = 500,
  overlap: number = 100
): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[。！？.!?])\s*/);
  
  let currentChunk = "";
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // 保留重叠部分
      const words = currentChunk.split(/\s+/);
      const overlapWords = words.slice(-Math.floor(overlap / 5));
      currentChunk = overlapWords.join(" ") + " " + sentence;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * 计算两个向量的余弦相似度
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude > 0 ? dotProduct / magnitude : 0;
}

/**
 * 搜索相关的教材内容
 */
export async function searchMaterials(
  query: string,
  topK: number = 5
): Promise<Array<{ content: string; title: string; type: string; similarity: number }>> {
  try {
    // 生成查询向量
    const queryEmbedding = await generateEmbedding(query);
    
    // 获取所有教材块
    const chunks = await prisma.materialChunk.findMany({
      include: {
        material: {
          select: {
            title: true,
            type: true,
            filePath: true,
          },
        },
      },
    });
    
    // 计算相似度并排序
    const results = chunks
      .map((chunk) => {
        const chunkEmbedding = chunk.embedding 
          ? JSON.parse(chunk.embedding) as number[]
          : [];
        const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);
        
        return {
          content: chunk.content,
          title: chunk.material.title,
          type: chunk.material.type,
          filePath: chunk.material.filePath,
          similarity,
        };
      })
      .filter((r) => r.similarity > 0.3) // 过滤低相似度结果
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
    
    return results;
  } catch (error) {
    console.error("搜索教材失败:", error);
    return [];
  }
}

/**
 * 获取所有视频教材
 */
export async function getVideoMaterials(): Promise<
  Array<{ id: string; title: string; filePath: string; description: string | null }>
> {
  const videos = await prisma.material.findMany({
    where: { type: "video" },
    select: {
      id: true,
      title: true,
      filePath: true,
      description: true,
    },
  });
  return videos;
}
