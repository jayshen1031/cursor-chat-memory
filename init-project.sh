#!/bin/bash

# Cursor Chat Memory 项目初始化脚本

echo "🚀 初始化 Cursor Chat Memory 项目支持..."

# 获取项目信息
PROJECT_PATH=$(pwd)
PROJECT_NAME=$(basename "$PROJECT_PATH")

echo "📁 项目路径: $PROJECT_PATH"
echo "📂 项目名称: $PROJECT_NAME"

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
        echo "✅ 已添加到 .gitignore"
    fi
fi

# 创建别名脚本
echo "📋 创建便捷脚本..."
cat > cursor-memory.sh << 'EOF'
#!/bin/bash
# Cursor Chat Memory 便捷脚本

# 检查是否安装了 cursor-chat-memory
if ! command -v cursor-memory &> /dev/null; then
    echo "❌ cursor-memory CLI 未安装"
    echo "💡 请运行: npm install -g cursor-chat-memory"
    exit 1
fi

# 设置项目上下文
cursor-memory set-project "$(pwd)"

# 执行命令
cursor-memory "$@"
EOF

chmod +x cursor-memory.sh

echo ""
echo "🎉 初始化完成！"
echo ""
echo "📚 使用方法:"
echo "  ./cursor-memory.sh project-sessions     # 查看项目相关会话"
echo "  ./cursor-memory.sh project-reference    # 获取项目相关引用"
echo "  ./cursor-memory.sh help                 # 查看所有命令"
echo ""
echo "💡 提示: 建议将 cursor-memory.sh 添加到你的 PATH 中" 