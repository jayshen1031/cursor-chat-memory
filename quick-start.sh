#!/bin/bash

# 🚀 Cursor聊天数据提取 - 快速启动脚本
# 作者: AI Assistant
# 功能: 提供所有工具的便捷访问

echo "🚀 Cursor聊天数据提取工具包"
echo "================================"
echo ""

# 检查依赖
check_dependencies() {
    echo "🔍 检查依赖..."
    
    if ! command -v python3 &> /dev/null; then
        echo "❌ 需要Python3，请先安装"
        exit 1
    fi
    
    if ! command -v sqlite3 &> /dev/null; then
        echo "❌ 需要SQLite3，请先安装"
        exit 1
    fi
    
    echo "✅ 依赖检查通过"
    echo ""
}

# 显示菜单
show_menu() {
    echo "请选择操作："
    echo "1. 🔍 快速扫描 - 扫描所有Cursor数据"
    echo "2. ⚡ 动态提取 - 提取聊天记录(推荐)"
    echo "3. 📊 完整提取 - 针对特定数据库"
    echo "4. 🧪 快速测试 - 验证配对效果"
    echo "5. 📈 详细分析 - 完整SQL分析"
    echo "6. 📋 查看结果 - 查看最新的CSV文件"
    echo "7. 📄 查看文档 - 打开完整指南"
    echo "8. 🔄 实时监控 - 监控Cursor变化"
    echo "9. ❓ 获取帮助"
    echo "0. 🚪 退出"
    echo ""
    read -p "请输入选项 (0-9): " choice
}

# 快速扫描
quick_scan() {
    echo "🔍 开始快速扫描..."
    if [ -f "./scan-cursor-data.sh" ]; then
        chmod +x ./scan-cursor-data.sh
        ./scan-cursor-data.sh
    else
        echo "❌ 扫描脚本不存在"
    fi
}

# 动态提取
dynamic_extract() {
    echo "⚡ 开始动态提取..."
    if [ -f "./generate-dynamic-records.py" ]; then
        python3 generate-dynamic-records.py
        echo ""
        echo "✅ 提取完成！文件: cursor_chat_records_dynamic.csv"
        echo "📊 快速预览:"
        head -5 cursor_chat_records_dynamic.csv 2>/dev/null || echo "❌ 文件不存在"
    else
        echo "❌ 动态提取脚本不存在"
    fi
}

# 完整提取
complete_extract() {
    echo "📊 开始完整提取..."
    if [ -f "./extract_complete_records.py" ]; then
        python3 extract_complete_records.py
        echo ""
        echo "✅ 提取完成！文件: cursor_chat_records_complete.csv"
        echo "📊 快速统计:"
        if [ -f "cursor_chat_records_complete.csv" ]; then
            lines=$(wc -l < cursor_chat_records_complete.csv)
            echo "   总记录数: $((lines-1))"
            answered=$(grep -v "\[无AI回答\]" cursor_chat_records_complete.csv | wc -l)
            echo "   有回答记录: $((answered-1))"
        fi
    else
        echo "❌ 完整提取脚本不存在"
    fi
}

# 快速测试
quick_test() {
    echo "🧪 开始快速测试..."
    
    # 查找数据库
    cursor_dir="$HOME/Library/Application Support/Cursor/User/workspaceStorage"
    if [ -d "$cursor_dir" ]; then
        db_path=$(find "$cursor_dir" -name "state.vscdb" | head -1)
        if [ -n "$db_path" ]; then
            echo "📂 找到数据库: $db_path"
            if [ -f "./test-qa-correlation.sql" ]; then
                sqlite3 "$db_path" < test-qa-correlation.sql
            else
                echo "❌ 测试查询文件不存在"
            fi
        else
            echo "❌ 未找到数据库文件"
        fi
    else
        echo "❌ Cursor目录不存在"
    fi
}

