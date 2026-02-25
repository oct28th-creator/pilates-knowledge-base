"use client";

import React, { useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import type { Components } from "react-markdown";
import {
  Send,
  User,
  Bot,
  LogOut,
  Settings,
  Loader2,
  MessageCircle,
} from "lucide-react";

// 自定义 Markdown 组件，用于渲染视频和图片
const MarkdownComponents: Components = {
  // 处理链接，识别视频 URL 并嵌入播放器
  a: ({ node, href, children, ...props }) => {
    if (!href) return <a {...props}>{children}</a>;

    // YouTube 视频检测
    const youtubeMatch = href.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/
    );
    if (youtubeMatch) {
      const videoId = youtubeMatch[1];
      return (
        <div className="my-4 rounded-lg overflow-hidden shadow-lg">
          <iframe
            width="100%"
            height="315"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full aspect-video"
          />
          <div className="bg-gray-100 px-3 py-2 text-sm text-gray-600">
            {children}
          </div>
        </div>
      );
    }

    // B站视频检测
    const bilibiliMatch = href.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/);
    if (bilibiliMatch) {
      const bvid = bilibiliMatch[1];
      return (
        <div className="my-4 rounded-lg overflow-hidden shadow-lg">
          <iframe
            width="100%"
            height="315"
            src={`https://player.bilibili.com/player.html?bvid=${bvid}&high_quality=1`}
            title="Bilibili video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full aspect-video"
          />
          <div className="bg-gray-100 px-3 py-2 text-sm text-gray-600">
            {children}
          </div>
        </div>
      );
    }

    // 本地视频文件检测
    if (href.match(/\.(mp4|webm|ogg)$/i)) {
      return (
        <div className="my-4 rounded-lg overflow-hidden shadow-lg">
          <video
            controls
            className="w-full"
            preload="metadata"
          >
            <source src={href} type={`video/${href.split('.').pop()}`} />
            您的浏览器不支持视频播放
          </video>
          <div className="bg-gray-100 px-3 py-2 text-sm text-gray-600">
            {children}
          </div>
        </div>
      );
    }

    // 普通链接
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
        {...props}
      >
        {children}
      </a>
    );
  },
  
  // 处理图片，添加样式和懒加载
  img: ({ node, src, alt, ...props }) => {
    if (!src) return null;
    
    return (
      <div className="my-4 rounded-lg overflow-hidden shadow-lg">
        <img
          src={src}
          alt={alt || "图片"}
          loading="lazy"
          className="w-full h-auto"
          {...props}
        />
        {alt && (
          <div className="bg-gray-100 px-3 py-2 text-sm text-gray-600">
            {alt}
          </div>
        )}
      </div>
    );
  },
};

export default function PilatesApp() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  // 检查登录状态
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // 加载中状态
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // 未登录重定向
  if (!session) {
    return null;
  }

  const isAdmin = session.user?.role === "ADMIN";

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans text-gray-800">
      {/* 侧边栏 */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 text-gray-300 flex-shrink-0">
        {/* Logo */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <div>
              <h1 className="font-bold text-white">普拉提助手</h1>
              <p className="text-xs text-gray-500">您的专属教练</p>
            </div>
          </div>
        </div>

        {/* 用户信息 */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {session.user?.name || session.user?.email?.split("@")[0]}
              </p>
              <p className="text-xs text-gray-500">
                {isAdmin ? "管理员" : "学员"}
              </p>
            </div>
          </div>
        </div>

        {/* 菜单 */}
        <div className="flex-1 p-4 space-y-2">
          <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg text-white">
            <MessageCircle className="w-5 h-5" />
            <span>智能对话</span>
          </div>

          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2 p-3 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span>教材管理</span>
            </Link>
          )}
        </div>

        {/* 退出登录 */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 w-full p-3 hover:bg-gray-800 rounded-lg transition-colors text-red-400"
          >
            <LogOut className="w-5 h-5" />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      {/* 主界面 */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-white">
        {/* 移动端顶栏 */}
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">P</span>
            </div>
            <span className="font-bold">普拉提助手</span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                href="/admin"
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Settings className="w-5 h-5" />
              </Link>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 hover:bg-gray-100 rounded-lg text-red-500"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* 聊天内容区 */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-6 bg-gray-50/30">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <Bot className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-xl font-medium text-gray-600 mb-2">
                你好，{session.user?.name || "学员"}！
              </h2>
              <p className="text-center max-w-md">
                我是你的专属普拉提教练。你可以问我关于普拉提动作、训练计划、呼吸技巧等任何问题。
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {[
                  "如何正确收紧核心？",
                  "推荐初学者动作",
                  "缓解腰痛的练习",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      const fakeEvent = {
                        target: { value: suggestion },
                      } as React.ChangeEvent<HTMLInputElement>;
                      handleInputChange(fakeEvent);
                    }}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-4 max-w-4xl mx-auto w-full ${
                m.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                  m.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-emerald-500 text-white"
                }`}
              >
                {m.role === "user" ? (
                  <User size={20} />
                ) : (
                  <Bot size={20} />
                )}
              </div>

              <div
                className={`flex-1 flex flex-col ${
                  m.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`p-4 rounded-2xl shadow-sm leading-relaxed max-w-[85%] ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-100"
                  }`}
                >
                  <article
                    className={`prose prose-sm max-w-none break-words ${
                      m.role === "user" ? "prose-invert" : "text-gray-700"
                    }`}
                  >
                    <ReactMarkdown 
                      rehypePlugins={[rehypeRaw]}
                      components={MarkdownComponents}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </article>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4 max-w-4xl mx-auto w-full">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm bg-emerald-500 text-white">
                <Bot size={20} />
              </div>
              <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>正在思考...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* 底部输入区 */}
        <div className="border-t bg-white p-4 sm:p-6 shadow-lg">
          <form
            onSubmit={handleSubmit}
            className="max-w-4xl mx-auto relative flex items-center"
          >
            <input
              id="chat-input"
              name="prompt"
              value={input}
              onChange={handleInputChange}
              placeholder="问问教练如何缓解腰部酸痛..."
              className="w-full p-4 pr-14 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-3 p-2 bg-emerald-500 text-white rounded-xl disabled:opacity-30 hover:bg-emerald-600 shadow-sm"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}