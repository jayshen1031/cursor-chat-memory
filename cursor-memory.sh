#!/bin/bash
# Cursor Chat Memory 便捷脚本 - 完整版 v2.1.0

CLI_TOOL="cursor-memory"

# 检查CLI工具是否可用
if ! command -v "$CLI_TOOL" &> /dev/null && [ ! -x "$CLI_TOOL" ]; then
    echo "❌ cursor-memory CLI 工具不可用: $CLI_TOOL"
    echo "💡 请重新运行项目初始化或检查CLI安装"
    exit 1
fi

# 设置项目上下文
"$CLI_TOOL" set-project "$(pwd)" 2>/dev/null

# 执行命令
"$CLI_TOOL" "$@"
