#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 显示帮助信息
show_help() {
    echo "用法: $0 <目标目录> [选项]"
    echo "选项:"
    echo "  --clean    清理目标目录（如果存在）"
    echo "  --help     显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 /path/to/new/project"
    echo "  $0 /path/to/new/project --clean"
}

# 检查参数
if [ "$1" == "--help" ] || [ -z "$1" ]; then
    show_help
    exit 0
fi

TARGET_DIR="$1/cursor-memory"
CLEAN_MODE=false

# 检查是否使用清理模式
if [ "$2" == "--clean" ]; then
    CLEAN_MODE=true
fi

# 检查目标目录
if [ -d "$TARGET_DIR" ]; then
    if [ "$CLEAN_MODE" = true ]; then
        echo -e "${YELLOW}清理目标目录: $TARGET_DIR${NC}"
        rm -rf "$TARGET_DIR"/*
    else
        echo -e "${RED}错误: 目标目录已存在。使用 --clean 选项来清理目录。${NC}"
        exit 1
    fi
fi

# 创建目标目录
echo -e "${GREEN}创建目标目录: $TARGET_DIR${NC}"
mkdir -p "$TARGET_DIR"

# 复制项目文件
echo -e "${GREEN}复制项目文件...${NC}"

# 首先复制目录
for dir in src memory-bank .cursor .vscode scripts; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}复制目录: $dir${NC}"
        cp -r "$dir" "$TARGET_DIR/"
    else
        echo -e "${RED}警告: 目录 $dir 不存在${NC}"
    fi
done

# 然后复制文件
for file in package.json package-lock.json cursor-mcp-config.json start-mcp-server.sh monitor-cursor-changes.sh scan-cursor-data.sh README.md LICENSE.txt; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}复制文件: $file${NC}"
        cp "$file" "$TARGET_DIR/"
    else
        echo -e "${RED}警告: 文件 $file 不存在${NC}"
    fi
done

# 创建必要的目录
echo -e "${GREEN}创建必要的目录...${NC}"
mkdir -p "$TARGET_DIR/output"
mkdir -p "$TARGET_DIR/logs"

# 设置文件权限
echo -e "${GREEN}设置文件权限...${NC}"
chmod +x "$TARGET_DIR/start-mcp-server.sh"
chmod +x "$TARGET_DIR/monitor-cursor-changes.sh"
chmod +x "$TARGET_DIR/scan-cursor-data.sh"

# 安装依赖
echo -e "${GREEN}安装项目依赖...${NC}"
cd "$TARGET_DIR"
npm install

# 创建 .gitignore
echo -e "${GREEN}创建 .gitignore 文件...${NC}"
cat > "$TARGET_DIR/.gitignore" << EOL
# Dependencies
node_modules/

# Output files
output/
logs/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
EOL

# 清理主目录中的文件
echo -e "${GREEN}清理主目录中的文件...${NC}"
cd "$1"
rm -rf .cursor .vscode LICENSE.txt README.md cursor-mcp-config.json logs memory-bank monitor-cursor-changes.sh node_modules output package-lock.json package.json scan-cursor-data.sh src mcp-server.log

echo -e "${GREEN}部署完成！${NC}"
echo -e "新项目位置: ${YELLOW}$TARGET_DIR${NC}"
echo -e "使用以下命令启动项目："
echo -e "  cd ${YELLOW}$TARGET_DIR${NC}"
echo -e "  ./start-mcp-server.sh" 