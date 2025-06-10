#!/bin/bash

# 🔍 Cursor 数据快速扫描脚本
# 用于在数据落库前找到完整的聊天关联关系

set -e

echo "🚀 Cursor 数据扫描开始..."
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'  # No Color

CURSOR_DIR="$HOME/Library/Application Support/Cursor"

# 检查Cursor目录是否存在
if [[ ! -d "$CURSOR_DIR" ]]; then
    echo -e "${RED}❌ Cursor目录不存在: $CURSOR_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 找到Cursor目录: $CURSOR_DIR${NC}"
echo ""

# 1. 📂 SQLite数据库扫描
echo -e "${BLUE}📂 SQLite数据库扫描:${NC}"
echo "----------------------------------------"
find "$CURSOR_DIR" -name "*.db*" -o -name "*.sqlite*" | while read db_file; do
    if [[ -f "$db_file" ]]; then
        size=$(ls -lh "$db_file" | awk '{print $5}')
        modified=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$db_file")
        echo -e "  📊 $db_file"
        echo -e "     大小: ${YELLOW}$size${NC}, 修改时间: ${YELLOW}$modified${NC}"
        
        # 尝试查看数据库表结构
        if command -v sqlite3 >/dev/null 2>&1; then
            echo "     表结构:"
            sqlite3 "$db_file" ".tables" 2>/dev/null | sed 's/^/       /'
        fi
        echo ""
    fi
done

# 2. 📄 JSON配置文件扫描
echo -e "${BLUE}📄 JSON配置文件扫描:${NC}"
echo "----------------------------------------"
find "$CURSOR_DIR" -name "*.json" -size +1k | head -10 | while read json_file; do
    if [[ -f "$json_file" ]]; then
        size=$(ls -lh "$json_file" | awk '{print $5}')
        modified=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$json_file")
        echo -e "  📄 $json_file"
        echo -e "     大小: ${YELLOW}$size${NC}, 修改时间: ${YELLOW}$modified${NC}"
        
        # 检查是否包含聊天相关内容
        if grep -q -E "(prompt|generation|chat|message)" "$json_file" 2>/dev/null; then
            echo -e "     ${GREEN}✅ 包含聊天相关内容${NC}"
            # 显示前几行内容
            head -3 "$json_file" | sed 's/^/       /'
        fi
        echo ""
    fi
done

# 3. 📝 日志文件扫描
echo -e "${BLUE}📝 日志文件扫描:${NC}"
echo "----------------------------------------"
LOG_DIR="$CURSOR_DIR/logs"
if [[ -d "$LOG_DIR" ]]; then
    ls -lht "$LOG_DIR"/*.log 2>/dev/null | head -5 | while read line; do
        echo "  📝 $line"
    done
else
    echo -e "  ${YELLOW}⚠️ 未找到日志目录${NC}"
fi
echo ""

# 4. 🔄 当前Cursor进程
echo -e "${BLUE}🔄 当前Cursor进程:${NC}"
echo "----------------------------------------"
ps aux | grep -i cursor | grep -v grep | while read line; do
    echo -e "  🔄 $line"
done
echo ""

# 5. 🔍 查找包含项目名称的文件
echo -e "${BLUE}🔍 查找包含'cursor-chat-memory'的文件:${NC}"
echo "----------------------------------------"
grep -r "cursor-chat-memory" "$CURSOR_DIR" 2>/dev/null | head -5 | while read line; do
    echo -e "  🎯 $line"
done
echo ""

# 6. 📊 最近修改的文件（可能包含最新聊天数据）
echo -e "${BLUE}📊 最近1小时内修改的文件:${NC}"
echo "----------------------------------------"
find "$CURSOR_DIR" -type f -mmin -60 | head -10 | while read recent_file; do
    if [[ -f "$recent_file" ]]; then
        size=$(ls -lh "$recent_file" | awk '{print $5}')
        modified=$(stat -f "%Sm" -t "%H:%M" "$recent_file")
        echo -e "  ⏰ $recent_file"
        echo -e "     大小: ${YELLOW}$size${NC}, 修改时间: ${YELLOW}$modified${NC}"
    fi
done
echo ""

# 7. 🎯 重点目录结构
echo -e "${BLUE}🎯 重点目录结构:${NC}"
echo "----------------------------------------"
for dir in "User/workspaceStorage" "User/globalStorage" "CachedData" "storage"; do
    full_dir="$CURSOR_DIR/$dir"
    if [[ -d "$full_dir" ]]; then
        echo -e "  📁 $dir/"
        ls -la "$full_dir" 2>/dev/null | head -5 | sed 's/^/     /'
        echo ""
    fi
done

# 8. 💡 建议的下一步操作
echo -e "${BLUE}💡 建议的下一步操作:${NC}"
echo "----------------------------------------"
echo "  1. 📊 检查最大的SQLite数据库文件"
echo "  2. 📄 查看包含聊天内容的JSON文件详情"
echo "  3. 🔄 使用 'fswatch' 监控文件变化"
echo "  4. 🌐 考虑使用抓包工具监控网络请求"
echo ""

echo -e "${GREEN}🎉 扫描完成！${NC}"
echo "==========================================" 