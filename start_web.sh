#!/bin/bash

# 🚀 Cursor Chat Memory - 完整解决方案启动脚本
# 集成数据提取、分析处理、Web界面的一体化系统

echo "🚀 Cursor Chat Memory - 完整智能分析系统"
echo "============================================="
echo ""
echo "🎯 系统功能概览:"
echo "   📊 数据提取 - 自动提取Cursor聊天数据"
echo "   🔗 智能关联 - 精确的问答配对机制" 
echo "   📈 深度分析 - 基于项目的智能分析"
echo "   🌐 Web界面 - 美观的可视化管理"
echo ""

# 检查系统环境
check_environment() {
    echo "🔍 检查系统环境..."
    
    # 检查Python3
    if ! command -v python3 &> /dev/null; then
        echo "❌ 需要Python3，请先安装"
        exit 1
    fi
    
    # 检查SQLite3
    if ! command -v sqlite3 &> /dev/null; then
        echo "❌ 需要SQLite3，请先安装"
        exit 1
    fi
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ 需要Node.js，请先安装"
        exit 1
    fi
    
    echo "✅ 系统环境检查通过"
}

# 初始化数据提取
initialize_data_extraction() {
    echo ""
    echo "📊 初始化数据提取模块..."
    
    # 给脚本添加执行权限
    chmod +x scan-cursor-data.sh 2>/dev/null
    chmod +x monitor-cursor-changes.sh 2>/dev/null
    chmod +x extract-cursor-chats.sh 2>/dev/null
    chmod +x quick-start.sh 2>/dev/null
    
    # 检查Cursor数据是否存在
    cursor_dir="$HOME/Library/Application Support/Cursor/User/workspaceStorage"
    if [ -d "$cursor_dir" ]; then
        db_count=$(find "$cursor_dir" -name "state.vscdb" | wc -l)
        echo "   ✅ 找到 $db_count 个Cursor数据库"
        
        # 如果没有CSV文件，尝试自动提取
        if [ ! -f "cursor_chat_records_dynamic.csv" ] && [ ! -f "cursor_chat_records_complete.csv" ]; then
            echo "   🔄 自动提取聊天数据..."
            if [ -f "generate-dynamic-records.py" ]; then
                python3 generate-dynamic-records.py > /dev/null 2>&1
                if [ -f "cursor_chat_records_dynamic.csv" ]; then
                    records=$(wc -l < cursor_chat_records_dynamic.csv)
                    echo "   ✅ 成功提取 $((records-1)) 条聊天记录"
                else
                    echo "   ⚠️  自动提取失败，建议手动运行数据提取"
                fi
            fi
        else
            echo "   ✅ 发现现有聊天数据文件"
        fi
    else
        echo "   ⚠️  未找到Cursor数据目录，请确保Cursor已安装并运行过"
    fi
}

# 显示数据统计
show_data_statistics() {
    echo ""
    echo "📈 数据统计概览:"
    
    # 统计CSV文件
    csv_files=(cursor_chat_records_*.csv)
    if [ -f "${csv_files[0]}" ]; then
        total_records=0
        for file in "${csv_files[@]}"; do
            if [ -f "$file" ]; then
                records=$(wc -l < "$file")
                echo "   📄 $file: $((records-1)) 条记录"
                total_records=$((total_records + records - 1))
            fi
        done
        echo "   📊 总计: $total_records 条聊天记录"
    else
        echo "   ❌ 未找到聊天记录文件"
        echo "   💡 建议运行: ./quick-start.sh 进行数据提取"
    fi
    
    # 统计SQL文件
    if [ -f "correlate-qa-pairs.sql" ]; then
        echo "   ✅ 完整SQL分析查询已就绪"
    fi
    
    if [ -f "test-qa-correlation.sql" ]; then
        echo "   ✅ 快速测试查询已就绪"
    fi
}

# 设置Web环境
setup_web_environment() {
    echo ""
    echo "🌐 设置Web环境..."
    
    if [ ! -d "node_modules" ]; then
        echo "   📦 安装Node.js依赖..."
        npm install
    fi
    
    if [ ! -d "out" ]; then
        echo "   🔨 编译TypeScript..."
        npm run build
    fi
    
    echo "   ✅ Web环境准备完成"
}

