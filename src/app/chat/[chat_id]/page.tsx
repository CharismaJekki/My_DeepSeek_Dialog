// src/app/chat/[chat_id]/page.tsx
"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect, useCallback } from "react";
import EastIcon from "@mui/icons-material/East";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export default function Page() {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState("deepseek-v3"); // 模型选择
  const [error, setError] = useState<string | null>(null); // 错误状态
  const [isConnected, setIsConnected] = useState(navigator.onLine); // 网络状态

  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => {
      setIsConnected(true);
      if (error) {
        setError(null); // 网络恢复时清除错误
      }
    };

    const handleOffline = () => {
      setIsConnected(false);
      setError("网络连接已断开，请检查网络后重试");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [error]);

  const handleChangeModel = useCallback(() => {
    setMode((prevMode) =>
      prevMode === "deepseek-v3" ? "deepseek-r1" : "deepseek-v3",
    );
  }, []);

  const { chat_id } = useParams();
  // 获取chat
  const { data: chat, isLoading } = useQuery({
    queryKey: ["chat", chat_id],
    queryFn: async () => {
      return await axios.post(`/api/get_chat`, { chat_id });
    },
  });

  // 获取之前的消息
  const { data: previousMessages } = useQuery({
    queryKey: ["messages", chat_id],
    queryFn: async () => {
      return await axios.post(`/api/get_messages`, {
        chat_id,
        chat_user_id: chat?.data?.userId,
      });
    },
    enabled: !!chat?.data?.id,
  });

  const {
    messages,
    sendMessage,
    isLoading: isSending,
    retry,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        model: mode,
        chat_id: chat_id,
        chat_user_id: chat?.data?.userId,
      },
    }),
    messages: previousMessages?.data || [],
    onError: (err) => {
      console.error("Streaming error:", err);
      setError("连接中断，请重试");
    },
    onFinish: () => {
      setError(null); // 完成时清除错误
    },
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 初始跳转对话框界面消息展示
  const handleInitMessages = useCallback(() => {
    if (chat?.data?.title && !previousMessages?.data?.length) {
      sendMessage(
        {
          role: "user",
          parts: [{ type: "text", text: chat?.data?.title }],
        },
        {
          body: {
            model: chat?.data?.model || mode,
            chat_id: chat_id,
            chat_user_id: chat?.data?.userId,
          },
        },
      );
    }
  }, [
    chat?.data?.title,
    chat?.data?.model,
    chat?.data?.userId,
    chat_id,
    mode,
    previousMessages?.data?.length,
    sendMessage,
  ]);

  useEffect(() => {
    handleInitMessages();
  }, [handleInitMessages]);

  return (
    <div className="flex flex-col h-screen justify-between items-center">
      <div className="flex flex-col w-2/3 gap-8 overflow-y-auto">
        <div className="h-4"></div>
        <div className="flex flex-col gap-8 flex-1">
          {messages.map((message) => (
            <div
              className={`rounded-lg flex flex-row ${message.role === "user" ? "bg-slate-200 justify-end ml-10" : "bg-blue-300 text-black justify-start mr-16"}`}
              key={message.id}
            >
              {message.parts.map((part, index) =>
                part.type === "text" ? (
                  <p key={index} className={`inline-block p-2 rounded-lg`}>
                    {part.text}
                  </p>
                ) : null,
              )}
            </div>
          ))}
          {/* 错误提示 */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
              <p className="flex items-center">
                <span className="mr-2">⚠️</span>
                {error}
              </p>
              <button
                onClick={() => retry()}
                className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm"
              >
                重试
              </button>
            </div>
          )}
          {/* 加载状态 */}
          {isSending && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">AI 正在思考...</span>
            </div>
          )}
        </div>
      </div>

      {/* 输入框 */}
      <div className="flex flex-col items-center justify-center mt-4 shadow-lg border border-gray-300 h-32 rounded-lg w-2/3">
        <textarea
          className="w-full rounded-lg h-30 focus:outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入你的问题..."
          disabled={!isConnected} // 网络断开时禁用输入
        ></textarea>
        {/* 模型选择 */}
        <div className="flex flex-row items-center justify-between w-full h-12 mb-2">
          <div className="flex items-center">
            <div
              className={`flex flex-row items-center justify-center rounded-lg border px-2 py-1 ml-2 cursor-pointer ${mode === "deepseek-r1" ? "border-blue-300 bg-blue-200" : "border-gray-300"}`}
              onClick={handleChangeModel}
            >
              <p className="text-sm"> 深度思考(R1)</p>
            </div>
            {/* 网络状态指示器 */}
            <div className="ml-4 flex items-center">
              <span
                className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"} mr-1`}
              ></span>
              <span className="text-xs text-gray-600">
                {isConnected ? "在线" : "离线"}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center border-2 mr-4 border-black p-1 rounded-full">
            <EastIcon
              onClick={(e) => {
                e.preventDefault();
                if (input.trim() && isConnected) {
                  sendMessage({ text: input });
                  setInput("");
                }
              }}
              style={{
                cursor: isConnected ? "pointer" : "not-allowed",
                opacity: isConnected ? 1 : 0.5,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
