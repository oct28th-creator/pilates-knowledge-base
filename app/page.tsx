"use client";

import React, { useState } from 'react';
import { Menu, Plus, Send, Paperclip, User, Bot, Search } from 'lucide-react';

export default function PilatesApp() {
  const [input, setInput] = useState('');

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans">
      
      {/* 左侧侧边栏 (PC端显示，移动端可通过按钮呼出，这里先做基础的固定自适应) */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 text-gray-300 transition-all duration-300">
        <div className="p-4 flex items-center justify-between border-b border-gray-800">
          <h1 className="text-white font-bold text-lg">普拉提助手</h1>
          <button className="p-1 hover:bg-gray-800 rounded">
            <Menu size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <button className="flex items-center gap-2 w-full p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors">
            <Plus size={18} />
            <span>新建训练计划</span>
          </button>
        </div>

        {/* 历史记录占位 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-xs text-gray-500 font-semibold mb-2">历史记录</p>
          <div className="p-2 hover:bg-gray-800 rounded cursor-pointer truncate text-sm">如何激活核心肌群？</div>
          <div className="p-2 hover:bg-gray-800 rounded cursor-pointer truncate text-sm">百次拍击 (The Hundred) 解析</div>
        </div>
      </aside>

      {/* 右侧主对话区 */}
      <main className="flex-1 flex flex-col h-full relative">
        {/* 移动端顶部导航 */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b">
          <div className="flex items-center gap-2">
            <button className="text-gray-600"><Menu size={24} /></button>
            <h1 className="font-bold text-lg">普拉提助手</h1>
          </div>
        </header>

        {/* 聊天记录显示区 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 pb-32">
          
          {/* AI 欢迎语 */}
          <div className="flex gap-4 max-w-3xl mx-auto">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-600">
              <Bot size={20} />
            </div>
            <div className="flex-1 space-y-2">
              <p className="font-semibold text-gray-800">普拉提教练</p>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 text-gray-600 leading-relaxed">
                你好！我是你的专属普拉提训练助手。你可以向我搜索普拉提教材内容，上传你的训练视频让我进行专业解析，或者告诉我你今天的训练目标。我们今天从哪里开始？
              </div>
            </div>
          </div>

          {/* 用户提问示例（占位） */}
          <div className="flex gap-4 max-w-3xl mx-auto flex-row-reverse">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
              <User size={20} />
            </div>
            <div className="flex-1 space-y-2 flex flex-col items-end">
              <p className="font-semibold text-gray-800">学员</p>
              <div className="bg-blue-600 text-white p-4 rounded-lg shadow-sm leading-relaxed max-w-[85%]">
                我想了解一下适合初学者的背部肌肉放松课程。
              </div>
            </div>
          </div>

        </div>

        {/* 底部输入框区域 */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pt-6 pb-6 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto relative flex items-center">
            <button className="absolute left-3 p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Paperclip size={20} />
            </button>
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入你的训练目标，或上传视频/PDF教材..."
              className="w-full pl-12 pr-12 py-4 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
            <button 
              className="absolute right-3 p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!input.trim()}
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">
            AI 教练可能会产生不准确的信息，请在进行高强度训练前咨询专业人士。
          </p>
        </div>
      </main>
    </div>
  );
}