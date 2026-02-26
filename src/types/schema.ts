// 数据结构定义与版本管理
// types/schema.ts

// 当前数据结构版本
export const CURRENT_SCHEMA_VERSION = 2;

// v1 数据结构（初始版本 - 明文存储）
export interface SchemaV1 {
  version?: 1;
  memos: Array<{
    id: string;
    title: string;
    content: string;
    tags: string[];
    createdAt: number;
    updatedAt: number;
  }>;
  users: Array<{
    id: string;
    username: string;
    password: string; // Base64 编码
  }>;
}

// v2 数据结构（加密版本）
export interface SchemaV2 {
  version: 2;
  updatedAt: number;
  memos: string; // AES 加密后的 JSON 字符串
  users: Array<{
    id: string;
    username: string;
    password: string; // bcrypt 哈希
  }>;
  metadata: {
    appVersion: string;
    encrypted: boolean;
  };
}

// 统一数据类型
export type DataSchema = SchemaV1 | SchemaV2;

// 迁移器接口
export interface DataMigrator {
  fromVersion: number;
  toVersion: number;
  migrate: (data: any) => Promise<any>;
}

// 存储键名常量
export const STORAGE_KEYS = {
  // 新结构（推荐）
  DATA: 'memo_app_data',
  
  // 旧结构（向后兼容）
  MEMOS_V1: 'memo_app_memos',
  USERS_V1: 'memo_app_users',
  
  // 备份
  BACKUP_PREFIX: 'memo_app_backup_'
} as const;
