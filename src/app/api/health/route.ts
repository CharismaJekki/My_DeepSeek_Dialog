import { NextResponse } from "next/server";

// 创建健康检查API
export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: Date.now(),
  });
}
