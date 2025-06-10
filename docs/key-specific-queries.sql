-- 🔑 针对Cursor聊天数据库特定键值的查询
-- 基于识别的键值结构创建的专用查询

-- ================================
-- 🤖 1. AI服务内容查询
-- ================================

-- 查看AI生成内容和提示词的基本信息
SELECT 
    '🤖 AI回复数据' as data_type,
    'aiService.generations' as key_name,
    length(value) as size_bytes,
    ROUND(length(value) / 1024.0, 2) as size_kb,
    substr(value, 1, 200) as content_preview
FROM ItemTable 
WHERE key = 'aiService.generations'

UNION ALL

SELECT 
    '📝 用户提示词' as data_type,
    'aiService.prompts' as key_name,
    length(value) as size_bytes,
    ROUND(length(value) / 1024.0, 2) as size_kb,
    substr(value, 1, 200) as content_preview
FROM ItemTable 
WHERE key = 'aiService.prompts';

-- ================================
-- 💬 2. 聊天会话查询
-- ================================

-- 获取所有聊天会话的详细信息
SELECT 
    '💬 聊天会话' as data_type,
    key,
    substr(key, 35) as session_uuid,  -- 提取UUID部分
    length(value) as size_bytes,
    ROUND(length(value) / 1024.0, 2) as size_kb,
    CASE 
        WHEN value LIKE '%cursor-chat-memory%' THEN '✅ 包含项目相关'
        WHEN value LIKE '%SQLite%' THEN '✅ 包含数据库相关' 
        WHEN value LIKE '%自动保存%' THEN '✅ 包含自动保存相关'
        ELSE '❓ 其他内容'
    END as content_analysis,
    substr(value, 1, 150) as preview
FROM ItemTable 
WHERE key LIKE 'workbench.panel.composerChatViewPane.%'
ORDER BY length(value) DESC;

-- ================================
-- 🏗️ 3. 编辑器组合器数据查询
-- ================================

-- 查看编辑器组合器相关数据
SELECT 
    '🏗️ 编辑器数据' as data_type,
    key,
    length(value) as size_bytes,
    ROUND(length(value) / 1024.0, 2) as size_kb,
    CASE 
        WHEN key = 'composer.composerData' THEN '主要组合器数据'
        WHEN key = 'workbench.backgroundComposer.workspacePersistentData' THEN '工作区持久数据'
        ELSE '其他组合器数据'
    END as data_category,
    substr(value, 1, 200) as preview
FROM ItemTable 
WHERE key IN ('composer.composerData', 'workbench.backgroundComposer.workspacePersistentData');

-- ================================
-- 📜 4. 历史记录查询
-- ================================

-- 查看历史记录数据
SELECT 
    '📜 历史记录' as data_type,
    key,
    length(value) as size_bytes,
    ROUND(length(value) / 1024.0, 2) as size_kb,
    substr(value, 1, 300) as preview
FROM ItemTable 
WHERE key = 'history.entries';

-- ================================
-- 🔍 5. 检索功能数据查询
-- ================================

-- 查看Cursor检索功能数据
SELECT 
    '🔍 检索数据' as data_type,
    key,
    length(value) as size_bytes,
    ROUND(length(value) / 1024.0, 2) as size_kb,
    substr(value, 1, 200) as preview
FROM ItemTable 
WHERE key = 'anysphere.cursor-retrieval';

-- ================================
-- 📊 6. 综合统计查询
-- ================================

-- 按类别统计数据大小
SELECT 
    CASE 
        WHEN key LIKE 'aiService.%' THEN '🤖 AI服务'
        WHEN key LIKE 'workbench.panel.composerChatViewPane.%' THEN '💬 聊天会话'
        WHEN key LIKE 'composer.%' OR key LIKE '%Composer%' THEN '🏗️ 编辑器组合器'
        WHEN key LIKE 'memento/%' THEN '💾 状态存储'
        WHEN key LIKE 'workbench.%' THEN '🖥️ 工作台'
        WHEN key LIKE 'terminal.%' THEN '🖥️ 终端'
        ELSE '📄 其他'
    END as category,
    COUNT(*) as count,
    SUM(length(value)) as total_bytes,
    ROUND(SUM(length(value)) / 1024.0, 2) as total_kb,
    ROUND(AVG(length(value)), 2) as avg_bytes
