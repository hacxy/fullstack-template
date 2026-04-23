# 目录结构规范

> 基于 `src/` 目录扫描及 `eslint.config.js` 中的文件命名规则得出。

## 概述

类型内聚组织方式（按文件类型分目录），目录 kebab-case，React 组件 PascalCase，其余 TS 文件 camelCase。

## 规则

### 目录命名

一律使用 kebab-case。

**✅ 正确写法：**
```
src/
  assets/      ✓
  layouts/     ✓
  pages/       ✓
  router/      ✓
  services/    ✓
  store/       ✓
```

**❌ 错误写法：**
```
src/
  Assets/       // PascalCase
  Layouts/      // PascalCase
  pageComponents/  // camelCase 目录
  routerConfig/    // camelCase 目录
```

---

### React 组件文件命名

PascalCase，与导出的组件名完全一致。

**✅ 正确写法：**
```
pages/Home.tsx        → export default Home
pages/About.tsx       → export default About
pages/NotFound.tsx    → export default NotFound
layouts/RootLayout.tsx → export default RootLayout
```

**❌ 错误写法：**
```
pages/home.tsx         // camelCase
pages/home-page.tsx    // kebab-case
pages/HomePage.tsx     // 与组件名不一致（export default Home）
layouts/root-layout.tsx // kebab-case
```

---

### 非组件 TS/TSX 文件命名

camelCase，包括工具函数、配置、入口和 store 文件。

**✅ 正确写法：**
```
main.tsx
counter.ts
createStore.ts
index.ts
client.ts
```

**❌ 错误写法：**
```
Main.tsx        // PascalCase
Counter.ts      // PascalCase（不是组件）
create-store.ts // kebab-case
```

---

### 组件配套 CSS 文件命名

与组件文件同名同目录，PascalCase。

**✅ 正确写法：**
```
layouts/RootLayout.tsx
layouts/RootLayout.css   ← 同名

pages/Home.tsx
pages/Home.css           ← 同名（若有独立样式）
```

**❌ 错误写法：**
```
layouts/rootLayout.css   // camelCase，应 PascalCase
layouts/root-layout.css  // kebab-case，应 PascalCase
styles/RootLayout.css    // 不在组件同目录
```

---

### Barrel 导出

`store/index.ts` 和 `services/index.ts` 使用 barrel 导出，其他目录视需要决定是否建 barrel。

**✅ 正确写法：**
```ts
// store/index.ts
export { useCounterStore } from './counter'
export { createStore } from './createStore'
export { useUsersStore } from './users'

// services/index.ts
export { client } from './client'
export type { components, paths } from './schema.gen'

// 组件从 barrel 导入
import { useUsersStore } from '../store'
import { client } from '../services'
```

**❌ 错误写法：**
```ts
// 跳过 barrel，直接从文件导入
import { useUsersStore } from '../store/users'
import { client } from '../services/client'

// 新建 store 文件后忘记在 index.ts 添加导出
// store/posts.ts 已创建，store/index.ts 未导出

// router 目录不需要 barrel（只有一个 index.tsx），不要创建额外 index 层
import router from '../router/index'  // 应 '../router'（已是 index）
```

---

### 类型内聚组织方式

按文件类型（pages、store、services…）归类，不按业务功能模块归类。

**✅ 正确写法：**
```
src/
  pages/      ← 所有页面（Home, About, NotFound）
  store/      ← 所有 store（counter, users）
  services/   ← 所有 API 相关（client, schema.gen）
  layouts/    ← 所有 layout
```

**❌ 错误写法：**
```
// 功能内聚（不符合项目结构）
src/
  features/
    users/
      UserPage.tsx
      useUsersStore.ts
      usersService.ts

// 按领域分层（不符合项目结构）
src/
  user/
    UserHome.tsx
    userStore.ts
    userClient.ts
```
