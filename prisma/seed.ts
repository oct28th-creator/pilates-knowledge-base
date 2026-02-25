import { hash } from "bcryptjs";
import prisma from "../lib/db";

async function main() {
  console.log("开始创建种子数据...");

  // 创建管理员用户
  const adminPassword = await hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@pilates.com" },
    update: {},
    create: {
      email: "admin@pilates.com",
      name: "管理员",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  console.log("管理员账户创建成功:", admin.email);

  // 创建测试用户
  const userPassword = await hash("user123", 12);
  const user = await prisma.user.upsert({
    where: { email: "user@pilates.com" },
    update: {},
    create: {
      email: "user@pilates.com",
      name: "测试学员",
      password: userPassword,
      role: "USER",
    },
  });

  console.log("测试用户创建成功:", user.email);

  console.log("\n登录信息:");
  console.log("管理员: admin@pilates.com / admin123");
  console.log("学员: user@pilates.com / user123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
