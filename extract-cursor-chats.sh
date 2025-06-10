#!/bin/bash

# 🚀 Cursor 聊天数据提取和分析工具
# 完整的问答关联解决方案

set -e

echo "🔍 Cursor 聊天数据提取工具"
echo "=========================================="

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 查找数据库文件
CURSOR_DIR="$HOME/Library/Application Support/Cursor"
DB_PATH=""

# 查找包含聊天数据的数据库
echo -e "${BLUE}🔍 查找聊天数据库...${NC}"
for db_file in "$CURSOR_DIR"/User/workspaceStorage/*/state.vscdb; do
    if [[ -f "$db_file" ]]; then
        # 检查是否包含AI服务数据
        if sqlite3 "$db_file" "SELECT COUNT(*) FROM ItemTable WHERE key = 'aiService.prompts';" 2>/dev/null | grep -q "1"; then
            DB_PATH="$db_file"
            break
        fi
    fi
done

if [[ -z "$DB_PATH" ]]; then
    echo -e "${RED}❌ 未找到包含聊天数据的数据库${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 找到聊天数据库: $DB_PATH${NC}"
echo ""

# 创建临时查询文件
TEMP_QUERY=$(mktemp /tmp/cursor_query.XXXXXX.sql)

# 生成完整的分析查询
cat > "$TEMP_QUERY" << 'EOF'
-- Cursor 聊天数据完整分析

.headers on
.mode table

-- 1. 数据统计概览
SELECT '📊 数据统计' as section, '' as info;
SELECT 
    '总问题数' as metric,
    json_array_length(value) as count
FROM ItemTable WHERE key = 'aiService.prompts'
UNION ALL
SELECT 
    '总回答数' as metric,
    json_array_length(value) as count  
FROM ItemTable WHERE key = 'aiService.generations';

-- 2. 最近5对问答
SELECT '' as separator, '🔥 最近的5对问答' as title;

WITH prompts AS (
    SELECT value as json_data FROM ItemTable WHERE key = 'aiService.prompts'
),
generations AS (
    SELECT value as json_data FROM ItemTable WHERE key = 'aiService.generations'
),
recent_indices AS (
    -- 获取最后5个索引
    SELECT (json_array_length((SELECT value FROM ItemTable WHERE key = 'aiService.prompts')) - 5 + i) as idx
    FROM (SELECT 0 as i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4)
    WHERE (json_array_length((SELECT value FROM ItemTable WHERE key = 'aiService.prompts')) - 5 + i) >= 0
)
SELECT 
    '问题 ' || (r.idx + 1) || ':' as label,
    substr(json_extract(p.json_data, '$[' || r.idx || '].text'), 1, 100) || '...' as content
FROM recent_indices r
CROSS JOIN prompts p
WHERE json_extract(p.json_data, '$[' || r.idx || '].text') IS NOT NULL

UNION ALL

SELECT 
    '回答 ' || (r.idx + 1) || ':' as label,
    substr(COALESCE(
        json_extract(g.json_data, '$[' || r.idx || '].textDescription'),
        json_extract(g.json_data, '$[' || r.idx || '].text'),
        '[AI回答格式需要分析]'
    ), 1, 100) || '...' as content
FROM recent_indices r
CROSS JOIN generations g;

-- 3. 项目相关对话搜索
SELECT '' as separator, '🎯 项目相关对话' as title;

WITH prompts AS (
    SELECT value as json_data FROM ItemTable WHERE key = 'aiService.prompts'
),
generations AS (
    SELECT value as json_data FROM ItemTable WHERE key = 'aiService.generations'
),
all_indices AS (
    SELECT 0 as i UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 
    UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
    UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
    UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19
),
project_related AS (
    SELECT 
        i.i as pair_id,
        json_extract(p.json_data, '$[' || i.i || '].text') as question,
        COALESCE(
            json_extract(g.json_data, '$[' || i.i || '].textDescription'),
            json_extract(g.json_data, '$[' || i.i || '].text'),
            '[回答待分析]'
        ) as answer,
        datetime(json_extract(g.json_data, '$[' || i.i || '].unixMs') / 1000, 'unixepoch') as chat_time
    FROM all_indices i
    CROSS JOIN prompts p
    CROSS JOIN generations g
    WHERE json_extract(p.json_data, '$[' || i.i || '].text') IS NOT NULL
      AND (
          json_extract(p.json_data, '$[' || i.i || '].text') LIKE '%cursor-chat-memory%'
          OR json_extract(p.json_data, '$[' || i.i || '].text') LIKE '%插件%'
          OR json_extract(p.json_data, '$[' || i.i || '].text') LIKE '%SQLite%'
          OR json_extract(p.json_data, '$[' || i.i || '].text') LIKE '%自动保存%'
      )
)
SELECT 
    '对话' || (pair_id + 1) as chat_id,
    chat_time as time,
    substr(question, 1, 60) || '...' as question_preview,
    substr(answer, 1, 60) || '...' as answer_preview
FROM project_related
ORDER BY pair_id;

-- 4. 时间分布分析
SELECT '' as separator, '📅 聊天时间分布' as title;

WITH generations AS (
    SELECT value as json_data FROM ItemTable WHERE key = 'aiService.generations'
),
time_stats AS (
    SELECT 
        datetime(json_extract(json_data, '$[0].unixMs') / 1000, 'unixepoch') as first_chat,
        datetime(json_extract(json_data, '$[' || (json_array_length(json_data) - 1) || '].unixMs') / 1000, 'unixepoch') as last_chat,
        json_array_length(json_data) as total_chats
    FROM generations
)
SELECT 
    '首次聊天' as metric,
    first_chat as value
FROM time_stats
UNION ALL
SELECT 
    '最后聊天' as metric, 
    last_chat as value
FROM time_stats
UNION ALL
SELECT 
    '总对话数' as metric,
    CAST(total_chats as TEXT) as value
FROM time_stats;

EOF

# 执行查询
echo -e "${BLUE}📊 开始分析聊天数据...${NC}"
echo ""

sqlite3 "$DB_PATH" < "$TEMP_QUERY"

# 清理临时文件
rm "$TEMP_QUERY"

echo ""
echo -e "${GREEN}✅ 分析完成！${NC}"
echo ""
echo -e "${YELLOW}💡 使用建议:${NC}"
echo "   1. 使用 correlate-qa-pairs.sql 进行详细的问答配对分析"
echo "   2. 使用 test-qa-correlation.sql 进行快速测试"
echo "   3. 在DBeaver中导入这些SQL文件进行可视化分析"
echo ""
echo -e "${BLUE}📍 数据库位置: $DB_PATH${NC}" 