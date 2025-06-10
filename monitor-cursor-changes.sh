#!/bin/bash

# 📊 Cursor 文件变化实时监控脚本
# 用于在聊天时实时观察数据变化，找到问答关联

set -e

echo "🔍 Cursor 实时监控启动..."
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

CURSOR_DIR="$HOME/Library/Application Support/Cursor"

# 检查必要工具
if ! command -v fswatch >/dev/null 2>&1; then
    echo -e "${RED}❌ 需要安装 fswatch: brew install fswatch${NC}"
    exit 1
fi

if [[ ! -d "$CURSOR_DIR" ]]; then
    echo -e "${RED}❌ Cursor目录不存在: $CURSOR_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 开始监控 Cursor 文件变化...${NC}"
echo -e "${YELLOW}💡 提示: 现在可以在Cursor中进行聊天，观察文件变化${NC}"
echo ""

# 创建日志文件
LOG_FILE="cursor-monitor-$(date +%Y%m%d-%H%M%S).log"
echo "📝 监控日志保存到: $LOG_FILE"
echo ""

# 监控函数
monitor_file_changes() {
    fswatch -r "$CURSOR_DIR" | while read changed_file; do
        timestamp=$(date '+%Y-%m-%d %H:%M:%S')
        
        # 获取文件信息
        if [[ -f "$changed_file" ]]; then
            size=$(ls -lh "$changed_file" 2>/dev/null | awk '{print $5}' || echo "unknown")
            
            # 根据文件类型分类显示
            case "$changed_file" in
                *.db|*.sqlite*)
                    echo -e "${BLUE}📊 [$timestamp] SQLite数据库更新:${NC}"
                    echo -e "   文件: $changed_file"
                    echo -e "   大小: ${YELLOW}$size${NC}"
                    
                    # 如果是我们关注的数据库，尝试查询最新数据
                    if [[ "$changed_file" == *"state.vscdb"* ]]; then
                        echo -e "   ${GREEN}🔍 这可能是聊天数据库！${NC}"
                        
                        # 尝试查看最新的键值
                        if command -v sqlite3 >/dev/null 2>&1; then
                            echo "   最新的5个键值:"
                            sqlite3 "$changed_file" "SELECT key, length(value) as size FROM ItemTable ORDER BY rowid DESC LIMIT 5;" 2>/dev/null | sed 's/^/     /' || echo "     查询失败"
                        fi
                    fi
                    ;;
                *.json)
                    echo -e "${PURPLE}📄 [$timestamp] JSON文件更新:${NC}"
                    echo -e "   文件: $changed_file"
                    echo -e "   大小: ${YELLOW}$size${NC}"
                    
                    # 检查是否包含聊天内容
                    if grep -q -E "(prompt|generation|chat|message)" "$changed_file" 2>/dev/null; then
                        echo -e "   ${GREEN}✅ 包含聊天相关内容！${NC}"
                        echo "   内容预览:"
                        head -5 "$changed_file" 2>/dev/null | sed 's/^/     /' || echo "     读取失败"
                    fi
                    ;;
                *.log)
                    echo -e "${YELLOW}📝 [$timestamp] 日志文件更新:${NC}"
                    echo -e "   文件: $changed_file"
                    echo -e "   大小: ${YELLOW}$size${NC}"
                    
                    # 显示最新的日志内容
                    echo "   最新日志:"
                    tail -3 "$changed_file" 2>/dev/null | sed 's/^/     /' || echo "     读取失败"
                    ;;
                *)
                    echo -e "${NC}📁 [$timestamp] 其他文件更新:${NC}"
                    echo -e "   文件: $changed_file"
                    echo -e "   大小: ${YELLOW}$size${NC}"
                    ;;
            esac
            
            echo ""
            
            # 同时写入日志文件
            echo "[$timestamp] $changed_file ($size)" >> "$LOG_FILE"
            
        else
            echo -e "${RED}❌ [$timestamp] 文件被删除或无法访问: $changed_file${NC}"
            echo ""
        fi
    done
}

# 启动监控
echo -e "${GREEN}🚀 监控已启动，按 Ctrl+C 停止${NC}"
echo "=========================================="

# 捕获中断信号
trap 'echo -e "\n${YELLOW}📊 监控已停止${NC}"; exit 0' INT

# 开始监控
monitor_file_changes

# 清理
echo -e "${GREEN}✅ 监控日志已保存到: $LOG_FILE${NC}" 