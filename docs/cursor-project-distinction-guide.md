# 🏗️ Cursor 项目和会话区分指南

## 📋 核心概念

Cursor 使用多层次的标识符来组织和区分不同的项目、工作区和聊天会话：

### 1. **工作区级别（Workspace Level）**
- **标识符**: 32位hash值（如：`e76c6a8343ed4d7d7b8f77651bad3214`）
- **位置**: 数据库路径中的工作区ID
- **作用**: 每个项目/工作区都有独立的SQLite数据库

### 2. **会话级别（Session Level）**  
- **标识符**: UUID格式（如：`a079be78-466e-4b3f-98f2-faf7aad71266`）
- **位置**: 键名中的UUID部分
- **作用**: 区分同一工作区内的不同聊天会话

### 3. **数据类型级别（Data Type Level）**
- **标识符**: 键名前缀（如：`aiService.*`, `workbench.*`）
- **作用**: 区分全局数据和会话特定数据

## 🔍 识别方法详解

### **工作区识别**

#### 数据库路径结构
```
/Users/jay/Library/Application Support/Cursor/User/workspaceStorage/
├── e76c6a8343ed4d7d7b8f77651bad3214/          ← 工作区A (cursor-chat-memory项目)
│   └── state.vscdb
├── a3bfb99b661b02d992886350c5d23863/          ← 工作区B (其他项目)
│   └── state.vscdb
└── 656f15942a5b723876261f96db13d485/          ← 工作区C (另一个项目)
    └── state.vscdb
```

#### 工作区相关查询
```sql
-- 查看当前工作区的所有项目相关数据
SELECT key, length(value) as size, substr(value, 1, 100) as preview
FROM ItemTable 
WHERE value LIKE '%cursor-chat-memory%'
   OR value LIKE '%github.com%'
ORDER BY size DESC;
```

### **会话识别**

#### 当前发现的会话
从你的数据库中识别出：

1. **🟢 Session-A**: `a079be78-466e-4b3f-98f2-faf7aad71266`
   - 数据条目: 2个
   - 总大小: 1,097字节
   - 活跃度: 高 (更多数据)

2. **🔵 Session-B**: `f41bf6be-620a-47b0-8d83-0878ed2da9df`
   - 数据条目: 1个  
   - 总大小: 105字节
   - 活跃度: 低 (较少数据)

#### 会话相关查询
```sql
-- 查看特定会话的所有数据
SELECT key, length(value) as size, substr(value, 1, 200) as preview
FROM ItemTable 
WHERE key LIKE '%a079be78-466e-4b3f-98f2-faf7aad71266%'
ORDER BY size DESC;

-- 比较不同会话的活跃度
SELECT 
    CASE 
        WHEN key LIKE '%a079be78%' THEN 'Session-A (活跃)'
        WHEN key LIKE '%f41bf6be%' THEN 'Session-B (不活跃)'
        ELSE 'Other'
    END as session,
    COUNT(*) as count,
    SUM(length(value)) as total_bytes
FROM ItemTable 
WHERE key LIKE '%.%-%-%-%'
GROUP BY session;
```

### **数据类型识别**

#### 数据分类体系
```sql
-- 数据类型完整分类
SELECT 
    CASE 
        WHEN key LIKE 'aiService.%' THEN '🌍 全局AI服务数据'
        WHEN key LIKE 'workbench.panel.composer%' THEN '💬 聊天会话数据'
        WHEN key LIKE 'workbench.panel.aichat%' THEN '🤖 AI聊天面板'
        WHEN key LIKE 'workbench.%' THEN '🔧 工作台设置'
        WHEN key LIKE 'chat.%' THEN '💬 聊天配置'
        WHEN key LIKE 'memento%' THEN '💾 编辑器状态'
        WHEN key LIKE 'history%' THEN '📚 历史记录'
        ELSE '❓ 其他类型'
    END as data_type,
    COUNT(*) as count,
    ROUND(SUM(length(value)) / 1024.0, 2) as total_kb
FROM ItemTable
GROUP BY data_type
ORDER BY total_kb DESC;
```

#### 主要数据类型说明

| 数据类型 | 键名模式 | 范围 | 说明 |
|---------|---------|------|------|
| 🌍 全局AI服务 | `aiService.*` | 跨会话 | 所有聊天会话共享的AI数据 |
| 💬 聊天会话 | `workbench.panel.composer*` | 会话特定 | 特定聊天会话的界面状态 |
| 🤖 AI面板 | `workbench.panel.aichat*` | 会话特定 | AI聊天面板的显示设置 |
| 🔧 工作台 | `workbench.*` | 工作区 | 编辑器和面板的布局设置 |
| 💾 编辑器状态 | `memento*` | 工作区 | 文件编辑历史和状态 |
| 📚 历史记录 | `history*` | 工作区 | 文件和操作历史 |

## 🎯 实际区分策略

### **按项目区分**

