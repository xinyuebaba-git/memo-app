# 🏗️ 数据迁移与版本兼容架构设计

**版本：** 1.0.0  
**日期：** 2026-02-26  
**优先级：** 🔴 最高

---

## 📋 问题分析

### 当前问题

1. **数据丢失风险**
   - 新版本部署后 LocalStorage 结构变更
   - 无数据迁移机制
   - 用户数据完全丢失

2. **版本不兼容**
   - 无版本号管理
   - 无向后兼容设计
   - 无数据迁移逻辑

3. **无备份机制**
   - 用户无法导出/导入数据
   - 无法回滚到旧版本

---

## 🎯 解决方案

### 核心设计原则

1. **数据永失（Never Lose Data）** - 最高优先级
2. **向后兼容** - 新版本必须兼容旧数据
3. **版本管理** - 明确的数据结构版本
4. **迁移机制** - 自动数据迁移
5. **备份恢复** - 导出/导入功能

---

## 📊 架构设计

### 1. 数据结构版本管理

```typescript
// 添加数据结构版本号
interface DataSchema {
  version: number;      // 数据结构版本
  updatedAt: number;    // 最后更新时间
  data: any;           // 实际数据
}
```

**版本历史：**
- v1: 初始版本（明文存储）
- v2: 加密版本（bcrypt + AES）
- v3: 未来版本...

---

### 2. 数据迁移器架构

```typescript
// 迁移器接口
interface DataMigrator {
  fromVersion: number;
  toVersion: number;
  migrate(data: any): any;
}

// 迁移管理器
class MigrationManager {
  private migrations: DataMigrator[];
  
  // 自动检测并执行迁移
  migrate(currentVersion: number, targetVersion: number): Promise<any>;
  
  // 注册迁移器
  register(migrator: DataMigrator): void;
}
```

---

### 3. 存储结构升级

**旧结构（❌ 有问题）：**
```typescript
localStorage.setItem('memo_app_memos', JSON.stringify(memos));
localStorage.setItem('memo_app_users', JSON.stringify(users));
```

**新结构（✅ 带版本）：**
```typescript
const storage = {
  version: 2,
  updatedAt: Date.now(),
  memos: [...],
  users: [...],
  metadata: {
    appVersion: '1.1.0',
    encrypted: true
  }
};

localStorage.setItem('memo_app_data', JSON.stringify(storage));
```

---

### 4. 迁移流程

```
应用启动
   ↓
读取 LocalStorage
   ↓
检测数据结构版本
   ↓
版本匹配？
   ├─ 是 → 正常使用
   └─ 否 → 执行迁移
         ↓
    备份旧数据
         ↓
    执行迁移器
         ↓
    验证新数据
         ↓
    保存新版本
         ↓
    完成
```

---

### 5. 数据导出/导入

**导出功能：**
```typescript
// 导出所有数据（加密）
export const exportData = async (): Promise<string> => {
  const data = localStorage.getItem('memo_app_data');
  const encrypted = encryptData(data);
  return JSON.stringify({
    version: CURRENT_VERSION,
    exportedAt: Date.now(),
    data: encrypted
  });
};
```

**导入功能：**
```typescript
// 导入数据（带验证）
export const importData = async (jsonData: string): Promise<boolean> => {
  const imported = JSON.parse(jsonData);
  
  // 验证版本兼容性
  if (!isVersionCompatible(imported.version)) {
    throw new Error('版本不兼容');
  }
  
  // 解密并验证
  const decrypted = decryptData(imported.data);
  const validated = validateDataStructure(decrypted);
  
  // 保存到 LocalStorage
  localStorage.setItem('memo_app_data', decrypted);
  return true;
};
```

---

## 🔧 实现方案

### 文件结构

```
src/
├── types/
│   └── schema.ts           # 数据结构定义
├── utils/
│   ├── crypto.ts           # 加密工具（已有）
│   └── migration.ts        # 迁移工具（新增）
├── composables/
│   ├── useMemos.ts         # 更新：添加版本检测
│   └── useAuth.ts          # 更新：添加版本检测
└── components/
    └── DataMigration.vue   # 迁移 UI 组件（新增）
```

---

### 迁移器实现示例

```typescript
// utils/migration.ts

import { encryptData, decryptData, hashPassword } from './crypto';

const CURRENT_VERSION = 2;

interface Migration {
  from: number;
  to: number;
  migrate: (data: any) => any;
}

const migrations: Migration[] = [
  {
    from: 1,
    to: 2,
    migrate: (v1Data) => {
      // v1 → v2 迁移
      // 1. 迁移用户密码为 bcrypt 哈希
      // 2. 迁移备忘录为 AES 加密
      // 3. 添加版本号
      
      const newUsers = v1Data.users.map((user: any) => ({
        ...user,
        password: hashPasswordSync(user.password) // 需要异步处理
      }));
      
      const encryptedMemos = encryptData(JSON.stringify(v1Data.memos));
      
      return {
        version: 2,
        updatedAt: Date.now(),
        users: newUsers,
        memos: encryptedMemos,
        metadata: {
          appVersion: '1.1.0',
          encrypted: true
        }
      };
    }
  }
];

export const migrateData = async (oldData: any): Promise<any> => {
  const fromVersion = oldData.version || 1;
  
  if (fromVersion === CURRENT_VERSION) {
    return oldData; // 无需迁移
  }
  
  // 查找并执行迁移
  const migration = migrations.find(m => m.from === fromVersion);
  if (!migration) {
    throw new Error(`不支持的迁移：v${fromVersion} → v${CURRENT_VERSION}`);
  }
  
  return await migration.migrate(oldData);
};

export const getCurrentVersion = (): number => CURRENT_VERSION;
```

