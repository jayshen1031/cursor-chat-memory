#!/bin/bash

echo "🔍 检查MCP服务器健康状态..."

# 检查服务器是否在运行
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ 服务器正在运行"
    echo "📊 健康状态:"
    curl -s http://localhost:3000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/health
    echo ""
else
    echo "❌ 服务器未运行或无法访问"
    echo "💡 请先运行: npm run mcp"
fi 