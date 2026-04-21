# react-template

基于 React 19 + TypeScript + Vite 的前端项目模板，开箱即用。

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | React 19 |
| 语言 | TypeScript 6 |
| 构建工具 | Vite 8 |
| 路由 | React Router 7 |
| 状态管理 | Zustand 5 |
| 代码规范 | ESLint + @antfu/eslint-config |
| E2E 测试 | Playwright |
| 覆盖率 | vite-plugin-istanbul + nyc |
| Git 规范 | simple-git-hooks + commitlint（Conventional Commits）|

## 项目结构

```
src/
├── assets/        # 静态资源
├── layouts/       # 布局组件
├── pages/         # 页面组件（Home、About、NotFound）
├── router/        # 路由配置
├── store/         # Zustand 状态
├── App.tsx
└── main.tsx
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产产物
pnpm build

# 预览构建结果
pnpm preview
```

## 代码规范

```bash
# 检查
pnpm lint

# 自动修复
pnpm lint:fix
```

提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范，由 commitlint 在 `commit-msg` 阶段自动校验。

## 测试

```bash
# 运行 E2E 测试
pnpm test:e2e

# 打开 Playwright UI 模式
pnpm test:e2e:ui

# 生成覆盖率报告
pnpm coverage:report
```
