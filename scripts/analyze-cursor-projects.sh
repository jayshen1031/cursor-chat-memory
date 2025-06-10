#!/bin/bash

# Cursor 项目和会话分析器
# 帮助区分不同的项目、工作区和聊天会话

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
    echo -e "${CYAN}║                🏗️  Cursor 项目和会话分析器                     ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo
}

print_section() {
    echo -e "${BLUE}▶ $1${NC}"
    echo -e "${BLUE}$(printf '%.0s─' {1..60})${NC}"
}

check_db() {
    if [ ! -f "$DB_PATH" ]; then
        echo -e "${RED}❌ 数据库文件不存在: $DB_PATH${NC}"
        exit 1
    fi
}

# 1. 分析工作区标识符
analyze_workspace_ids() {
    print_section "🏗️ 工作区标识符分析"
    
    echo -e "${YELLOW}当前数据库路径:${NC}"
    echo "$DB_PATH"
    echo
    
    echo -e "${YELLOW}工作区ID提取:${NC}"
    workspace_id=$(echo "$DB_PATH" | grep -o '[a-f0-9]\{32\}' | head -1)
    echo "工作区ID: ${workspace_id}"
    echo
    
    echo -e "${YELLOW}工作区相关信息:${NC}"
    sqlite3 "$DB_PATH" -header -column "
    SELECT 
        key as '键名',
        length(value) as '大小',
        substr(value, 1, 80) as '内容预览'
    FROM ItemTable 
    WHERE key LIKE '%workspace%' 
       OR key LIKE '%project%'
    ORDER BY length(value) DESC
    LIMIT 5;"
    echo
}

# 2. 分析聊天会话UUID
analyze_chat_sessions() {
    print_section "💬 聊天会话UUID分析"
    
    echo -e "${YELLOW}检测到的聊天会话UUID:${NC}"
    sqlite3 "$DB_PATH" "
    SELECT DISTINCT
        CASE 
            WHEN key LIKE '%a079be78-466e-4b3f-98f2-faf7aad71266%' THEN 'Session-A: a079be78-466e-4b3f-98f2-faf7aad71266'
            WHEN key LIKE '%f41bf6be-620a-47b0-8d83-0878ed2da9df%' THEN 'Session-B: f41bf6be-620a-47b0-8d83-0878ed2da9df'
            WHEN key LIKE '%8198e1cc-5be9-451b-8093-f52814c8e9f6%' THEN 'View-A: 8198e1cc-5be9-451b-8093-f52814c8e9f6'
            WHEN key LIKE '%2c4467ea-276a-4fcf-84b9-a05f3f97b441%' THEN 'View-B: 2c4467ea-276a-4fcf-84b9-a05f3f97b441'
            ELSE 'Other'
        END as session_info
    FROM ItemTable 
    WHERE key LIKE '%.%-%-%-%'
       AND session_info != 'Other'
    ORDER BY session_info;"
    echo
    
    echo -e "${YELLOW}各会话的数据分布:${NC}"
    sqlite3 "$DB_PATH" -header -column "
    SELECT 
        CASE 
            WHEN key LIKE '%a079be78-466e-4b3f-98f2-faf7aad71266%' THEN '🟢 Session-A (a079be78)'
            WHEN key LIKE '%f41bf6be-620a-47b0-8d83-0878ed2da9df%' THEN '🔵 Session-B (f41bf6be)'
            ELSE '⚪ Other'
        END as '会话标识',
        COUNT(*) as '数据条目',
        SUM(length(value)) as '总字节数',
        ROUND(AVG(length(value)), 2) as '平均大小'
    FROM ItemTable 
    WHERE key LIKE '%.%-%-%-%'
    GROUP BY 会话标识
    ORDER BY 总字节数 DESC;"
    echo
}

# 3. 分析会话内容
analyze_session_content() {
    print_section "📋 会话内容详细分析"
    
    echo -e "${YELLOW}Session-A (a079be78) 详细信息:${NC}"
    sqlite3 "$DB_PATH" -header -column "
    SELECT 
        key as '键名',
        length(value) as '大小',
        substr(value, 1, 150) as '内容预览'
    FROM ItemTable 
    WHERE key LIKE '%a079be78-466e-4b3f-98f2-faf7aad71266%'
    ORDER BY length(value) DESC;"
    echo
    
    echo -e "${YELLOW}Session-B (f41bf6be) 详细信息:${NC}"
    sqlite3 "$DB_PATH" -header -column "
    SELECT 
        key as '键名',
        length(value) as '大小',
        substr(value, 1, 150) as '内容预览'
    FROM ItemTable 
    WHERE key LIKE '%f41bf6be-620a-47b0-8d83-0878ed2da9df%'
    ORDER BY length(value) DESC;"
    echo
}

# 4. 全局数据vs会话数据
analyze_data_scope() {
    print_section "🌐 全局数据 vs 会话数据"
    
    echo -e "${YELLOW}数据范围分类:${NC}"
    sqlite3 "$DB_PATH" -header -column "
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
        END as '数据类型',
        COUNT(*) as '数量',
        SUM(length(value)) as '总字节',
        ROUND(SUM(length(value)) / 1024.0, 2) as '总KB'
    FROM ItemTable
    GROUP BY 数据类型
    ORDER BY 总字节 DESC;"
    echo
}

