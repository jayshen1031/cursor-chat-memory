# 🔍 Cursor 聊天数据 SQL 查询示例

## 📊 基础查询

### 1. 查看数据库概览
```sql
-- 统计所有数据条目
SELECT COUNT(*) as total_entries FROM ItemTable;

-- 查看数据大小分布
SELECT 
    CASE 
        WHEN length(value) < 1000 THEN 'Small (< 1KB)'
        WHEN length(value) < 10000 THEN 'Medium (1-10KB)'
        WHEN length(value) < 100000 THEN 'Large (10-100KB)'
        ELSE 'Very Large (> 100KB)'
    END as size_category,
    COUNT(*) as count,
    ROUND(AVG(length(value)), 2) as avg_size_bytes
FROM ItemTable
GROUP BY size_category
ORDER BY avg_size_bytes;
```

### 2. 查找聊天相关数据
```sql
-- 列出所有聊天相关的键
SELECT 
    key,
    length(value) as size_bytes,
    ROUND(length(value) / 1024.0, 2) as size_kb,
    CASE 
        WHEN key LIKE '%prompt%' THEN '🔤 提示词'
        WHEN key LIKE '%generation%' THEN '🤖 AI回复'
        WHEN key LIKE '%chat%' THEN '💬 聊天设置'
        WHEN key LIKE '%ai%' THEN '🧠 AI服务'
        ELSE '❓ 其他'
    END as category
FROM ItemTable 
WHERE key LIKE '%chat%' 
   OR key LIKE '%prompt%' 
   OR key LIKE '%ai%'
   OR key LIKE '%generation%'
ORDER BY size_bytes DESC;
```

## 💬 聊天内容查询

### 3. 查看提示词历史
```sql
-- 获取提示词数据 (JSON格式)
SELECT value 
FROM ItemTable 
WHERE key = 'aiService.prompts';

-- 提示词数据的基本信息
SELECT 
    key,
    length(value) as json_size,
    CASE 
        WHEN value LIKE '%cursor-chat-memory%' THEN '✅ 包含项目相关内容'
        ELSE '❌ 无项目相关内容'
    END as project_related
FROM ItemTable 
WHERE key = 'aiService.prompts';
```

### 4. 查看AI生成内容
```sql
-- 获取AI生成的回复数据
SELECT value 
FROM ItemTable 
WHERE key = 'aiService.generations';

-- AI生成内容的统计信息
SELECT 
    key,
    length(value) as content_size,
    ROUND(length(value) / 1024.0, 2) as size_kb,
    CASE 
        WHEN value LIKE '%SQLite%' THEN '🗃️ 包含数据库相关'
        WHEN value LIKE '%自动保存%' THEN '💾 包含自动保存相关'
        WHEN value LIKE '%DBeaver%' THEN '📊 包含DBeaver相关'
        ELSE '📝 其他内容'
    END as content_type
FROM ItemTable 
WHERE key = 'aiService.generations';
```

## 🔍 内容搜索查询

### 5. 搜索特定关键词
```sql
-- 搜索包含特定关键词的数据
SELECT 
    key,
    length(value) as size,
    substr(value, 1, 200) as preview,
    CASE 
        WHEN value LIKE '%cursor-chat-memory%' THEN '🎯 项目名称'
        WHEN value LIKE '%自动保存%' THEN '💾 自动保存'
        WHEN value LIKE '%SQLite%' THEN '🗃️ 数据库'
        WHEN value LIKE '%DBeaver%' THEN '📊 数据库工具'
        ELSE '🔍 其他匹配'
    END as match_type
FROM ItemTable 
WHERE value LIKE '%cursor-chat-memory%'
   OR value LIKE '%自动保存%'
   OR value LIKE '%SQLite%'
   OR value LIKE '%DBeaver%'
ORDER BY length(value) DESC;
```

### 6. 查找最近的聊天活动
```sql
-- 查看最大的数据条目 (通常是最新的聊天数据)
SELECT 
    key,
    length(value) as size_bytes,
    ROUND(length(value) / 1024.0, 2) as size_kb,
    substr(value, 1, 300) as content_preview
FROM ItemTable 
WHERE key LIKE '%prompt%' OR key LIKE '%generation%'
ORDER BY length(value) DESC
LIMIT 5;
```

## 📈 数据分析查询

### 7. 聊天数据统计分析
```sql
-- 聊天数据详细统计
SELECT 
    '📊 数据概览' as section,
    COUNT(*) as count,
    SUM(length(value)) as total_bytes,
    ROUND(SUM(length(value)) / 1024.0, 2) as total_kb,
    ROUND(AVG(length(value)), 2) as avg_bytes
FROM ItemTable
WHERE key LIKE '%chat%' OR key LIKE '%prompt%' OR key LIKE '%ai%'

UNION ALL

SELECT 
    '🔤 提示词数据' as section,
    COUNT(*) as count,
    SUM(length(value)) as total_bytes,
    ROUND(SUM(length(value)) / 1024.0, 2) as total_kb,
    ROUND(AVG(length(value)), 2) as avg_bytes
FROM ItemTable
WHERE key LIKE '%prompt%'

UNION ALL

SELECT 
    '🤖 AI回复数据' as section,
    COUNT(*) as count,
    SUM(length(value)) as total_bytes,
    ROUND(SUM(length(value)) / 1024.0, 2) as total_kb,
    ROUND(AVG(length(value)), 2) as avg_bytes
FROM ItemTable
WHERE key LIKE '%generation%';
```