# 详细分析
detailed_analysis() {
    echo "📈 开始详细分析..."
    
    cursor_dir="$HOME/Library/Application Support/Cursor/User/workspaceStorage"
    if [ -d "$cursor_dir" ]; then
        db_path=$(find "$cursor_dir" -name "state.vscdb" | head -1)
        if [ -n "$db_path" ]; then
            echo "📂 使用数据库: $db_path"
            if [ -f "./correlate-qa-pairs.sql" ]; then
                echo "💾 保存分析结果到: detailed_analysis.txt"
                sqlite3 "$db_path" < correlate-qa-pairs.sql > detailed_analysis.txt
                echo "✅ 分析完成！"
                echo ""
                echo "📊 分析概览:"
                head -20 detailed_analysis.txt
            else
                echo "❌ 详细分析查询文件不存在"
            fi
        else
            echo "❌ 未找到数据库文件"
        fi
    else
        echo "❌ Cursor目录不存在"
    fi
}

# 查看结果
view_results() {
    echo "📋 查看结果文件..."
    echo ""
    
    # 查找CSV文件
    csv_files=(cursor_chat_records_*.csv)
    
    if [ ${#csv_files[@]} -eq 0 ] || [ ! -f "${csv_files[0]}" ]; then
        echo "❌ 未找到CSV结果文件"
        echo "💡 建议先运行选项2或3进行数据提取"
        return
    fi
    
    echo "📁 找到的CSV文件:"
    for file in "${csv_files[@]}"; do
        if [ -f "$file" ]; then
            size=$(wc -l < "$file")
            echo "   $file (记录数: $((size-1)))"
        fi
    done
    
    echo ""
    latest_file="${csv_files[-1]}"
    echo "📊 最新文件预览: $latest_file"
    echo "----------------------------------------"
    head -10 "$latest_file"
    echo "----------------------------------------"
    echo ""
    
    read -p "是否在默认应用中打开? (y/n): " open_choice
    if [ "$open_choice" = "y" ] || [ "$open_choice" = "Y" ]; then
        open "$latest_file"
    fi
}

# 查看文档
view_docs() {
    echo "📄 打开完整解决方案指南..."
    if [ -f "README-完整解决方案.md" ]; then
        open "README-完整解决方案.md"
    else
        echo "❌ 文档文件不存在"
    fi
}

# 实时监控
real_time_monitor() {
    echo "🔄 启动实时监控..."
    
    if ! command -v fswatch &> /dev/null; then
        echo "❌ 需要安装fswatch: brew install fswatch"
        return
    fi
    
    if [ -f "./monitor-cursor-changes.sh" ]; then
        chmod +x ./monitor-cursor-changes.sh
        ./monitor-cursor-changes.sh
    else
        echo "❌ 监控脚本不存在"
    fi
}

# 获取帮助
show_help() {
    echo "❓ 帮助信息"
    echo "============"
    echo ""
    echo "📚 工具说明:"
    echo "   1. 快速扫描: 扫描Cursor目录，找到所有相关数据库"
    echo "   2. 动态提取: 自动检测记录数量，适合任何规模的数据"
    echo "   3. 完整提取: 针对特定数据库的完整提取"
    echo "   4. 快速测试: 验证问答配对效果"
    echo "   5. 详细分析: 生成完整的SQL分析报告"
    echo "   6. 查看结果: 预览和打开CSV结果文件"
    echo "   7. 查看文档: 打开完整的使用指南"
    echo "   8. 实时监控: 监控Cursor数据变化(需要fswatch)"
    echo ""
    echo "🎯 推荐流程:"
    echo "   首次使用: 1 → 2 → 6"
    echo "   日常使用: 2 → 6"
    echo "   深度分析: 5 → 查看detailed_analysis.txt"
    echo ""
    echo "📂 输出文件:"
    echo "   cursor_chat_records_dynamic.csv   - 动态提取结果"
    echo "   cursor_chat_records_complete.csv  - 完整提取结果"
    echo "   detailed_analysis.txt             - 详细分析报告"
    echo ""
    echo "🔗 更多信息请查看: README-完整解决方案.md"
}

# 主循环
main() {
    check_dependencies
    
    while true; do
        show_menu
        
        case $choice in
            1) quick_scan ;;
            2) dynamic_extract ;;
            3) complete_extract ;;
            4) quick_test ;;
            5) detailed_analysis ;;
            6) view_results ;;
            7) view_docs ;;
            8) real_time_monitor ;;
            9) show_help ;;
            0) 
                echo "👋 再见！"
                exit 0
                ;;
            *)
                echo "❌ 无效选项，请重试"
                ;;
        esac
        
        echo ""
        read -p "按Enter继续..."
        echo ""
    done
}

# 启动脚本
main 