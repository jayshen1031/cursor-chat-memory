#!/bin/bash

# Cursor Chat Memory - 智能分析Web界面启动脚本
# 基于项目的AI驱动会话分析和知识提取系统

echo "🚀 启动 Cursor Chat Memory 智能分析系统"
echo "=================================================="
echo ""
echo "🎯 新功能亮点 - 基于项目的智能分析:"
echo "   ✨ 项目会话过滤 - 只分析当前项目相关的对话"
echo "   🧠 双引擎支持 - 本地Claude + Azure OpenAI"
echo "   📊 流程化指导 - 智能整合 → 批量提炼 → 知识图谱"
echo "   🎨 可视化界面 - 美观的分析结果展示"
echo ""
echo "🔧 推荐的使用流程:"
echo "   1️⃣  首次使用: 点击'智能整合'优化现有提示词"
echo "   2️⃣  定期执行: 点击'批量提炼'分析新增会话内容"  
echo "   3️⃣  项目总结: 点击'生成知识图谱'获得项目全貌"
echo ""
echo "💡 本地Claude分析器优势:"
echo "   ⚡ 更快的分析速度 (无网络延迟)"
echo "   🎯 更准确的技术理解 (无幻觉问题)"
echo "   🔒 更好的隐私保护 (数据不出本地)"
echo "   💰 零API费用 (完全免费使用)"
echo ""

# 检查依赖
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
fi

if [ ! -d "out" ]; then
    echo "🔨 编译 TypeScript..."
    npm run build
fi

echo "🌐 启动Web服务器..."
echo "   📍 访问地址: http://localhost:3001"
echo "   🎛️  智能分析: 点击'智能分析'标签页开始"
echo ""
echo "⚠️  注意事项:"
echo "   • 首次使用建议选择'本地Claude分析器'"
echo "   • 按照1→2→3的流程顺序进行分析"
echo "   • 分析结果会自动保存到项目目录"
echo ""
echo "🎉 准备就绪！正在启动服务器..."
echo "=================================================="

# 启动服务器
node out/webManager.js --port 3001 