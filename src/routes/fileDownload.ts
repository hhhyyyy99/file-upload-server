import express from 'express';
import { downloadFile } from '../controllers/fileController';

const router = express.Router();

// 文件下载路由
router.get('/', function(req, res) {
  downloadFile(req, res);
});

export { router as fileDownloadRouter };