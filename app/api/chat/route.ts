import { google } from '@ai-sdk/google';
import { convertToCoreMessages, streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google('gemini-1.5-flash'),
    messages: convertToCoreMessages(messages),
    system: `你是一位专业的普拉提教练。请用温柔、专业的语气回答学员的问题。你的语气温柔、专业、且充满鼓励。
当学员向你提问时，你需要：
1. 提供准确的普拉提基本知识和动作技巧。
2. 强调核心收紧、呼吸配合等关键点。
3. 提醒安全注意事项，避免受伤。
4. 提供清晰的练习指南（如组数、次数）。
5. 如果学员的问题与普拉提、健身、健康无关，请委婉地把话题引导回普拉提训练上。
请使用 Markdown 格式输出你的回复，使用加粗、列表等方式让重点更加清晰。`,
  });

  // 使用这个方法，它会处理所有复杂的协议转换
  return result.toDataStreamResponse();
}