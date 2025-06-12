#!/bin/bash

# 🚀 Cursor Chat Memory - 增强版启动脚本 (包含修复后数据功能)
echo "🚀 Cursor Chat Memory - 增强版智能分析系统"
echo "============================================="
echo ""
echo "🎯 系统功能概览:"
echo "   📊 数据提取 - 自动提取Cursor聊天数据"
echo "   🔧 数据修复 - 修复时间戳问题，显示真实对话"
echo "   🔗 智能关联 - 精确的问答配对机制" 
echo "   📈 深度分析 - 基于项目的智能分析"
echo "   🌐 Web界面 - 美观的可视化管理"
echo ""

# 检查系统环境
check_environment() {
    echo "🔍 检查系统环境..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ 需要Node.js，请先安装"
        exit 1
    fi
    
    echo "✅ 系统环境检查通过"
}

# 检查依赖
check_dependencies() {
    echo ""
    echo "📦 检查依赖..."
    
    # 检查better-sqlite3
    if ! node -e "require('better-sqlite3')" 2>/dev/null; then
        echo "   📥 安装better-sqlite3..."
        npm install better-sqlite3
    fi
    
    echo "✅ 依赖检查完成"
}

# 显示数据统计
show_data_statistics() {
    echo ""
    echo "📈 数据统计概览:"
    
    # 检查Cursor数据是否存在
    cursor_dir="$HOME/Library/Application Support/Cursor/User/workspaceStorage"
    if [ -d "$cursor_dir" ]; then
        db_count=$(find "$cursor_dir" -name "state.vscdb" | wc -l)
        echo "   ✅ 找到 $db_count 个Cursor数据库"
        
        # 检查特定数据库
        specific_db="$cursor_dir/e76c6a8343ed4d7d7b8f77651bad3214/state.vscdb"
        if [ -f "$specific_db" ]; then
            echo "   ✅ 当前工作区数据库已找到"
            echo "   📍 数据库路径: $specific_db"
        else
            echo "   ⚠️  当前工作区数据库未找到，可能需要更新工作区ID"
        fi
    else
        echo "   ⚠️  未找到Cursor数据目录，请确保Cursor已安装并运行过"
    fi
}

# 显示使用指南
show_usage_guide() {
    echo ""
    echo "🎯 增强功能说明:"
    echo "================"
    echo ""
    echo "🔧 修复后数据功能 (新增):"
    echo "   • 解决Cursor时间戳显示问题"
    echo "   • 显示真实的今日对话内容"
    echo "   • 智能时间戳修复算法"
    echo "   • 中文时间格式显示"
    echo ""
    echo "🌐 Web界面访问方式:"
    echo "   • 主界面: http://localhost:3001"
    echo "   • 修复后数据: http://localhost:3001 (已集成)"
    echo "   • API接口: http://localhost:3001/api/cursor-data"
    echo ""
    echo "💡 推荐使用流程:"
    echo "   1️⃣  访问Web界面查看修复后的实际对话数据"
    echo "   2️⃣  确认今日对话内容已正确显示"
    echo "   3️⃣  使用智能分析功能处理数据"
    echo "   4️⃣  导出或进一步分析处理"
}

# 显示快捷操作菜单
show_quick_actions() {
    echo ""
    echo "⚡ 启动选项:"
    echo "============"
    echo ""
    echo "1. 🔧 启动修复后数据服务器 (推荐)"
    echo "2. 📊 查看数据统计"
    echo "3. ❓ 查看使用指南"  
    echo "4. 🚪 退出"
    echo ""
    read -p "请选择操作 (1-4, 默认1): " choice
    choice=${choice:-1}
    
    case $choice in
        1)
            echo ""
            echo "🚀 启动修复后数据服务器..."
            ;;
        2)
            show_data_statistics
            echo ""
            read -p "按Enter继续启动服务器..."
            ;;
        3)
            show_usage_guide
            echo ""
            read -p "按Enter继续启动服务器..."
            ;;
        4)
            echo "👋 已退出"
            exit 0
            ;;
        *)
            echo "🚀 默认启动服务器..."
            ;;
    esac
}

# 启动Web服务
start_web_server() {
    echo ""
    echo "🌐 启动修复后数据Web服务器..."
    echo "================================"
    echo ""
    echo "📍 访问地址: http://localhost:3001"
    echo "🔧 功能特色:"
    echo "   • ✅ 修复时间戳显示问题"
    echo "   • 📅 正确显示今日对话内容"
    echo "   • 🕰️ 中文时间格式"
    echo "   • 📊 实时数据统计"
    echo "   • 🔄 数据刷新功能"
    echo ""
    echo "🎉 服务器启动中..."
    echo "=================================================="
    echo ""
    
    # 检查quick-web-server.js是否存在
    if [ -f "quick-web-server.js" ]; then
        node quick-web-server.js
    else
        echo "❌ quick-web-server.js 文件不存在"
        echo "请确保文件已正确创建"
        exit 1
    fi
}

# 主函数
main() {
    # 系统检查
    check_environment
    
    # 检查依赖
    check_dependencies
    
    # 显示数据统计
    show_data_statistics
    
    # 显示快捷操作菜单
    show_quick_actions
    
    # 启动Web服务
    start_web_server
}

# 执行主函数
main 