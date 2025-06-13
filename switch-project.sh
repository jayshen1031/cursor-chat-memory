#!/bin/bash

# 检查参数
if [ $# -ne 1 ]; then
    echo "Usage: $0 <project-name>"
    echo "Available projects:"
    echo "  - system-development"
    echo "  - data-analysis"
    exit 1
fi

PROJECT_NAME=$1
CONFIG_FILE="cursor-mcp-config.json"

# 检查配置文件是否存在
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: $CONFIG_FILE not found"
    exit 1
fi

# 检查项目是否在配置中
if ! jq -e ".projects.\"$PROJECT_NAME\"" "$CONFIG_FILE" > /dev/null 2>&1; then
    echo "Error: Project '$PROJECT_NAME' not found in configuration"
    exit 1
fi

# 更新环境变量
export CURSOR_MEMORY_PROJECT="$PROJECT_NAME"

# 获取项目路径
PROJECT_PATH=$(jq -r ".projects.\"$PROJECT_NAME\".path" "$CONFIG_FILE")

# 检查项目目录是否存在
if [ ! -d "$PROJECT_PATH" ]; then
    echo "Creating project directory: $PROJECT_PATH"
    mkdir -p "$PROJECT_PATH"
fi

echo "Switched to project: $PROJECT_NAME"
echo "Project path: $PROJECT_PATH"
echo "Environment variable CURSOR_MEMORY_PROJECT set to: $PROJECT_NAME"

# 如果使用 PM2，重启服务
if command -v pm2 &> /dev/null; then
    echo "Restarting MCP server..."
    pm2 restart mcp-server
fi 