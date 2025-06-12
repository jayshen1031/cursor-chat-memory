#!/bin/bash

# 🚀 Cursor Memory MCP Server 启动脚本

echo "🤖 启动 Cursor Memory MCP Server..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装，请先安装Node.js 18+${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js版本过低 (需要18+，当前 $NODE_VERSION)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js 版本检查通过${NC}"

# 检查项目文件
if [ ! -f "src/mcp-server.js" ]; then
    echo -e "${RED}❌ MCP Server文件不存在，请检查项目结构${NC}"
    exit 1
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  依赖未安装，正在安装...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 依赖安装失败${NC}"
        exit 1
    fi
fi

# 检查MCP配置
echo -e "${BLUE}🔍 检查MCP配置...${NC}"
if [ ! -f "cursor-mcp-config.json" ]; then
    echo -e "${YELLOW}⚠️  MCP配置不存在，运行设置脚本...${NC}"
    node scripts/setup.js
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 设置失败${NC}"
        exit 1
    fi
fi

# 检查Memory Bank
if [ ! -d "memory-bank" ]; then
    echo -e "${YELLOW}⚠️  Memory Bank不存在，正在初始化...${NC}"
    mkdir -p memory-bank
fi

# 设置环境变量
if [ -z "$CURSOR_WORKSPACE_ID" ]; then
    # 尝试从配置文件读取
    if [ -f "cursor-mcp-config.json" ]; then
        WORKSPACE_ID=$(cat cursor-mcp-config.json | grep -o '"CURSOR_WORKSPACE_ID":"[^"]*"' | cut -d'"' -f4)
        if [ ! -z "$WORKSPACE_ID" ]; then
            export CURSOR_WORKSPACE_ID="$WORKSPACE_ID"
            echo -e "${GREEN}✅ 从配置文件读取工作区ID: $WORKSPACE_ID${NC}"
        fi
    fi
fi

# 启动参数处理
MODE="start"
if [ "$1" = "dev" ]; then
    MODE="dev"
    echo -e "${BLUE}🛠️  开发模式启动${NC}"
elif [ "$1" = "test" ]; then
    echo -e "${BLUE}🧪 运行测试...${NC}"
    node scripts/test.js
    exit $?
fi

# 显示启动信息
echo -e "${GREEN}🚀 启动 Cursor Memory MCP Server...${NC}"
echo -e "${BLUE}📁 项目路径: $(pwd)${NC}"
echo -e "${BLUE}🧠 Memory Bank: $(pwd)/memory-bank${NC}"

if [ ! -z "$CURSOR_WORKSPACE_ID" ]; then
    echo -e "${BLUE}🆔 工作区ID: $CURSOR_WORKSPACE_ID${NC}"
fi

echo -e "${BLUE}⏰ 启动时间: $(date)${NC}"
echo ""

# 创建启动日志
LOG_FILE="mcp-server.log"
echo "$(date): Starting Cursor Memory MCP Server" >> $LOG_FILE

# 启动服务器
if [ "$MODE" = "dev" ]; then
    echo -e "${YELLOW}🔍 开发模式 - 启用调试${NC}"
    node --inspect src/mcp-server.js 2>&1 | tee -a $LOG_FILE
else
    echo -e "${GREEN}🏁 生产模式${NC}"
    node src/mcp-server.js 2>&1 | tee -a $LOG_FILE
fi

# 检查退出状态
EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ MCP Server 正常退出${NC}"
else
    echo -e "${RED}❌ MCP Server 异常退出 (代码: $EXIT_CODE)${NC}"
    echo -e "${YELLOW}💡 检查日志文件: $LOG_FILE${NC}"
fi

exit $EXIT_CODE 