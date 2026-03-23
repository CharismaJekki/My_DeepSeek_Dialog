import { convertToModelMessages, streamText } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { auth } from "@clerk/nextjs/server";
import { createMessage } from "@/src/db";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.BASE_URL,
});

export async function POST(req: Request) {
  // messages是点击提交收到的消息
  const { messages, model, chat_id, chat_user_id } = await req.json();

  // 消息持久化 存储用户消息
  const { userId } = await auth();
  if (!userId || userId !== chat_user_id) {
    return new Response(JSON.stringify({ error: "Unauthorized access" }), {
      status: 403,
    });
  }
  const lastMessage = messages[messages.length - 1];
  await createMessage(chat_id, lastMessage.content, lastMessage.role);

  // 消息给到deepseek模型 得到的result流式输出
  const result = streamText({
    model: deepseek("deepseek-v3"),
    system: "You are a helpful assistant.",
    messages: await convertToModelMessages(messages),
    onFinish: async (res) => {
      // 模型返回结果 持久化
      await createMessage(chat_id, res.text, "assistant");
    },
  });

  return result.toUIMessageStreamResponse();
}
