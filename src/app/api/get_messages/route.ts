import { getMessagesById } from "@/src/db";
import { auth } from "@clerk/nextjs/server";
export async function POST(req: Request) {
  const { userId } = await auth();
  const { chat_id, chat_user_id } = await req.json(); // 从请求体中获取chat_id入参

  if (!userId || userId !== chat_user_id) {
    return new Response(JSON.stringify({ error: "Unauthorized access" }), {
      status: 401,
    });
  }

  const messages = await getMessagesById(chat_id);
  return new Response(JSON.stringify(messages), { status: 200 });
}
