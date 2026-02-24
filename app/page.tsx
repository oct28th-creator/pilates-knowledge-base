"use client";

import React, { useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import ReactMarkdown from 'react-markdown';
import { Menu, Plus, Send, User, Bot } from 'lucide-react';

export default function PilatesApp() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 确保对话始终滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-800 font-sans overflow-hidden">
      {/* 侧边栏 */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 text-gray-300 flex-shrink-0">
        <div className="p-4 font-bold border-b border-gray-800 text-white">普拉提助手</div>
        <div className="p-4">
          <button className="flex items-center gap-2 w-full p-2 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors">
            <Plus size={18} /> <span>新训练</span>
          </button>
        </div>
      </aside>

      {/* 主界面：使用 flex-col 确保内容区和输入框上下排列 */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-white">
        
        {/* 聊天内容区：flex-1 会占据除输入框外的所有高度，min-h-0 触发内部滚动 */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Bot size={48} className="mb-4 opacity-20" />
              <p>你好！我是接入了最新 Gemini 搜索能力的教练。有什么可以帮你的？</p>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex gap-4 max-w-4xl mx-auto w-full ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                m.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
              }`}>
                {m.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              
              <div className={`flex-1 flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-4 rounded-2xl shadow-sm leading-relaxed max-w-[85%] ${
                  m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-50 border text-gray-700'
                }`}>
                  <div className={`prose prose-sm max-w-none break-words ${m.role === 'user' ? 'prose-invert' : ''}`}>
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {/* 自动滚动锚点 */}
          <div ref={messagesEndRef} className="h-2" />
        </div>

        {/* 底部输入框：直接位于流中，不会遮挡消息 */}
        <div className="border-t bg-white p-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
            <input 
              id="chat-input"
              name="prompt"
              value={input} 
              onChange={handleInputChange}
              placeholder="问问教练最新的普拉提动作..."
              className="w-full p-4 pr-12 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-emerald-500 text-white rounded-xl disabled:opacity-30"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}