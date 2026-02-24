# 🚀 Vercel 部署指南

## 📋 部署步骤

### 方法 1：GitHub + Vercel（推荐）

#### 步骤 1：创建 GitHub 仓库

1. 访问 https://github.com
2. 登录你的 GitHub 账号
3. 点击右上角 **"+"** → **"New repository"**
4. 填写信息：
   - **Repository name:** `memo-app`
   - **Description:** 备忘录应用
   - **Public** 或 **Private**（推荐 Private）
   - 点击 **"Create repository"**

#### 步骤 2：推送代码到 GitHub

```bash
# 进入项目目录
cd ~/.openclaw/workspace/agents/dev-team/projects/memo-system

# 初始化 Git（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit - Memo App with Auth"

# 关联远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/memo-app.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

#### 步骤 3：在 Vercel 部署

1. 访问 https://vercel.com
2. 点击 **"Sign Up"** 或 **"Login"**
3. 选择 **"Continue with GitHub"**
4. 点击 **"Add New Project"**
5. 选择 **"Import Git Repository"**
6. 找到并选择 `memo-app` 仓库
7. 点击 **"Import"**
8. 保持默认配置，点击 **"Deploy"**
9. 等待部署完成（约 1-2 分钟）

#### 步骤 4：获取访问地址

部署完成后，你会看到：
- ✅ **Production URL:** `https://memo-app-xxx.vercel.app`
- ✅ **Preview URL:** `https://memo-app-git-main-xxx.vercel.app`

**点击链接即可访问！**

---

### 方法 2：Vercel CLI（更快）

#### 步骤 1：安装 Vercel CLI

```bash
npm install -g vercel
```

#### 步骤 2：登录 Vercel

```bash
vercel login
```

选择 **"Continue with GitHub"**

#### 步骤 3：部署

```bash
# 进入项目目录
cd ~/.openclaw/workspace/agents/dev-team/projects/memo-system

# 部署到生产环境
vercel --prod
```

按提示操作：
- **Set up and deploy?** → `Y`
- **Which scope?** → 选择你的账号
- **Link to existing project?** → `N`
- **What's your project's name?** → `memo-app`
- **In which directory is your code located?** → `./`
- **Want to override the settings?** → `N`

等待部署完成！

---

## 🔗 访问你的应用

部署成功后，你会得到类似这样的地址：

```
https://memo-app-abc123.vercel.app
```

**在任何设备的浏览器访问这个地址即可使用！**

---

## 📱 使用方法

### 第一次使用

1. 访问你的 Vercel 地址
2. 点击 **"立即注册"**
3. 输入用户名和密码
4. 点击 **"注册"**
5. 开始使用备忘录！

### 后续使用

1. 访问 Vercel 地址
2. 输入用户名和密码
3. 点击 **"登录"**
4. 你的备忘录都在！

---

## ⚠️ 重要提示

### 数据存储

- ✅ 数据存储在浏览器 LocalStorage
- ✅ 同一浏览器数据持久化
- ❌ 换设备/浏览器数据不共享
- ❌ 清除浏览器数据会丢失备忘录

### 建议

1. **固定使用同一浏览器**
2. **不要清除浏览器数据**
3. **重要内容额外备份**

---

## 🎨 自定义域名（可选）

### 在 Vercel 设置

1. 访问 Vercel Dashboard
2. 选择你的项目
3. 点击 **"Settings"** → **"Domains"**
4. 添加你的域名
5. 按提示配置 DNS

---

## 🔄 自动更新

**代码更新后自动部署！**

```bash
# 修改代码后
git add .
git commit -m "更新内容"
git push

# Vercel 会自动部署新版本
```

---

## 📊 查看部署状态

访问 Vercel Dashboard → 选择项目 → 查看：
- ✅ 部署历史
- ✅ 访问统计
- ✅ 错误日志

---

## 🆘 遇到问题？

### 部署失败

查看 Vercel 的部署日志，常见错误：
- ❌ 构建失败 → 检查 `package.json`
- ❌ 路由错误 → 检查 `vercel.json`

### 访问空白

- 清除浏览器缓存
- 检查浏览器控制台（F12）

---

**祝你部署成功！** 🎉

有任何问题随时问我！🦞
