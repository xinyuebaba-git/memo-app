# 🔐 安全文档

本文档说明备忘录系统的安全措施和加密实现。

---

## ✅ 已实现的安全措施

### 1. 密码哈希存储（bcrypt）

**实现位置：** `src/composables/useAuth.ts` + `src/utils/crypto.ts`

**技术细节：**
- 使用 `bcryptjs` 库进行密码哈希
- 盐值 rounds: 10
- 密码验证使用 bcrypt.compare()

**代码示例：**
```typescript
import { hashPassword, verifyPassword } from '../utils/crypto';

// 注册时哈希密码
const hashedPassword = await hashPassword(registerData.password);

// 登录时验证密码
const isValid = await verifyPassword(credentials.password, user.password);
```

**安全优势：**
- ✅ 不可逆：无法从哈希值还原原始密码
- ✅ 抗彩虹表：每个密码都有唯一盐值
- ✅ 计算成本高：防止暴力破解

---

### 2. 备忘录内容加密（AES）

**实现位置：** `src/composables/useMemos.ts` + `src/utils/crypto.ts`

**技术细节：**
- 使用 `crypto-js` 库进行 AES 加密
- 加密模式：AES
- 可选启用/禁用加密功能

**API：**
```typescript
import { enableEncryption, disableEncryption, getEncryptionStatus } from './composables/useMemos';

// 启用加密
enableEncryption();

// 检查加密状态
const isEnabled = getEncryptionStatus();

// 禁用加密
disableEncryption();
```

**安全优势：**
- ✅ 数据加密存储：LocalStorage 中存储的是密文
- ✅ 防止窥探：即使访问浏览器开发者工具也无法查看原始内容
- ✅ 灵活控制：用户可选择是否启用加密

---

### 3. 加密工具模块

**文件：** `src/utils/crypto.ts`

**提供的功能：**

| 函数 | 用途 |
|------|------|
| `hashPassword(password)` | 密码哈希（bcrypt） |
| `verifyPassword(password, hash)` | 验证密码 |
| `encryptData(data, key?)` | AES 加密数据 |
| `decryptData(encryptedData, key?)` | AES 解密数据 |
| `deriveKeyFromPassword(password)` | 从密码派生密钥 |

---

## ⚠️ 当前限制

### 前端加密的固有限制

1. **密钥存储**
   - 当前加密密钥硬编码在代码中
   - 生产环境应使用环境变量
   - 最佳实践：从用户密码派生密钥

2. **LocalStorage 安全**
   - 加密后存储，但仍可能被 XSS 攻击利用
   - 建议：实施内容安全策略（CSP）

3. **无后端验证**
   - 当前为纯前端应用
   - 无服务器端身份验证
   - 建议：添加后端服务进行真正的安全认证

---

## 🚀 建议的安全增强

### 短期改进

1. **环境变量**
   ```bash
   # .env
   VITE_ENCRYPTION_KEY=your-secret-key-here
   ```

2. **内容安全策略（CSP）**
   ```html
   <meta http-equiv="Content-Security-Policy" 
         content="default-src 'self'; script-src 'self'">
   ```

3. **密码强度验证**
   - 最小长度 8 字符
   - 包含大小写字母、数字、特殊字符

### 长期改进

1. **后端服务**
   - 真正的用户认证（JWT）
   - 服务器端加密存储
   - HTTPS 强制

2. **端到端加密**
   - 密钥从用户密码派生
   - 服务器无法解密用户数据
   - 类似 Signal/WhatsApp 模式

3. **双因素认证（2FA）**
   - TOTP 支持
   - 短信验证

---

## 📊 安全对比

| 项目 | 之前 | 现在 |
|------|------|------|
| 密码存储 | Base64 编码（❌ 可逆） | bcrypt 哈希（✅ 不可逆） |
| 备忘录存储 | 明文（❌ 无保护） | AES 加密（✅ 密文） |
| 密码验证 | 字符串比较 | bcrypt.compare() |
| 密钥管理 | 无 | 支持自定义密钥 |

---

## 🔍 如何验证加密效果

### 验证密码哈希

1. 打开浏览器开发者工具
2. 进入 Application → Local Storage
3. 查看 `memo_app_users`
4. 密码字段应为 bcrypt 哈希格式：`$2a$10$...`

### 验证备忘录加密

1. 启用加密：在控制台运行 `enableEncryption()`
2. 创建备忘录
3. 查看 `memo_app_memos`
4. 内容应为 AES 密文格式

---

## 📝 更新日志

### v1.1.0 (2026-02-26)
- ✅ 添加 bcrypt 密码哈希
- ✅ 添加 AES 备忘录加密
- ✅ 创建加密工具模块
- ✅ 更新安全文档

### v1.0.0 (2026-02-24)
- 初始版本
- Base64 密码编码（已弃用）
- 明文备忘录存储（已改进）

---

## 🆘 安全问题反馈

如发现安全漏洞，请通过以下方式报告：
- GitHub Issues（私有仓库）
- 直接联系开发团队

---

**最后更新：** 2026-02-26  
**版本：** 1.1.0
