// 文件类型枚举
export enum BigFileType {
  FILE_TYPE_COMMON_BIG_FILE = 0, // 普通大文件
  FILE_TYPE_SHORT_VIDEO = 1, // 短视频文件
}

// 文件上传信息接口
export interface FileUploadInfo {
  file_md5: string; // 文件MD5
  user_uid: string; // 上传用户ID
  file_type: BigFileType; // 文件类型
  chunks?: number; // 总分块数
  chunk?: number; // 当前块编号
  totalLength?: number; // 文件总大小
  name?: string; // 文件名
  token?: string; // 认证token
}

// 文件上传状态
export enum FileUploadStatus {
  NOT_EXIST = '0', // 文件不存在
  COMPLETED = '1', // 文件已上传完成
  INCOMPLETE = '2', // 文件上传未完成
}

// 文件上传状态响应
export interface FileUploadStatusResponse {
  retCode: FileUploadStatus;
  chunkCount?: number; // 已上传的块数
}

// 文件上传响应
export interface FileUploadResponse {
  success: boolean;
  message?: string;
  data?: any;
}
