// src/hooks/useHeartbeat.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseHeartbeatOptions {
  url: string; // 心跳检测的URL
  interval: number; // 检测间隔（毫秒），默认5000ms
  timeout: number; // 超时时间（毫秒），默认3000ms
  onStatusChange?: (isConnected: boolean) => void; // 状态变化回调
}

export function useHeartbeat({
  url = "/api/health",
  interval = 5000,
  timeout = 3000,
  onStatusChange,
}: UseHeartbeatOptions) {
  const [isServerConnected, setIsServerConnected] = useState(true);
  const [latency, setLatency] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const checkConnection = useCallback(async () => {
    // 如果正在检查，跳过这次
    if (isChecking) return;

    // 取消上一次的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsChecking(true);
    const startTime = Date.now();
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(url, {
        method: "HEAD",
        cache: "no-cache",
        signal: abortControllerRef.current.signal,
      });

      if (response.ok) {
        const elapsed = Date.now() - startTime;
        setLatency(elapsed);
        setIsServerConnected(true);
        onStatusChange?.(true);
      } else {
        setIsServerConnected(false);
        onStatusChange?.(false);
      }
    } catch (error) {
      // fetch 报错说明连接不可用
      if ((error as Error).name !== "AbortError") {
        setIsServerConnected(false);
        setLatency(null);
        onStatusChange?.(false);
      }
    } finally {
      setIsChecking(false);
    }
  }, [url, isChecking, onStatusChange]);

  // 启动心跳检测
  useEffect(() => {
    // 立即执行一次检测
    checkConnection();

    // 设置定时器
    timerRef.current = setInterval(() => {
      checkConnection();
    }, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [checkConnection, interval]);

  // 手动触发检测
  const ping = useCallback(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    isServerConnected,
    latency,
    isChecking,
    ping,
  };
}
