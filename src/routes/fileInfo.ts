import express from 'express';
import { getFileUploadStatus } from '../controllers/fileController';

const router = express.Router();

// 文件上传状态查询路由
router.post('/file/status', function(req, res) {
  getFileUploadStatus(req, res);
});

export { router as fileInfoRouter };