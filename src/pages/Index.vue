<!-- 备忘录列表页面 -->
<!-- pages/Index.vue -->

<template>
  <div class="memo-app">
    <!-- 顶部导航 -->
    <header class="header">
      <div class="header-left">
        <h1 class="title">📝 备忘录</h1>
      </div>
      <div class="header-center">
        <button class="btn-primary" @click="goToCreate">
          + 新建备忘录
        </button>
      </div>
      <div class="header-right">
        <span class="username" v-if="currentUser">👤 {{ currentUser.username }}</span>
        <button class="btn-logout" @click="showLogoutConfirm = true" title="退出登录">
          🚪 退出
        </button>
      </div>
    </header>

    <!-- 标签筛选 -->
    <div class="tag-filter">
      <button 
        :class="['tag-btn', { active: selectedTag === 'all' }]"
        @click="selectedTag = 'all'"
      >
        全部
      </button>
      <button 
        v-for="tag in getAllTags" 
        :key="tag"
        :class="['tag-btn', { active: selectedTag === tag }]"
        @click="selectedTag = tag"
      >
        🏷️ {{ tag }}
      </button>
    </div>

    <!-- 搜索框 -->
    <div class="search-box">
      <input 
        v-model="searchKeyword"
        type="text" 
        placeholder="🔍 搜索备忘录..."
        class="search-input"
      />
    </div>

    <!-- 备忘录列表 -->
    <div class="memo-list">
      <div v-if="filteredMemos.length === 0" class="empty-state">
        <p>📭 暂无备忘录</p>
        <button class="btn-primary" @click="goToCreate">
          创建第一个备忘录
        </button>
      </div>

      <div 
        v-for="memo in filteredMemos" 
        :key="memo.id"
        class="memo-card"
        @click="goToEdit(memo.id)"
        title="点击编辑"
      >
        <div class="memo-header">
          <h3 class="memo-title">
            <span class="edit-icon">✏️</span>
            {{ memo.title }}
          </h3>
          <button 
            class="btn-delete"
            @click.stop="confirmDelete(memo)"
            title="删除"
          >
            🗑️
          </button>
        </div>
        <p class="memo-content">{{ memo.content.substring(0, 100) }}...</p>
        <div class="memo-footer">
          <div class="memo-tags">
            <span v-for="tag in memo.tags" :key="tag" class="tag">
              🏷️ {{ tag }}
            </span>
          </div>
          <span class="memo-time">{{ formatTime(memo.updatedAt) }}</span>
        </div>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click="showDeleteConfirm = false">
      <div class="modal" @click.stop>
        <h3>确认删除</h3>
        <p>确定要删除「{{ memoToDelete?.title }}」吗？</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showDeleteConfirm = false">取消</button>
          <button class="btn-danger" @click="deleteMemo">删除</button>
        </div>
      </div>
    </div>

    <!-- 退出登录确认对话框 -->
    <div v-if="showLogoutConfirm" class="modal-overlay" @click="showLogoutConfirm = false">
      <div class="modal" @click.stop>
        <h3>🚪 确认退出</h3>
        <p>确定要退出登录吗？</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showLogoutConfirm = false">取消</button>
          <button class="btn-danger" @click="handleLogoutConfirm">退出</button>
        </div>
      </div>
    </div>

    <!-- 创建/编辑备忘录弹窗 -->
    <div v-if="showEditor" class="modal-overlay" @click="cancelEdit">
      <div class="modal modal-large" @click.stop>
        <div class="modal-header">
          <h3>{{ editingMemo ? '编辑备忘录' : '新建备忘录' }}</h3>
          <button class="btn-close" @click="cancelEdit">×</button>
        </div>
        
        <div class="editor-content">
          <input
            v-model="editorForm.title"
            type="text"
            class="editor-title-input"
            placeholder="输入标题..."
            autofocus
          />
          
          <textarea
            v-model="editorForm.content"
            class="editor-content-input"
            placeholder="输入内容..."
            rows="8"
          ></textarea>
          
          <div class="editor-tag-section">
            <label class="label">标签</label>
            <input
              v-model="editorForm.tagInput"
              type="text"
              class="tag-input"
              placeholder="输入标签，多个用逗号分隔（如：工作，重要）"
            />
            
            <div class="tags-preview" v-if="editorTags.length > 0">
              <span v-for="(tag, index) in editorTags" :key="index" class="tag">
                🏷️ {{ tag }}
                <button class="tag-remove" @click="removeEditorTag(index)">×</button>
              </span>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-cancel" @click="cancelEdit">取消</button>
          <button class="btn-save" @click="saveEditorMemo" :disabled="!editorForm.title.trim()">
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMemos } from '../composables/useMemos'
import { useAuth } from '../composables/useAuth'
import type { Memo, CreateMemoDTO } from '../types/memo'

