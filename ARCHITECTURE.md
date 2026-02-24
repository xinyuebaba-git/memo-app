# 备忘录系统 - 系统架构设计

**版本：** 1.0.0  
**创建时间：** 2026-02-24  
**Agent:** Architect

---

## 1. 架构概述

### 1.1 架构图

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
│  │ 管理     │ │  管理    │ │  过滤    │ │  同步    │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                      数据层                               │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐   │
│  │              LocalStorage / IndexedDB            │   │
│  │  ┌──────────────┐  ┌──────────────┐             │   │
│  │  │   Memos      │  │    Tags      │             │   │
│  │  └──────────────┘  └──────────────┘             │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 1.2 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| **前端框架** | Vue 3 | 组合式 API，响应式 |
| **构建工具** | Vite | 快速开发和构建 |
| **UI 框架** | Element Plus | 桌面端组件 |
| **移动端 UI** | Vant | 移动端组件 |
| **状态管理** | Pinia | 轻量级状态管理 |
| **数据存储** | LocalStorage | 本地持久化 |
| **样式方案** | Tailwind CSS | 原子化 CSS |
| **部署平台** | Vercel | 免费托管，自动部署 |

### 1.3 架构模式
- **MVVM** - Model-View-ViewModel
- **响应式设计** - 一套代码，多端适配

---

## 2. 模块设计

### 2.1 模块划分

| 模块名 | 职责 | 主要组件 |
|--------|------|---------|
| **MemoModule** | 备忘录 CRUD | MemoList, MemoEditor, MemoItem |
| **TagModule** | 标签管理 | TagFilter, TagEditor |
| **StorageModule** | 数据存储 | localStorage adapter |
| **UIModule** | 界面组件 | Layout, Header, Responsive |

### 2.2 模块详情

#### MemoModule
```
MemoModule
├── MemoList.vue       # 备忘录列表
├── MemoItem.vue       # 单个备忘录项
├── MemoEditor.vue     # 编辑/创建页面
├── MemoDetail.vue     # 详情页面
└── composables/
    └── useMemos.js    # 备忘录逻辑
```

#### TagModule
```
TagModule
├── TagFilter.vue      # 标签筛选
├── TagEditor.vue      # 标签编辑
└── composables/
    └── useTags.js     # 标签逻辑
```

---

## 3. 数据设计

### 3.1 数据模型

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

#### Tag（标签）
```typescript
interface Tag {
  id: string;           // 唯一标识
  name: string;         // 标签名称
  color: string;        // 标签颜色
  count: number;        // 关联备忘录数量
}
```

### 3.2 存储结构

```javascript
// LocalStorage Key-Value
{
  "memos": [
    {
      "id": "memo_001",
      "title": "工作会议记录",
      "content": "讨论 Q2 目标...",
      "tags": ["工作", "会议"],
      "createdAt": 1708776000000,
      "updatedAt": 1708776000000
    }
  ],
  "tags": [
    {"id": "tag_001", "name": "工作", "color": "#3498db"},
    {"id": "tag_002", "name": "生活", "color": "#2ecc71"}
  ]
}
```

---

## 4. 接口设计

### 4.1 内部 API（Composables）

#### useMemos
```typescript
interface UseMemosReturn {
  memos: Ref<Memo[]>;
  createMemo: (data: CreateMemoDTO) => Promise<Memo>;
  updateMemo: (id: string, data: UpdateMemoDTO) => Promise<void>;
  deleteMemo: (id: string) => Promise<void>;
  getMemoById: (id: string) => Memo | null;
  filterByTag: (tag: string) => Memo[];
}
```

#### useTags
```typescript
interface UseTagsReturn {
  tags: Ref<Tag[]>;
  addTag: (name: string) => Promise<Tag>;
  removeTag: (tagId: string) => Promise<void>;
  getAllTags: () => Tag[];
}
```

---

## 5. 组件设计

### 5.1 页面组件

```
pages/
├── index.vue          # 首页（备忘录列表）
├── create.vue         # 创建备忘录
├── edit/[id].vue      # 编辑备忘录
└── tag/[name].vue     # 标签筛选页
```

### 5.2 公共组件

```
components/
├── Layout/
│   ├── Header.vue     # 顶部导航
│   ├── Sidebar.vue    # 侧边栏（标签）
│   └── Footer.vue     # 底部信息
├── Memo/
│   ├── MemoCard.vue   # 备忘录卡片
│   ├── MemoList.vue   # 备忘录列表
│   └── MemoEditor.vue # 编辑器
└── Tag/
    ├── TagList.vue    # 标签列表
    └── TagInput.vue   # 标签输入
```

---

## 6. 响应式设计

### 6.1 断点定义

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

### 6.2 布局适配

| 设备 | 屏幕宽度 | 布局 |
|------|---------|------|
| 手机 | < 640px | 单列，全屏编辑 |
| 平板 | 641-1024px | 双列，侧边栏可折叠 |
| 桌面 | > 1025px | 三列，固定侧边栏 |

---

## 7. 安全设计

### 7.1 输入验证
- 标题长度限制（1-100 字符）
- 内容长度限制（0-10000 字符）
- 标签名称过滤（防止特殊字符）

### 7.2 XSS 防护
- 用户输入内容转义
- 使用 Vue 的自动转义机制
- 禁用 v-html（除非必要）

### 7.3 数据安全
- LocalStorage 数据可选加密
- 敏感操作二次确认
- 定期备份提醒

---

## 8. 部署方案

### 8.1 环境要求
- Node.js 18+
- npm 或 pnpm

### 8.2 部署步骤

```bash
# 1. 安装依赖
pnpm install

# 2. 开发
pnpm dev

# 3. 构建
pnpm build

# 4. 部署到 Vercel
pnpm i -g vercel
vercel deploy
```

### 8.3 目录结构

```
memo-app/
├── src/
│   ├── components/
│   ├── composables/
│   ├── pages/
│   ├── stores/
│   ├── types/
│   └── utils/
├── public/
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

**文档结束**
