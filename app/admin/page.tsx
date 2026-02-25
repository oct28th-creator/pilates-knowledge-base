"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  Trash2,
  FileText,
  Video,
  Image as ImageIcon,
  File,
  Loader2,
  ArrowLeft,
  Search,
} from "lucide-react";

interface Material {
  id: string;
  title: string;
  description: string | null;
  type: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
  _count: { chunks: number };
}

const typeIcons: Record<string, React.ReactNode> = {
  video: <Video className="w-5 h-5" />,
  image: <ImageIcon className="w-5 h-5" />,
  pdf: <FileText className="w-5 h-5" />,
  doc: <File className="w-5 h-5" />,
};

const typeLabels: Record<string, string> = {
  video: "视频",
  image: "图片",
  pdf: "PDF",
  doc: "文档",
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // 表单状态
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // 获取教材列表
  const fetchMaterials = useCallback(async () => {
    try {
      const res = await fetch("/api/materials");
      if (res.ok) {
        const data = await res.json();
        setMaterials(data.materials);
      }
    } catch (error) {
      console.error("获取教材失败:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/login");
      return;
    }

    if (session.user.role !== "ADMIN") {
      router.push("/");
      return;
    }

    fetchMaterials();
  }, [session, status, router, fetchMaterials]);

  // 上传文件
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !title) {
      alert("请填写标题并选择文件");
      return;
    }

    setIsUploading(true);
    setUploadProgress("正在上传...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      formData.append("description", description);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "上传失败");
      }

      setUploadProgress("上传成功！");
      setTitle("");
      setDescription("");
      setFile(null);

      // 重置文件输入
      const fileInput = document.getElementById("file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // 刷新列表
      fetchMaterials();
    } catch (error) {
      setUploadProgress(`上传失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(""), 3000);
    }
  };

  // 删除教材
  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个教材吗？")) return;

    try {
      const res = await fetch(`/api/materials?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchMaterials();
      } else {
        const data = await res.json();
        alert(data.error || "删除失败");
      }
    } catch (error) {
      console.error("删除失败:", error);
      alert("删除失败");
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 过滤教材
  const filteredMaterials = materials.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-gray-800">教材管理</h1>
          </div>
          <span className="text-sm text-gray-500">
            管理员: {session?.user?.name || session?.user?.email}
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 上传表单 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-500" />
                上传教材
              </h2>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="教材标题"
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    描述
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="简要描述教材内容..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    文件 <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="file-input"
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    accept="video/*,image/*,.pdf,.doc,.docx"
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:bg-emerald-50 file:text-emerald-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    支持: 视频、图片、PDF、Word文档 (最大100MB)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                  {isUploading ? "上传中..." : "上传"}
                </button>

                {uploadProgress && (
                  <p
                    className={`text-sm text-center ${
                      uploadProgress.includes("成功")
                        ? "text-green-600"
                        : uploadProgress.includes("失败")
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {uploadProgress}
                  </p>
                )}
              </form>
            </div>
          </div>

          {/* 教材列表 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">
                  已上传教材 ({materials.length})
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索教材..."
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {filteredMaterials.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无教材</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMaterials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className={`p-3 rounded-lg ${
                          material.type === "video"
                            ? "bg-purple-100 text-purple-600"
                            : material.type === "image"
                            ? "bg-blue-100 text-blue-600"
                            : material.type === "pdf"
                            ? "bg-red-100 text-red-600"
                            : "bg-orange-100 text-orange-600"
                        }`}
                      >
                        {typeIcons[material.type]}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 truncate">
                          {material.title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span>{typeLabels[material.type]}</span>
                          <span>{formatFileSize(material.fileSize)}</span>
                          {material._count.chunks > 0 && (
                            <span className="text-emerald-600">
                              {material._count.chunks} 个知识块
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(material.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