const router = useRouter()
const { memos, createMemo, deleteMemo: deleteMemoAction, updateMemo, getMemoById, getAllTags, filterByTag, searchMemos } = useMemos()
const { logout, authState } = useAuth()

// 获取当前用户
const currentUser = computed(() => authState.user)

const selectedTag = ref('all')
const searchKeyword = ref('')
const showDeleteConfirm = ref(false)
const showLogoutConfirm = ref(false)
const memoToDelete = ref<Memo | null>(null)

// 编辑器相关
const showEditor = ref(false)
const editingMemo = ref<Memo | null>(null)
const editorForm = ref({
  title: '',
  content: '',
  tagInput: ''
})

// 筛选后的备忘录列表
const filteredMemos = computed(() => {
  let result = memos.value

  // 按标签筛选
  if (selectedTag.value !== 'all') {
    result = filterByTag(selectedTag.value)
  }

  // 按关键词搜索
  if (searchKeyword.value) {
    result = searchMemos(searchKeyword.value)
  }

  return result
})

// 显示退出确认弹窗
const showLogoutConfirmDialog = () => {
  showLogoutConfirm.value = true
}

// 确认退出登录
const handleLogoutConfirm = () => {
  logout()
  showLogoutConfirm.value = false
  router.push('/login')
}

// 打开创建弹窗
const goToCreate = () => {
  showEditor.value = true
  editingMemo.value = null
  editorForm.value = {
    title: '',
    content: '',
    tagInput: ''
  }
}

// 打开编辑弹窗
const goToEdit = (id: string) => {
  console.log('点击编辑，ID:', id)
  const memo = getMemoById(id)
  console.log('找到的备忘录:', memo)
  if (!memo) {
    console.error('未找到备忘录')
    return
  }
  
  showEditor.value = true
  editingMemo.value = memo
  editorForm.value = {
    title: memo.title,
    content: memo.content,
    tagInput: memo.tags.join(', ')
  }
  console.log('编辑器表单:', editorForm.value)
}

// 取消编辑
const cancelEdit = () => {
  showEditor.value = false
  editingMemo.value = null
}

// 保存编辑
const saveEditorMemo = () => {
  if (!editorForm.value.title.trim()) return
  
  const tags = editorForm.value.tagInput
    .split(',')
    .map(t => t.trim())
    .filter(t => t)
  
  if (editingMemo.value) {
    // 更新
    updateMemo(editingMemo.value.id, {
      title: editorForm.value.title,
      content: editorForm.value.content,
      tags
    })
  } else {
    // 创建
    createMemo({
      title: editorForm.value.title,
      content: editorForm.value.content,
      tags
    } as CreateMemoDTO)
  }
  
  showEditor.value = false
  editingMemo.value = null
}

// 移除编辑器标签
const removeEditorTag = (index: number) => {
  const tags = editorTags.value.filter((_, i) => i !== index)
  editorForm.value.tagInput = tags.join(', ')
}

// 编辑器标签
const editorTags = computed(() => {
  if (!editorForm.value.tagInput.trim()) return []
  return editorForm.value.tagInput
    .split(',')
    .map(t => t.trim())
    .filter(t => t)
})

// 确认删除
const confirmDelete = (memo: Memo) => {
  memoToDelete.value = memo
  showDeleteConfirm.value = true
}

// 执行删除
const deleteMemo = () => {
  if (memoToDelete.value) {
    deleteMemoAction(memoToDelete.value.id)
    showDeleteConfirm.value = false
    memoToDelete.value = null
  }
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // 今天
  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  
  // 本周
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString('zh-CN', { weekday: 'short' })
  }
  
  // 其他
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.memo-app {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
}

