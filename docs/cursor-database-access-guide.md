# 🗃️ Cursor SQLite 数据库访问指南

## 📍 数据库位置

Cursor 的聊天数据主要存储在 SQLite 数据库文件中：

```
/Users/jay/Library/Application Support/Cursor/User/workspaceStorage/[workspaceId]/state.vscdb
```

**当前项目的数据库路径**：
```
/Users/jay/Library/Application Support/Cursor/User/workspaceStorage/e76c6a8343ed4d7d7b8f77651bad3214/state.vscdb
```

## 🔍 访问方法

### 1. 使用我们的专用工具（推荐）

我们已经创建了专门的 SQLite 数据库探索工具：

```bash
# 显示数据库基本信息
./scripts/cursor-db-explorer.sh info

# 查看聊天相关数据
./scripts/cursor-db-explorer.sh chat

# 查看所有表结构
./scripts/cursor-db-explorer.sh tables

# 导出聊天数据
./scripts/cursor-db-explorer.sh export

# 进入交互式查询模式
./scripts/cursor-db-explorer.sh query

# 备份数据库
./scripts/cursor-db-explorer.sh backup

# 查看所有功能
./scripts/cursor-db-explorer.sh all
```

### 2. 直接使用 SQLite 命令行

```bash
# 进入数据库命令行
sqlite3 "/Users/jay/Library/Application Support/Cursor/User/workspaceStorage/e76c6a8343ed4d7d7b8f77651bad3214/state.vscdb"

# 常用查询命令
.schema                    # 查看表结构
.tables                    # 列出所有表
SELECT * FROM ItemTable LIMIT 10;  # 查看前10条记录
```

### 3. 使用图形界面工具

#### **DB Browser for SQLite** (免费)
```bash
# 安装
brew install --cask db-browser-for-sqlite

# 使用
open -a "DB Browser for SQLite" "/Users/jay/Library/Application Support/Cursor/User/workspaceStorage/e76c6a8343ed4d7d7b8f77651bad3214/state.vscdb"
```

#### **TablePlus** (付费)
```bash
# 安装
brew install --cask tableplus

# 使用
open -a "TablePlus" "/Users/jay/Library/Application Support/Cursor/User/workspaceStorage/e76c6a8343ed4d7d7b8f77651bad3214/state.vscdb"
```

### 4. 在代码中访问

#### **Node.js 示例**：
```javascript
const sqlite3 = require('sqlite3').verbose();
const dbPath = '/Users/jay/Library/Application Support/Cursor/User/workspaceStorage/e76c6a8343ed4d7d7b8f77651bad3214/state.vscdb';

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('数据库打开失败:', err.message);
    return;
  }
  console.log('数据库连接成功');
});

// 查询聊天数据
db.all("SELECT key, length(value) as size FROM ItemTable WHERE key LIKE '%chat%' OR key LIKE '%prompt%'", 
  (err, rows) => {
    if (err) {
      console.error(err.message);
      return;
    }
    console.log('聊天相关数据:', rows);
});

db.close();
```

#### **Python 示例**：
```python
import sqlite3
import json

db_path = '/Users/jay/Library/Application Support/Cursor/User/workspaceStorage/e76c6a8343ed4d7d7b8f77651bad3214/state.vscdb'

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 查询聊天数据
    cursor.execute("SELECT key, value FROM ItemTable WHERE key = 'aiService.prompts'")
    result = cursor.fetchone()
    
    if result:
        prompts_data = json.loads(result[1])
        print(f"发现 {len(prompts_data)} 个提示词记录")
    
    conn.close()
    
except sqlite3.Error as e:
    print(f"数据库错误: {e}")
```

## 📊 数据库结构

### 主要表

- **ItemTable**: 主要的键值存储表
  - `key`: 键名
  - `value`: JSON 格式的值

### 重要的键值

| 键名 | 描述 | 大小 |
|------|------|------|
| `aiService.prompts` | 用户提示词历史 | ~12KB |
| `aiService.generations` | AI 生成的回复 | ~14KB |
| `chat.editing.autosaveDisabled` | 自动保存设置 | 2B |
| `workbench.panel.composerChatViewPane.*` | 聊天面板状态 | ~1KB |

## 🔒 安全注意事项

1. **只读访问**: 建议使用只读模式打开数据库，避免意外修改
2. **备份保护**: 在访问前先备份数据库文件
3. **权限检查**: 确保有足够权限访问 Application Support 目录
4. **Cursor 运行状态**: 最好在 Cursor 关闭时访问数据库，避免文件锁定

## 🛠️ 常用查询

### 查看所有键名
```sql
SELECT key FROM ItemTable ORDER BY key;
```

### 查找聊天相关数据
```sql
SELECT key, length(value) as size 
FROM ItemTable 
WHERE key LIKE '%chat%' OR key LIKE '%prompt%' OR key LIKE '%ai%'
ORDER BY size DESC;
```

### 导出提示词数据
```sql
SELECT value FROM ItemTable WHERE key = 'aiService.prompts';
```

### 查看最近修改的数据
```sql
SELECT key, length(value) as size
FROM ItemTable 
WHERE key LIKE '%chat%'
ORDER BY rowid DESC
LIMIT 10;
```

## 📂 数据导出

使用我们的导出工具：
```bash
./scripts/cursor-db-explorer.sh export
```

导出的文件将保存在 `./exports/cursor-db-[timestamp]/` 目录中：
- `prompts.json`: 提示词历史
- `generations.json`: AI 生成内容
- `chat_summary.csv`: 聊天数据概览

## 🚨 故障排除

### 数据库锁定
```bash
# 检查 Cursor 进程
ps aux | grep -i cursor

# 确保 Cursor 完全关闭后再访问数据库
```

### 权限问题
```bash
# 检查文件权限
ls -la "/Users/jay/Library/Application Support/Cursor/User/workspaceStorage/e76c6a8343ed4d7d7b8f77651bad3214/"

# 文件应该是 rw-r--r-- (644)
```

### 数据库损坏
```bash
# 检查数据库完整性
sqlite3 "/path/to/state.vscdb" "PRAGMA integrity_check;"
```

## 📈 数据监控

创建监控脚本，实时查看数据库变化：
```bash
# 监控文件变化
fswatch -o "/Users/jay/Library/Application Support/Cursor/User/workspaceStorage/e76c6a8343ed4d7d7b8f77651bad3214/state.vscdb" | while read num; do
    echo "$(date): 数据库已更新"
    ./scripts/cursor-db-explorer.sh chat
done
```

---

**💡 提示**: 使用我们提供的 `cursor-db-explorer.sh` 脚本是访问数据库最安全和便捷的方式！ 