#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 显示使用说明
show_usage() {
    echo "Usage: $0 <target_directory> [options]"
    echo "Options:"
    echo "  --clean        Clean target directory before deployment"
    echo "  --type TYPE    Project type (development|analysis|bi)"
    echo "  --help         Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 /path/to/project --type bi --clean"
}

# 检查参数
if [ $# -lt 1 ] || [ "$1" == "--help" ]; then
    show_usage
    exit 1
fi

TARGET_DIR=$1
shift

# 默认项目类型
PROJECT_TYPE="development"

# 解析其他参数
CLEAN=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --clean)
            CLEAN=true
            shift
            ;;
        --type)
            PROJECT_TYPE="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# 验证项目类型
if [[ ! "$PROJECT_TYPE" =~ ^(development|analysis|bi)$ ]]; then
    echo "Error: Invalid project type. Must be one of: development, analysis, bi"
    exit 1
fi

# 检查目标目录
if [ ! -d "$TARGET_DIR" ]; then
    echo "Creating target directory: $TARGET_DIR"
    mkdir -p "$TARGET_DIR"
fi

# 清理目标目录（如果指定）
if [ "$CLEAN" = true ]; then
    echo "[跳过] 不再清理目标目录，保留所有原有文件。"
    # 保留 .git 目录
    # if [ -d "$TARGET_DIR/.git" ]; then
    #     mv "$TARGET_DIR/.git" "$TARGET_DIR/.git.bak"
    # fi
    # rm -rf "$TARGET_DIR"/*
    # if [ -d "$TARGET_DIR/.git.bak" ]; then
    #     mv "$TARGET_DIR/.git.bak" "$TARGET_DIR/.git"
    # fi
fi

# 创建项目结构
echo "Creating project structure for type: $PROJECT_TYPE"

# 创建基本目录结构
mkdir -p "$TARGET_DIR/memory-bank"
mkdir -p "$TARGET_DIR/output"
mkdir -p "$TARGET_DIR/logs"
mkdir -p "$TARGET_DIR/src"

# 根据项目类型创建特定的目录结构
case $PROJECT_TYPE in
    "development")
        mkdir -p "$TARGET_DIR/memory-bank/learningInsights"
        mkdir -p "$TARGET_DIR/memory-bank/problemSolutions"
        mkdir -p "$TARGET_DIR/memory-bank/codePatterns"
        ;;
    "analysis")
        mkdir -p "$TARGET_DIR/memory-bank/businessInsights"
        mkdir -p "$TARGET_DIR/memory-bank/analysisPatterns"
        mkdir -p "$TARGET_DIR/memory-bank/dataModels"
        ;;
    "bi")
        mkdir -p "$TARGET_DIR/memory-bank/businessInsights"
        mkdir -p "$TARGET_DIR/memory-bank/dataModels"
        mkdir -p "$TARGET_DIR/memory-bank/reportTemplates"
        mkdir -p "$TARGET_DIR/memory-bank/dashboardDesigns"
        mkdir -p "$TARGET_DIR/memory-bank/etlProcesses"
        ;;
esac

# 创建配置文件
cat > "$TARGET_DIR/cursor-mcp-config.json" << EOF
{
    "port": 3000,
    "host": "localhost",
    "logLevel": "info",
    "memoryBankPath": "./memory-bank",
    "outputPath": "./output",
    "logPath": "./logs",
    "projects": {
        "$(basename "$TARGET_DIR")": {
            "name": "$(basename "$TARGET_DIR")",
            "path": "./memory-bank",
            "type": "$PROJECT_TYPE"
        }
    }
}
EOF

# 创建项目说明文件
cat > "$TARGET_DIR/README.md" << EOF
# Cursor Memory Project

## 项目类型
$PROJECT_TYPE

## 目录结构
- \`memory-bank/\`: 记忆库目录
- \`output/\`: 输出文件目录
- \`logs/\`: 日志文件目录
- \`src/\`: 源代码目录

## 使用说明
1. 安装依赖：
   \`\`\`bash
   npm install
   \`\`\`

2. 启动服务：
   \`\`\`bash
   npm run mcp
   \`\`\`

3. 配置 Cursor：
   - 打开 Cursor 设置
   - 添加 MCP 服务器配置
   - 重启 Cursor

## 维护说明
- 定期备份记忆库
- 检查日志文件
- 更新配置文件

最后更新: $(date +%Y-%m-%d)
EOF

# 复制必要的文件
echo "Copying project files..."
cp package.json "$TARGET_DIR/"
cp .gitignore "$TARGET_DIR/"

# 确保src目录存在并复制所有源文件
if [ -d "src" ]; then
    cp -r src/* "$TARGET_DIR/src/"
    echo "✅ 源代码文件已复制"
else
    echo "⚠️  警告: src目录不存在"
fi

# 复制其他必要文件
if [ -f "start-mcp-server.sh" ]; then
    cp start-mcp-server.sh "$TARGET_DIR/"
fi

# 验证关键文件是否存在
echo "验证部署文件..."
if [ -f "$TARGET_DIR/src/config-validator.js" ]; then
    echo "✅ 配置验证器已部署"
else
    echo "❌ 配置验证器缺失"
fi

if [ -f "$TARGET_DIR/src/mcp-server.js" ]; then
    echo "✅ MCP服务器已部署"
else
    echo "❌ MCP服务器缺失"
fi

# 检查package.json中的脚本
if grep -q "validate-config" "$TARGET_DIR/package.json"; then
    echo "✅ 配置验证脚本已添加"
else
    echo "❌ 配置验证脚本缺失"
fi

echo ""
echo "🎉 Project initialized successfully in $TARGET_DIR"
echo "📋 Project type: $PROJECT_TYPE"
echo "📖 Please review the README.md file for usage instructions."
echo ""
echo "🔧 Next steps:"
echo "   cd $TARGET_DIR"
echo "   npm install"
echo "   npm run validate-config"
echo "   npm run mcp" 