.header-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.header-center {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
  gap: 12px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.username {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.btn-logout {
  background: #f5f5f5;
  color: #666;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  margin-left: 40px;
}

.btn-logout:hover {
  background: #e74c3c;
  color: white;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.3s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.tag-filter {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.tag-btn {
  background: #f5f5f5;
  border: none;
  padding: 6px 12px;
  border-radius: 16px;
  cursor: pointer;
  font-size: 13px;
}

.tag-btn.active {
  background: #3498db;
  color: white;
}

.search-box {
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.memo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.memo-card {
  background: white;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.memo-card::before {
  content: '✏️';
  position: absolute;
  top: 12px;
  right: 50px;
  opacity: 0;
  transition: all 0.3s;
  font-size: 18px;
}

.memo-card:hover {
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
  border-color: #667eea;
  transform: translateY(-2px);
}

.memo-card:hover::before {
  opacity: 1;
  right: 45px;
}

.memo-card:active {
  transform: translateY(0);
}

.memo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.memo-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.memo-title .edit-icon {
  opacity: 0;
  transition: opacity 0.3s;
  font-size: 16px;
}

.memo-card:hover .memo-title .edit-icon {
  opacity: 1;
}

.btn-delete {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  opacity: 0.6;
}

.btn-delete:hover {
  opacity: 1;
}

.memo-content {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  margin: 8px 0;
}

.memo-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.memo-tags {
  display: flex;
  gap: 6px;
}

.tag {
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
}

.memo-time {
  font-size: 12px;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 24px;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
}

.modal h3 {
  margin: 0 0 16px;
  color: #333;
}

.modal p {
  color: #666;
  margin: 0 0 24px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-cancel {
  background: #f5f5f5;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
}

.btn-danger {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
}

/* 编辑器弹窗样式 - 美化版 */
.modal-large {
  max-width: 650px;
  width: 90%;
  padding: 0;
  overflow: hidden;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-header h3::before {
  content: '✏️';
  font-size: 22px;
}

.btn-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: white;
  padding: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.editor-content {
  padding: 28px 24px;
  background: #fff;
}

.editor-title-input {
  width: 100%;
  border: none;
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 20px;
  outline: none;
  color: #2d3748;
  background: transparent;
}

.editor-title-input::placeholder {
  color: #cbd5e0;
  font-weight: 500;
}

.editor-title-input:focus {
  border-bottom: 3px solid #667eea;
}

.editor-content-input {
  width: 100%;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  line-height: 1.8;
  resize: vertical;
  outline: none;
  min-height: 180px;
  font-family: inherit;
  padding: 16px;
  transition: all 0.2s;
  background: #f8fafc;
}

.editor-content-input:focus {
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.editor-content-input::placeholder {
  color: #a0aec0;
}

.editor-tag-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 2px dashed #e2e8f0;
}

.editor-tag-section .label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.editor-tag-section .label::before {
  content: '🏷️';
}

.tag-input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  outline: none;
  transition: all 0.2s;
  background: white;
}

.tag-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.tag-input::placeholder {
  color: #a0aec0;
}

.tags-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.tag {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  animation: tagPopIn 0.3s ease-out;
}

@keyframes tagPopIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.tag-remove {
  background: rgba(255, 255, 255, 0.3);
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: white;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.tag-remove:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: scale(1.1);
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.modal-footer .btn-cancel {
  background: white;
  border: 2px solid #e2e8f0;
  color: #4a5568;
  padding: 12px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.2s;
}

.modal-footer .btn-cancel:hover {
  border-color: #cbd5e0;
  background: #f7fafc;
}

.modal-footer .btn-save {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.modal-footer .btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.modal-footer .btn-save:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
  box-shadow: none;
}

/* 移动端适配 */
@media (max-width: 640px) {
  .modal-large {
    width: 95%;
    border-radius: 12px;
  }
  
  .modal-header {
    padding: 16px 20px;
  }
  
  .modal-header h3 {
    font-size: 18px;
  }
  
  .editor-content {
    padding: 20px 16px;
  }
  
  .editor-title-input {
    font-size: 22px;
  }
  
  .editor-content-input {
    font-size: 15px;
    min-height: 150px;
  }
  
  .modal-footer {
    padding: 16px 20px;
    flex-direction: column;
  }
  
  .modal-footer .btn-cancel,
  .modal-footer .btn-save {
    width: 100%;
  }
}

/* 移动端适配 */
@media (max-width: 640px) {
  .memo-app {
    padding: 16px;
  }
  
  .title {
    font-size: 20px;
  }
  
  .tag-filter {
    overflow-x: auto;
    flex-wrap: nowrap;
  }
  
  /* 移动端显示编辑图标 */
  .memo-title .edit-icon {
    opacity: 1;
  }
  
  .memo-card::before {
    display: none;
  }
  
  .memo-card {
    padding: 14px;
  }
}
</style>
