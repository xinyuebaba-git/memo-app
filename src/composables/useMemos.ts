// 备忘录数据管理 Composable
// composables/useMemos.ts
// 🔐 已添加 AES 加密保护

import { ref, computed } from 'vue'
import type { Memo, CreateMemoDTO, UpdateMemoDTO } from '../types/memo'
import { encryptData, decryptData } from '../utils/crypto'

const STORAGE_KEY = 'memo_app_memos'
const ENCRYPTION_ENABLED_KEY = 'memo_app_encryption_enabled'

// 检查是否启用加密
const isEncryptionEnabled = (): boolean => {
  return localStorage.getItem(ENCRYPTION_ENABLED_KEY) === 'true'
}

// 从 LocalStorage 加载备忘录
function loadMemos(): Memo[] {
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return []
  
  try {
    // 🔐 如果启用加密，先解密数据
    if (isEncryptionEnabled()) {
      const decrypted = decryptData(data)
      return decrypted ? JSON.parse(decrypted) : []
    }
    return JSON.parse(data)
  } catch (error) {
    console.error('Failed to load memos:', error)
    return []
  }
}

// 保存备忘录到 LocalStorage
function saveMemos(memos: Memo[]): void {
  try {
    const data = JSON.stringify(memos)
    // 🔐 如果启用加密，先加密数据
    if (isEncryptionEnabled()) {
      const encrypted = encryptData(data)
      localStorage.setItem(STORAGE_KEY, encrypted)
    } else {
      localStorage.setItem(STORAGE_KEY, data)
    }
  } catch (error) {
    console.error('Failed to save memos:', error)
  }
}

// 生成唯一 ID
function generateId(): string {
  return `memo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 🔐 启用加密（迁移现有数据）
export const enableEncryption = (): boolean => {
  try {
    const existingMemos = loadMemos()
    localStorage.setItem(ENCRYPTION_ENABLED_KEY, 'true')
    saveMemos(existingMemos)
    return true
  } catch (error) {
    console.error('Failed to enable encryption:', error)
    return false
  }
}

// 🔐 禁用加密（解密所有数据）
export const disableEncryption = (): boolean => {
  try {
    const existingMemos = loadMemos()
    localStorage.setItem(ENCRYPTION_ENABLED_KEY, 'false')
    saveMemos(existingMemos)
    return true
  } catch (error) {
    console.error('Failed to disable encryption:', error)
    return false
  }
}

// 🔐 检查加密状态
export const getEncryptionStatus = (): boolean => {
  return isEncryptionEnabled()
}

export function useMemos() {
  const memos = ref<Memo[]>(loadMemos())

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
