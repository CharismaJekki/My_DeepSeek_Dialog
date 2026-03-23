# My DeepSeek - AI 对话界面

一个仿 DeepSeek 的 AI 对话界面应用，支持多模型切换、用户认证和对话历史管理。

## 技术栈

### 前端框架

- **Next.js 16.2.0** - React 框架，使用 App Router
- **React 19.2.4** - UI 库
- **TypeScript 5** - 类型安全的 JavaScript 超集

### 样式和 UI

- **Tailwind CSS 4** - 实用优先的 CSS 框架
- **Material-UI 7.3.9** - React 组件库
- **Emotion 11.14.0** - CSS-in-JS 库

### AI 集成

- **@ai-sdk/deepseek 2.0.24** - DeepSeek AI SDK
- **@ai-sdk/react 3.0.118** - React AI hooks
- **ai 6.0.116** - Vercel AI SDK 核心

### 状态管理

- **TanStack Query 5.91.3** - 数据获取和缓存

### 身份验证

- **Clerk 7.0.5** - 用户认证和授权

### 数据库

- **PostgreSQL** - 关系型数据库（使用 Supabase）
- **Drizzle ORM 0.45.1** - 类型安全的 ORM
- **postgres 3.4.8** - PostgreSQL 客户端

### 工具库

- **Axios 1.13.6** - HTTP 客户端
- **dotenv 17.3.1** - 环境变量管理

## 项目结构

```
my_deepseek/
├── drizzle/                      # Drizzle ORM 生成的迁移文件
│   ├── meta/                     # 元数据
│   └── 0000_light_slyde.sql     # 数据库迁移脚本
├── public/                       # 静态资源
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                 # API 路由
│   │   │   ├── chat/            # 聊天 API
│   │   │   │   └── route.ts    # 处理聊天消息和 AI 响应
│   │   │   ├── creat_chat/       # 创建对话 API
│   │   │   │   └── route.ts
│   │   │   ├── get_chat/        # 获取单个对话 API
│   │   │   │   └── route.ts
│   │   │   ├── get_chats/       # 获取对话列表 API
│   │   │   │   └── route.ts
│   │   │   └── get_messages/   # 获取消息历史 API
│   │   │       └── route.ts
│   │   ├── chat/               # 对话页面
│   │   │   └── [chat_id]/     # 动态路由
│   │   │       └── page.tsx    # 对话详情页
│   │   ├── sign-in/            # 登录页面
│   │   │   └── [[...sign-in]]/
│   │   │       └── page.tsx
│   │   ├── layout.tsx          # 根布局
│   │   ├── page.tsx            # 首页
│   │   └── globals.css        # 全局样式
│   ├── components/             # React 组件
│   │   ├── Navibar.tsx        # 侧边导航栏
│   │   └── QueryClientProvider.tsx  # React Query 提供者
│   ├── db/                   # 数据库相关
│   │   ├── index.ts           # 数据库操作函数
│   │   └── schema.ts          # 数据库模型定义
│   └── middleware.ts          # Next.js 中间件
├── drizzle.config.ts          # Drizzle ORM 配置
├── next.config.ts            # Next.js 配置
├── tsconfig.json             # TypeScript 配置
├── postcss.config.mjs        # PostCSS 配置
└── package.json             # 项目依赖
```

## 数据库设计

### 数据表

#### chats 表

存储用户对话信息

- `id` - 主键（自增）
- `user_id` - 用户 ID（关联 Clerk 用户）
- `title` - 对话标题
- `model` - 使用的 AI 模型（deepseek-v3 或 deepseek-r1）

#### messages 表

存储对话消息

- `id` - 主键（自增）
- `chat_id` - 关联的对话 ID（外键）
- `role` - 消息角色（user 或 assistant）
- `content` - 消息内容

## 核心功能

### 1. 用户认证

- 使用 Clerk 进行用户注册和登录
- 支持多种登录方式
- 中间件保护需要认证的路由

### 2. 对话管理

