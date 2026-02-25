import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { unlink } from "fs/promises";
import path from "path";

// 获取所有教材列表
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const materials = await prisma.material.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        filePath: true,
        fileName: true,
        fileSize: true,
        createdAt: true,
        _count: {
          select: { chunks: true },
        },
      },
    });

    return NextResponse.json({ materials });
  } catch (error) {
    console.error("获取教材列表失败:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// 删除教材
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少教材ID" }, { status: 400 });
    }

    // 查找教材
    const material = await prisma.material.findUnique({
      where: { id },
    });

    if (!material) {
      return NextResponse.json({ error: "教材不存在" }, { status: 404 });
    }

    // 删除文件
    try {
      const filePath = path.join(process.cwd(), "public", material.filePath);
      await unlink(filePath);
    } catch (e) {
      console.error("删除文件失败:", e);
    }

    // 删除数据库记录（会级联删除chunks）
    await prisma.material.delete({
      where: { id },
    });

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    console.error("删除教材失败:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
