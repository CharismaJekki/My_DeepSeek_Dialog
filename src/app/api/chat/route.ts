// src/app/api/chat/route.ts
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
  try {
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
      model: deepseek(model),
      system: "You are a helpful assistant.",
      messages: await convertToModelMessages(messages),
      onFinish: async (res) => {
        // 模型返回结果 持久化
        try {
          await createMessage(chat_id, res.text, "assistant");
        } catch (dbError) {
          console.error(
            "Database error when saving assistant message:",
            dbError,
          );
          // 即使数据库错误也不影响流式输出
        }
      },
      onError: async (err) => {
        console.error("AI model error:", err);
        // 可以添加错误日志或监控
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Streaming endpoint error:", error);
    // 确保返回有效的错误响应
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
      },
    );
  }
}
