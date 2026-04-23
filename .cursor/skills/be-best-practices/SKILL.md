---
name: be-best-practices
description: 此 skill 应在开发 fullstack-template 后端（apps/server）时自动触发，提供基于真实代码分析的后端规范。当用户要求创建 controller、service、model、DB schema 或测试时，读取对应 rules 文件。
user-invocable: false
---

# Backend Best Practices — fullstack-template

## 技术栈

- Bun 运行时（含内置 SQLite 和测试框架）
- Elysia 1.4.28（HTTP 框架，TypeBox 类型验证，内置 Swagger）
- Drizzle ORM 0.45.2（SQL schema 定义 + 类型推断）
- SQLite（bun:sqlite）+ WAL 模式
- consola 3.4.2（日志）
- bun:test（内置单元测试框架）
- TypeScript strict 模式 + moduleResolution nodenext + `@/*` 路径别名

## 分层架构

```
src/
  index.ts         # 启动入口：运行 migration + 启动服务器
  app.ts           # App 组装：注册 cors + swagger + controllers
  db/
    index.ts       # Drizzle 客户端实例
    schema.ts      # 表定义 + $inferSelect/$inferInsert 类型导出
  models/
    userModel.ts   # Elysia TypeBox model（domain.purpose 命名）
  controllers/
    userController.ts  # 路由前缀 + handler 绑定（委托给 service）
  services/
    userService.ts     # 业务逻辑（static 类方法）
```

## Rules 文件

| 文件 | 读取时机 |
|------|----------|
| `rules/app-structure.md` | 修改 app.ts 或 index.ts，注册新 controller 时 |
| `rules/controllers.md` | 创建或修改 Elysia controller 时 |
| `rules/services.md` | 创建或修改 service 类时 |
| `rules/models.md` | 定义 Elysia TypeBox model 时 |
| `rules/database.md` | 修改 Drizzle schema 或编写数据库查询时 |
| `rules/typescript.md` | 定义类型或使用路径别名时 |
| `rules/testing.md` | 编写或修改 bun:test 测试时 |
| `rules/error-handling.md` | 处理请求错误或参数校验时 |
