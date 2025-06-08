#!/bin/bash

echo "🚀 启动Cursor Chat Memory Web管理界面"
echo "================================================"
echo "📋 功能包括:"
echo "  • 📋 历史会话管理"
echo "  • 🧠 提示词中心管理"
echo "  • ⚡ 智能引用生成"
echo "  • 📊 统计分析"
echo "================================================"
echo ""

# 性能优化配置
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=2048 --enable-source-maps"

# 端口配置 - 避免重复设置
if [ -z "$PORT" ]; then
    export PORT=3001
fi

echo "🔧 当前配置:"
echo "  • 端口: $PORT"
echo "  • 环境: $NODE_ENV"
echo "  • Node内存限制: 2GB"
echo ""

# 确保编译是最新的
echo "🔨 编译TypeScript代码..."
npm run compile

if [ $? -eq 0 ]; then
    echo "✅ 编译成功"
    echo ""
    echo "🌐 启动Web服务器..."
    echo "🔗 访问地址: http://localhost:$PORT"
    echo "📍 按 Ctrl+C 停止服务"
    echo ""
    
    # 启动服务器并捕获信号以优雅关闭
    trap 'echo ""; echo "🛑 正在优雅关闭服务器..."; kill $SERVER_PID; wait $SERVER_PID 2>/dev/null; echo "✅ 服务器已关闭"; exit 0' INT TERM
    
    node out/webManager.js &
    SERVER_PID=$!
    wait $SERVER_PID
else
    echo "❌ 编译失败，请检查代码"
    exit 1
fi 