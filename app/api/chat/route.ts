import { google } from "@ai-sdk/google";
import { streamText, convertToCoreMessages } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchMaterials, getVideoMaterials } from "@/lib/rag";
import {
  checkRateLimit,
  getClientKey,
  rateLimitResponse,
  validateInput,
} from "@/lib/rate-limiter";

export const maxDuration = 60;

// 系统提示词
const SYSTEM_PROMPT = `你是一位专业的普拉提教练，拥有联网搜索能力。请用温柔、专业的语气回答学员的问题。你的语气温柔、专业、且充满鼓励。

当学员向你提问时，你需要：
1. 提供准确的普拉提基本知识和动作技巧。
2. 强调核心收紧、呼吸配合等关键点。
3. 提醒安全注意事项，避免受伤。
4. 提供清晰的练习指南（如组数、次数）。
5. 如果学员的问题与普拉提、健身、健康无关，请委婉地把话题引导回普拉提训练上。

请使用 Markdown 格式输出你的回复，使用加粗、列表等方式让重点更加清晰。

**重要指引**：
- 当提供了【参考教材内容】时，优先基于教材内容回答
- 当没有提供教材内容时，你可以：
  1. 使用你的知识库回答基础问题
  2. 对于需要最新信息、视频链接、具体研究等问题，主动搜索互联网获取信息
  3. 推荐视频时，搜索并提供真实的 YouTube 或 B站链接
  4. 引用互联网信息时，说明信息来源

**视频和图片格式要求**：
- 视频链接使用标准 Markdown 链接格式：[视频标题](视频URL)
- 图片使用标准 Markdown 格式：![图片描述](图片URL)
- 视频会自动嵌入到聊天界面中，无需跳转
- 支持 YouTube、B站和本地视频文件

如果用户需要视频教程，请搜索并推荐真实可用的视频链接。`;

export async function POST(req: NextRequest) {
  try {
    // 1. 身份验证
    const session = await auth();
    const userId = session?.user?.id;

    // 2. 速率限制检查
    const clientKey = getClientKey(req, userId);
    const rateLimit = await checkRateLimit(clientKey);

    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.resetAt);
    }

    // 3. 解析请求
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];

    // 4. 输入验证
    if (lastMessage?.role === "user") {
      const validation = validateInput(lastMessage.content);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
    }

    // 5. RAG 检索相关教材
    let contextContent = "";
    let hasMaterialContext = false;
    const userQuery = lastMessage?.content || "";

    if (userQuery) {
      const relevantMaterials = await searchMaterials(userQuery, 3);

      if (relevantMaterials.length > 0) {
        hasMaterialContext = true;
        contextContent = "\n\n【参考教材内容】\n";
        relevantMaterials.forEach((material, index) => {
          contextContent += `\n${index + 1}. 《${material.title}》（${material.type}）:\n${material.content}\n`;
        });
      }

      // 获取相关视频
      const videos = await getVideoMaterials();
      if (videos.length > 0) {
        contextContent += "\n\n【可用视频教程】\n";
        videos.forEach((video, index) => {
          // 根据文件路径判断是本地视频还是在线链接
          const isLocalVideo = video.filePath.startsWith('/uploads/') || video.filePath.startsWith('./public/');
          const videoPath = isLocalVideo ? video.filePath : video.filePath;
          contextContent += `${index + 1}. [${video.title}](${videoPath})\n`;
          if (video.description) {
            contextContent += `   描述：${video.description}\n`;
          }
        });
      }
    }

    // 6. 构建增强的系统提示
    let enhancedSystemPrompt = SYSTEM_PROMPT + contextContent;
    
    // 如果没有找到教材内容，明确提示 AI 需要搜索
    if (!hasMaterialContext && userQuery) {
      enhancedSystemPrompt += `\n\n【当前情况】：教材库中未找到"${userQuery}"的相关内容。请使用你的联网搜索能力查找最新、最准确的信息来回答这个问题。如果涉及视频推荐，请提供真实的视频链接。`;
    }

    // 7. 调用 AI 模型
    // gemini-flash-lite-latest 具备内置的实时信息获取能力
    const result = streamText({
      model: google("gemini-flash-lite-latest"),
      messages: convertToCoreMessages(messages),
      system: enhancedSystemPrompt,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API 错误:", error);
    return NextResponse.json(
      { error: "服务暂时不可用，请稍后重试" },
      { status: 500 }
    );
  }
}