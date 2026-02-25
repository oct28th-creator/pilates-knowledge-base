import { NextRequest, NextResponse } from "next/server";
import prisma from "./db";

interface RateLimitConfig {
  maxRequests: number;  // 最大请求数
  windowMs: number;     // 时间窗口（毫秒）
}

const defaultConfig: RateLimitConfig = {
  maxRequests: 30,      // 每个时间窗口最大30次请求
  windowMs: 60 * 1000,  // 1分钟窗口
};

/**
 * 获取客户端标识（IP或用户ID）
 */
export function getClientKey(req: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || 
             req.headers.get("x-real-ip") || 
             "unknown";
  return `ip:${ip}`;
}

/**
 * 检查是否超过速率限制
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig = defaultConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const now = new Date();
  
  try {
    // 查找或创建速率限制记录
    let rateLimit = await prisma.rateLimit.findUnique({
      where: { key },
    });

    // 如果记录不存在或已过期，重置
    if (!rateLimit || rateLimit.resetAt < now) {
      const resetAt = new Date(now.getTime() + config.windowMs);
      
      rateLimit = await prisma.rateLimit.upsert({
        where: { key },
        update: {
          count: 1,
          resetAt,
        },
        create: {
          key,
          count: 1,
          resetAt,
        },
      });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt,
      };
    }

    // 检查是否超过限制
    if (rateLimit.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: rateLimit.resetAt,
      };
    }

    // 增加计数
    await prisma.rateLimit.update({
      where: { key },
      data: { count: rateLimit.count + 1 },
    });

    return {
      allowed: true,
      remaining: config.maxRequests - rateLimit.count - 1,
      resetAt: rateLimit.resetAt,
    };
  } catch (error) {
    console.error("速率限制检查失败:", error);
    // 出错时默认允许
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(now.getTime() + config.windowMs),
    };
  }
}

/**
 * 速率限制中间件响应
 */
export function rateLimitResponse(resetAt: Date): NextResponse {
  const retryAfter = Math.ceil((resetAt.getTime() - Date.now()) / 1000);
  
  return NextResponse.json(
    { 
      error: "请求过于频繁，请稍后再试",
      retryAfter,
    },
    { 
      status: 429,
      headers: {
        "Retry-After": retryAfter.toString(),
        "X-RateLimit-Reset": resetAt.toISOString(),
      },
    }
  );
}

/**
 * 输入验证：检查是否包含恶意内容
 */
export function validateInput(input: string): { valid: boolean; error?: string } {
  // 检查空输入
  if (!input || !input.trim()) {
    return { valid: false, error: "输入不能为空" };
  }

  // 检查输入长度
  if (input.length > 2000) {
    return { valid: false, error: "输入内容过长（最多2000字符）" };
  }

  // 检查是否包含可疑的注入模式
  const suspiciousPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /forget\s+(all\s+)?your\s+(previous\s+)?instructions/i,
    /you\s+are\s+now\s+a/i,
    /act\s+as\s+if\s+you/i,
    /pretend\s+you\s+are/i,
    /system\s*:\s*/i,
    /\[INST\]/i,
    /<<SYS>>/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(input)) {
      return { valid: false, error: "输入内容包含不允许的模式" };
    }
  }

  return { valid: true };
}