#### 1. 通过内容搜索
```sql
-- 搜索特定项目的相关内容
SELECT 
    key,
    CASE 
        WHEN value LIKE '%cursor-chat-memory%' THEN '✅ cursor-chat-memory项目'
        WHEN value LIKE '%github.com/jayshen1031%' THEN '✅ 你的GitHub项目'
        WHEN value LIKE '%提示词中心%' THEN '✅ 功能模块相关'
        ELSE '❓ 其他项目'
    END as project_match,
    length(value) as size,
    substr(value, 1, 100) as preview
FROM ItemTable 
WHERE value LIKE '%cursor-chat-memory%'
   OR value LIKE '%github.com/jayshen1031%'
   OR value LIKE '%提示词中心%'
ORDER BY size DESC;
```

#### 2. 通过文件路径识别
```sql
-- 通过文件路径识别项目
SELECT key, length(value) as size, substr(value, 1, 150) as preview
FROM ItemTable 
WHERE value LIKE '%/Users/jay/Documents/baidu/projects/cursor-chat-memory%'
ORDER BY size DESC;
```

### **按会话区分**

#### 查看活跃会话
```sql
-- 识别最活跃的聊天会话
SELECT 
    CASE 
        WHEN key LIKE '%a079be78%' THEN '🟢 Session-A (主要会话)'
        WHEN key LIKE '%f41bf6be%' THEN '🔵 Session-B (次要会话)'
        ELSE '⚪ Other'
    END as session,
    key,
    length(value) as data_size,
    CASE 
        WHEN length(value) > 1000 THEN '🔥 高活跃'
        WHEN length(value) > 100 THEN '📊 中等活跃'
        ELSE '💤 低活跃'
    END as activity_level
FROM ItemTable 
WHERE key LIKE '%.%-%-%-%'
ORDER BY data_size DESC;
```

### **按时间区分**

#### 基于数据大小推断时间线
```sql
-- 推断会话的时间顺序 (数据大小通常反映活跃程度)
SELECT 
    key,
    length(value) as size,
    CASE 
        WHEN length(value) > 1000 THEN '🕐 最近活跃'
        WHEN length(value) > 100 THEN '🕑 较早活跃'
        ELSE '🕒 早期或不活跃'
    END as timeline_estimate
FROM ItemTable 
WHERE key LIKE '%composer%' OR key LIKE '%aichat%'
ORDER BY size DESC;
```

## 🛠️ 实用查询模板

### **完整项目概览**
```sql
-- 当前工作区的完整项目概览
SELECT 
    '📊 数据概览' as section,
    COUNT(*) as total_entries,
    ROUND(SUM(length(value)) / 1024.0, 2) as total_kb
FROM ItemTable

UNION ALL

SELECT 
    '🌍 全局AI数据',
    COUNT(*),
    ROUND(SUM(length(value)) / 1024.0, 2)
FROM ItemTable WHERE key LIKE 'aiService.%'

UNION ALL

SELECT 
    '💬 会话数据',
    COUNT(*),
    ROUND(SUM(length(value)) / 1024.0, 2)
FROM ItemTable WHERE key LIKE '%composer%'

UNION ALL

SELECT 
    '🎯 项目相关',
    COUNT(*),
    ROUND(SUM(length(value)) / 1024.0, 2)
FROM ItemTable WHERE value LIKE '%cursor-chat-memory%';
```

### **会话对比分析**
```sql
-- 对比不同会话的详细信息
SELECT 
    'Session-A (a079be78)' as session,
    COUNT(*) as entries,
    SUM(length(value)) as total_bytes,
    MAX(length(value)) as max_size,
    ROUND(AVG(length(value)), 2) as avg_size
FROM ItemTable 
WHERE key LIKE '%a079be78%'

UNION ALL

SELECT 
    'Session-B (f41bf6be)',
    COUNT(*),
    SUM(length(value)),
    MAX(length(value)),
    ROUND(AVG(length(value)), 2)
FROM ItemTable 
WHERE key LIKE '%f41bf6be%';
```

## 📱 使用工具

### **专用分析脚本**
```bash
# 分析工作区和会话
./scripts/analyze-cursor-projects.sh sessions

# 查看项目信息提取
./scripts/analyze-cursor-projects.sh projects

# 完整分析报告
./scripts/analyze-cursor-projects.sh all
```

### **在DBeaver中使用**
1. 创建书签文件夹："Project Analysis"
2. 保存上述查询为书签
3. 定期运行分析，了解项目和会话变化

## 🎯 最佳实践

### **项目识别优先级**
1. **内容搜索** - 最可靠的方法
2. **文件路径** - 准确度高
3. **会话UUID** - 区分不同对话
4. **数据大小** - 推断活跃度

### **区分建议**
- 使用 **工作区ID** 区分不同项目
- 使用 **会话UUID** 区分同项目内的不同对话
- 使用 **内容关键词** 确认项目相关性
- 使用 **数据大小** 判断会话活跃程度

---

**💡 关键结论**: 你的数据库包含 cursor-chat-memory 项目的聊天记录，主要活跃会话是 Session-A (a079be78)，这很可能就是我们当前正在进行的对话所在的会话！ 