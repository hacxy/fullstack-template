---
name: fe-best-practices
description: 此 skill 应在开发 fullstack-template 前端（apps/web）时自动触发，提供基于真实代码分析的前端规范。当用户要求创建组件、store、API 调用、路由配置或测试时，读取对应 rules 文件。
user-invocable: false
---

# Frontend Best Practices — fullstack-template

## 技术栈

- React 19.2.5 + TypeScript 6 + Vite 8
- React Router 7（createBrowserRouter 配置式路由）
- Zustand 5（自定义 createStore 工厂函数 + devtools 中间件）
- openapi-fetch 0.17.0（类型安全 API 客户端，类型从 schema.gen.ts 自动生成）
- 后端响应协议由 `elysia-plugin-response` 统一输出 `{ code, msg, data }`，前端通过 service/store 层统一解包与报错处理
- Playwright（E2E 测试，带 nyc + vite-plugin-istanbul 覆盖率）
- @antfu/eslint-config（含 verbatimModuleSyntax 约束）
- 纯 CSS + 行内样式（无 Tailwind、无 CSS-in-JS、无组件库）

## Rules 文件

| 文件 | 读取时机 |
|------|----------|
| `rules/component-patterns.md` | 创建或修改 React 组件时 |
| `rules/state-management.md` | 创建或修改 Zustand store 时 |
| `rules/api-calls.md` | 编写 API 请求或 service 相关代码时 |
| `rules/routing.md` | 添加路由或修改路由配置时 |
| `rules/error-handling.md` | 处理 loading/error 状态或用户反馈时 |
| `rules/styling.md` | 为组件添加样式时 |
| `rules/typescript.md` | 定义类型、interface 或泛型时 |
| `rules/directory-structure.md` | 创建新文件或目录时 |
| `rules/testing.md` | 编写或修改 E2E 测试时 |
