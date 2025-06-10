# 🔗 DBeaver 连接 Cursor SQLite 数据库指南

## 📥 安装 DBeaver

### 方法 1: 使用 Homebrew（推荐）
```bash
# 安装 DBeaver Community Edition（免费）
brew install --cask dbeaver-community

# 或者安装 DBeaver Enterprise Edition（付费）
brew install --cask dbeaver-enterprise
```

### 方法 2: 官网下载
访问 [DBeaver 官网](https://dbeaver.io/download/) 下载适合 macOS 的版本。

## 🔧 配置 DBeaver 连接

### 步骤 1: 创建新连接

1. **启动 DBeaver**
2. **点击 "新建连接"** 按钮（或使用快捷键 `Cmd + Shift + N`）
3. **选择数据库类型**: 在连接向导中选择 **SQLite**

### 步骤 2: 基本配置

在 SQLite 连接配置界面，填入以下信息：

#### **连接设置**
- **Connection Name**: `Cursor Chat Database`
- **Database Path**: 点击 **Browse** 按钮，导航到：
  ```
  /Users/jay/Library/Application Support/Cursor/User/workspaceStorage/e76c6a8343ed4d7d7b8f77651bad3214/state.vscdb
  ```

#### **高级设置**
- **Connection Type**: `File`
- **Open Mode**: `Read Only` （推荐，避免意外修改）

### 步骤 3: 详细配置截图指南

#### **3.1 选择 SQLite 数据库类型**
```
┌─ New Connection ─────────────────────────────────────┐
│                                                     │
│  🔍 Search: [SQLite              ]                 │
│                                                     │
│  📁 Generic                                         │
│  📁 Analytical                                      │
│  📁 BigData                                         │
│  📁 Cloud                                           │
│  📁 Document                                        │
│  📁 Embedded                                        │
│    ► 📊 SQLite ← 选择这个                            │
│  📁 NoSQL                                           │
│                                                     │
│                            [Next >]     [Cancel]   │
└─────────────────────────────────────────────────────┘
```

#### **3.2 SQLite 连接配置**
```
┌─ SQLite Connection Settings ─────────────────────────┐
│                                                     │
│  Connection name: [Cursor Chat Database]           │
│                                                     │
│  📁 Database:                                       │
│    Path: [Browse...] → 选择数据库文件                │
│    /Users/jay/Library/Application Support/Cursor/  │
│    User/workspaceStorage/e76c6a8343ed4d7d7b8f776... │
│                                                     │
│  ⚙️ Settings:                                       │
│    ☑️ Read-only connection                          │
│    ☐ Show system objects                            │
│    ☐ Show utility objects                           │
│                                                     │
│  [Test Connection]  [Finish]          [Cancel]     │
└─────────────────────────────────────────────────────┘
```

### 步骤 4: 测试连接

1. **点击 "Test Connection"** 按钮
2. **如果成功**，会显示：`Connected (SQLite 3.x.x)`
3. **点击 "Finish"** 完成配置

## 📊 使用 DBeaver 查看 Cursor 数据

### 连接成功后的界面

#### **数据库结构视图**
```
📂 Cursor Chat Database
  └── 📂 Databases
      └── 📂 main
          └── 📂 Tables
              └── 📋 ItemTable
                  ├── 🔑 key (TEXT)
                  └── 📄 value (TEXT)
```

#### **重要表和数据**

1. **ItemTable**: 主要的键值存储表
   - `key`: 存储键名（如 aiService.prompts）
   - `value`: 存储 JSON 格式的值

### 常用查询操作

#### **查看所有聊天相关键**
```sql
SELECT key, length(value) as size 
FROM ItemTable 
WHERE key LIKE '%chat%' 
   OR key LIKE '%prompt%' 
   OR key LIKE '%ai%'
ORDER BY size DESC;
```

#### **查看提示词数据**
```sql
SELECT value 
FROM ItemTable 
WHERE key = 'aiService.prompts';
```

#### **查看AI生成内容**
```sql
SELECT value 
FROM ItemTable 
WHERE key = 'aiService.generations';
```

#### **搜索特定内容**
```sql
SELECT key, substr(value, 1, 100) as preview
FROM ItemTable 
WHERE value LIKE '%cursor-chat-memory%'
   OR value LIKE '%自动保存%';
```

## 🎨 DBeaver 使用技巧

### 1. **结果查看优化**
- **JSON 格式化**: 右键点击 JSON 数据 → `View/Edit` → 选择 JSON 格式
- **文本搜索**: 使用 `Ctrl + F` 在结果中搜索
- **导出数据**: 右键结果集 → `Export Data`

### 2. **查询历史**
- **保存查询**: `Ctrl + S` 保存常用查询
- **查询历史**: 查看之前执行的 SQL 语句

### 3. **数据可视化**
```sql
-- 查看数据大小分布
SELECT 
    CASE 
        WHEN length(value) < 1000 THEN 'Small (< 1KB)'
        WHEN length(value) < 10000 THEN 'Medium (1-10KB)'
        ELSE 'Large (> 10KB)'
    END as size_category,
    COUNT(*) as count
FROM ItemTable
GROUP BY size_category;
```

## 🔒 安全配置

### 只读连接设置
```
Connection Settings → Advanced → 
☑️ Read-only connection
```

### 备份提醒
在 DBeaver 中添加连接描述：
```
Description: 
⚠️ Cursor Chat Database - READ ONLY
请在 Cursor 关闭时访问
备份路径: ./backups/cursor-db-backup-[timestamp].db
```

## 🚨 故障排除

### 连接失败的常见原因

#### 1. **文件路径错误**
```bash
# 验证文件存在
ls -la "/Users/jay/Library/Application Support/Cursor/User/workspaceStorage/e76c6a8343ed4d7d7b8f77651bad3214/state.vscdb"
```

#### 2. **权限问题**
```bash
# 检查文件权限
stat -f "%A %N" "/Users/jay/Library/Application Support/Cursor/User/workspaceStorage/e76c6a8343ed4d7d7b8f77651bad3214/state.vscdb"
```

#### 3. **数据库锁定**
```bash
# 确保 Cursor 已关闭
ps aux | grep -i cursor
```

#### 4. **SQLite 驱动问题**
- DBeaver 通常自带 SQLite 驱动
- 如果有问题，可以在 DBeaver 中更新驱动：
  `Database → Driver Manager → SQLite → Update/Reset`

## 📱 DBeaver 快捷键

| 功能 | 快捷键 |
|------|--------|
| 新建连接 | `Cmd + Shift + N` |
| 执行查询 | `Cmd + Enter` |
| 格式化 SQL | `Cmd + Shift + F` |
| 查找替换 | `Cmd + F` |
| 导出数据 | `Cmd + Shift + E` |

## 📋 预设查询模板

创建一个查询书签文件夹 "Cursor Analysis"，包含以下查询：

### **1. 数据概览**
```sql
-- 数据库概览
SELECT 
    COUNT(*) as total_entries,
    COUNT(CASE WHEN key LIKE '%chat%' THEN 1 END) as chat_entries,
    COUNT(CASE WHEN key LIKE '%prompt%' THEN 1 END) as prompt_entries,
    SUM(length(value)) as total_size_bytes
FROM ItemTable;
```

### **2. 大文件分析**
```sql
-- 查找大数据条目
SELECT 
    key,
    length(value) as size_bytes,
    ROUND(length(value) / 1024.0, 2) as size_kb
FROM ItemTable
WHERE length(value) > 1000
ORDER BY size_bytes DESC;
```

### **3. 聊天数据统计**
```sql
-- 聊天相关数据统计
SELECT 
    key,
    length(value) as size,
    CASE 
        WHEN key LIKE '%prompt%' THEN '提示词'
        WHEN key LIKE '%generation%' THEN 'AI回复'
        WHEN key LIKE '%chat%' THEN '聊天设置'
        ELSE '其他'
    END as category
FROM ItemTable
WHERE key LIKE '%chat%' OR key LIKE '%prompt%' OR key LIKE '%ai%'
ORDER BY category, size DESC;
```

---

**💡 提示**: 使用只读模式连接，这样可以安全地探索数据库而不会意外修改 Cursor 的数据！ 