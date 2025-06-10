-- 🔗 Cursor 聊天问答关联查询脚本
-- 基于发现的数据结构，实现问题与答案的精确配对

-- ====================================
-- 📊 1. 数据结构分析
-- ====================================

-- 查看提示词和生成内容的基本信息
SELECT 
    '📝 用户提示词数据' as data_type,
    'aiService.prompts' as key_name,
    length(value) as total_size_bytes,
    ROUND(length(value) / 1024.0, 2) as size_kb,
    -- 估算消息数量（基于JSON结构）
    (length(value) - length(REPLACE(value, '{"text":', ''))) as estimated_message_count
FROM ItemTable 
WHERE key = 'aiService.prompts'

UNION ALL

SELECT 
    '🤖 AI生成内容数据' as data_type,
    'aiService.generations' as key_name,
    length(value) as total_size_bytes,
    ROUND(length(value) / 1024.0, 2) as size_kb,
    (length(value) - length(REPLACE(value, '{"unixMs":', ''))) as estimated_message_count
FROM ItemTable 
WHERE key = 'aiService.generations';

-- ====================================
-- 🎯 2. 问答配对查询（核心功能）
-- ====================================

-- 方法1: 基于JSON数组索引的直接配对（推荐）
WITH prompts_extracted AS (
    SELECT 
        key,
        json_array_length(value) as prompt_count,
        value as prompts_json
    FROM ItemTable 
    WHERE key = 'aiService.prompts'
),
generations_extracted AS (
    SELECT 
        key,
        json_array_length(value) as generation_count,
        value as generations_json
    FROM ItemTable 
    WHERE key = 'aiService.generations'
),
indexed_pairs AS (
    SELECT 
        -- 生成索引序列
        0 as idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 
        UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
        UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
        UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19
)
SELECT 
    (p.idx + 1) as qa_pair_id,
    '❓ 用户问题:' as label1,
    json_extract(pe.prompts_json, '$[' || p.idx || '].text') as user_question,
    json_extract(pe.prompts_json, '$[' || p.idx || '].commandType') as command_type,
    '',
    '🤖 AI回答:' as label2,
    json_extract(ge.generations_json, '$[' || p.idx || '].textDescription') as ai_response,
    json_extract(ge.generations_json, '$[' || p.idx || '].unixMs') as timestamp_ms,
    json_extract(ge.generations_json, '$[' || p.idx || '].generationUUID') as generation_uuid,
    datetime(json_extract(ge.generations_json, '$[' || p.idx || '].unixMs') / 1000, 'unixepoch') as readable_time,
    '----------------------------------------' as separator
FROM indexed_pairs p
CROSS JOIN prompts_extracted pe
CROSS JOIN generations_extracted ge
WHERE p.idx < pe.prompt_count 
  AND p.idx < ge.generation_count
  AND json_extract(pe.prompts_json, '$[' || p.idx || '].text') IS NOT NULL
  AND json_extract(ge.generations_json, '$[' || p.idx || '].textDescription') IS NOT NULL
ORDER BY p.idx;

-- ====================================
-- 📈 3. 统计分析查询
-- ====================================

-- 统计问答配对的数量和完整性
WITH stats AS (
    SELECT 
        json_array_length((SELECT value FROM ItemTable WHERE key = 'aiService.prompts')) as prompt_count,
        json_array_length((SELECT value FROM ItemTable WHERE key = 'aiService.generations')) as generation_count
)
SELECT 
    '📊 配对统计' as analysis_type,
    prompt_count as total_prompts,
    generation_count as total_generations,
    MIN(prompt_count, generation_count) as valid_pairs,
    CASE 
        WHEN prompt_count = generation_count THEN '✅ 完美配对'
        WHEN prompt_count > generation_count THEN '⚠️ 有未回复的问题'
        ELSE '⚠️ 有多余的回复'
    END as pairing_status,
    ROUND(MIN(prompt_count, generation_count) * 100.0 / MAX(prompt_count, generation_count), 1) || '%' as match_rate
FROM stats;

-- ====================================
-- 🔍 4. 内容搜索查询
-- ====================================

