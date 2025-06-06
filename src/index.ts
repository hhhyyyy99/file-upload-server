import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs-extra';
import { fileUploadRouter } from './routes/fileUpload';
import { fileDownloadRouter } from './routes/fileDownload';
import { fileInfoRouter } from './routes/fileInfo';

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 7777;

// 中间件
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads');
const tempDir = path.join(__dirname, '../temp');
fs.ensureDirSync(uploadDir);
fs.ensureDirSync(tempDir);

// 路由
app.use('/BigFileUploader', fileUploadRouter);
app.use('/BigFileDownloader', fileDownloadRouter);
app.use('/api', fileInfoRouter);

// 根路由
app.get('/', (req, res) => {
  res.send('文件上传下载服务器运行中...');
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});