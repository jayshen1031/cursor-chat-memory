#!/bin/bash

# Cursor Chat Memory 项目初始化脚本 v2.1.0

echo "🚀 初始化 Cursor Chat Memory 项目支持..."

# 获取项目信息
PROJECT_PATH=$(pwd)
PROJECT_NAME=$(basename "$PROJECT_PATH")

echo "📁 项目路径: $PROJECT_PATH"
echo "📂 项目名称: $PROJECT_NAME"

# 检查 cursor-memory CLI 工具
check_cli_tool() {
    local cli_paths=(
        "cursor-memory"                              # 全局安装
        "$HOME/.local/bin/cursor-memory"             # 用户本地安装
        "$HOME/.cursor-memory/cli/cursor-memory"     # 自定义安装位置
    )
    
    for path in "${cli_paths[@]}"; do
        if command -v "$path" &> /dev/null || [ -x "$path" ]; then
            echo "$path"
            return 0
        fi
    done
    
    return 1
}

CLI_PATH=$(check_cli_tool)
CLI_AVAILABLE=$?

if [ $CLI_AVAILABLE -eq 0 ]; then
    echo "✅ 找到 cursor-memory CLI: $CLI_PATH"
else
    echo "⚠️  未找到 cursor-memory CLI 工具"
    echo ""
    echo "📦 安装选项:"
    echo "1. 如果你有 cursor-chat-memory 项目源码："
    echo "   cd /path/to/cursor-chat-memory"
    echo "   npm run compile"
    echo "   ./install-cli.sh"
    echo ""
    echo "2. 或者继续使用简化版（无 CLI 依赖）"
    echo ""
    read -p "是否继续创建简化版配置？ (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 初始化已取消"
        exit 1
    fi
fi

# 创建配置文件
if [ ! -f "cursor-memory.config.json" ]; then
    echo "📝 创建项目配置文件..."
    cat > cursor-memory.config.json << EOF
{
  "project": {
    "name": "$PROJECT_NAME",
    "path": ".",
    "description": "$PROJECT_NAME 项目的聊天记忆配置"
  },
  "memory": {
    "enableProjectSpecific": true,
    "maxProjectSessions": 20,
    "projectKeywords": [
      "$PROJECT_NAME",
      "$(echo $PROJECT_NAME | tr '[:upper:]' '[:lower:]')"
    ]
  },
  "filters": {
    "includeCategories": ["JavaScript", "Python", "Web开发", "系统工具"],
    "excludeKeywords": ["test", "测试"],
    "minImportance": 0.3
  },
  "output": {
    "format": "markdown",
    "includeTimestamps": true,
    "maxSummaryLength": 150
  }
}
EOF
    echo "✅ 配置文件已创建: cursor-memory.config.json"
else
    echo "⚠️  配置文件已存在，跳过创建"
fi

# 添加到 .gitignore (如果存在)
if [ -f ".gitignore" ]; then
    if ! grep -q ".cursor-memory" .gitignore; then
        echo "" >> .gitignore
        echo "# Cursor Chat Memory 缓存" >> .gitignore
        echo ".cursor-memory/" >> .gitignore
        echo "cursor-memory.log" >> .gitignore
        echo "✅ 已添加到 .gitignore"
    fi
fi

# 创建便捷脚本
echo "📋 创建便捷脚本..."

if [ $CLI_AVAILABLE -eq 0 ]; then
    # 创建完整功能版本
    cat > cursor-memory.sh << EOF
#!/bin/bash
# Cursor Chat Memory 便捷脚本 - 完整版 v2.1.0

CLI_TOOL="$CLI_PATH"

# 检查CLI工具是否可用
if ! command -v "\$CLI_TOOL" &> /dev/null && [ ! -x "\$CLI_TOOL" ]; then
    echo "❌ cursor-memory CLI 工具不可用: \$CLI_TOOL"
    echo "💡 请重新运行项目初始化或检查CLI安装"
    exit 1
fi

