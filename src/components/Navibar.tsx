"use client";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import React from "react";
import { ChatModel } from "../db/schema";
import { useRouter, usePathname } from "next/navigation";

// type Props = {};

const Navibar = () => {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const { data: chats } = useQuery({
    queryKey: ["chats"],
    queryFn: () => {
      return axios.post("/api/get_chats");
    },
    enabled: !!user?.id,
  });

  return (
    <div className="h-screen bg-gray-50">
      <div className="flex justify-center items-center">
        <p className="text-2xl font-bold">DeepSeek</p>
      </div>

      <div
        className="h-10 flex justify-center items-center mt-4 cursor-pointer"
        onClick={() => router.push("/")}
      >
        <p className="h-full w-2/3 bg-blue-100 rounded-lg flex items-center justify-center font-thin">
          创建新对话
        </p>
      </div>
      {/* 对话目录 */}
      <div>
        {chats?.data?.map((chat: ChatModel) => (
          <div
            key={chat.id}
            className="w-full h-10"
            onClick={() => router.push(`/chat/${chat.id}`)}
          >
            <p
              className={`bg-slate-200 font-extralight text-sm line-clamp-1 ${pathname === `/chat/${chat.id}` ? "text-blue-500" : ""}`}
            >
              {chat?.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Navibar;

// tsrfce快捷键