- 创建新对话
- 查看对话历史
- 切换不同对话
- 对话持久化存储

### 3. AI 聊天

- 支持 DeepSeek V3 和 R1 模型
- 流式响应输出
- 消息历史记录
- 实时对话界面

### 4. 模型切换

- 在 deepseek-v3 和 deepseek-r1 之间切换
- R1 模型提供深度思考能力

## 实现流程

### 1. 用户登录流程

```
用户访问应用
  ↓
Clerk 中间件检查认证状态
  ↓
未登录 → 跳转到 /sign-in 页面
  ↓
用户完成登录
  ↓
获取用户信息并存储
```

### 2. 创建对话流程

```
用户在首页输入问题
  ↓
点击发送按钮
  ↓
检查用户是否登录
  ↓
调用 /api/creat_chat
  ↓
创建新的对话记录（chats 表）
  ↓
跳转到对话详情页 /chat/[chat_id]
  ↓
初始化对话消息
```

### 3. 聊天消息流程

```
用户在对话页面输入消息
  ↓
点击发送按钮
  ↓
调用 /api/chat
  ↓
验证用户权限
  ↓
保存用户消息到数据库（messages 表）
  ↓
调用 DeepSeek API
  ↓
流式返回 AI 响应
  ↓
保存 AI 响应到数据库
  ↓
前端实时显示消息
```

### 4. 对话历史加载流程

```
用户访问 /chat/[chat_id]
  ↓
调用 /api/get_chat 获取对话信息
  ↓
调用 /api/get_messages 获取消息历史
  ↓
初始化 useChat hook
  ↓
加载历史消息到界面
  ↓
自动滚动到最新消息
```

### 5. 模型切换流程

```
用户点击「深度思考(R1)」按钮
  ↓
切换 mode 状态（deepseek-v3 ↔ deepseek-r1）
  ↓
更新 useChat 的 body 参数
  ↓
后续消息使用新模型
```

## 环境变量

创建 `.env` 文件并配置以下变量：

```env
# Clerk 认证
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in

# DeepSeek API
DEEPSEEK_API_KEY=your_deepseek_api_key
BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

# 数据库连接（Supabase）
DATABASE_URL=postgresql://postgres.plgfnbzxonznjlakyfxg:password@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置数据库

1. 创建 Supabase 项目
2. 获取数据库连接字符串
3. 更新 `.env` 文件中的 `DATABASE_URL`
4. 运行数据库迁移：

```bash
npx drizzle-kit push
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 数据库操作

### 创建迁移文件

```bash
npx drizzle-kit generate
```

### 应用迁移

```bash
npx drizzle-kit migrate
```

### 推送 schema 变更

```bash
npx drizzle-kit push
```

## API 端点

### POST /api/chat

处理聊天消息并返回 AI 响应

- 请求体：`{ messages, model, chat_id, chat_user_id }`
- 响应：流式 AI 消息

### POST /api/creat-chat

创建新对话

- 请求体：`{ title, model }`
- 响应：`{ id, title, model, userId }`

### POST /api/get-chat

获取单个对话信息

- 请求体：`{ chat_id }`
- 响应：对话详情

### POST /api/get-chats

获取用户的所有对话

- 响应：对话列表

### POST /api/get-messages

获取对话的消息历史

- 请求体：`{ chat_id, chat_user_id }`
- 响应：消息列表

## 开发说明

### 添加新功能

1. 在 `src/db/schema.ts` 中定义数据库模型
2. 运行 `npx drizzle-kit generate` 生成迁移
3. 运行 `npx drizzle-kit push` 应用变更
4. 在 `src/app/api/` 中创建 API 路由
5. 在 `src/app/` 中创建页面组件

### 样式定制

项目使用 Tailwind CSS，可以在组件中直接使用 Tailwind 类名。全局样式在 `src/app/globals.css` 中定义。

## 部署

### Vercel 部署

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署

### 其他平台

项目可以部署到任何支持 Next.js 的平台，如：

- Netlify
- Railway
- Render
- 自建服务器

## 许可证

MIT