# 5. 提取会话相关的项目信息
extract_project_info() {
    print_section "🎯 项目信息提取"
    
    echo -e "${YELLOW}从聊天数据中提取项目信息:${NC}"
    sqlite3 "$DB_PATH" -header -column "
    SELECT 
        key as '数据源',
        CASE 
            WHEN value LIKE '%cursor-chat-memory%' THEN '✅ cursor-chat-memory项目'
            WHEN value LIKE '%github.com%' THEN '✅ GitHub项目'
            WHEN value LIKE '%提示词中心%' THEN '✅ 提示词中心功能'
            WHEN value LIKE '%实现cursor%' THEN '✅ Cursor实现相关'
            ELSE '❓ 其他项目内容'
        END as '项目匹配',
        length(value) as '大小',
        substr(value, 1, 100) as '内容预览'
    FROM ItemTable 
    WHERE (value LIKE '%cursor-chat-memory%'
        OR value LIKE '%github.com%'
        OR value LIKE '%提示词中心%'
        OR value LIKE '%实现cursor%')
        AND length(value) > 50
    ORDER BY length(value) DESC
    LIMIT 10;"
    echo
}

# 6. 会话时间线分析
analyze_session_timeline() {
    print_section "⏰ 会话时间线分析"
    
    echo -e "${YELLOW}基于数据大小推断活跃度:${NC}"
    sqlite3 "$DB_PATH" -header -column "
    SELECT 
        CASE 
            WHEN key LIKE '%a079be78%' THEN '🟢 Session-A'
            WHEN key LIKE '%f41bf6be%' THEN '🔵 Session-B'
            ELSE '⚪ Other'
        END as '会话',
        key as '具体键名',
        length(value) as '数据大小',
        CASE 
            WHEN length(value) > 1000 THEN '🔥 高活跃'
            WHEN length(value) > 100 THEN '📊 中等活跃'
            ELSE '💤 低活跃'
        END as '活跃度'
    FROM ItemTable 
    WHERE key LIKE '%.%-%-%-%'
    ORDER BY length(value) DESC;"
    echo
}

# 7. 生成项目区分建议
generate_project_distinction_guide() {
    print_section "📖 项目区分指南"
    
    echo -e "${GREEN}🎯 如何区分不同项目和会话：${NC}"
    echo
    echo -e "${YELLOW}1. 工作区级别区分:${NC}"
    echo "   • 数据库路径中的32位hash: e76c6a8343ed4d7d7b8f77651bad3214"
    echo "   • 每个项目/工作区都有独立的数据库文件"
    echo
    
    echo -e "${YELLOW}2. 会话级别区分:${NC}"
    echo "   • composerChatViewPane UUID: 区分不同的聊天会话"
    echo "   • Session-A: a079be78-466e-4b3f-98f2-faf7aad71266 (更活跃)"
    echo "   • Session-B: f41bf6be-620a-47b0-8d83-0878ed2da9df (较少活跃)"
    echo
    
    echo -e "${YELLOW}3. 数据类型区分:${NC}"
    echo "   • aiService.* : 全局AI服务数据 (跨会话共享)"
    echo "   • workbench.panel.composer* : 特定会话数据"
    echo "   • memento.* : 编辑器状态和文件历史"
    echo
    
    echo -e "${YELLOW}4. 项目内容识别:${NC}"
    echo "   • 通过内容搜索项目名称: cursor-chat-memory"
    echo "   • 通过GitHub链接识别项目"
    echo "   • 通过代码路径和文件名识别"
    echo
    
    echo -e "${YELLOW}5. 推荐查询方法:${NC}"
    echo "   • 按工作区: 查看不同数据库文件"
    echo "   • 按会话: 使用UUID过滤"
    echo "   • 按内容: 搜索项目相关关键词"
    echo
}

# 主函数
main() {
    check_db
    
    case "${1:-all}" in
        "workspace")
            print_header
            analyze_workspace_ids
            ;;
        "sessions")
            print_header
            analyze_chat_sessions
            ;;
        "content")
            print_header
            analyze_session_content
            ;;
        "scope")
            print_header
            analyze_data_scope
            ;;
        "projects")
            print_header
            extract_project_info
            ;;
        "timeline")
            print_header
            analyze_session_timeline
            ;;
        "guide")
            print_header
            generate_project_distinction_guide
            ;;
        "all")
            print_header
            analyze_workspace_ids
            analyze_chat_sessions
            analyze_session_content
            analyze_data_scope
            extract_project_info
            analyze_session_timeline
            generate_project_distinction_guide
            ;;
        "help"|*)
            print_header
            echo -e "${YELLOW}用法: $0 [选项]${NC}"
            echo
            echo -e "${GREEN}选项:${NC}"
            echo -e "  ${CYAN}workspace${NC}    分析工作区标识符"
            echo -e "  ${CYAN}sessions${NC}     分析聊天会话UUID"
            echo -e "  ${CYAN}content${NC}      分析会话内容"
            echo -e "  ${CYAN}scope${NC}        分析数据范围"
            echo -e "  ${CYAN}projects${NC}     提取项目信息"
            echo -e "  ${CYAN}timeline${NC}     分析会话时间线"
            echo -e "  ${CYAN}guide${NC}        生成区分指南"
            echo -e "  ${CYAN}all${NC}          运行所有分析"
            echo -e "  ${CYAN}help${NC}         显示帮助"
            ;;
    esac
}

# 运行主函数
main "$@" 