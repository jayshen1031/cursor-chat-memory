#!/bin/bash

# Cursor 聊天数据 SQL 查询执行器
# 运行预定义的SQL查询并显示格式化结果

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 数据库路径
DB_PATH="/Users/jay/Library/Application Support/Cursor/User/workspaceStorage/e76c6a8343ed4d7d7b8f77651bad3214/state.vscdb"

print_header() {
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                🔍 Cursor 聊天数据查询器                        ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo
}

print_section() {
    echo -e "${BLUE}▶ $1${NC}"
    echo -e "${BLUE}$(printf '%.0s─' {1..60})${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

check_db() {
    if [ ! -f "$DB_PATH" ]; then
        echo -e "${RED}❌ 数据库文件不存在: $DB_PATH${NC}"
        exit 1
    fi
}

# 1. 数据库概览
query_overview() {
    print_section "📊 数据库概览"
    
    echo -e "${YELLOW}总数据条目:${NC}"
    sqlite3 "$DB_PATH" "SELECT COUNT(*) as '总条目数' FROM ItemTable;"
    echo
    
    echo -e "${YELLOW}数据大小分布:${NC}"
    sqlite3 "$DB_PATH" -header -column "
    SELECT 
        CASE 
            WHEN length(value) < 1000 THEN 'Small (< 1KB)'
            WHEN length(value) < 10000 THEN 'Medium (1-10KB)'
            WHEN length(value) < 100000 THEN 'Large (10-100KB)'
            ELSE 'Very Large (> 100KB)'
        END as '大小分类',
        COUNT(*) as '数量',
        ROUND(AVG(length(value)), 2) as '平均大小(字节)'
    FROM ItemTable
    GROUP BY 大小分类
    ORDER BY AVG(length(value));"
    echo
}

# 2. 聊天相关数据
query_chat_data() {
    print_section "💬 聊天相关数据"
    
    sqlite3 "$DB_PATH" -header -column "
    SELECT 
        key as '键名',
        length(value) as '大小(字节)',
        ROUND(length(value) / 1024.0, 2) as '大小(KB)',
        CASE 
            WHEN key LIKE '%prompt%' THEN '🔤 提示词'
            WHEN key LIKE '%generation%' THEN '🤖 AI回复'
            WHEN key LIKE '%chat%' THEN '💬 聊天设置'
            WHEN key LIKE '%ai%' THEN '🧠 AI服务'
            ELSE '❓ 其他'
        END as '类别'
    FROM ItemTable 
    WHERE key LIKE '%chat%' 
       OR key LIKE '%prompt%' 
       OR key LIKE '%ai%'
       OR key LIKE '%generation%'
    ORDER BY length(value) DESC;"
    echo
}

# 3. 搜索项目相关内容
query_project_content() {
    print_section "🎯 项目相关内容搜索"
    
    echo -e "${YELLOW}搜索关键词: cursor-chat-memory, 自动保存, SQLite, DBeaver${NC}"
    sqlite3 "$DB_PATH" -header -column "
    SELECT 
        key as '键名',
        length(value) as '大小',
        CASE 
            WHEN value LIKE '%cursor-chat-memory%' THEN '🎯 项目名称'
            WHEN value LIKE '%自动保存%' THEN '💾 自动保存'
            WHEN value LIKE '%SQLite%' THEN '🗃️ 数据库'
            WHEN value LIKE '%DBeaver%' THEN '📊 数据库工具'
            ELSE '🔍 其他匹配'
        END as '匹配类型',
        substr(value, 1, 80) as '内容预览'
    FROM ItemTable 
    WHERE value LIKE '%cursor-chat-memory%'
       OR value LIKE '%自动保存%'
       OR value LIKE '%SQLite%'
       OR value LIKE '%DBeaver%'
    ORDER BY length(value) DESC
    LIMIT 5;"
    echo
}

# 4. 统计分析
query_statistics() {
    print_section "📈 统计分析"
    
    sqlite3 "$DB_PATH" -header -column "
    SELECT 
        '📊 总体数据' as '统计类型',
        COUNT(*) as '数量',
        SUM(length(value)) as '总字节数',
        ROUND(SUM(length(value)) / 1024.0, 2) as '总KB',
        ROUND(AVG(length(value)), 2) as '平均字节'
    FROM ItemTable
    WHERE key LIKE '%chat%' OR key LIKE '%prompt%' OR key LIKE '%ai%'
    
    UNION ALL
    
    SELECT 
        '🔤 提示词数据' as '统计类型',
        COUNT(*) as '数量',
        SUM(length(value)) as '总字节数',
        ROUND(SUM(length(value)) / 1024.0, 2) as '总KB',
        ROUND(AVG(length(value)), 2) as '平均字节'
    FROM ItemTable
    WHERE key LIKE '%prompt%'
    
    UNION ALL
    
    SELECT 
        '🤖 AI回复数据' as '统计类型',
        COUNT(*) as '数量',
        SUM(length(value)) as '总字节数',
        ROUND(SUM(length(value)) / 1024.0, 2) as '总KB',
        ROUND(AVG(length(value)), 2) as '平均字节'
    FROM ItemTable
    WHERE key LIKE '%generation%';"
    echo
}

# 5. 查看提示词内容摘要
query_prompts_summary() {
    print_section "🔤 提示词内容摘要"
    
    echo -e "${YELLOW}提示词数据详情:${NC}"
    sqlite3 "$DB_PATH" -header -column "
    SELECT 
        key as '键名',
        length(value) as 'JSON大小',
        CASE 
            WHEN value LIKE '%cursor-chat-memory%' THEN '✅ 包含项目相关内容'
            ELSE '❌ 无项目相关内容'
        END as '项目相关性'
    FROM ItemTable 
    WHERE key = 'aiService.prompts';"
    
    echo
    echo -e "${YELLOW}提示词内容预览 (前200字符):${NC}"
    sqlite3 "$DB_PATH" "SELECT substr(value, 1, 200) FROM ItemTable WHERE key = 'aiService.prompts';"
    echo
}

# 6. 数据完整性检查  
query_integrity() {
    print_section "🔧 数据完整性检查"
    
    sqlite3 "$DB_PATH" -header -column "
    SELECT 
        '数据完整性检查' as '检查类型',
        COUNT(*) as '总记录数',
        COUNT(CASE WHEN key IS NULL THEN 1 END) as '空键数',
        COUNT(CASE WHEN value IS NULL THEN 1 END) as '空值数',
        COUNT(CASE WHEN length(value) = 0 THEN 1 END) as '空内容数',
        COUNT(CASE WHEN length(value) > 100000 THEN 1 END) as '超大文件数'
    FROM ItemTable;"
    echo
}

# 7. JSON结构分析
query_json_structure() {
    print_section "📦 JSON数据结构分析"
    
    sqlite3 "$DB_PATH" -header -column "
    SELECT 
        key as '键名',
        length(value) as '大小',
        CASE 
            WHEN value LIKE '[%' THEN '📋 JSON数组'
            WHEN value LIKE '{%' THEN '📦 JSON对象'
            ELSE '📄 普通文本'
        END as '数据类型',
        substr(value, 1, 60) as '结构预览'
    FROM ItemTable 
    WHERE key IN ('aiService.prompts', 'aiService.generations')
    ORDER BY length(value) DESC;"
    echo
}

# 自定义查询
run_custom_query() {
    print_section "💻 自定义查询"
    echo -e "${YELLOW}请输入SQL查询 (输入 'exit' 退出):${NC}"
    
    while true; do
        echo -n -e "${CYAN}SQL> ${NC}"
        read -r query
        
        if [[ "$query" == "exit" ]]; then
            break
        fi
        
        if [[ -n "$query" ]]; then
            echo -e "${BLUE}执行查询...${NC}"
            sqlite3 "$DB_PATH" -header -column "$query" || echo -e "${RED}查询执行失败${NC}"
            echo
        fi
    done
}

# 显示帮助
show_help() {
    print_header
    echo -e "${YELLOW}用法: $0 [选项]${NC}"
    echo
    echo -e "${GREEN}选项:${NC}"
    echo -e "  ${CYAN}overview${NC}     数据库概览"
    echo -e "  ${CYAN}chat${NC}         聊天相关数据"
    echo -e "  ${CYAN}search${NC}       搜索项目内容" 
    echo -e "  ${CYAN}stats${NC}        统计分析"
    echo -e "  ${CYAN}prompts${NC}      提示词摘要"
    echo -e "  ${CYAN}integrity${NC}    数据完整性检查"
    echo -e "  ${CYAN}json${NC}         JSON结构分析"
    echo -e "  ${CYAN}custom${NC}       自定义查询"
    echo -e "  ${CYAN}all${NC}          运行所有查询"
    echo -e "  ${CYAN}help${NC}         显示帮助"
    echo
    echo -e "${YELLOW}示例:${NC}"
    echo -e "  $0 overview      # 查看数据库概览"
    echo -e "  $0 search        # 搜索项目相关内容"
    echo -e "  $0 all           # 运行所有查询"
    echo
}

# 主函数
main() {
    check_db
    
    case "${1:-help}" in
        "overview")
            print_header
            query_overview
            ;;
        "chat")
            print_header
            query_chat_data
            ;;
        "search")
            print_header
            query_project_content
            ;;
        "stats")
            print_header
            query_statistics
            ;;
        "prompts")
            print_header
            query_prompts_summary
            ;;
        "integrity")
            print_header
            query_integrity
            ;;
        "json")
            print_header
            query_json_structure
            ;;
        "custom")
            print_header
            run_custom_query
            ;;
        "all")
            print_header
            query_overview
            query_chat_data
            query_project_content
            query_statistics
            query_prompts_summary
            query_integrity
            query_json_structure
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# 运行主函数
main "$@" 