### 8. 查找包含项目信息的对话
```sql
-- 查找与当前项目相关的聊天记录
SELECT 
    key,
    CASE 
        WHEN value LIKE '%cursor-chat-memory%' THEN '✅ 项目名称匹配'
        WHEN value LIKE '%提示词中心%' THEN '✅ 功能模块匹配'
        WHEN value LIKE '%实现cursor%' THEN '✅ 实现相关匹配'
        WHEN value LIKE '%会话归档%' THEN '✅ 归档功能匹配'
        ELSE '❓ 其他匹配'
    END as match_reason,
    length(value) as size,
    substr(value, 1, 150) as preview
FROM ItemTable 
WHERE (value LIKE '%cursor-chat-memory%'
    OR value LIKE '%提示词中心%'
    OR value LIKE '%会话归档%'
    OR value LIKE '%实现cursor%')
    AND length(value) > 100
ORDER BY length(value) DESC;
```

## 🎯 高级查询

### 9. JSON 数据解析（如果支持）
```sql
-- 尝试解析JSON数据的结构（某些SQLite版本支持JSON函数）
SELECT 
    key,
    length(value) as size,
    CASE 
        WHEN value LIKE '[%' THEN '📋 JSON数组'
        WHEN value LIKE '{%' THEN '📦 JSON对象'
        ELSE '📄 普通文本'
    END as data_type,
    substr(value, 1, 100) as structure_preview
FROM ItemTable 
WHERE key IN ('aiService.prompts', 'aiService.generations')
ORDER BY length(value) DESC;
```

### 10. 时间相关查询（基于内容推断）
```sql
-- 查找包含时间信息的聊天记录
SELECT 
    key,
    length(value) as size,
    CASE 
        WHEN value LIKE '%2025%' THEN '📅 2025年相关'
        WHEN value LIKE '%今天%' OR value LIKE '%今日%' THEN '📅 今天相关'
        WHEN value LIKE '%最近%' THEN '📅 最近相关'
        WHEN value LIKE '%刚才%' THEN '📅 刚才相关'
        ELSE '❓ 其他时间'
    END as time_reference,
    substr(value, 1, 200) as preview
FROM ItemTable 
WHERE value LIKE '%2025%'
    OR value LIKE '%今天%'
    OR value LIKE '%今日%'
    OR value LIKE '%最近%'
    OR value LIKE '%刚才%'
ORDER BY length(value) DESC;
```

## 🔧 实用工具查询

### 11. 数据导出查询
```sql
-- 导出所有聊天相关数据的摘要
SELECT 
    'key' as field,
    'size_kb' as field2,
    'category' as field3,
    'preview' as field4
UNION ALL
SELECT 
    key,
    CAST(ROUND(length(value) / 1024.0, 2) as TEXT),
    CASE 
        WHEN key LIKE '%prompt%' THEN 'prompts'
        WHEN key LIKE '%generation%' THEN 'generations'
        WHEN key LIKE '%chat%' THEN 'chat_settings'
        ELSE 'other'
    END,
    substr(REPLACE(REPLACE(value, '"', '""'), CHAR(10), ' '), 1, 100)
FROM ItemTable 
WHERE key LIKE '%chat%' OR key LIKE '%prompt%' OR key LIKE '%ai%'
ORDER BY field DESC;
```

### 12. 查找空值或异常数据
```sql
-- 检查数据完整性
SELECT 
    '数据完整性检查' as check_type,
    COUNT(*) as total_records,
    COUNT(CASE WHEN key IS NULL THEN 1 END) as null_keys,
    COUNT(CASE WHEN value IS NULL THEN 1 END) as null_values,
    COUNT(CASE WHEN length(value) = 0 THEN 1 END) as empty_values,
    COUNT(CASE WHEN length(value) > 100000 THEN 1 END) as very_large_values
FROM ItemTable;
```

## 📱 在 DBeaver 中使用这些查询

### 设置查询书签
1. 在 DBeaver 中创建新的 SQL 脚本
2. 复制上述查询到脚本中
3. 保存为书签：右键 → `Add to Bookmarks`
4. 创建文件夹"Cursor Chat Queries"组织查询

### 查询执行技巧
- **执行单个查询**: 选中查询文本，按 `Cmd + Enter`
- **格式化SQL**: 选中查询，按 `Cmd + Shift + F`
- **导出结果**: 右键结果集 → `Export Data`
- **查看大文本**: 双击值或按 `F2` 打开编辑器

### 结果查看优化
- **JSON格式化**: 右键JSON数据 → `View/Edit` → 选择JSON格式
- **文本搜索**: 在结果中按 `Cmd + F` 搜索
- **列宽调整**: 双击列分隔线自动调整宽度

---

**💡 提示**: 这些查询都是只读的，不会修改数据库。可以安全地在DBeaver中执行！ 