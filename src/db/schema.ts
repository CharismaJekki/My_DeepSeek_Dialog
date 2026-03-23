import { integer, pgTable, varchar, serial, text } from "drizzle-orm/pg-core";

// export const usersTable = pgTable("users", {
//   id: integer().primaryKey().generatedAlwaysAsIdentity(),
//   name: varchar({ length: 255 }).notNull(),
//   age: integer().notNull(),
//   email: varchar({ length: 255 }).notNull().unique(),
// });

// 对话表
export const chatsTable = pgTable("chats", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  model: text("model").notNull(),
});
// 消息表
export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").references(() => chatsTable.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
});

// 用于传参
export type ChatModel = typeof chatsTable.$inferSelect;
export type MessageModel = typeof messagesTable.$inferSelect;