# 设置项目上下文
"\$CLI_TOOL" set-project "\$(pwd)" 2>/dev/null

# 执行命令
"\$CLI_TOOL" "\$@"
EOF
else
    # 创建简化版本
    cat > cursor-memory.sh << 'EOF'
#!/bin/bash
# Cursor Chat Memory 便捷脚本 - 简化版 v2.1.0

# 简化的功能实现（无需CLI工具）

show_help() {
    echo "🧠 Cursor Chat Memory 简化版"
    echo ""
    echo "📋 可用命令:"
    echo "  help                    显示此帮助信息"
    echo "  status                  显示状态信息"
    echo "  list-chats              列出聊天文件"
    echo "  config                  显示配置信息"
    echo ""
    echo "💡 要使用完整功能，请安装 cursor-memory CLI 工具"
}

show_status() {
    local chat_dir="$HOME/.cursor/chat"
    local cache_dir="$HOME/.cursor-memory"
    local project_name=$(basename "$(pwd)")
    
    echo "📊 Cursor Chat Memory 状态"
    echo ""
    echo "项目: $project_name"
    echo "路径: $(pwd)"
    echo ""
    
    if [ -d "$chat_dir" ]; then
        local chat_count=$(find "$chat_dir" -name "*.json" 2>/dev/null | wc -l)
        echo "✅ 聊天目录: $chat_dir"
        echo "📄 聊天文件数: $chat_count"
    else
        echo "❌ 聊天目录不存在: $chat_dir"
    fi
    
    if [ -d "$cache_dir" ]; then
        echo "✅ 缓存目录: $cache_dir"
    else
        echo "⚠️  缓存目录不存在: $cache_dir"
    fi
    
    if [ -f "cursor-memory.config.json" ]; then
        echo "✅ 项目配置: cursor-memory.config.json"
    else
        echo "⚠️  项目配置文件不存在"
    fi
}

list_chats() {
    local chat_dir="$HOME/.cursor/chat"
    
    if [ ! -d "$chat_dir" ]; then
        echo "❌ 聊天目录不存在: $chat_dir"
        return 1
    fi
    
    echo "📄 最近的聊天文件:"
    find "$chat_dir" -name "*.json" -type f -exec ls -la {} \; 2>/dev/null | head -10
}

show_config() {
    if [ -f "cursor-memory.config.json" ]; then
        echo "📋 项目配置:"
        cat cursor-memory.config.json
    else
        echo "❌ 项目配置文件不存在"
        echo "💡 运行 init-project.sh 创建配置"
    fi
}

# 主逻辑
case "${1:-help}" in
    "status")
        show_status
        ;;
    "list-chats")
        list_chats
        ;;
    "config")
        show_config
        ;;
    "help"|*)
        show_help
        ;;
esac
EOF
fi

chmod +x cursor-memory.sh

echo ""
echo "🎉 初始化完成！"
echo ""

if [ $CLI_AVAILABLE -eq 0 ]; then
    echo "✅ 完整功能版本已创建"
    echo ""
    echo "📚 使用方法:"
    echo "  ./cursor-memory.sh project-sessions     # 查看项目相关会话"
    echo "  ./cursor-memory.sh project-reference    # 获取项目相关引用"
    echo "  ./cursor-memory.sh light-reference      # 获取轻量级引用"
    echo "  ./cursor-memory.sh status               # 查看系统状态"
    echo "  ./cursor-memory.sh help                 # 查看所有命令"
else
    echo "⚠️  简化版本已创建（功能有限）"
    echo ""
    echo "📚 可用命令:"
    echo "  ./cursor-memory.sh status               # 查看状态"
    echo "  ./cursor-memory.sh list-chats           # 列出聊天文件"
    echo "  ./cursor-memory.sh config               # 显示配置"
    echo "  ./cursor-memory.sh help                 # 显示帮助"
    echo ""
    echo "💡 要获得完整功能，请安装 cursor-memory CLI 工具"
fi

echo ""
echo "💡 提示: 建议将 cursor-memory.sh 添加到你的 PATH 中" 