<!-- 创建备忘录页面 -->
<!-- pages/Create.vue -->

<template>
  <div class="create-page">
    <!-- 顶部导航 -->
    <header class="header">
      <button class="btn-back" @click="goBack">
        ← 返回
      </button>
      <h1 class="title">新建备忘录</h1>
      <button class="btn-save" @click="saveMemo" :disabled="!title.trim()">
        保存
      </button>
    </header>

    <!-- 编辑区域 -->
    <div class="editor">
      <!-- 标题输入 -->
      <input
        v-model="title"
        type="text"
        class="title-input"
        placeholder="输入标题..."
        autofocus
      />

      <!-- 内容输入 -->
      <textarea
        v-model="content"
        class="content-input"
        placeholder="输入内容..."
        rows="10"
      ></textarea>

      <!-- 标签输入 -->
      <div class="tag-section">
        <label class="label">标签</label>
        <input
          v-model="tagInput"
          type="text"
          class="tag-input"
          placeholder="输入标签，多个标签用逗号分隔（如：工作，重要）"
        />
        
        <!-- 已添加的标签 -->
        <div class="tags-preview" v-if="tags.length > 0">
          <span v-for="(tag, index) in tags" :key="index" class="tag">
            🏷️ {{ tag }}
            <button class="tag-remove" @click="removeTag(index)">×</button>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMemos } from '../composables/useMemos'

const router = useRouter()
const { createMemo } = useMemos()

const title = ref('')
const content = ref('')
const tagInput = ref('')

// 解析标签
const tags = computed(() => {
  if (!tagInput.value.trim()) return []
  return tagInput.value.split(',').map(t => t.trim()).filter(t => t)
})

// 返回上一页
const goBack = () => {
  router.back()
}

// 保存备忘录
const saveMemo = () => {
  if (!title.value.trim()) {
    alert('请输入标题')
    return
  }

  const newMemo = createMemo({
    title: title.value,
    content: content.value,
    tags: tags.value
  })

  // 返回主页
  router.push('/')
}

// 移除标签
const removeTag = (index: number) => {
  const newTags = tags.value.filter((_, i) => i !== index)
  tagInput.value = newTags.join(', ')
}
</script>

<style scoped>
.create-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ddd;
}

.btn-back {
  background: none;
  border: none;
  color: #3498db;
  cursor: pointer;
  font-size: 14px;
  padding: 8px 12px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.btn-save {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.btn-save:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.editor {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.title-input {
  width: 100%;
  border: none;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
  outline: none;
  border-bottom: 2px solid transparent;
  transition: border-color 0.2s;
}

.title-input:focus {
  border-bottom-color: #3498db;
}

.content-input {
  width: 100%;
  border: none;
  font-size: 16px;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  min-height: 200px;
  font-family: inherit;
}

.tag-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #eee;
}

.label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
}

.tag-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
}

.tag-input:focus {
  border-color: #3498db;
}

.tags-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.tag {
  background: #f0f0f0;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tag-remove {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #999;
  padding: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tag-remove:hover {
  color: #e74c3c;
}

/* 移动端适配 */
@media (max-width: 640px) {
  .create-page {
    padding: 16px;
  }

  .title-input {
    font-size: 20px;
  }

  .content-input {
    font-size: 15px;
  }
}
</style>
