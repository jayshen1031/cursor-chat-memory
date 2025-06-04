#!/bin/bash
# Cursor Chat Memory 便捷脚本

# 检查本地CLI文件
LOCAL_CLI="./cursor-memory-cli.js"
if [ -f "$LOCAL_CLI" ]; then
    echo "🎯 使用本地CLI工具"
    # 设置项目上下文
    node "$LOCAL_CLI" set-project "$(pwd)"
    # 执行命令
    node "$LOCAL_CLI" "$@"
elif command -v cursor-memory &> /dev/null; then
    echo "🌐 使用全局CLI工具"
    # 设置项目上下文
    cursor-memory set-project "$(pwd)"
    # 执行命令
    cursor-memory "$@"
else
    echo "❌ cursor-memory CLI 未安装且本地文件不存在"
    echo "💡 请运行: npm install -g cursor-chat-memory"
    echo "💡 或确保 cursor-memory-cli.js 文件存在"
    exit 1
fi
