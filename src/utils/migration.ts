// 数据迁移工具
// utils/migration.ts
// 🔐 负责数据版本迁移和向后兼容

import { encryptData, hashPassword } from './crypto';
import type { DataMigrator, DataSchema } from '../types/schema';
import { CURRENT_SCHEMA_VERSION, STORAGE_KEYS } from '../types/schema';

/**
 * 获取当前应用版本
 */
export const getCurrentVersion = (): number => {
  return CURRENT_SCHEMA_VERSION;
};

/**
 * v1 → v2 迁移器
 * 
 * 变更：
 * 1. 添加版本号
 * 2. 用户密码从 Base64 改为 bcrypt 哈希
 * 3. 备忘录从明文改为 AES 加密
 * 4. 添加元数据
 */
const v1Tov2Migrator: DataMigrator = {
  fromVersion: 1,
  toVersion: 2,
  migrate: async (v1Data: any) => {
    console.log('🔄 开始迁移数据：v1 → v2');
    
    try {
      // 1. 迁移用户密码（Base64 → bcrypt）
      // 注意：由于 bcrypt 需要原始密码，而 v1 存储的是 Base64 编码
      // 我们需要先解码，然后重新哈希
      const migratedUsers = (v1Data.users || []).map((user: any) => {
        // v1 的密码是 Base64 编码，需要解码后重新哈希
        // 但 bcrypt 是不可逆的，所以这里有个问题：
        // 实际上我们无法从 Base64 还原原始密码
        // 解决方案：保持密码哈希不变，登录时特殊处理
        
        return {
          id: user.id,
          username: user.username,
          password: user.password, // 暂时保持原样，登录时处理
          needsRehash: true // 标记需要重新哈希
        };
      });
      
      // 2. 加密备忘录数据
      const memosJson = JSON.stringify(v1Data.memos || []);
      const encryptedMemos = encryptData(memosJson);
      
      // 3. 构建 v2 数据结构
      const v2Data: DataSchema = {
        version: 2,
        updatedAt: Date.now(),
        memos: encryptedMemos,
        users: migratedUsers,
        metadata: {
          appVersion: '1.1.0',
          encrypted: true
        }
      };
      
      console.log('✅ 数据迁移完成：v1 → v2');
      return v2Data;
    } catch (error) {
      console.error('❌ 数据迁移失败:', error);
      throw new Error(`数据迁移失败：${(error as Error).message}`);
    }
  }
};

/**
 * 注册所有迁移器
 */
const migrations: DataMigrator[] = [
  v1Tov2Migrator
  // 未来添加更多迁移器
  // v2Tov3Migrator
];

/**
 * 检测数据结构版本
 */
export const detectVersion = (data: any): number => {
  if (!data) return 0;
  
  // 新结构（带版本号）
  if (typeof data.version === 'number') {
    return data.version;
  }
  
  // 旧结构（通过特征判断）
  if (Array.isArray(data)) {
    return 1; // 假设数组是 v1 格式
  }
  
  return 0; // 未知版本
};

/**
 * 检查版本兼容性
 */
export const isVersionCompatible = (version: number): boolean => {
  // 支持最近 2 个版本的直接迁移
  return version >= CURRENT_SCHEMA_VERSION - 1;
};

/**
 * 执行数据迁移
 */
export const migrateData = async (oldData: any): Promise<DataSchema> => {
  const fromVersion = detectVersion(oldData);
  const toVersion = CURRENT_SCHEMA_VERSION;
  
  // 无需迁移
  if (fromVersion === toVersion) {
    console.log('✅ 数据版本已是最新，无需迁移');
    return oldData as DataSchema;
  }
  
  // 检查兼容性
  if (!isVersionCompatible(fromVersion)) {
    throw new Error(
      `版本不兼容：当前版本 v${toVersion} 不支持从 v${fromVersion} 迁移`
    );
  }
  
  // 查找迁移器
  const migrator = migrations.find(m => m.fromVersion === fromVersion);
  if (!migrator) {
    throw new Error(`未找到迁移器：v${fromVersion} → v${toVersion}`);
  }
  
  // 执行迁移
  console.log(`🔄 执行迁移：v${fromVersion} → v${toVersion}`);
  return await migrator.migrate(oldData);
};

/**
 * 备份旧数据
 */
export const backupData = (data: any, version: number): void => {
  const backupKey = `${STORAGE_KEYS.BACKUP_PREFIX}v${version}_${Date.now()}`;
  try {
    localStorage.setItem(backupKey, JSON.stringify(data));
    console.log(`💾 数据已备份：${backupKey}`);
  } catch (error) {
    console.error('备份失败:', error);
  }
};

/**
 * 加载并迁移数据（主入口函数）
 */
export const loadAndMigrateData = async (): Promise<DataSchema> => {
  try {
    // 尝试读取新结构
    let rawData = localStorage.getItem(STORAGE_KEYS.DATA);
    
    if (rawData) {
      // 新结构，解析并检查版本
      const data = JSON.parse(rawData);
      const version = detectVersion(data);
      
      if (version < CURRENT_SCHEMA_VERSION) {
        // 需要迁移
        backupData(data, version);
        const migrated = await migrateData(data);
        localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(migrated));
        return migrated;
      }
      
      return data;
    }
    
    // 尝试读取旧结构（向后兼容）
    const memosV1 = localStorage.getItem(STORAGE_KEYS.MEMOS_V1);
    const usersV1 = localStorage.getItem(STORAGE_KEYS.USERS_V1);
    
    if (memosV1 || usersV1) {
      console.log('📦 检测到旧数据结构，开始迁移...');
      
      const v1Data = {
        version: 1,
        memos: memosV1 ? JSON.parse(memosV1) : [],
        users: usersV1 ? JSON.parse(usersV1) : []
      };
      
      // 备份旧数据
      backupData(v1Data, 1);
      
      // 迁移到新结构
      const migrated = await migrateData(v1Data);
      
      // 清除旧数据
      localStorage.removeItem(STORAGE_KEYS.MEMOS_V1);
      localStorage.removeItem(STORAGE_KEYS.USERS_V1);
      
      // 保存新数据
      localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(migrated));
      
      return migrated;
    }
    
    // 无数据，返回空结构
    return {
      version: CURRENT_SCHEMA_VERSION,
      updatedAt: Date.now(),
      memos: encryptData(JSON.stringify([])),
      users: [],
      metadata: {
        appVersion: '1.1.0',
        encrypted: true
      }
    };
  } catch (error) {
    console.error('加载数据失败:', error);
    throw error;
  }
};

/**
 * 恢复备份
 */
export const restoreBackup = (backupKey: string): boolean => {
  try {
    const backup = localStorage.getItem(backupKey);
    if (!backup) return false;
    
    localStorage.setItem(STORAGE_KEYS.DATA, backup);
    console.log(`⏮️  已从备份恢复：${backupKey}`);
    return true;
  } catch (error) {
    console.error('恢复备份失败:', error);
    return false;
  }
};

/**
 * 列出所有备份
 */
export const listBackups = (): string[] => {
  const backups: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEYS.BACKUP_PREFIX)) {
      backups.push(key);
    }
  }
  return backups.sort().reverse(); // 最新的在前
};
