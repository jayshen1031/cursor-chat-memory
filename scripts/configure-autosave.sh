#!/bin/bash

# Cursor 自动保存配置脚本
# 提供便捷的命令行接口来管理 Cursor 的自动保存设置

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 检查 Node.js 是否安装
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
}

# 显示帮助信息
show_help() {
    cat << EOF
🔧 Cursor 自动保存配置工具
========================

用法: $0 [命令] [参数]

命令:
  status              查看当前自动保存设置
  set [间隔]          设置定时自动保存 (默认10分钟)
  focus              设置失去焦点时自动保存
  disable            禁用自动保存
  help               显示此帮助信息

支持的时间间隔:
  30秒, 1分钟, 5分钟, 10分钟, 15分钟, 30分钟

示例:
  $0 status           # 查看当前设置
  $0 set 10分钟       # 设置10分钟自动保存
  $0 set 5分钟        # 设置5分钟自动保存
  $0 focus           # 设置失去焦点时保存
  $0 disable         # 禁用自动保存

EOF
}

# 主函数
main() {
    local command="${1:-status}"
    local interval="${2:-10分钟}"
    
    print_info "Cursor 自动保存配置工具"
    echo
    
    check_nodejs
    
    case "$command" in
        "status")
            node scripts/auto-save-manager.js status
            ;;
        "set")
            print_info "设置自动保存间隔为: $interval"
            node scripts/auto-save-manager.js set "$interval"
            ;;
        "focus")
            print_info "设置失去焦点时自动保存"
            node scripts/auto-save-manager.js focus
            ;;
        "disable")
            print_info "禁用自动保存"
            node scripts/auto-save-manager.js disable
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "未知命令: $command"
            echo
            show_help
            exit 1
            ;;
    esac
    
    echo
    print_success "操作完成！重启 Cursor 以应用新设置。"
}

# 运行主函数
main "$@" 