"use client";
import Image from "next/image";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import React, { useState, useCallback } from "react";
import EastIcon from "@mui/icons-material/East";
import { useMutation, QueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function Home() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("deepseek-v3"); // 模型选择

  const queryClient = new QueryClient();
  const router = useRouter();
  const user = useUser();

  const handleChangeModel = useCallback(() => {
    setMode(mode === "deepseek-v3" ? "deepseek-r1" : "deepseek-v3");
  }, [mode]);

  // Mutations
  const { mutate: createChat } = useMutation({
    mutationFn: async () => {
      return axios.post("/api/create_chat", {
        title: input,
        model: mode,
      });
    },
    onSuccess: (res) => {
      // Invalidate and refetch
      router.push(`/chat/${res.data.id}`);
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  const handleSumbit = () => {
    if (input.trim() === "") {
      return;
    }
    // 用户未登陆 跳转登录页
    if (!user) {
      router.push("/sign-in");
      return;
    }
    createChat();
  };

  return (
    <div className="h-screen flex flex-col items-center">
      <div className="h-1/5"></div>
      <div className="w-1/2">
        <p className="text-2xl text-center">有什么可以帮您的吗？</p>
        {/* 输入框 */}
        <div className="flex flex-col items-center justify-center mt-4 shadow-lg border-[1px] border-gray-300 h-32 rounded-lg">
          <textarea
            className="w-full rounded-lg h-30 focus:outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          ></textarea>
          {/* 模型选择 */}
          <div className="flex flex-row items-center justify-between w-full h-12 mb-2">
            <div>
              <div
                className={`flex flex-row items-center justify-center rounded-lg border-[1px] px-2 py-1 ml-2 cursor-pointer ${mode === "deepseek-r1" ? "border-blue-300 bg-blue-200" : "border-gray-300"}`}
                onClick={handleChangeModel}
              >
                <p className="text-sm"> 深度思考(R1)</p>
              </div>
            </div>
            <div className="flex items-center justify-center border-2 mr-4 border-black p-1 rounded-full">
              <EastIcon
                onClick={(e) => {
                  e.preventDefault();
                  handleSumbit();
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
