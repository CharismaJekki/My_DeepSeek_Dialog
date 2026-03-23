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

  const handleChangeModel = useCallback(() => {
    setMode(mode === "deepseek-v3" ? "deepseek-r1" : "deepseek-v3");
  }, [mode]);

  const { chat_id } = useParams();
  // 获取chat
  const { data: chat } = useQuery({
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

  const { messages, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        model: mode,
        chat_id: chat_id,
        chat_user_id: chat?.data?.userId,
      },
    }),
    messages: previousMessages?.data || [],
  });
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 初始跳转对话框界面消息展示
  const handleInitMessages = useCallback(async () => {
    if (chat?.data?.title && !previousMessages?.data?.length) {
      await sendMessage(
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
                  // <span key={index}></span>
                  <p key={index} className={`inline-block p-2 rounded-lg`}>
                    {part.text}
                  </p>
                ) : null,
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 输入框 */}

      <div className="flex flex-col items-center justify-center mt-4 shadow-lg border border-gray-300 h-32 rounded-lg w-2/3">
        <textarea
          className="w-full rounded-lg h-30 focus:outline-none"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        ></textarea>
        {/* 模型选择 */}
        <div className="flex flex-row items-center justify-between w-full h-12 mb-2">
          <div>
            <div
              className={`flex flex-row items-center justify-center rounded-lg border px-2 py-1 ml-2 cursor-pointer ${mode === "deepseek-r1" ? "border-blue-300 bg-blue-200" : "border-gray-300"}`}
              onClick={handleChangeModel}
            >
              <p className="text-sm"> 深度思考(R1)</p>
            </div>
          </div>
          <div className="flex items-center justify-center border-2 mr-4 border-black p-1 rounded-full">
            <EastIcon
              onClick={(e) => {
                e.preventDefault();
                if (input.trim()) {
                  sendMessage({ text: input });
                  setInput("");
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
