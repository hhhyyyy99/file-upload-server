# 大文件上传下载服务器

基于TypeScript和Node.js实现的大文件上传下载服务器，支持断点续传功能。

## 功能特点

- 大文件上传（支持断点续传）
- 大文件下载（支持断点续传）
- 文件上传状态查询
- 文件MD5校验

## 技术栈

- TypeScript
- Node.js
- Express
- Multer

## 安装与运行

### 安装依赖

```bash
pnpm install
```

### 开发模式运行

```bash
pnpm run dev
```

### 构建项目

```bash
pnpm run build
```

### 生产模式运行

```bash
pnpm start
```

## API接口说明

### 1. 大文件上传接口（支持断点续传）

**请求方式**：POST

**URL**：`/BigFileUploader`

**参数**：

| 参数 | 参数内容 | 说明 |
| --- | --- | --- |
| Multipart Data | 文件二进制数据 | |
| name | 文件名 | 客户端传上来的文件名（文件的真正名字）|
| chunks | 文件总分块数 | |
| chunk | 当前文件分块编号 | 起始编号是1 |
| totalLength | 总文件大小 | 单位：字节 |
| totalFileMd5 | 总文件的MD5码 | 而不是本次上传的"块"的md5码 |
| user_uid | 上传者的uid | |
| file_type | 文件类型 | 可选值：IMAGE, VIDEO, AUDIO, DOCUMENT, OTHER |

### 2. 大文件下载接口（支持断点续传）

**请求方式**：GET

**URL**：`/BigFileDownloader`

**参数**：

| 参数 | 说明 |
| --- | --- |
| file_md5 | 文件的md5码，必填 |
| user_uid | 下载该资源的用户uid，必填 |
| skip_length | 断点下载时，从指定字节处开始下载，不填则从0字节处开始 |

### 3. 获取文件上传状态接口

**请求方式**：POST

**URL**：`/api/file/status`

**请求体**：

```json
{
  "processorId": "PROCESSOR_FILE",
  "jobDispatchId": "LOGIC_FILE_MGR",
  "actionId": "ACTION_APPEND1",
  "newData": {
    "file_md5": "",  // 必填参数：大文件的md5码
    "user_uid": "",  // 必填参数：大文件上传者的uid
    "file_type": ""   // 必填参数：大文件类型
  }
}
```

**响应**：

```json
{
  "success": true,
  "returnValue": {
    "retCode": "0",  // 0表示文件不存在，1表示文件已上传完成，2表示文件上传未完成
    "chunkCount": "5"  // 当retCode为2时有效，表示已上传的块数
  }
}
```