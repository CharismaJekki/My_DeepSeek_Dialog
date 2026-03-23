import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { chatsTable, messagesTable } from "./schema";
import { and, desc, eq } from "drizzle-orm";

// 同步连接数据库
// async function main() {
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle({ client });
// }

// main();

// 创建对话
export const createChat = async (
  title: string,
  userId: string,
  model: string,
) => {
  try {
    const [newChat] = await db
      .insert(chatsTable)
      .values({ title, userId, model })
      .returning();
    return newChat;
  } catch (error) {
    console.error(error);
    return null;
  }
};

// 获取对话
export const getChat = async (chatId: number, userId: string) => {
  try {
    const chats = await db
      .select()
      .from(chatsTable)
      .where(and(eq(chatsTable.id, chatId), eq(chatsTable.userId, userId)));
    if (chats.length === 0) {
      return null;
    }
    return chats[0];
  } catch (error) {
    console.error(error);
    return null;
  }
};

// 获取当前用户侧边栏获取对话
export const getChats = async (userId: string) => {
  try {
    const chats = await db
      .select()
      .from(chatsTable)
      .where(eq(chatsTable.userId, userId))
      .orderBy(desc(chatsTable.id));

    return chats;
  } catch (error) {
    console.error(error);
    return null;
  }
};

// 获取消息messages
export const createMessage = async (
  chatId: number,
  content: string,
  role: string,
) => {
  try {
    const [newMessage] = await db
      .insert(messagesTable)
      .values({ chatId, content, role })
      .returning();
    return newMessage;
  } catch (error) {
    console.error(error);
    return null;
  }
};

// 获取消息messages
export const getMessagesById = async (chatId: number) => {
  try {
    const messages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.chatId, chatId));
    if (messages.length === 0) {
      return null;
    }
    return messages;
  } catch (error) {}
};
