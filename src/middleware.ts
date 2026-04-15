import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)"]);

// 定义哪些是公开路由（不需要登录
export default clerkMiddleware(async (auth, req) => {
  // 如果不是公开路由，就需要登录验证
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

// 配置 matcher，指定 middleware 生效的路径
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
