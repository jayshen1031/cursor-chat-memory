#!/bin/bash

echo "🎯 Cursor Chat Memory - 精确引用格式演示"
echo "=============================================="
echo ""

# 检查是否编译过
if [ ! -f "out/cli.js" ]; then
    echo "📦 首次运行，正在编译..."
    npm run compile
    echo ""
fi

echo "✨ 新功能演示：精确来源标识系统"
echo ""

echo "🔍 1. 生成带项目标识的最近会话引用"
echo "-------------------------------------------"
node out/cli.js get-template recent | head -n 15
echo ""

echo "🌐 2. 查看全局与项目会话的区分"
echo "-------------------------------------------"
echo "注意观察会话条目中的标识："
echo "  📁 PROJECT - 项目相关会话"
echo "  🌐 GLOBAL  - 通用知识会话"
echo ""

echo "📊 3. 详细的引用统计信息"
echo "-------------------------------------------"
node out/cli.js get-template recent | tail -n 5
echo ""

echo "🚀 4. Web界面测试（后台启动）"
echo "-------------------------------------------"
if ! lsof -ti:3001 >/dev/null; then
    echo "启动 Web 服务器在端口 3001..."
    PORT=3001 npm run web > /dev/null 2>&1 &
    sleep 3
    echo "✅ Web 服务器已启动: http://localhost:3001"
else
    echo "✅ Web 服务器已运行: http://localhost:3001"
fi
echo ""

echo "🎯 5. API 测试 - 生成引用"
echo "-------------------------------------------"
curl -s -X POST http://localhost:3001/api/sessions/reference \
  -H "Content-Type: application/json" \
  -d '{"templateId":"recent","inputText":"测试"}' | \
  jq -r '.reference' | head -n 10
echo ""

echo "✨ 功能亮点总结："
echo "================"
echo "✅ 明确的项目 vs 全局标识"
echo "✅ 完整的来源路径追踪"  
echo "✅ 详细的会话元数据"
echo "✅ 智能重要性评分"
echo "✅ 统一的API和CLI体验"
echo ""

echo "📖 详细文档："
echo "- 集成指南: INTEGRATION_GUIDE.md"
echo "- 引用格式: REFERENCE_FORMAT_GUIDE.md"
echo "- Web界面: http://localhost:3001"
echo ""

echo "🎉 演示完成！现在你可以精确管理和追踪所有历史对话了！" 