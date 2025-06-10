#!/bin/bash

# DBeaver 安装脚本
# 提供多种安装方法

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                    📊 DBeaver 安装助手                         ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo
}

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

check_homebrew() {
    if command -v brew &> /dev/null; then
        print_success "Homebrew 已安装"
        return 0
    else
        print_warning "Homebrew 未安装"
        return 1
    fi
}

install_homebrew() {
    print_info "正在安装 Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # 添加 Homebrew 到 PATH
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
    eval "$(/opt/homebrew/bin/brew shellenv)"
    
    print_success "Homebrew 安装完成"
}

install_dbeaver_homebrew() {
    print_info "使用 Homebrew 安装 DBeaver Community Edition..."
    
    if check_homebrew; then
        brew install --cask dbeaver-community
        print_success "DBeaver 安装完成"
    else
        print_error "Homebrew 不可用，请使用其他安装方法"
        return 1
    fi
}

install_dbeaver_download() {
    print_info "准备下载 DBeaver..."
    
    # 获取最新版本信息
    DOWNLOAD_URL="https://dbeaver.io/files/dbeaver-ce-latest-macos-x86_64.dmg"
    DMG_FILE="dbeaver-ce-latest-macos.dmg"
    
    print_info "下载 DBeaver DMG 文件..."
    curl -L -o "$DMG_FILE" "$DOWNLOAD_URL"
    
    print_info "挂载 DMG 文件..."
    hdiutil attach "$DMG_FILE"
    
    print_info "复制应用到 Applications 文件夹..."
    cp -R "/Volumes/DBeaver/DBeaver.app" "/Applications/"
    
    print_info "卸载 DMG 文件..."
    hdiutil detach "/Volumes/DBeaver"
    
    print_info "清理下载文件..."
    rm "$DMG_FILE"
    
    print_success "DBeaver 安装完成"
}

verify_installation() {
    if [ -d "/Applications/DBeaver.app" ]; then
        print_success "DBeaver 安装验证成功"
        print_info "版本信息:"
        /Applications/DBeaver.app/Contents/MacOS/dbeaver -version 2>/dev/null || echo "  无法获取版本信息"
        return 0
    else
        print_error "DBeaver 安装验证失败"
        return 1
    fi
}

create_connection_script() {
    print_info "创建 DBeaver 连接脚本..."
    
    cat > "scripts/open-dbeaver-connection.sh" << 'EOF'
#!/bin/bash

# 自动打开 DBeaver 并连接到 Cursor 数据库

DB_PATH="/Users/jay/Library/Application Support/Cursor/User/workspaceStorage/e76c6a8343ed4d7d7b8f77651bad3214/state.vscdb"

# 检查数据库文件是否存在
if [ ! -f "$DB_PATH" ]; then
    echo "❌ 数据库文件不存在: $DB_PATH"
    exit 1
fi

# 检查 Cursor 是否在运行
if pgrep -f "Cursor" > /dev/null; then
    echo "⚠️  警告: Cursor 正在运行，建议关闭后再访问数据库"
    read -p "是否继续? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 启动 DBeaver
echo "🚀 启动 DBeaver..."
open -a DBeaver

echo "💡 连接配置信息:"
echo "   数据库类型: SQLite"
echo "   数据库路径: $DB_PATH"
echo "   建议设置: Read-only connection"
echo ""
echo "📋 请在 DBeaver 中手动创建连接，或导入配置文件"
EOF

    chmod +x "scripts/open-dbeaver-connection.sh"
    print_success "连接脚本创建完成: scripts/open-dbeaver-connection.sh"
}

