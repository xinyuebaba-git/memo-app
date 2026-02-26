# 📦 数据迁移指南

**版本：** 1.2.0  
**日期：** 2026-02-26  
**优先级：** 🔴 必读

---

## 🎯 重要更新

### v1.2.0 数据架构升级

本次更新引入了全新的数据管理架构，确保：

- ✅ **数据永不丢失** - 自动版本检测和迁移
- ✅ **向后兼容** - 支持旧数据结构自动升级
- ✅ **备份恢复** - 自动备份 + 手动导出/导入
- ✅ **跨设备同步** - 通过导出/导入实现数据同步

---

## 🔄 自动迁移

### 首次启动时

当你首次启动 v1.2.0 时，系统会：

1. **检测旧数据** - 自动发现 v1.0/v1.1 的数据结构
2. **创建备份** - 自动备份旧数据到 `memo_app_backup_v1_时间戳`
3. **执行迁移** - 将数据升级到 v2 结构
4. **加密保护** - 如果启用了加密，会加密备忘录内容

**整个过程无需手动操作！**

---

## 📊 数据结构版本

| 版本 | 应用版本 | 特点 | 状态 |
|------|---------|------|------|
| v1 | 1.0.0 - 1.0.x | 明文存储 | ⚠️ 已弃用 |
| v2 | 1.1.0+ | bcrypt + AES 加密 | ✅ 当前版本 |
| v2 | 1.2.0+ | 统一存储 + 自动迁移 | ✅ 推荐 |

---

## 📤 导出数据

### 为什么需要导出？

- 📱 **跨设备同步** - 在新设备上导入数据
- 💾 **备份** - 定期备份防止数据丢失
- 🔄 **版本升级** - 升级前备份旧数据

### 如何导出？

**方法 1：使用数据管理界面**

1. 点击右上角菜单 → 数据管理
2. 点击 "📤 导出数据"
3. 保存 JSON 文件到安全位置

**方法 2：浏览器控制台**

```javascript
// 在控制台运行
const data = localStorage.getItem('memo_app_data');
const blob = new Blob([data], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `memo-backup-${Date.now()}.json`;
a.click();
```

### 导出文件内容

```json
{
  "version": 2,
  "exportedAt": 1709020800000,
  "data": "...",
  "encrypted": true
}
```

---

## 📥 导入数据

### 何时需要导入？

- 📱 新设备首次使用
- 🔄 恢复备份
- 💻 从其他设备同步

### 如何导入？

**方法 1：使用数据管理界面**

1. 点击右上角菜单 → 数据管理
2. 点击 "📥 导入数据"
3. 选择之前导出的 JSON 文件
4. 确认后页面刷新

**方法 2：浏览器控制台**

```javascript
// 在控制台运行
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.json';
fileInput.onchange = async (e) => {
  const file = e.target.files[0];
  const text = await file.text();
  // 导入逻辑
  localStorage.setItem('memo_app_data', text);
  location.reload();
};
fileInput.click();
```

### ⚠️ 导入注意事项

1. **会覆盖当前数据** - 导入前请先导出当前数据备份
2. **版本兼容** - 只支持兼容版本的数据
3. **加密设置** - 导入后会恢复原来的加密设置

---

## 💾 备份管理

### 自动备份

系统在以下情况会自动创建备份：

- ✅ 数据结构升级时
- ✅ 导入新数据前
- ✅ 启用/禁用加密时

### 查看备份

**数据管理界面：**

1. 点击 "数据管理"
2. 点击 "💾 备份管理"
3. 查看历史备份列表

**浏览器控制台：**

```javascript
// 列出所有备份
const backups = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.startsWith('memo_app_backup_')) {
    backups.push(key);
  }
}
console.table(backups);
```

### 恢复备份

1. 打开数据管理界面
2. 点击 "备份管理"
3. 找到要恢复的备份
4. 点击 "⏮️ 恢复"
5. 确认后页面刷新

---

## 🔧 故障排查

### 问题 1：迁移失败

**症状：** 启动后提示 "数据迁移失败"

**解决方案：**

```javascript
// 1. 检查是否有备份
const backups = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.startsWith('memo_app_backup_')) {
    backups.push(key);
  }
}

// 2. 如果有备份，手动恢复
if (backups.length > 0) {
  const latestBackup = backups.sort().pop();
  const backupData = localStorage.getItem(latestBackup);
  localStorage.setItem('memo_app_data', backupData);
  location.reload();
}
```

### 问题 2：数据丢失

**症状：** 升级后看不到之前的备忘录

**解决方案：**

1. 检查浏览器是否相同（LocalStorage 是浏览器隔离的）
2. 检查是否清除了浏览器数据
3. 尝试恢复自动备份
4. 联系技术支持

### 问题 3：导入失败

**症状：** 提示 "无效的导入数据格式"

**解决方案：**

1. 确认导出文件完整
2. 确认文件未被修改
3. 检查版本兼容性
4. 尝试使用备份恢复

---

## 📊 数据迁移流程

```
应用启动
   ↓
检测 LocalStorage
   ↓
发现旧数据 (v1)?
   ├─ 是 → 创建备份
   │       ↓
   │     执行迁移
   │       ↓
   │     验证数据
   │       ↓
   │     保存 v2
   │
   └─ 否 → 检查版本
           ↓
       需要升级？
           ├─ 是 → 迁移
           └─ 否 → 使用
```

---

## 🛡️ 最佳实践

### 1. 定期导出备份

**建议频率：**
- 📅 每周一次（重度用户）
- 📅 每月一次（普通用户）
- 📅 升级前必须备份

### 2. 多地存储备份

- 💻 电脑本地
- ☁️ 云盘（Google Drive、Dropbox）
- 📱 手机备份

### 3. 启用加密

如果备忘录包含敏感信息：

1. 打开数据管理
2. 点击 "🔒 启用加密"
3. 导出加密备份（需要密码保护）

### 4. 跨设备同步流程

```
设备 A                          设备 B
   ↓                             ↓
导出数据                        导入数据
   ↓                             ↓
保存 JSON 文件  ────────────→  选择文件
                              ↓
                            完成同步
```

---

## 📞 技术支持

如遇到数据相关问题：

1. **不要清除浏览器数据** - 这可能删除备份
2. **记录错误信息** - 截图或复制错误文本
3. **联系支持** - 提供以下信息：
   - 应用版本
   - 浏览器版本
   - 错误信息
   - 最近的操作

---

## 📝 更新日志

### v1.2.0 (2026-02-26)
- ✅ 添加数据结构版本管理
- ✅ 实现自动迁移系统
- ✅ 添加导出/导入功能
- ✅ 添加备份管理
- ✅ 向后兼容 v1.0+

### v1.1.0 (2026-02-24)
- ✅ 添加 bcrypt 密码哈希
- ✅ 添加 AES 备忘录加密

### v1.0.0 (2026-02-24)
- ✅ 初始版本

---

**最后更新：** 2026-02-26  
**文档版本：** 1.0.0
