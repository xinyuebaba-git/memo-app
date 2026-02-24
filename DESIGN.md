# 📝 备忘录系统 - 设计文档

**项目名称：** Memo App  
**版本：** 1.0.0  
**创建时间：** 2026-02-24  
**开发团队：** OpenClaw 软件开发 Agent 团队

---

## 1. 项目概述

### 1.1 产品定位
一款轻量级、跨平台的备忘录管理应用，支持桌面端和移动端使用，帮助用户高效记录和管理日常笔记。

### 1.2 目标用户
- 需要快速记录灵感的创意工作者
- 需要管理多个项目笔记的职场人士
- 需要跨设备同步笔记的学生

### 1.3 核心价值
- 📱 多端适配 - 桌面端和移动端完美响应
- 📝 多备忘录管理 - 轻松创建和管理多个笔记
- 🏷️ 标签分组 - 自定义标签，快速筛选
- 💾 本地存储 - 数据安全，隐私保护
- ⚡ 快速响应 - 流畅的用户体验

---

## 2. 技术架构

### 2.1 架构图

```
┌─────────────────────────────────────────────────────────┐
│                      用户界面层                            │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  桌面端     │  │  移动端     │  │  平板端     │     │
│  │  (响应式)   │  │  (响应式)   │  │  (响应式)   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                      应用层                               │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 备忘录   │ │  标签    │ │  搜索    │ │  数据    │   │
│  │ 管理     │ │  管理    │ │  过滤    │ │  持久化  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                      数据层                               │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐   │
│  │              LocalStorage                         │   │
│  │  ┌──────────────┐  ┌──────────────┐             │   │
│  │  │   Memos      │  │    Tags      │             │   │
│  │  └──────────────┘  └──────────────┘             │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 2.2 技术栈

| 层级 | 技术选型 | 版本 | 用途 |
|------|---------|------|------|
| **前端框架** | Vue 3 | 3.5.x | 响应式框架 |
| **构建工具** | Vite | 5.4.x | 快速构建 |
| **类型系统** | TypeScript | 5.9.x | 类型安全 |
| **状态管理** | Composables | - | 逻辑复用 |
| **数据存储** | LocalStorage | - | 本地持久化 |
| **样式方案** | 原生 CSS | - | 响应式布局 |

### 2.3 架构模式
- **MVVM** - Model-View-ViewModel
- **Composition API** - 组合式 API
- **响应式设计** - 一套代码，多端适配

---

## 3. 模块设计

### 3.1 模块划分

| 模块名 | 职责 | 主要文件 |
|--------|------|---------|
| **MemoModule** | 备忘录 CRUD | useMemos.ts |
| **TagModule** | 标签管理 | useMemos.ts |
| **StorageModule** | 数据存储 | useMemos.ts |
| **UIModule** | 界面组件 | Index.vue |

### 3.2 目录结构

```
memo-system/
├── src/
│   ├── types/
│   │   └── memo.ts              # 类型定义
│   ├── composables/
│   │   └── useMemos.ts          # 核心逻辑
│   ├── pages/
│   │   └── Index.vue            # 主页面
│   └── main.ts                  # 入口文件
├── index.html                   # HTML 模板
├── package.json                 # 项目配置
├── vite.config.js               # Vite 配置
└── README.md                    # 项目说明
```

---

## 4. 数据设计

### 4.1 数据模型

#### Memo（备忘录）
```typescript
interface Memo {
  id: string;           // 唯一标识 (UUID)
  title: string;        // 标题
  content: string;      // 内容
  tags: string[];       // 标签列表
  createdAt: number;    // 创建时间戳
  updatedAt: number;    // 更新时间戳
}
```

#### CreateMemoDTO（创建数据传输对象）
```typescript
interface CreateMemoDTO {
  title: string;        // 标题
  content?: string;     // 内容（可选）
  tags?: string[];      // 标签（可选）
}
```

#### UpdateMemoDTO（更新数据传输对象）
```typescript
interface UpdateMemoDTO {
  title?: string;       // 标题（可选）
  content?: string;     // 内容（可选）
  tags?: string[];      // 标签（可选）
}
```

### 4.2 存储结构

```javascript
// LocalStorage Key-Value
{
  "memo_app_memos": [
    {
      "id": "memo_1708776000000_abc123",
      "title": "工作会议记录",
      "content": "讨论 Q2 目标和计划...",
      "tags": ["工作", "会议"],
      "createdAt": 1708776000000,
      "updatedAt": 1708776000000
    }
  ]
}
```

### 4.3 数据操作

```typescript
// 加载备忘录
function loadMemos(): Memo[] {
  const data = localStorage.getItem('memo_app_memos')
  return data ? JSON.parse(data) : []
}

// 保存备忘录
function saveMemos(memos: Memo[]): void {
  localStorage.setItem('memo_app_memos', JSON.stringify(memos))
}