create_connection_config() {
    print_info "创建 DBeaver 连接配置文件..."
    
    mkdir -p "config/dbeaver"
    
    cat > "config/dbeaver/cursor-connection.json" << EOF
{
  "connection": {
    "name": "Cursor Chat Database",
    "driver": "sqlite_jdbc",
    "url": "jdbc:sqlite:/Users/jay/Library/Application Support/Cursor/User/workspaceStorage/e76c6a8343ed4d7d7b8f77651bad3214/state.vscdb",
    "properties": {
      "read_only": "true"
    },
    "description": "⚠️ Cursor Chat Database - READ ONLY\\n请在 Cursor 关闭时访问\\n备份路径: ./backups/"
  }
}
EOF

    print_success "连接配置文件创建完成: config/dbeaver/cursor-connection.json"
}

show_usage_guide() {
    print_info "DBeaver 使用指南:"
    echo
    echo -e "${YELLOW}📋 连接步骤:${NC}"
    echo "1. 启动 DBeaver: open -a DBeaver"
    echo "2. 创建新连接: Cmd + Shift + N"
    echo "3. 选择 SQLite 数据库类型"
    echo "4. 配置数据库路径:"
    echo "   /Users/jay/Library/Application Support/Cursor/User/workspaceStorage/e76c6a8343ed4d7d7b8f77651bad3214/state.vscdb"
    echo "5. 启用只读模式: ☑️ Read-only connection"
    echo "6. 测试连接并完成配置"
    echo
    echo -e "${YELLOW}📊 常用查询:${NC}"
    echo "• 查看聊天数据: SELECT * FROM ItemTable WHERE key LIKE '%chat%';"
    echo "• 查看提示词: SELECT value FROM ItemTable WHERE key = 'aiService.prompts';"
    echo "• 数据统计: SELECT COUNT(*) FROM ItemTable;"
    echo
    echo -e "${YELLOW}🛠️ 便捷脚本:${NC}"
    echo "• 启动连接: ./scripts/open-dbeaver-connection.sh"
    echo "• 配置文件: config/dbeaver/cursor-connection.json"
    echo "• 详细指南: docs/dbeaver-cursor-connection-guide.md"
}

# 主菜单
show_menu() {
    print_header
    echo -e "${YELLOW}请选择安装方法:${NC}"
    echo
    echo "1) 🍺 使用 Homebrew 安装 (推荐)"
    echo "2) 📥 直接下载安装"
    echo "3) 🔍 仅检查是否已安装"
    echo "4) 📋 显示使用指南"
    echo "5) 🚪 退出"
    echo
    read -p "请输入选择 (1-5): " choice
    
    case $choice in
        1)
            if check_homebrew; then
                install_dbeaver_homebrew
            else
                print_warning "Homebrew 未安装，是否先安装 Homebrew? (y/N)"
                read -r answer
                if [[ $answer =~ ^[Yy]$ ]]; then
                    install_homebrew
                    install_dbeaver_homebrew
                else
                    print_info "跳过 Homebrew 安装，请选择其他方法"
                fi
            fi
            ;;
        2)
            install_dbeaver_download
            ;;
        3)
            verify_installation
            ;;
        4)
            show_usage_guide
            ;;
        5)
            print_info "退出安装程序"
            exit 0
            ;;
        *)
            print_error "无效选择，请重新输入"
            show_menu
            ;;
    esac
}

# 安装后配置
post_install() {
    if verify_installation; then
        create_connection_script
        create_connection_config
        show_usage_guide
        
        echo
        print_success "🎉 DBeaver 安装和配置完成！"
        print_info "现在可以使用 ./scripts/open-dbeaver-connection.sh 启动连接"
    else
        print_error "安装验证失败，请检查安装过程"
    fi
}

# 主程序
main() {
    # 检查是否已安装
    if verify_installation 2>/dev/null; then
        print_success "DBeaver 已经安装"
        print_info "是否重新配置连接? (y/N)"
        read -r answer
        if [[ $answer =~ ^[Yy]$ ]]; then
            create_connection_script
            create_connection_config
            show_usage_guide
        fi
    else
        show_menu
        post_install
    fi
}

# 如果直接运行脚本
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 