FROM ItemTable 
GROUP BY 
    CASE 
        WHEN key LIKE 'aiService.%' THEN '🤖 AI服务'
        WHEN key LIKE 'workbench.panel.composerChatViewPane.%' THEN '💬 聊天会话'
        WHEN key LIKE 'composer.%' OR key LIKE '%Composer%' THEN '🏗️ 编辑器组合器'
        WHEN key LIKE 'memento/%' THEN '💾 状态存储'
        WHEN key LIKE 'workbench.%' THEN '🖥️ 工作台'
        WHEN key LIKE 'terminal.%' THEN '🖥️ 终端'
        ELSE '📄 其他'
    END
ORDER BY total_bytes DESC;

-- ================================
-- 🎯 7. 项目相关内容搜索
-- ================================

-- 在所有主要键值中搜索项目相关内容
SELECT 
    '🎯 项目相关内容' as search_type,
    key,
    CASE 
        WHEN key = 'aiService.prompts' THEN '📝 用户输入'
        WHEN key = 'aiService.generations' THEN '🤖 AI回复'
        WHEN key LIKE 'workbench.panel.composerChatViewPane.%' THEN '💬 会话数据'
        WHEN key = 'composer.composerData' THEN '🏗️ 组合器数据'
        ELSE '📄 其他数据'
    END as data_type,
    length(value) as size_bytes,
    CASE 
        WHEN value LIKE '%cursor-chat-memory%' THEN '✅ 项目名称匹配'
        WHEN value LIKE '%提示词中心%' THEN '✅ 功能模块匹配'
        WHEN value LIKE '%会话归档%' THEN '✅ 归档功能匹配'
        WHEN value LIKE '%SQLite%' THEN '✅ 数据库相关匹配'
        WHEN value LIKE '%自动保存%' THEN '✅ 自动保存匹配'
        ELSE '❓ 其他匹配'
    END as match_type,
    substr(value, 1, 200) as content_preview
FROM ItemTable 
WHERE (
    key IN ('aiService.prompts', 'aiService.generations', 'composer.composerData', 'history.entries')
    OR key LIKE 'workbench.panel.composerChatViewPane.%'
) AND (
    value LIKE '%cursor-chat-memory%'
    OR value LIKE '%提示词中心%'
    OR value LIKE '%会话归档%'
    OR value LIKE '%SQLite%'
    OR value LIKE '%自动保存%'
    OR value LIKE '%DBeaver%'
)
ORDER BY length(value) DESC;

-- ================================
-- 🔧 8. 快速数据导出查询
-- ================================

-- 导出聊天相关的核心数据摘要
SELECT 
    'data_type' as field1,
    'key_name' as field2, 
    'size_kb' as field3,
    'has_project_content' as field4,
    'content_sample' as field5

UNION ALL

SELECT 
    CASE 
        WHEN key = 'aiService.prompts' THEN 'user_prompts'
        WHEN key = 'aiService.generations' THEN 'ai_responses'
        WHEN key LIKE 'workbench.panel.composerChatViewPane.%' THEN 'chat_session'
        WHEN key = 'composer.composerData' THEN 'composer_data'
        ELSE 'other'
    END,
    key,
    CAST(ROUND(length(value) / 1024.0, 2) as TEXT),
    CASE 
        WHEN value LIKE '%cursor-chat-memory%' THEN 'YES'
        ELSE 'NO'
    END,
    substr(REPLACE(REPLACE(value, '"', '""'), CHAR(10), ' '), 1, 100)
FROM ItemTable 
WHERE key IN ('aiService.prompts', 'aiService.generations', 'composer.composerData')
    OR key LIKE 'workbench.panel.composerChatViewPane.%'
ORDER BY field1, field3 DESC; 