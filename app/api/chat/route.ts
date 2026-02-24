import { google } from '@ai-sdk/google';
import { streamText, convertToCoreMessages, tool } from 'ai';
import { z } from 'zod'; // 👈 1. 引入 zod

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    // 确保模型名称与你测试成功的一致
    model: google('gemini-flash-lite-latest'), 
    messages: convertToCoreMessages(messages),
    system: '你是一位专业的普拉提教练。你可以通过 Google 搜索获取最新的健身资讯。',
    
    tools: {
      getLatestPilatesInfo: tool({
        description: '获取关于普拉提最新的研究或训练方法',
        // 👈 2. 将 null 改为 z.object({})
        parameters: z.object({}), 
        execute: async () => {
          // 这里是你的工具执行逻辑
          return "最新的普拉提研究显示，结合呼吸训练能提升 20% 的核心稳定性。";
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}