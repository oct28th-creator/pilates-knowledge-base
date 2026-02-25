import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

/**
 * 注意：文件上传在 Vercel serverless 环境中有限制
 * 
 * Vercel 的文件系统是只读的，上传的文件不会持久化。
 * 
 * 生产环境建议：
 * 1. 使用 Vercel Blob 存储：https://vercel.com/docs/storage/vercel-blob
 * 2. 使用 AWS S3 或其他云存储服务
 * 3. 将文件上传功能部署到支持文件系统的服务器
 * 
 * 当前实现仅适用于本地开发环境
 */

// 允许的文件类型
const ALLOWED_TYPES = {
  "video/mp4": "video",
  "video/webm": "video",
  "video/quicktime": "video",
  "image/jpeg": "image",
  "image/png": "image",
  "image/gif": "image",
  "image/webp": "image",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "doc",
};

// 最大文件大小 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    // 验证用户身份和权限
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;

    if (!file) {
      return NextResponse.json({ error: "请选择文件" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "请输入标题" }, { status: 400 });
    }

    // 验证文件类型
    const fileType = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES];
    if (!fileType) {
      return NextResponse.json(
        { error: "不支持的文件类型" },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "文件大小不能超过100MB" },
        { status: 400 }
      );
    }

    // 创建上传目录
    const uploadDir = path.join(process.cwd(), "public", "uploads", fileType);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 生成唯一文件名
    const ext = path.extname(file.name);
    const fileName = `${uuidv4()}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    // 保存文件
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 相对路径（用于前端访问）
    const relativePath = `/uploads/${fileType}/${fileName}`;

    // 保存到数据库
    const material = await prisma.material.create({
      data: {
        title,
        description: description || "",
        type: fileType,
        filePath: relativePath,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      },
    });

    // 异步处理文档（提取文本并创建向量）
    // 使用动态导入避免构建时加载问题
    if (fileType !== "video") {
      import("@/lib/document-processor")
        .then(({ processDocument }) => {
          return processDocument(material.id, filePath, fileType);
        })
        .catch(console.error);
    }

    return NextResponse.json({
      message: "上传成功",
      material: {
        id: material.id,
        title: material.title,
        type: material.type,
        filePath: material.filePath,
      },
    });
  } catch (error) {
    console.error("上传失败:", error);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
