// src/app/chat/[chat_id]/page.tsx
"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useRef, useEffect, useCallback } from "react";
import EastIcon from "@mui/icons-material/East";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useHeartbeat } from "../../../hooks/useHeartbeats";

export default function Page() {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState("deepseek-v3");
  const [error, setError] = useState<string | null>(null);
  const [partialMessageId, setPartialMessageId] = useState<string | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  // 心跳检测
  const { isServerConnected, latency, ping } = useHeartbeat({
    url: "/api/health",
    interval: 5000,
    timeout: 3000,
    onStatusChange: (isConnected: boolean) => {
      if (!isConnected) {
        setError("与服务器的连接已断开，正在重连...");
      } else {
        setError(null);
        setReconnectAttempt(0);
      }
    },
  });

  const handleChangeModel = useCallback(() => {
    setMode((prevMode) =>
      prevMode === "deepseek-v3" ? "deepseek-r1" : "deepseek-v3",
    );
  }, []);

  const { chat_id } = useParams();
  const { data: chat } = useQuery({
    queryKey: ["chat", chat_id],
    queryFn: async () => {
      return await axios.post(`/api/get_chat`, { chat_id });
    },
  });

  // 获取消息时检查完整性
  const { data: previousMessages } = useQuery({
    queryKey: ["messages", chat_id],
    queryFn: async () => {
      const result = await axios.post(`/api/get_messages`, {
        chat_id,
        chat_user_id: chat?.data?.userId,
      });
      return result.data;
    },
    enabled: !!chat?.data?.id,
  });

  // 标记未完成的消息
  const processedMessages = useCallback(() => {
    if (!previousMessages?.data) return [];
    return previousMessages.data.map((msg: any) => ({
      ...msg,
      isComplete: msg.is_complete ?? true, // 默认为完整
    }));
  }, [previousMessages]);

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
    messages: processedMessages(),
    onError: (err) => {
      console.error("Streaming error:", err);
      // 区分是完整错误还是部分响应
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === "assistant") {
          setError("AI回复已部分保存，可以继续对话或重试");
          setPartialMessageId(lastMessage.id);
        } else {
          setError("连接中断，请重试");
        }
      } else {
        setError("连接中断，请重试");
      }
      ping();
    },
    onFinish: () => {
      setError(null);
      setPartialMessageId(null);
    },
  });

  // 检查最后一条AI消息是否为部分响应
  const lastAssistantMessage = messages
    .filter((m) => m.role === "assistant")
    .pop();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
          {messages.map((message: any) => {
            // 判断是否是部分响应
            const isPartial = message.id === partialMessageId;

            return (
              <div
                className={`rounded-lg flex flex-row ${
                  message.role === "user"
                    ? "bg-slate-200 justify-end ml-10"
                    : "bg-blue-300 text-black justify-start mr-16"
                }`}
                key={message.id}
              >
                {message.parts.map((part: any, index: number) =>
                  part.type === "text" ? (
                    <div key={index} className="relative">
                      <p
                        className={`inline-block p-2 rounded-lg ${isPartial ? "bg-yellow-100" : ""}`}
                      >
                        {part.text}
                      </p>
                      {/* 部分响应提示 */}
                      {isPartial && (
                        <span className="absolute -top-4 left-0 text-xs text-yellow-600 bg-yellow-100 px-1 rounded">
                          ⚠️ 部分响应
                        </span>
                      )}
                    </div>
                  ) : null,
                )}
              </div>
            );
          })}

          {/* 错误提示 */}
          {error && (
            <div
              className={`border px-4 py-3 rounded-lg mb-4 ${
                partialMessageId
                  ? "bg-yellow-100 border-yellow-400 text-yellow-700"
                  : "bg-red-100 border-red-400 text-red-700"
              }`}
            >
              <p className="flex items-center">
                <span className="mr-2">{partialMessageId ? "⚠️" : "❌"}</span>
                {error}
                {latency && (
                  <span className="ml-2 text-sm">(延迟: {latency}ms)</span>
                )}
              </p>
              <div className="flex gap-2 mt-2">
                {partialMessageId ? (
                  <>
                    <button
                      onClick={() => retry()}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm"
                    >
                      继续生成
                    </button>
                    <span className="text-sm text-yellow-600 py-1">
                      已保存部分回复，可继续对话
                    </span>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      ping();
                      retry();
                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm"
                  >
                    重试
                  </button>
                )}
              </div>
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
          disabled={!isServerConnected}
        ></textarea>

        {/* 模型选择 + 连接状态 */}
        <div className="flex flex-row items-center justify-between w-full h-12 mb-2">
          <div className="flex items-center">
            <div
              className={`flex flex-row items-center justify-center rounded-lg border px-2 py-1 ml-2 cursor-pointer ${mode === "deepseek-r1" ? "border-blue-300 bg-blue-200" : "border-gray-300"}`}
              onClick={handleChangeModel}
            >
              <p className="text-sm"> 深度思考(R1)</p>
            </div>

            {/* 连接状态指示器 */}
            <div className="ml-4 flex items-center">
              <span
                className={`w-2 h-2 rounded-full mr-1 ${
                  isServerConnected
                    ? latency && latency > 2000
                      ? "bg-yellow-500"
                      : "bg-green-500"
                    : "bg-red-500"
                }`}
              ></span>
              <span className="text-xs text-gray-600">
                {isServerConnected
                  ? latency
                    ? `在线 (${latency}ms)`
                    : "在线"
                  : "离线"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center border-2 mr-4 border-black p-1 rounded-full">
            <EastIcon
              onClick={(e) => {
                e.preventDefault();
                if (input.trim() && isServerConnected) {
                  sendMessage({ text: input });
                  setInput("");
                }
              }}
              style={{
                cursor: isServerConnected ? "pointer" : "not-allowed",
                opacity: isServerConnected ? 1 : 0.5,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
