#!/bin/bash

# Cursor Chat Memory CLI 安装脚本

echo "🚀 安装 Cursor Chat Memory CLI 工具..."

# 检查必要文件
if [ ! -f "out/cli.js" ]; then
    echo "❌ 找不到编译后的 CLI 文件，请先运行: npm run compile"
    exit 1
fi

if [ ! -f "out/chatMemoryService.js" ]; then
    echo "❌ 找不到依赖文件，请先运行: npm run compile"
    exit 1
fi

# 创建安装目录
INSTALL_DIR="$HOME/.cursor-memory/cli"
mkdir -p "$INSTALL_DIR"

# 复制文件
echo "📂 复制CLI文件到: $INSTALL_DIR"
cp out/cli.js "$INSTALL_DIR/"
cp out/chatMemoryService.js "$INSTALL_DIR/"
cp out/*.js.map "$INSTALL_DIR/" 2>/dev/null || true

# 创建可执行脚本
EXEC_SCRIPT="$INSTALL_DIR/cursor-memory"
cat > "$EXEC_SCRIPT" << 'EOF'
#!/bin/bash
# Cursor Chat Memory CLI 执行脚本

SCRIPT_DIR="$(dirname "$0")"
node "$SCRIPT_DIR/cli.js" "$@"
EOF

chmod +x "$EXEC_SCRIPT"

# 检查并添加到PATH
BIN_DIR="/usr/local/bin"
SYMLINK_PATH="$BIN_DIR/cursor-memory"

# 尝试创建符号链接（需要sudo权限）
if command -v sudo &> /dev/null; then
    echo "🔗 创建全局符号链接..."
    if sudo ln -sf "$EXEC_SCRIPT" "$SYMLINK_PATH" 2>/dev/null; then
        echo "✅ 已创建全局符号链接: $SYMLINK_PATH"
        GLOBAL_INSTALL=true
    else
        echo "⚠️  无法创建全局符号链接（需要管理员权限）"
        GLOBAL_INSTALL=false
    fi
else
    echo "⚠️  未找到sudo命令，跳过全局安装"
    GLOBAL_INSTALL=false
fi

# 检查用户本地bin目录
LOCAL_BIN="$HOME/.local/bin"
LOCAL_SYMLINK="$LOCAL_BIN/cursor-memory"

if [ "$GLOBAL_INSTALL" != true ]; then
    echo "📁 尝试安装到用户本地bin目录..."
    mkdir -p "$LOCAL_BIN"
    ln -sf "$EXEC_SCRIPT" "$LOCAL_SYMLINK"
    echo "✅ 已创建本地符号链接: $LOCAL_SYMLINK"
    
    # 检查PATH是否包含本地bin目录
    if [[ ":$PATH:" != *":$LOCAL_BIN:"* ]]; then
        echo ""
        echo "⚠️  $LOCAL_BIN 不在你的 PATH 中"
        echo "💡 请添加以下行到你的 ~/.bashrc 或 ~/.zshrc："
        echo "   export PATH=\"\$HOME/.local/bin:\$PATH\""
        echo ""
        echo "🔄 然后运行: source ~/.bashrc 或 source ~/.zshrc"
    fi
fi

echo ""
echo "🎉 安装完成！"
echo ""
echo "📋 测试安装:"
if [ "$GLOBAL_INSTALL" = true ]; then
    echo "  cursor-memory help"
else
    echo "  $LOCAL_SYMLINK help"
    echo "  或者 (如果已添加到PATH): cursor-memory help"
fi
echo ""
echo "💡 如果命令不可用，请检查PATH设置或使用完整路径" 