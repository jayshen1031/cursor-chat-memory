#!/bin/bash

# Cursor SQLite 数据库探索工具
# 提供多种方式访问和查看 Cursor 的 SQLite 数据库

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
    echo -e "${CYAN}║                  🗃️  Cursor SQLite 数据库探索器                ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_db_exists() {
    if [ ! -f "$DB_PATH" ]; then
        print_error "数据库文件不存在: $DB_PATH"
        exit 1
    fi
    print_success "数据库文件存在: $(du -h "$DB_PATH" | cut -f1)"
}

show_db_info() {
    print_info "数据库文件信息："
    echo -e "${PURPLE}📁 路径: ${NC}$DB_PATH"
    echo -e "${PURPLE}📊 大小: ${NC}$(du -h "$DB_PATH" | cut -f1)"
    echo -e "${PURPLE}📅 修改时间: ${NC}$(stat -f "%Sm" "$DB_PATH")"
    echo -e "${PURPLE}🔐 权限: ${NC}$(stat -f "%Mp%Lp" "$DB_PATH")"
    echo
}

show_tables() {
    print_info "数据库表结构："
    sqlite3 "$DB_PATH" "SELECT name FROM sqlite_master WHERE type='table';" | while read table; do
        echo -e "${GREEN}📋 表名: ${NC}$table"
        count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM $table;")
        echo -e "   ${CYAN}📊 记录数: ${NC}$count"
    done
    echo
}

show_chat_keys() {
    print_info "聊天相关的键值："
    sqlite3 "$DB_PATH" "SELECT key FROM ItemTable WHERE key LIKE '%chat%' OR key LIKE '%prompt%' OR key LIKE '%ai%';" | while read key; do
        size=$(sqlite3 "$DB_PATH" "SELECT length(value) FROM ItemTable WHERE key='$key';")
        echo -e "${YELLOW}🔑 ${NC}$key ${CYAN}(${size} bytes)${NC}"
    done
    echo
}

export_chat_data() {
    print_info "导出聊天数据到 JSON 文件..."
    
    # 创建导出目录
    export_dir="./exports/cursor-db-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$export_dir"
    
    # 导出 prompts 数据
    sqlite3 "$DB_PATH" "SELECT value FROM ItemTable WHERE key='aiService.prompts';" > "$export_dir/prompts.json"
    
    # 导出 generations 数据
    sqlite3 "$DB_PATH" "SELECT value FROM ItemTable WHERE key='aiService.generations';" > "$export_dir/generations.json"
    
    # 导出所有聊天相关数据
    sqlite3 "$DB_PATH" -header -csv "SELECT key, length(value) as size, substr(value, 1, 100) as preview FROM ItemTable WHERE key LIKE '%chat%' OR key LIKE '%prompt%' OR key LIKE '%ai%';" > "$export_dir/chat_summary.csv"
    
    print_success "数据导出完成: $export_dir"
    echo
}

interactive_query() {
    print_info "进入交互式查询模式 (输入 .exit 退出)："
    echo -e "${YELLOW}💡 示例查询：${NC}"
    echo -e "   ${CYAN}SELECT key FROM ItemTable LIMIT 10;${NC}"
    echo -e "   ${CYAN}SELECT key, length(value) FROM ItemTable WHERE key LIKE '%prompt%';${NC}"
    echo
    
    sqlite3 "$DB_PATH"
}

backup_database() {
    backup_path="./backups/cursor-db-backup-$(date +%Y%m%d-%H%M%S).db"
    mkdir -p "./backups"
    
    print_info "备份数据库..."
    cp "$DB_PATH" "$backup_path"
    print_success "备份完成: $backup_path"
    echo
}

show_help() {
    print_header
    echo -e "${YELLOW}用法: $0 [命令]${NC}"
    echo
    echo -e "${GREEN}命令:${NC}"
    echo -e "  ${CYAN}info${NC}        显示数据库基本信息"
    echo -e "  ${CYAN}tables${NC}      显示所有表结构"
    echo -e "  ${CYAN}chat${NC}        显示聊天相关的键值"
    echo -e "  ${CYAN}export${NC}      导出聊天数据到JSON文件"
    echo -e "  ${CYAN}query${NC}       进入交互式查询模式"
    echo -e "  ${CYAN}backup${NC}      备份数据库文件"
    echo -e "  ${CYAN}all${NC}         执行所有查看操作"
    echo -e "  ${CYAN}help${NC}        显示此帮助信息"
    echo
    echo -e "${YELLOW}💡 提示：${NC}"
    echo -e "  - 使用 'query' 命令进行自定义 SQL 查询"
    echo -e "  - 使用 'export' 命令导出数据进行分析"
    echo -e "  - 使用 'backup' 命令在修改前备份数据库"
    echo
}

# 主逻辑
case "${1:-help}" in
    "info")
        print_header
        check_db_exists
        show_db_info
        ;;
    "tables")
        print_header
        check_db_exists
        show_tables
        ;;
    "chat")
        print_header
        check_db_exists
        show_chat_keys
        ;;
    "export")
        print_header
        check_db_exists
        export_chat_data
        ;;
    "query")
        print_header
        check_db_exists
        interactive_query
        ;;
    "backup")
        print_header
        check_db_exists
        backup_database
        ;;
    "all")
        print_header
        check_db_exists
        show_db_info
        show_tables
        show_chat_keys
        ;;
    "help"|*)
        show_help
        ;;
esac 