import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs-extra';
import { BigFileType, FileUploadStatus, FileUploadStatusResponse } from '../types';
import { getChunkDir, getFilePath, mergeFileChunks, checkFileUploadStatus, createFileStreamFromPosition } from '../utils/fileUtils';

/**
 * 处理文件上传请求
 */
export const uploadFile = async (req: Request, res: Response) => {
  try {
    console.log('开始处理文件上传请求:', {
      hasFile: !!req.file,
      body: req.body,
      timestamp: new Date().toISOString(),
    });

    if (!req.file) {
      return res.status(400).json({ success: false, message: '没有接收到文件' });
    }

    // 获取表单参数
    const { name, chunks, chunk, totalLength, totalFileMd5, user_uid, file_type = BigFileType.FILE_TYPE_COMMON_BIG_FILE } = req.body;

    // 验证必要参数
    if (!name || !chunks || !chunk || !totalLength || !totalFileMd5 || !user_uid) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数',
      });
    }

    // 获取分块目录
    const chunkDir = getChunkDir(totalFileMd5, user_uid);
    const chunkPath = path.join(chunkDir, chunk);

    // 确保分块目录存在（防止并发时目录创建竞态条件）
    await fs.ensureDir(chunkDir);

    // 检查源文件是否存在
    if (!(await fs.pathExists(req.file.path))) {
      return res.status(400).json({
        success: false,
        message: '上传的临时文件不存在，请重新上传',
      });
    }

    // 保存分块
    console.log('开始保存分块:', { chunkPath, sourcePath: req.file.path });
    try {
      await fs.move(req.file.path, chunkPath, { overwrite: true });
      console.log('分块保存成功:', chunkPath);
    } catch (error) {
      // 如果移动失败，尝试复制后删除源文件
      if ((error as any).code === 'ENOENT') {
        // 再次检查源文件是否存在
        if (await fs.pathExists(req.file.path)) {
          await fs.ensureDir(path.dirname(chunkPath));
          await fs.copy(req.file.path, chunkPath, { overwrite: true });
          await fs.unlink(req.file.path);
        } else {
          return res.status(400).json({
            success: false,
            message: '源文件在处理过程中丢失，请重新上传',
          });
        }
      } else {
        throw error;
      }
    }

    // 检查是否所有分块都已上传（优化性能：一次性读取目录）
    const totalChunks = parseInt(chunks);
    const uploadedFiles = await fs.readdir(chunkDir);
    const uploadedChunksSet = new Set(uploadedFiles);
    console.log('检查分块状态:', { totalChunks, uploadedFiles, currentChunk: chunk });

    // 检查所有预期的分片是否都存在
    let allChunksUploaded = true;
    for (let i = 1; i <= totalChunks; i++) {
      if (!uploadedChunksSet.has(`${i}`)) {
        allChunksUploaded = false;
        break;
      }
    }
    console.log('所有分块是否已上传:', allChunksUploaded);
    // 如果所有分块都已上传，则合并文件
    if (allChunksUploaded) {
      console.log('开始合并文件:', { totalFileMd5, user_uid, name, totalChunks });
      try {
        const filePath = await mergeFileChunks(totalFileMd5, user_uid, file_type as BigFileType, name, parseInt(chunks));
        console.log('文件合并成功:', filePath);
        return res.status(200).json({
          success: true,
          message: '文件上传成功',
          data: { filePath },
        });
      } catch (error) {
        console.error('合并文件失败:', error);
        return res.status(500).json({
          success: false,
          message: `合并文件失败: ${(error as Error).message}`,
        });
      }
    }

    // 返回当前块上传成功
    return res.status(200).json({
      success: true,
      message: `块 ${chunk}/${chunks} 上传成功`,
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    return res.status(500).json({
      success: false,
      message: `文件上传失败: ${(error as Error).message}`,
    });
  }
};

/**
 * 处理文件下载请求
 */
export const downloadFile = async (req: Request, res: Response) => {
  try {
    const { file_md5, user_uid, skip_length = 0 } = req.query;

    // 验证必要参数
    if (!file_md5 || !user_uid) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数 file_md5 或 user_uid',
      });
    }

    // 查找文件
    const fileTypes = Object.values(BigFileType);
    let filePath = '';
    let fileName = '';

    // 在各类型目录中查找文件
    for (const type of fileTypes) {
      const typeDir = path.join(__dirname, `../../uploads`);
      if (await fs.pathExists(typeDir)) {
        const files = await fs.readdir(typeDir);
        const targetFile = files.find(file => file.startsWith(file_md5 as string));

        if (targetFile) {
          filePath = path.join(typeDir, targetFile);
          fileName = targetFile;
          break;
        }
      }
    }

    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: '文件不存在',
      });
    }

    // 获取文件信息
    const stat = await fs.stat(filePath);
    const fileSize = stat.size;
    const skipBytes = parseInt(skip_length as string) || 0;

    // 设置响应头
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(fileName)}`);
    res.setHeader('Content-Length', fileSize - skipBytes);

    // 如果请求包含Range头，设置206状态码
    if (skipBytes > 0) {
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Range', `bytes ${skipBytes}-${fileSize - 1}/${fileSize}`);
      res.status(206);
    }

    // 创建文件流并发送
    const fileStream = createFileStreamFromPosition(filePath, skipBytes);
    fileStream.pipe(res);
  } catch (error) {
    console.error('文件下载失败:', error);
    return res.status(500).json({
      success: false,
      message: `文件下载失败: ${(error as Error).message}`,
    });
  }
};

/**
 * 获取文件上传状态
 */
export const getFileUploadStatus = async (req: Request, res: Response) => {
  try {
    console.log(req.body.newData);
    const { file_md5, user_uid, file_type = 0 } = req.body.newData;

    // 验证必要参数
    if (!file_md5 || !user_uid) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数',
      });
    }

    // 检查文件上传状态
    const status: FileUploadStatusResponse = await checkFileUploadStatus(file_md5, user_uid, file_type as BigFileType);

    return res.status(200).json({
      success: true,
      returnValue: status,
    });
  } catch (error) {
    console.error('获取文件状态失败:', error);
    return res.status(500).json({
      success: false,
      message: `获取文件状态失败: ${(error as Error).message}`,
    });
  }
};
