"use client";

import React, { useEffect, useRef } from 'react'; // 👈 新增：引入 useEffect 和 useRef
import { useChat } from '@ai-sdk/react';
import ReactMarkdown from 'react-markdown';
import { Menu, Plus, Send, Paperclip, User, Bot } from 'lucide-react';

export default function PilatesApp() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  
  // 👈 新增：用于精确定位消息列表末尾的引用
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 👈 新增：自动滚动到底部的函数
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 👈 新增：每当消息数组发生变化，就触发滚动
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans">
      {/* 左侧侧边栏保持不变 */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 text-gray-300 transition-all duration-300">
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
          <h1 className="text-white font-bold text-lg">普拉提助手</h1>
        </div>
        <div className="p-4">
          <button className="flex items-center gap-2 w-full p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors">
            <Plus size={18} />
            <span>新建训练计划</span>
          </button>
        </div>
      </aside>

      {/* 右侧主对话区 */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* 聊天记录显示区 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 pb-40">
          {messages.length === 0 && (
            <div className="flex gap-4 max-w-3xl mx-auto text-gray-500">
              <Bot size={20} />
              <p>你好！我是你的普拉提教练。我们今天练什么？</p>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex gap-4 max-w-3xl mx-auto ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {m.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              
              <div className={`flex-1 space-y-2 flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-4 rounded-lg shadow-sm leading-relaxed max-w-[90%] ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-100 text-gray-700'}`}>
                  {/* 优化点：增加 break-words 防止长文本溢出，并确保 Markdown 容器宽度 */}
                  <div className="prose prose-sm max-w-none break-words">
                    <ReactMarkdown>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {/* 👈 新增：滚动锚点，确保它位于所有消息之后 */}
          <div ref={messagesEndRef} />
        </div>

        {/* 底部输入框区域 */}
        <div className="absolute bottom-0 left-0 right-0 bg-white p-6 border-t">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative flex items-center">
            <input 
              id="message-input" // 👈 修复控制台 ID 警告
              name="message"      // 👈 修复控制台 Name 警告
              value={input} 
              onChange={handleInputChange}
              placeholder="输入你的问题..."
              className="w-full p-4 pr-12 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-3 p-2 bg-emerald-500 text-white rounded-lg disabled:opacity-30"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}