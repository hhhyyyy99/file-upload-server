# 大文件上传下载服务器

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Latest-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-lightgrey.svg)](https://expressjs.com/)

基于 TypeScript 和 Node.js 构建的高性能文件上传下载服务器，支持大文件的断点续传功能。

## ✨ 功能特点

- 📤 **大文件上传** - 支持分块上传和断点续传
- 📥 **大文件下载** - 支持范围请求和断点续传
- 🔍 **上传状态查询** - 实时跟踪上传进度
- 🔐 **MD5 校验** - 自动文件完整性检查
- 🚀 **高性能** - 针对大文件处理进行优化
- 🛡️ **错误处理** - 全面的错误处理和恢复机制
- 📊 **日志记录** - 详细的请求和操作日志

## 🏗️ 系统架构

```
src/
├── controllers/          # 请求处理器
│   └── fileController.ts # 文件上传/下载/状态控制器
├── routes/              # API 路由定义
│   ├── fileUpload.ts    # 上传端点
│   ├── fileDownload.ts  # 下载端点
│   └── fileInfo.ts      # 状态查询端点
├── types/               # TypeScript 类型定义
│   └── index.ts         # 接口和枚举
├── utils/               # 工具函数
│   └── fileUtils.ts     # 文件操作和辅助函数
└── index.ts             # 应用程序入口点
```

## 🛠️ 技术栈

- **运行时**: Node.js
- **开发语言**: TypeScript
- **Web 框架**: Express.js
- **文件处理**: Multer, fs-extra
- **安全性**: CORS 支持
- **日志**: Morgan
- **哈希**: MD5-file

## 📦 安装部署

### 环境要求

- Node.js (v16 或更高版本)
- pnpm (推荐) 或 npm

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone <repository-url>
   cd fileUploadServer
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **构建项目**
   ```bash
   pnpm run build
   ```

## 🚀 运行方式

### 开发模式

```bash
pnpm run dev
```

### 生产模式

```bash
pnpm start
```

服务器默认运行在 `http://localhost:7777`。

## 📚 API 接口文档

### 1. 文件上传接口（支持断点续传）

**接口地址**: `POST /BigFileUploader`

**请求类型**: `multipart/form-data`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `file` | File | ✅ | 文件二进制数据（分块） |
| `name` | string | ✅ | 原始文件名 |
| `chunks` | number | ✅ | 总分块数 |
| `chunk` | number | ✅ | 当前分块编号（从1开始） |
| `totalLength` | number | ✅ | 文件总大小（字节） |
| `totalFileMd5` | string | ✅ | 完整文件的MD5哈希值 |
| `user_uid` | string | ✅ | 用户标识符 |
| `file_type` | number | ❌ | 文件类型（0: 普通文件, 1: 视频文件） |

**响应示例**:

```json
{
  "success": true,
  "message": "分块 1/10 上传成功",
  "data": {
    "filePath": "/path/to/merged/file" // 仅在上传完成时返回
  }
}
```

### 2. 文件下载接口（支持断点续传）

**接口地址**: `GET /BigFileDownloader`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `file_md5` | string | ✅ | 文件的MD5哈希值 |
| `user_uid` | string | ✅ | 用户标识符 |
| `skip_length` | number | ❌ | 跳过的字节数（用于断点续传） |

**响应**: 二进制文件流，包含适当的断点续传响应头。

**响应头**:
- `Content-Type`: `application/octet-stream`
- `Content-Disposition`: `attachment; filename="filename"`
- `Content-Length`: 文件大小
- `Accept-Ranges`: `bytes`（支持范围请求）
- `Content-Range`: `bytes start-end/total`（部分内容）

### 3. 上传状态查询接口

**接口地址**: `POST /api/file/status`

**请求体**:

```json
{
  "processorId": "PROCESSOR_FILE",
  "jobDispatchId": "LOGIC_FILE_MGR",
  "actionId": "ACTION_APPEND1",
  "newData": {
    "file_md5": "abc123...",
    "user_uid": "user123",
    "file_type": 0
  }
}
```

**响应示例**:

```json
{
  "success": true,
  "returnValue": {
    "retCode": "2",
    "chunkCount": 5
  }
}
```

**状态码说明**:
- `0`: 文件不存在
- `1`: 文件上传已完成
- `2`: 文件上传进行中

## 🔧 配置说明

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `PORT` | `7777` | 服务器端口 |

### 文件存储

- **上传目录**: `./uploads/` - 最终合并的文件
- **临时目录**: `./temp/` - 上传过程中的临时分块

### 请求限制

- **分块大小**: 每个分块最大 50MB
- **请求超时**: 5 分钟

## 🏗️ 文件上传流程

1. **客户端分割文件** 为多个分块并计算MD5
2. **上传分块** 可以顺序或并行上传
3. **服务器存储** 每个分块到临时目录
4. **进度跟踪** 通过状态API实时查询
5. **自动合并** 当所有分块接收完成时
6. **MD5校验** 验证合并后文件的完整性
7. **清理临时文件** 删除临时分块文件

## 📁 目录结构

```
fileUploadServer/
├── src/                 # 源代码
├── dist/                # 编译后的JavaScript文件
├── uploads/             # 最终上传的文件
├── temp/                # 临时上传分块
├── package.json         # 依赖和脚本配置
├── tsconfig.json        # TypeScript配置
├── .gitignore          # Git忽略规则
└── README.md           # 项目说明文档
```

## 🧪 测试示例

### 使用 cURL 测试上传

```bash
# 上传单个分块
curl -X POST http://localhost:7777/BigFileUploader \
  -F "file=@test.txt" \
  -F "name=test.txt" \
  -F "chunks=1" \
  -F "chunk=1" \
  -F "totalLength=1024" \
  -F "totalFileMd5=abc123..." \
  -F "user_uid=user123"
```

### 使用 cURL 测试下载

```bash
# 下载完整文件
curl "http://localhost:7777/BigFileDownloader?file_md5=abc123...&user_uid=user123" \
  -o downloaded_file.txt

# 从第1024字节开始断点续传
curl "http://localhost:7777/BigFileDownloader?file_md5=abc123...&user_uid=user123&skip_length=1024" \
  -o downloaded_file.txt
```

### 使用 cURL 测试状态查询

```bash
curl -X POST http://localhost:7777/api/file/status \
  -H "Content-Type: application/json" \
  -d '{
    "processorId": "PROCESSOR_FILE",
    "jobDispatchId": "LOGIC_FILE_MGR",
    "actionId": "ACTION_APPEND1",
    "newData": {
      "file_md5": "abc123...",
      "user_uid": "user123",
      "file_type": 0
    }
  }'
```

## 🔍 故障排除

### 常见问题

1. **上传超时**
   - 检查网络连接
   - 确认分块大小不超过50MB
   - 检查服务器日志

2. **MD5校验失败**
   - 确认客户端计算的MD5正确
   - 检查文件传输过程中是否有损坏
   - 重新上传文件

3. **文件合并失败**
   - 确认所有分块都已上传
   - 检查磁盘空间是否充足
   - 查看服务器错误日志

### 日志查看

服务器会输出详细的操作日志，包括：
- 文件上传开始和结束
- 分块保存状态
- 文件合并过程
- MD5校验结果
- 错误信息

## 🚀 性能优化

### 建议配置

1. **并发上传**: 客户端可以并行上传多个分块
2. **分块大小**: 建议10-50MB，根据网络条件调整
3. **内存管理**: 服务器会自动管理内存使用
4. **磁盘空间**: 确保有足够的临时存储空间

### 监控指标

- 上传速度
- 内存使用率
- 磁盘I/O
- 网络带宽
- 错误率

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 开发规范

- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 代码规范
- 编写单元测试
- 更新相关文档

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关项目

- [Express.js](https://expressjs.com/) - Web 框架
- [Multer](https://github.com/expressjs/multer) - 文件上传中间件
- [TypeScript](https://www.typescriptlang.org/) - 类型安全的 JavaScript
- [fs-extra](https://github.com/jprichardson/node-fs-extra) - 增强的文件系统操作

## 📞 技术支持

如果您有任何问题或需要帮助，请：

1. 查看 [API 接口文档](#-api-接口文档)
2. 阅读 [配置说明](#-配置说明)
3. 查看 [故障排除](#-故障排除)
4. 在 GitHub 上创建 Issue

## 🎯 未来规划

- [ ] 支持更多文件类型
- [ ] 添加文件压缩功能
- [ ] 实现用户认证和权限控制
- [ ] 添加文件预览功能
- [ ] 支持云存储集成
- [ ] 性能监控和统计

---

**使用 ❤️ 和 TypeScript、Node.js 构建**