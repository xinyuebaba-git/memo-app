// 备忘录数据管理 Composable
// composables/useMemos.ts
// 🔐 已添加版本管理和数据迁移支持

import { ref, computed } from 'vue'
import type { Memo, CreateMemoDTO, UpdateMemoDTO } from '../types/memo'
import { encryptData, decryptData } from '../utils/crypto'
import { loadAndMigrateData, getCurrentVersion, backupData } from '../utils/migration'
import { STORAGE_KEYS } from '../types/schema'

const ENCRYPTION_ENABLED_KEY = 'memo_app_encryption_enabled'

// 检查是否启用加密
const isEncryptionEnabled = (): boolean => {
  return localStorage.getItem(ENCRYPTION_ENABLED_KEY) === 'true'
}

// 从 LocalStorage 加载备忘录（带版本迁移）
async function loadMemos(): Promise<Memo[]> {
  try {
    // 使用新的迁移系统加载数据
    const data = await loadAndMigrateData();
    
    // v2 结构解密密备忘录
    if (data.version >= 2 && typeof data.memos === 'string') {
      try {
        const decrypted = decryptData(data.memos);
        return decrypted ? JSON.parse(decrypted) : [];
      } catch (error) {
        console.error('解密备忘录失败:', error);
        return [];
      }
    }
    
    // 向后兼容：直接返回备忘录
    return (data as any).memos || [];
  } catch (error) {
    console.error('加载备忘录失败:', error);
    return [];
  }
}

// 保存备忘录到 LocalStorage
function saveMemos(memos: Memo[]): void {
  try {
    const memosJson = JSON.stringify(memos);
    
    // 如果启用加密，先加密数据
    const encryptedMemos = isEncryptionEnabled() 
      ? encryptData(memosJson)
      : memosJson;
    
    // 读取现有数据
    const rawData = localStorage.getItem(STORAGE_KEYS.DATA);
    let data: any = rawData ? JSON.parse(rawData) : {};
    
    // 更新备忘录数据
    data.memos = encryptedMemos;
    data.updatedAt = Date.now();
    
    // 保存
    localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(data));
  } catch (error) {
    console.error('保存备忘录失败:', error);
  }
}

// 生成唯一 ID
function generateId(): string {
  return `memo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 🔐 启用加密（迁移现有数据）
export const enableEncryption = (): boolean => {
  try {
    const existingMemos = loadMemos();
    localStorage.setItem(ENCRYPTION_ENABLED_KEY, 'true');
    saveMemos(existingMemos);
    return true;
  } catch (error) {
    console.error('Failed to enable encryption:', error);
    return false;
  }
};

// 🔐 禁用加密（解密所有数据）
export const disableEncryption = (): boolean => {
  try {
    const existingMemos = loadMemos();
    localStorage.setItem(ENCRYPTION_ENABLED_KEY, 'false');
    saveMemos(existingMemos);
    return true;
  } catch (error) {
    console.error('Failed to disable encryption:', error);
    return false;
  }
};

// 🔐 检查加密状态
export const getEncryptionStatus = (): boolean => {
  return isEncryptionEnabled();
};

// 📤 导出数据
export const exportData = async (): Promise<string> => {
  const rawData = localStorage.getItem(STORAGE_KEYS.DATA);
  if (!rawData) {
    throw new Error('没有可导出的数据');
  }
  
  const exportData = {
    version: getCurrentVersion(),
    exportedAt: Date.now(),
    data: rawData,
    encrypted: isEncryptionEnabled()
  };
  
  return JSON.stringify(exportData, null, 2);
};

// 📥 导入数据
export const importData = async (jsonData: string): Promise<boolean> => {
  try {
    const imported = JSON.parse(jsonData);
    
    // 验证数据结构
    if (!imported.data) {
      throw new Error('无效的导入数据格式');
    }
    
    // 备份当前数据
    const currentData = localStorage.getItem(STORAGE_KEYS.DATA);
    if (currentData) {
      backupData(JSON.parse(currentData), getCurrentVersion());
    }
    
    // 保存导入的数据
    localStorage.setItem(STORAGE_KEYS.DATA, imported.data);
    
    // 恢复加密设置
    if (imported.encrypted) {
      localStorage.setItem(ENCRYPTION_ENABLED_KEY, 'true');
    }
    
    return true;
  } catch (error) {
    console.error('导入数据失败:', error);
    throw error;
  }
};

// 📋 获取数据版本信息
export const getDataVersion = (): number => {
  const rawData = localStorage.getItem(STORAGE_KEYS.DATA);
  if (!rawData) return getCurrentVersion();
  
  try {
    const data = JSON.parse(rawData);
    return data.version || 1;
  } catch {
    return 1;
  }
};

export function useMemos() {
  const memos = ref<Memo[]>([])
  const loading = ref(true)
  
  // 异步加载备忘录
  const initMemos = async () => {
    loading.value = true
    memos.value = await loadMemos()
    loading.value = false
  }
  
  // 初始化加载
  initMemos()

  // 创建备忘录
  const createMemo = (data: CreateMemoDTO): Memo => {
    const now = Date.now()
    const newMemo: Memo = {
      id: generateId(),
      title: data.title,
      content: data.content || '',
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now
    }
    
    memos.value.unshift(newMemo)
    saveMemos(memos.value)
    return newMemo
  }

  // 更新备忘录
  const updateMemo = (id: string, data: UpdateMemoDTO): void => {
    const index = memos.value.findIndex(m => m.id === id)
    if (index === -1) return

    memos.value[index] = {
      ...memos.value[index],
      ...data,
      updatedAt: Date.now()
    }
    saveMemos(memos.value)
  }

  // 删除备忘录
  const deleteMemo = (id: string): void => {
    memos.value = memos.value.filter(m => m.id !== id)
    saveMemos(memos.value)
  }

  // 根据 ID 获取备忘录
  const getMemoById = (id: string): Memo | null => {
    return memos.value.find(m => m.id === id) || null
  }

  // 按标签筛选
  const filterByTag = (tag: string): Memo[] => {
    return memos.value.filter(m => m.tags.includes(tag))
  }

  // 搜索备忘录
  const searchMemos = (keyword: string): Memo[] => {
    const lowerKeyword = keyword.toLowerCase()
    return memos.value.filter(m => 
      m.title.toLowerCase().includes(lowerKeyword) ||
      m.content.toLowerCase().includes(lowerKeyword)
    )
  }

  // 获取所有标签
  const getAllTags = computed(() => {
    const tagSet = new Set<string>()
    memos.value.forEach(memo => {
      memo.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet)
  })

  // 统计备忘录数量
  const memoCount = computed(() => memos.value.length)

  return {
    memos,
    loading,
    initMemos,
    createMemo,
    updateMemo,
    deleteMemo,
    getMemoById,
    filterByTag,
    searchMemos,
    getAllTags,
    memoCount
  }
}
