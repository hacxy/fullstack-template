## 0.0.1 (2026-04-27)


### Bug Fixes

* **elysia-response:** 修复 void schema 在 OpenAPI 文档中错误展示 data 字段 ([4df18a3](https://github.com/hacxy/fullstack-template/commit/4df18a335c790f7ced0e648e38afedcd57193673))
* rsync 添加 --omit-dir-times 修复目录时间戳权限错误 ([f4bd518](https://github.com/hacxy/fullstack-template/commit/f4bd5188977ee642b11f13fbe88498f43ca6e672))
* **server:** 修复编译二进制迁移文件路径及模块导入扩展名 ([703b9a6](https://github.com/hacxy/fullstack-template/commit/703b9a653a374d9be21683673005728cef7b42be))
* **server:** 替换 @libsql/client 为 bun:sqlite 以支持二进制打包 ([01a2d09](https://github.com/hacxy/fullstack-template/commit/01a2d093f359e60ab90b5bfcb812c936838d9a50))
* **server:** 调整 Swagger servers 顺序，生产地址优先显示 ([40364d9](https://github.com/hacxy/fullstack-template/commit/40364d9fb5e4cbd48b8d35b451e6c6a6043278f7))
* 修正 drizzle 上传路径、rsync 权限及 nginx 检测正则 ([e4b209f](https://github.com/hacxy/fullstack-template/commit/e4b209f6a9eb9bc5c193398fe7a3c95e98a8385e))
* 修正 HTTP/HTTPS 协议逻辑，同步更新 README 部署文档 ([4893734](https://github.com/hacxy/fullstack-template/commit/48937346399ce7c779f72500ca43664bf9c21d68))
* 修正 sudoers 中 systemctl 路径及 status 参数通配符 ([cc98c60](https://github.com/hacxy/fullstack-template/commit/cc98c6096dd02bb0fc15f00f7c8ca86c0eeb2d91))
* 用 -rlz 替换 drizzle rsync 的 -avz，彻底消除目录时间戳权限错误 ([ce7e4f1](https://github.com/hacxy/fullstack-template/commit/ce7e4f11e645a79f8dcbe15167c09f3cccb59d45))


### Features

* **api-codegen:** 提交生成的 API 类型 ([89e931f](https://github.com/hacxy/fullstack-template/commit/89e931fc78a4ef2e01fc081cc8902ba1ac137e57))
* **ci:** 改进 CI 工作流并增强用户管理 E2E 测试 ([75ff3d7](https://github.com/hacxy/fullstack-template/commit/75ff3d79dd3734b4f263330e6b232f9934612dfe))
* **db:** 引入 Drizzle ORM 并生成初始迁移 ([3cd8fe0](https://github.com/hacxy/fullstack-template/commit/3cd8fe00634a68899da7bffbdae0463e2c6e2740))
* **elysia-response:** 新增 filterNull 选项，支持过滤响应及 schema 中的 null 字段 ([67b4bb3](https://github.com/hacxy/fullstack-template/commit/67b4bb3a71ab43f1474a08f1a20a7f2c1d1c5ac6))
* **server:** 引入 Drizzle ORM 并配置数据库 ([3712eaa](https://github.com/hacxy/fullstack-template/commit/3712eaa4ba98dfb6eafa3dae6b2a4a9d71900496))
* **server:** 支持通过 SERVER_URL 环境变量配置生产 Swagger 服务器地址 ([baa19a4](https://github.com/hacxy/fullstack-template/commit/baa19a434366e2e1e5ccb24bfb54ab4960508147))
* **server:** 新增 user.test 模型与 /test 路由 ([98319cd](https://github.com/hacxy/fullstack-template/commit/98319cdee5cc57c3c39bc2dc4224255736fcd4ea))
* **setup:** 新增 HTTPS 支持（Let's Encrypt / 手动证书）及 Nginx 跳过选项 ([a4a4d42](https://github.com/hacxy/fullstack-template/commit/a4a4d42bd6e04eb950d0ad5748823ad8bab14507))
* 引入 MIT 许可证 ([32564d1](https://github.com/hacxy/fullstack-template/commit/32564d18253485a7a86ea6a0bf1cbb7dbda3d36e))
* 引入统一响应插件并联动前后端协议 ([7d6f3c4](https://github.com/hacxy/fullstack-template/commit/7d6f3c427396758038129501819b93402ee57b97))
* 支持通过环境变量配置应用 ([6e567f3](https://github.com/hacxy/fullstack-template/commit/6e567f30aeee3eb65757a7f9091bbf57515e3e1c))
* 新增 init-deploy.ts，替代手动部署脚本实现一键初始化 ([8a1c717](https://github.com/hacxy/fullstack-template/commit/8a1c71703938a526b80ffb4e5bfaec77f4e5d9bd))
