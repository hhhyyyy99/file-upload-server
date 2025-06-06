import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { uploadFile } from '../controllers/fileController';

const router = express.Router();

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 使用临时目录存储上传的文件
    const tempDir = path.join(__dirname, '../../temp/uploads');
    fs.ensureDirSync(tempDir);
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // 使用时间戳作为临时文件名
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// 创建multer实例
const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 限制每个块最大50MB
  }
});

// 文件上传路由
router.post('/', upload.single('file'), function(req, res) {
  uploadFile(req, res);
});

export { router as fileUploadRouter };