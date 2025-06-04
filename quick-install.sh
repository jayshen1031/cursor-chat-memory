#!/bin/bash

# Cursor Chat Memory 一键安装脚本 v2.1.0

echo "🚀 Cursor Chat Memory 一键安装脚本"
echo "=================================="
echo ""

# 检查是否在项目目录中
if [ ! -f "package.json" ] || [ ! -f "src/cli.ts" ]; then
    echo "❌ 请在 cursor-chat-memory 项目根目录中运行此脚本"
    exit 1
fi

echo "📋 步骤 1/4: 安装依赖..."
if ! npm install; then
    echo "❌ npm install 失败"
    exit 1
fi
echo "✅ 依赖安装完成"
echo ""

echo "📋 步骤 2/4: 编译 TypeScript..."
if ! npm run compile; then
    echo "❌ 编译失败"
    exit 1
fi
echo "✅ 编译完成"
echo ""

echo "📋 步骤 3/4: 安装 CLI 工具..."
if ! ./install-cli.sh; then
    echo "❌ CLI 安装失败"
    exit 1
fi
echo "✅ CLI 工具安装完成"
echo ""

echo "📋 步骤 4/4: 配置环境..."

# 检查 PATH 配置
if echo $PATH | grep -q "$HOME/.local/bin"; then
    echo "✅ PATH 已配置"
else
    # 检测使用的 shell
    if [ -n "$ZSH_VERSION" ]; then
        SHELL_RC="$HOME/.zshrc"
    elif [ -n "$BASH_VERSION" ]; then
        SHELL_RC="$HOME/.bashrc"
    else
        SHELL_RC="$HOME/.profile"
    fi
    
    echo "🔧 添加 PATH 配置到 $SHELL_RC"
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$SHELL_RC"
    echo "✅ PATH 配置已添加"
    echo "💡 请运行: source $SHELL_RC 或重新打开终端"
fi

echo ""
echo "🎉 安装完成！"
echo ""
echo "📋 验证安装:"
echo "  cursor-memory help"
echo "  # 或使用完整路径: ~/.local/bin/cursor-memory help"
echo ""
echo "📚 使用方法:"
echo "  1. 在任何项目目录运行: $(pwd)/init-project.sh"
echo "  2. 使用生成的 ./cursor-memory.sh 脚本"
echo ""
echo "📖 详细文档: 查看 INSTALL_GUIDE.md" 