# 显示使用指南
show_usage_guide() {
    echo ""
    echo "🎯 使用指南:"
    echo "============"
    echo ""
    echo "📊 数据提取工具 (可随时使用):"
    echo "   • ./quick-start.sh          - 一键启动脚本(推荐)"
    echo "   • python3 generate-dynamic-records.py  - 动态提取"
    echo "   • python3 extract_complete_records.py  - 完整提取"
    echo ""
    echo "🌐 Web界面功能:"
    echo "   • 智能分析标签页  - 基于提取数据的AI分析"
    echo "   • 项目会话过滤    - 只分析当前项目相关对话"
    echo "   • 知识图谱生成    - 项目全貌可视化"
    echo ""
    echo "🔄 推荐工作流程:"
    echo "   1️⃣  数据提取: 使用数据提取工具获取最新聊天记录"
    echo "   2️⃣  智能整合: Web界面点击'智能整合'优化提示词"
    echo "   3️⃣  批量提炼: 定期点击'批量提炼'分析新内容"
    echo "   4️⃣  知识图谱: 生成项目全貌和总结报告"
    echo ""
    echo "💡 高级功能:"
    echo "   • 本地Claude分析器 - 快速、准确、免费"
    echo "   • 实时数据监控     - 自动检测Cursor数据变化"
    echo "   • 多格式导出       - CSV、SQL、JSON等格式"
}

# 显示快捷操作菜单
show_quick_actions() {
    echo ""
    echo "⚡ 快捷操作 (启动Web服务后可用):"
    echo "================================"
    echo ""
    echo "在启动Web服务之前，你可以选择："
    echo "1. 🔄 更新聊天数据 - 运行数据提取工具"
    echo "2. 📊 查看数据统计 - 显示当前数据概览" 
    echo "3. 🚀 直接启动Web - 使用现有数据启动"
    echo "4. ❓ 查看帮助    - 显示详细使用指南"
    echo "5. 🚪 退出"
    echo ""
    read -p "请选择操作 (1-5, 默认3): " choice
    choice=${choice:-3}
    
    case $choice in
        1)
            echo ""
            echo "🔄 启动数据提取工具..."
            if [ -f "quick-start.sh" ]; then
                ./quick-start.sh
            else
                echo "❌ 数据提取工具不存在"
            fi
            echo ""
            read -p "按Enter继续启动Web服务..."
            ;;
        2)
            show_data_statistics
            echo ""
            read -p "按Enter继续启动Web服务..."
            ;;
        3)
            echo "🚀 直接启动Web服务..."
            ;;
        4)
            show_usage_guide
            echo ""
            read -p "按Enter继续启动Web服务..."
            ;;
        5)
            echo "👋 已退出"
            exit 0
            ;;
        *)
            echo "🚀 默认启动Web服务..."
            ;;
    esac
}

# 启动Web服务
start_web_server() {
    echo ""
    echo "🌐 启动Web服务器..."
    echo "==================="
    echo ""
    echo "📍 访问地址: http://localhost:3001"
    echo "🎛️  功能入口:"
    echo "   • 智能分析 - 基于提取数据的AI驱动分析"
    echo "   • 提示词中心 - 管理和优化提示词库"
    echo "   • 会话归档 - 查看和管理历史对话"
    echo ""
    echo "💎 数据提取工具 (随时可用):"
    echo "   • 新开终端运行: ./quick-start.sh"
    echo "   • 或直接运行: python3 generate-dynamic-records.py"
    echo ""
    echo "🎉 系统已就绪！正在启动服务器..."
    echo "=================================================="
    echo ""
    
    # 启动Node.js服务器
    node out/webManager.js --port 3001
}

# 主函数
main() {
    # 系统检查
    check_environment
    
    # 初始化数据提取
    initialize_data_extraction
    
    # 显示数据统计
    show_data_statistics
    
    # 设置Web环境
    setup_web_environment
    
    # 显示快捷操作菜单
    show_quick_actions
    
    # 启动Web服务
    start_web_server
}

# 执行主函数
main 