// 生成唯一 ID
function generateId(): string {
  return `memo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
```

---

## 5. 接口设计

### 5.1 Composables API

#### useMemos

```typescript
interface UseMemosReturn {
  // 数据
  memos: Ref<Memo[]>;
  
  // 创建
  createMemo: (data: CreateMemoDTO) => Memo;
  
  // 更新
  updateMemo: (id: string, data: UpdateMemoDTO) => void;
  
  // 删除
  deleteMemo: (id: string) => void;
  
  // 查询
  getMemoById: (id: string) => Memo | null;
  
  // 筛选
  filterByTag: (tag: string) => Memo[];
  searchMemos: (keyword: string) => Memo[];
  
  // 统计
  getAllTags: ComputedRef<string[]>;
  memoCount: ComputedRef<number>;
}
```

### 5.2 使用示例

```typescript
// 引入 Composable
import { useMemos } from './composables/useMemos'

// 在组件中使用
const { 
  memos, 
  createMemo, 
  updateMemo, 
  deleteMemo,
  filterByTag,
  searchMemos
} = useMemos()

// 创建备忘录
const newMemo = createMemo({
  title: '新备忘录',
  content: '内容...',
  tags: ['工作', '重要']
})

// 更新备忘录
updateMemo(memoId, {
  title: '更新后的标题'
})

// 删除备忘录
deleteMemo(memoId)

// 按标签筛选
const workMemos = filterByTag('工作')

// 搜索
const results = searchMemos('会议')
```

---

## 6. 界面设计

### 6.1 页面结构

#### 主页（Index.vue）

**功能区域：**
1. **顶部导航栏**
   - 应用标题
   - 新建按钮

2. **标签筛选栏**
   - 全部标签
   - 自定义标签列表

3. **搜索框**
   - 关键词输入
   - 实时搜索

4. **备忘录列表**
   - 卡片式布局
   - 标题、内容预览
   - 标签显示
   - 时间显示
   - 删除按钮

5. **编辑弹窗**
   - 标题输入
   - 内容输入
   - 标签输入
   - 保存/取消按钮

### 6.2 响应式断点

```css
/* 移动端 */
@media (max-width: 640px) {
  /* 单列布局 */
}

/* 平板端 */
@media (min-width: 641px) and (max-width: 1024px) {
  /* 双列布局 */
}

/* 桌面端 */
@media (min-width: 1025px) {
  /* 三列布局 + 侧边栏 */
}
```

### 6.3 配色方案

```css
/* 主色 - 紫色渐变 */
--primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* 背景色 */
--bg-color: #f5f5f5;
--card-bg: #ffffff;

/* 文字色 */
--text-primary: #2d3748;
--text-secondary: #4a5568;
--text-muted: #a0aec0;

/* 边框色 */
--border-color: #e2e8f0;
```

---

## 7. 核心功能实现

### 7.1 创建备忘录

```typescript
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
```

### 7.2 编辑备忘录

```typescript
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
```

### 7.3 删除备忘录

```typescript
const deleteMemo = (id: string): void => {
  memos.value = memos.value.filter(m => m.id !== id)
  saveMemos(memos.value)
}
```

### 7.4 标签筛选

```typescript
const filterByTag = (tag: string): Memo[] => {
  return memos.value.filter(m => m.tags.includes(tag))
}
```

### 7.5 搜索功能

```typescript
const searchMemos = (keyword: string): Memo[] => {
  const lowerKeyword = keyword.toLowerCase()
  return memos.value.filter(m => 
    m.title.toLowerCase().includes(lowerKeyword) ||
    m.content.toLowerCase().includes(lowerKeyword)
  )
}
```

---

## 8. 安全设计

### 8.1 输入验证
- 标题长度限制：1-100 字符
- 内容长度限制：0-10000 字符
- 标签名称过滤：防止特殊字符

### 8.2 XSS 防护
- Vue 自动转义用户输入
- 不使用 v-html（除非必要）
- 内容输出时自动转义

### 8.3 数据安全
- LocalStorage 数据仅本地访问
- 敏感操作二次确认（删除）
- 无后端，数据不出浏览器

---

## 9. 性能优化

### 9.1 渲染优化
- 使用 Computed 缓存计算结果
- v-for 使用唯一 key
- 条件渲染使用 v-if

### 9.2 存储优化
- 数据压缩存储
- 批量保存操作
- 限制备忘录数量

### 9.3 加载优化
- 首屏快速加载
- 懒加载非必要资源
- 本地缓存策略

---

## 10. 部署方案

### 10.1 开发环境

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 访问 http://localhost:5173
```

### 10.2 生产环境

```bash
# 构建
pnpm build

# 预览
pnpm preview
```

### 10.3 部署平台

**推荐：Vercel**
```bash
pnpm i -g vercel
vercel deploy
```

**其他选项：**
- Netlify
- GitHub Pages
- Cloudflare Pages

---

## 11. 测试策略

### 11.1 单元测试
- Composables 逻辑测试
- 数据操作测试
- 工具函数测试

### 11.2 组件测试
- 页面渲染测试
- 用户交互测试
- 状态变化测试

### 11.3 E2E 测试
- 创建流程测试
- 编辑流程测试
- 删除流程测试
- 筛选功能测试

---

## 12. 后续优化

### 12.1 短期计划
- [ ] 完善创建/编辑页面
- [ ] 添加单元测试
- [ ] 优化移动端体验
- [ ] 添加加载状态

### 12.2 中期计划
- [ ] 数据导出/导入
- [ ] 备忘录置顶
- [ ] 深色模式
- [ ] 分享功能

### 12.3 长期计划
- [ ] 后端 API 服务
- [ ] 多设备同步
- [ ] 用户系统
- [ ] 协作编辑

---

## 13. 技术债务

### 13.1 已知问题
- 无后端，数据无法跨设备同步
- 无备份机制，清除浏览器数据会丢失
- 无富文本编辑，仅支持纯文本

### 13.2 优化建议
- 添加数据导出功能
- 实现自动备份提醒
- 考虑引入富文本编辑器

---

**文档结束**

**最后更新：** 2026-02-24  
**维护者：** OpenClaw 软件开发团队
