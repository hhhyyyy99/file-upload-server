# File Upload Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Latest-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-lightgrey.svg)](https://expressjs.com/)

A robust file upload and download server built with TypeScript and Node.js, featuring resumable uploads and downloads for large files.

## ✨ Features

- 📤 **Large File Upload** - Support for chunked uploads with resumable capability
- 📥 **Large File Download** - Support for range requests and resumable downloads
- 🔍 **Upload Status Query** - Real-time tracking of upload progress
- 🔐 **MD5 Verification** - Automatic file integrity checking
- 🚀 **High Performance** - Optimized for handling large files efficiently
- 🛡️ **Error Handling** - Comprehensive error handling and recovery
- 📊 **Logging** - Detailed request and operation logging

## 🏗️ Architecture

```
src/
├── controllers/          # Request handlers
│   └── fileController.ts # File upload/download/status controllers
├── routes/              # API route definitions
│   ├── fileUpload.ts    # Upload endpoints
│   ├── fileDownload.ts  # Download endpoints
│   └── fileInfo.ts      # Status query endpoints
├── types/               # TypeScript type definitions
│   └── index.ts         # Interfaces and enums
├── utils/               # Utility functions
│   └── fileUtils.ts     # File operations and helpers
└── index.ts             # Application entry point
```

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **File Handling**: Multer, fs-extra
- **Security**: CORS enabled
- **Logging**: Morgan
- **Hashing**: MD5-file

## 📦 Installation

### Prerequisites

- Node.js (v16 or higher)
- pnpm (recommended) or npm

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fileUploadServer
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Build the project**
   ```bash
   pnpm run build
   ```

## 🚀 Usage

### Development Mode

```bash
pnpm run dev
```

### Production Mode

```bash
pnpm start
```

The server will start on `http://localhost:7777` by default.

## 📚 API Documentation

### 1. File Upload (Resumable)

**Endpoint**: `POST /BigFileUploader`

**Content-Type**: `multipart/form-data`

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | File | ✅ | Binary file data (chunk) |
| `name` | string | ✅ | Original filename |
| `chunks` | number | ✅ | Total number of chunks |
| `chunk` | number | ✅ | Current chunk number (starts from 1) |
| `totalLength` | number | ✅ | Total file size in bytes |
| `totalFileMd5` | string | ✅ | MD5 hash of the complete file |
| `user_uid` | string | ✅ | User identifier |
| `file_type` | number | ❌ | File type (0: common, 1: video) |

**Response**:

```json
{
  "success": true,
  "message": "Chunk 1/10 uploaded successfully",
  "data": {
    "filePath": "/path/to/merged/file" // Only when upload is complete
  }
}
```

### 2. File Download (Resumable)

**Endpoint**: `GET /BigFileDownloader`

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file_md5` | string | ✅ | MD5 hash of the file |
| `user_uid` | string | ✅ | User identifier |
| `skip_length` | number | ❌ | Bytes to skip (for resumable download) |

**Response**: Binary file stream with appropriate headers for resumable download.

**Headers**:
- `Content-Type`: `application/octet-stream`
- `Content-Disposition`: `attachment; filename="filename"`
- `Content-Length`: File size
- `Accept-Ranges`: `bytes` (for range requests)
- `Content-Range`: `bytes start-end/total` (for partial content)

### 3. Upload Status Query

**Endpoint**: `POST /api/file/status`

**Request Body**:

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

**Response**:

```json
{
  "success": true,
  "returnValue": {
    "retCode": "2",
    "chunkCount": 5
  }
}
```

**Status Codes**:
- `0`: File does not exist
- `1`: File upload completed
- `2`: File upload in progress

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `7777` | Server port |

### File Storage

- **Upload Directory**: `./uploads/` - Final merged files
- **Temporary Directory**: `./temp/` - Temporary chunks during upload

### Request Limits

- **Chunk Size**: Maximum 50MB per chunk
- **Request Timeout**: 5 minutes

## 🏗️ File Upload Process

1. **Client splits file** into chunks and calculates MD5
2. **Upload chunks** sequentially or in parallel
3. **Server stores** each chunk in temporary directory
4. **Progress tracking** via status API
5. **Automatic merging** when all chunks are received
6. **MD5 verification** of the merged file
7. **Cleanup** of temporary files

## 📁 Directory Structure

```
fileUploadServer/
├── src/                 # Source code
├── dist/                # Compiled JavaScript (after build)
├── uploads/             # Final uploaded files
├── temp/                # Temporary upload chunks
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## 🧪 Testing

### Upload Test with cURL

```bash
# Upload a single chunk
curl -X POST http://localhost:7777/BigFileUploader \
  -F "file=@test.txt" \
  -F "name=test.txt" \
  -F "chunks=1" \
  -F "chunk=1" \
  -F "totalLength=1024" \
  -F "totalFileMd5=abc123..." \
  -F "user_uid=user123"
```

### Download Test with cURL

```bash
# Download complete file
curl "http://localhost:7777/BigFileDownloader?file_md5=abc123...&user_uid=user123" \
  -o downloaded_file.txt

# Resume download from byte 1024
curl "http://localhost:7777/BigFileDownloader?file_md5=abc123...&user_uid=user123&skip_length=1024" \
  -o downloaded_file.txt
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- [Express.js](https://expressjs.com/) - Web framework
- [Multer](https://github.com/expressjs/multer) - File upload middleware
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript

## 📞 Support

If you have any questions or need help, please:

1. Check the [API Documentation](#-api-documentation)
2. Review the [Configuration](#-configuration) section
3. Open an issue on GitHub

---

**Built with ❤️ using TypeScript and Node.js**