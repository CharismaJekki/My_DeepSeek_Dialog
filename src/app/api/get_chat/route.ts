import { getChat } from "@/src/db";
import { auth } from "@clerk/nextjs/server";
import { unauthorized } from "next/navigation";
export async function POST(req: Request) {
  const { chat_id } = await req.json();
  const { userId } = await auth();
  // 检测用户是否登录
  if (userId) {
    // 1. 获取chat
    const chat = await getChat(chat_id, userId);

    // 返回
    return new Response(JSON.stringify(chat), { status: 200 });
  }
  return new Response(JSON.stringify({ error: unauthorized }), { status: 401 });
}
