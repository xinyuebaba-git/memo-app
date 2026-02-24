// 备忘录数据管理 Composable
// composables/useMemos.ts

import { ref, computed } from 'vue'
import type { Memo, CreateMemoDTO, UpdateMemoDTO } from '../types/memo'

const STORAGE_KEY = 'memo_app_memos'

// 从 LocalStorage 加载备忘录
function loadMemos(): Memo[] {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

// 保存备忘录到 LocalStorage
function saveMemos(memos: Memo[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memos))
}

// 生成唯一 ID
function generateId(): string {
  return `memo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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
