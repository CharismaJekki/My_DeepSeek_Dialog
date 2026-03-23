import { createChat, getChats } from "@/src/db";
import { auth } from "@clerk/nextjs/server";
export async function POST(req: Request) {
  const { userId } = await auth();
  // 检测用户是否登录
  if (userId) {
    //  获取当前用户的所有对话
    const chats = await getChats(userId);

    // 返回所有对话
    return new Response(JSON.stringify(chats), { status: 200 });
  }
  return new Response(null, { status: 200 });
}