---

### 更新 useMemos

```typescript
// composables/useMemos.ts

import { migrateData, getCurrentVersion } from '../utils/migration';

const STORAGE_KEY = 'memo_app_data';

const loadData = async () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { memos: [], version: CURRENT_VERSION };
  
  try {
    let data = JSON.parse(raw);
    
    // 检测版本并迁移
    if (data.version < CURRENT_VERSION) {
      // 备份旧数据
      localStorage.setItem(`${STORAGE_KEY}_backup_v${data.version}`, raw);
      
      // 执行迁移
      data = await migrateData(data);
      
      // 保存新数据
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    
    // 解密密备忘录
    const memos = isEncryptionEnabled() 
      ? JSON.parse(decryptData(data.memos))
      : data.memos;
    
    return { memos, version: data.version };
  } catch (error) {
    console.error('Failed to load data:', error);
    return { memos: [], version: CURRENT_VERSION };
  }
};
```

---

## ✅ 向后兼容策略

### 1. 版本检测

```typescript
const checkCompatibility = (version: number): boolean => {
  // 只支持相邻版本迁移
  return version >= CURRENT_VERSION - 1;
};
```

### 2. 数据验证

```typescript
const validateData = (data: any): boolean => {
  // 验证必需字段
  // 验证数据类型
  // 验证数据完整性
  return true;
};
```

### 3. 回滚机制

```typescript
// 迁移失败时回滚
const rollback = async (backupKey: string) => {
  const backup = localStorage.getItem(backupKey);
  if (backup) {
    localStorage.setItem(STORAGE_KEY, backup);
  }
};
```

---

## 📁 数据导出/导入 UI

### 导出按钮

```vue
<template>
  <button @click="handleExport">
    📤 导出数据
  </button>
</template>

<script setup>
const handleExport = async () => {
  const data = await exportData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `memo-backup-${Date.now()}.json`;
  a.click();
};
</script>
```

### 导入按钮

```vue
<template>
  <input type="file" @change="handleImport" accept=".json" />
</template>

<script setup>
const handleImport = async (event) => {
  const file = event.target.files[0];
  const text = await file.text();
  
  try {
    await importData(text);
    alert('导入成功！');
    location.reload();
  } catch (error) {
    alert(`导入失败：${error.message}`);
  }
};
</script>
```

---

## 🧪 测试策略

### 1. 迁移测试

```typescript
describe('Data Migration', () => {
  it('should migrate v1 to v2', async () => {
    const v1Data = {
      version: 1,
      memos: [...],
      users: [...]
    };
    
    const v2Data = await migrateData(v1Data);
    
    expect(v2Data.version).toBe(2);
    expect(v2Data.encrypted).toBe(true);
  });
});
```

### 2. 兼容性测试

```typescript
describe('Backward Compatibility', () => {
  it('should load v1 data', async () => {
    // 模拟 v1 数据
    localStorage.setItem('memo_app_data', v1Data);
    
    // 启动应用
    const app = createApp(App);
    
    // 验证数据已迁移
    const migrated = JSON.parse(localStorage.getItem('memo_app_data'));
    expect(migrated.version).toBe(CURRENT_VERSION);
  });
});
```

---

## 📊 版本矩阵

| 当前版本 | 支持迁移 | 备注 |
|---------|---------|------|
| v1 | ✅ → v2 | 初始版本 |
| v2 | ✅ → v3 | 加密版本 |
| v3 | ✅ → v4 | 未来版本 |

**策略：** 支持最近 2 个版本的直接迁移，更早版本需要先升级到中间版本。

---

## 🚀 实施计划

### Phase 1: 核心迁移（立即）
- [ ] 创建数据结构版本管理
- [ ] 实现迁移器框架
- [ ] v1 → v2 迁移逻辑
- [ ] 自动迁移检测

### Phase 2: 备份恢复（本周）
- [ ] 数据导出功能
- [ ] 数据导入功能
- [ ] 自动备份机制

### Phase 3: UI 增强（下周）
- [ ] 迁移进度 UI
- [ ] 导入/导出 UI
- [ ] 版本信息展示

---

## ⚠️ 注意事项

1. **迁移不可逆** - v2 无法回退到 v1
2. **备份优先** - 迁移前必须备份
3. **验证完整** - 迁移后验证数据完整性
4. **用户通知** - 迁移时告知用户

---

**批准人：** 翔哥（CTO）  
**架构师：** OpenClaw Architect Agent  
**最后更新：** 2026-02-26
