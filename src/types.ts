// types/api.ts
export interface ChatResponse {
  id: number;
  title: string;
  userId: string;
  model: string;
}

export interface MessageResponse {
  id: number;
  chatId: number | null;
  role: string;
  content: string;
}
