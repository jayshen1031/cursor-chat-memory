-- 🧪 简化的问答关联测试查询
-- 专注于核心功能，处理数据格式的变化

-- 1. 快速统计检查
SELECT 
    '数据概览' as check_type,
    (SELECT json_array_length(value) FROM ItemTable WHERE key = 'aiService.prompts') as prompt_count,
    (SELECT json_array_length(value) FROM ItemTable WHERE key = 'aiService.generations') as generation_count;

-- 2. 显示前5对问答（改进版）
WITH prompts AS (
    SELECT value as json_data FROM ItemTable WHERE key = 'aiService.prompts'
),
generations AS (
    SELECT value as json_data FROM ItemTable WHERE key = 'aiService.generations'
),
indices AS (
    SELECT 0 as i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
)
SELECT 
    (i.i + 1) as pair_num,
    '问题:' as q_label,
    json_extract(p.json_data, '$[' || i.i || '].text') as question,
    '回答:' as a_label,
    COALESCE(
        json_extract(g.json_data, '$[' || i.i || '].textDescription'),
        json_extract(g.json_data, '$[' || i.i || '].text'),
        '未找到回答内容'
    ) as answer,
    '时间:' as t_label,
    datetime(json_extract(g.json_data, '$[' || i.i || '].unixMs') / 1000, 'unixepoch') as chat_time,
    '---分隔线---' as separator
FROM indices i
CROSS JOIN prompts p
CROSS JOIN generations g
WHERE json_extract(p.json_data, '$[' || i.i || '].text') IS NOT NULL
ORDER BY i.i;

-- 3. 检查generations数据的字段结构
SELECT 
    'generations结构分析' as analysis,
    substr(value, 1, 300) as sample_structure
FROM ItemTable 
WHERE key = 'aiService.generations';

-- 4. 搜索包含项目名称的对话
WITH prompts AS (
    SELECT value as json_data FROM ItemTable WHERE key = 'aiService.prompts'
),
generations AS (
    SELECT value as json_data FROM ItemTable WHERE key = 'aiService.generations'
),
indices AS (
    SELECT 0 as i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 
    UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
)
SELECT 
    '项目相关对话' as search_result,
    (i.i + 1) as pair_id,
    json_extract(p.json_data, '$[' || i.i || '].text') as question,
    COALESCE(
        json_extract(g.json_data, '$[' || i.i || '].textDescription'),
        json_extract(g.json_data, '$[' || i.i || '].text'),
        '回答格式待分析'
    ) as answer
FROM indices i
CROSS JOIN prompts p
CROSS JOIN generations g
WHERE json_extract(p.json_data, '$[' || i.i || '].text') LIKE '%cursor-chat-memory%'
   OR json_extract(p.json_data, '$[' || i.i || '].text') LIKE '%插件%'
   OR json_extract(p.json_data, '$[' || i.i || '].text') LIKE '%SQLite%'
ORDER BY i.i; 