-- 搜索包含特定关键词的问答对
WITH prompts_extracted AS (
    SELECT value as prompts_json FROM ItemTable WHERE key = 'aiService.prompts'
),
generations_extracted AS (
    SELECT value as generations_json FROM ItemTable WHERE key = 'aiService.generations'
),
indexed_pairs AS (
    SELECT 0 as idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 
    UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
    UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
    UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19
),
qa_pairs AS (
    SELECT 
        (p.idx + 1) as pair_id,
        json_extract(pe.prompts_json, '$[' || p.idx || '].text') as question,
        json_extract(ge.generations_json, '$[' || p.idx || '].textDescription') as answer,
        datetime(json_extract(ge.generations_json, '$[' || p.idx || '].unixMs') / 1000, 'unixepoch') as chat_time
    FROM indexed_pairs p
    CROSS JOIN prompts_extracted pe
    CROSS JOIN generations_extracted ge
    WHERE p.idx < json_array_length(pe.prompts_json)
      AND p.idx < json_array_length(ge.generations_json)
      AND json_extract(pe.prompts_json, '$[' || p.idx || '].text') IS NOT NULL
)
SELECT 
    '🔍 搜索结果 - 包含项目相关内容' as search_type,
    pair_id,
    chat_time,
    CASE 
        WHEN question LIKE '%cursor-chat-memory%' THEN '✅ 问题中提到项目'
        WHEN answer LIKE '%cursor-chat-memory%' THEN '✅ 回答中提到项目'
        WHEN question LIKE '%SQLite%' OR answer LIKE '%SQLite%' THEN '✅ 数据库相关'
        WHEN question LIKE '%插件%' OR answer LIKE '%插件%' THEN '✅ 插件功能相关'
        ELSE '❓ 其他匹配'
    END as match_type,
    substr(question, 1, 100) || '...' as question_preview,
    substr(answer, 1, 100) || '...' as answer_preview
FROM qa_pairs
WHERE question LIKE '%cursor-chat-memory%'
   OR answer LIKE '%cursor-chat-memory%'
   OR question LIKE '%SQLite%'
   OR answer LIKE '%SQLite%'
   OR question LIKE '%插件%'
   OR answer LIKE '%插件%'
   OR question LIKE '%自动保存%'
   OR answer LIKE '%自动保存%'
ORDER BY pair_id;

-- ====================================
-- 💡 5. 时间线分析查询
-- ====================================

-- 按时间顺序显示完整的对话流
WITH prompts_extracted AS (
    SELECT value as prompts_json FROM ItemTable WHERE key = 'aiService.prompts'
),
generations_extracted AS (
    SELECT value as generations_json FROM ItemTable WHERE key = 'aiService.generations'
),
indexed_pairs AS (
    SELECT 0 as idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 
    UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
    UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
    UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19
)
SELECT 
    '📅 时间线 - 对话历史' as timeline_view,
    (p.idx + 1) as conversation_seq,
    datetime(json_extract(ge.generations_json, '$[' || p.idx || '].unixMs') / 1000, 'unixepoch') as timestamp,
    '👤 用户: ' || substr(json_extract(pe.prompts_json, '$[' || p.idx || '].text'), 1, 80) || '...' as user_input,
    '🤖 AI: ' || substr(json_extract(ge.generations_json, '$[' || p.idx || '].textDescription'), 1, 80) || '...' as ai_output,
    json_extract(ge.generations_json, '$[' || p.idx || '].generationUUID') as trace_id
FROM indexed_pairs p
CROSS JOIN prompts_extracted pe
CROSS JOIN generations_extracted ge
WHERE p.idx < json_array_length(pe.prompts_json)
  AND p.idx < json_array_length(ge.generations_json)
  AND json_extract(pe.prompts_json, '$[' || p.idx || '].text') IS NOT NULL
ORDER BY json_extract(ge.generations_json, '$[' || p.idx || '].unixMs');

-- ====================================
-- 🚀 6. 导出友好的查询
-- ====================================

-- 导出为易读格式的问答对
SELECT 
    'QA_PAIR_' || (ROW_NUMBER() OVER()) as export_id,
    'Q: ' || json_extract(pe.prompts_json, '$[' || p.idx || '].text') as question,
    'A: ' || json_extract(ge.generations_json, '$[' || p.idx || '].textDescription') as answer,
    datetime(json_extract(ge.generations_json, '$[' || p.idx || '].unixMs') / 1000, 'unixepoch') as chat_time,
    json_extract(ge.generations_json, '$[' || p.idx || '].generationUUID') as reference_id
FROM (
    SELECT 0 as idx UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 
    UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
    UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
    UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19
) p
CROSS JOIN (SELECT value as prompts_json FROM ItemTable WHERE key = 'aiService.prompts') pe
CROSS JOIN (SELECT value as generations_json FROM ItemTable WHERE key = 'aiService.generations') ge
WHERE p.idx < json_array_length(pe.prompts_json)
  AND p.idx < json_array_length(ge.generations_json)
  AND json_extract(pe.prompts_json, '$[' || p.idx || '].text') IS NOT NULL
ORDER BY json_extract(ge.generations_json, '$[' || p.idx || '].unixMs'); 