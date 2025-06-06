import fs from 'fs-extra';
import path from 'path';
import { createReadStream } from 'fs';
import { FileUploadStatus, FileUploadStatusResponse, BigFileType } from '../types';
import md5File from 'md5-file';

// 上传目录和临时目录
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const TEMP_DIR = path.join(__dirname, '../../temp');

// 确保目录存在
fs.ensureDirSync(UPLOAD_DIR);
fs.ensureDirSync(TEMP_DIR);

/**
 * 获取文件的临时目录
 * @param fileMd5 文件MD5
 * @param userUid 用户ID
 */
export const getChunkDir = (fileMd5: string, userUid: string): string => {
  const chunkDir = path.join(TEMP_DIR, `${userUid}_${fileMd5}`);
  fs.ensureDirSync(chunkDir);
  return chunkDir;
};

/**
 * 获取文件的最终保存路径
 * @param fileMd5 文件MD5
 * @param fileType 文件类型
 * @param fileName 文件名
 */
export const getFilePath = (fileMd5: string, fileType: BigFileType, fileName: string): string => {
  // 根据文件类型创建子目录
  const typeDir = path.join(UPLOAD_DIR);
  fs.ensureDirSync(typeDir);

  // 提取文件扩展名
  const ext = path.extname(fileName);

  // 返回最终文件路径
  return path.join(typeDir, `${fileMd5}${ext}`);
};

/**
 * 合并文件块
 * @param fileMd5 文件MD5
 * @param userUid 用户ID
 * @param fileType 文件类型
 * @param fileName 文件名
 * @param totalChunks 总块数
 */
export const mergeFileChunks = async (fileMd5: string, userUid: string, fileType: BigFileType, fileName: string, totalChunks: number): Promise<string> => {
  const chunkDir = getChunkDir(fileMd5, userUid);
  const filePath = getFilePath(fileMd5, fileType, fileName);
  // 检查所有块是否都已上传
  const chunkPaths = [];
  for (let i = 1; i <= totalChunks; i++) {
    const chunkPath = path.join(chunkDir, `${i}`);
    if (!fs.existsSync(chunkPath)) {
      throw new Error(`块 ${i} 不存在，无法合并文件`);
    }
    chunkPaths.push(chunkPath);
  }

  // 合并文件
  await fs.ensureFile(filePath);
  const writeStream = fs.createWriteStream(filePath);

  // 按顺序写入每个分片
  for (const chunkPath of chunkPaths) {
    const buffer = await fs.readFile(chunkPath);
    await new Promise<void>((resolve, reject) => {
      writeStream.write(buffer, err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // 确保所有数据都写入完成
  await new Promise<void>((resolve, reject) => {
    writeStream.end((err: any) => {
      if (err) {
        console.error('写入流结束时出错:', err);
        reject(err);
      } else {
        console.log('写入流已结束');
        resolve();
      }
    });
  });

  console.log('开始验证文件MD5');
  // 验证合并后的文件MD5是否正确
  try {
    const mergedFileMd5 = await md5File(filePath);
    console.log('MD5验证结果:', { mergedFileMd5, expectedMd5: fileMd5, match: mergedFileMd5 === fileMd5 });
    
    if (mergedFileMd5 !== fileMd5) {
      console.log('MD5不匹配，删除文件:', filePath);
      await fs.unlink(filePath);
      throw new Error('文件MD5验证失败，合并后的文件与原始MD5不匹配');
    } else {
      console.log('MD5验证通过，清理临时文件夹:', chunkDir);
      // 清理临时文件夹
      await fs.remove(chunkDir);
      console.log('文件合并完成:', filePath);
      return filePath;
    }
  } catch (err) {
    console.error('MD5验证过程出错:', err);
    throw err;
  }
};

/**
 * 检查文件上传状态
 * @param fileMd5 文件MD5
 * @param userUid 用户ID
 * @param fileType 文件类型
 */
export const checkFileUploadStatus = async (fileMd5: string, userUid: string, fileType: BigFileType): Promise<FileUploadStatusResponse> => {
  // 检查文件是否已经上传完成
  const files = await fs.readdir(path.join(UPLOAD_DIR));
  const fileExists = files.some(file => file.startsWith(fileMd5));

  if (fileExists) {
    return { retCode: FileUploadStatus.COMPLETED };
  }

  // 检查是否有临时块
  const chunkDir = getChunkDir(fileMd5, userUid);
  if (!fs.existsSync(chunkDir)) {
    return { retCode: FileUploadStatus.NOT_EXIST };
  }

  // 获取已上传的块数
  const uploadedChunks = await fs.readdir(chunkDir);
  return {
    retCode: FileUploadStatus.INCOMPLETE,
    chunkCount: uploadedChunks.length,
  };
};

/**
 * 从指定位置读取文件
 * @param filePath 文件路径
 * @param skipLength 跳过的字节数
 */
export const createFileStreamFromPosition = (filePath: string, skipLength: number = 0) => {
  return createReadStream(filePath, { start: skipLength });
};
