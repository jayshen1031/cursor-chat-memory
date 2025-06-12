#!/bin/bash

# 🚀 Memory Bank 新项目部署脚本
# 快速将Memory Bank系统部署到新项目中

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示帮助信息
show_help() {
    cat << EOF
🚀 Memory Bank 新项目部署脚本

用法:
    ./deploy-to-new-project.sh <target-directory> [project-name]

参数:
    target-directory    目标项目目录 (必需)
    project-name       项目名称 (可选，默认使用目录名)

示例:
    ./deploy-to-new-project.sh /path/to/my-new-project
    ./deploy-to-new-project.sh ~/projects/my-app "My Awesome App"

选项:
    -h, --help         显示此帮助信息
    --clean           清空目标目录中的旧Memory Bank (谨慎使用)
    --no-git          跳过Git初始化
    --no-install      跳过npm依赖安装

EOF
}

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装。请先安装 Node.js (>= 18.0.0)"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js 版本过低 (当前: $(node --version), 需要: >= 18.0.0)"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装。请先安装 npm"
        exit 1
    fi
    
    log_success "系统依赖检查通过"
}

# 解析命令行参数
parse_arguments() {
    CLEAN_MODE=false
    NO_GIT=false
    NO_INSTALL=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            --clean)
                CLEAN_MODE=true
                shift
                ;;
            --no-git)
                NO_GIT=true
                shift
                ;;
            --no-install)
                NO_INSTALL=true
                shift
                ;;
            *)
                if [ -z "$TARGET_DIR" ]; then
                    TARGET_DIR="$1"
                elif [ -z "$PROJECT_NAME" ]; then
                    PROJECT_NAME="$1"
                else
                    log_error "未知参数: $1"
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    if [ -z "$TARGET_DIR" ]; then
        log_error "缺少目标目录参数"
        show_help
        exit 1
    fi
    
    # 默认项目名称
    if [ -z "$PROJECT_NAME" ]; then
        PROJECT_NAME=$(basename "$TARGET_DIR")
    fi
}

# 获取源目录路径 (在改变目录之前)
get_source_directory() {
    # 获取脚本所在目录的绝对路径 (兼容macOS)
    if [ -L "$0" ]; then
        # 如果是符号链接，获取真实路径
        SCRIPT_SOURCE_DIR="$(dirname "$(readlink "$0")")"
        if [[ "$SCRIPT_SOURCE_DIR" != /* ]]; then
            # 相对路径，需要转换为绝对路径
            SCRIPT_SOURCE_DIR="$(cd "$(dirname "$0")/$(dirname "$(readlink "$0")")" && pwd)"
        fi
    else
        # 获取脚本所在目录的绝对路径
        SCRIPT_SOURCE_DIR="$(cd "$(dirname "$0")" && pwd)"
    fi
    
    log_info "脚本源目录: $SCRIPT_SOURCE_DIR"
}

# 创建目标目录
setup_target_directory() {
    log_info "设置目标目录: $TARGET_DIR"
    
    if [ -d "$TARGET_DIR" ]; then
        if [ "$CLEAN_MODE" = true ]; then
            log_warning "清空模式：删除现有Memory Bank文件..."
            rm -rf "$TARGET_DIR/memory-bank" || true
            rm -f "$TARGET_DIR/src/mcp-server.js" || true
            rm -f "$TARGET_DIR/cursor-mcp-config.json" || true
        fi
    else
        mkdir -p "$TARGET_DIR"
        log_success "创建目录: $TARGET_DIR"
    fi
    
    cd "$TARGET_DIR"
}

# 复制核心文件
copy_core_files() {
    log_info "复制Memory Bank核心文件..."
    
    log_info "源目录: $SCRIPT_SOURCE_DIR"
    log_info "当前目录: $(pwd)"
    
    # 复制Memory Bank目录
    if [ -d "$SCRIPT_SOURCE_DIR/memory-bank" ]; then
        cp -r "$SCRIPT_SOURCE_DIR/memory-bank" .
        log_success "复制Memory Bank目录"
    else
        log_error "源目录中找不到memory-bank文件夹: $SCRIPT_SOURCE_DIR/memory-bank"
        log_info "可用文件列表:"
        ls -la "$SCRIPT_SOURCE_DIR/" || true
        exit 1
    fi
    
    # 创建src目录并复制MCP服务器
    mkdir -p src
    if [ -f "$SCRIPT_SOURCE_DIR/src/mcp-server.js" ]; then
        cp "$SCRIPT_SOURCE_DIR/src/mcp-server.js" src/
        log_success "复制MCP服务器文件"
    else
        log_error "源目录中找不到src/mcp-server.js"
        exit 1
    fi
    
    # 复制配置文件
    if [ -f "$SCRIPT_SOURCE_DIR/cursor-mcp-config.json" ]; then
        cp "$SCRIPT_SOURCE_DIR/cursor-mcp-config.json" .
        log_success "复制MCP配置文件"
    fi
}

# 创建package.json
create_package_json() {
    log_info "创建项目package.json..."
    
    PROJECT_SLUG=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')
    
    cat > package.json << EOF
{
  "name": "${PROJECT_SLUG}-memory-bank",
  "version": "1.0.0",
  "description": "${PROJECT_NAME} Memory Bank with Cursor Integration",
  "type": "module",
  "main": "src/mcp-server.js",
  "scripts": {
    "start": "node src/mcp-server.js",
    "sync": "node src/mcp-server.js sync",
    "status": "node src/mcp-server.js status",
    "sync:today": "node src/mcp-server.js sync today",
    "sync:week": "node src/mcp-server.js sync week",
    "analyze": "node src/mcp-server.js analyze"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "sqlite3": "^5.1.6"
  },
  "keywords": ["mcp", "cursor", "memory", "ai", "${PROJECT_SLUG}"],
  "author": "$(git config user.name 2>/dev/null || echo 'Developer')",
  "license": "MIT"
}
EOF
    
    log_success "创建package.json"
}

# 自定义项目配置
customize_project_config() {
    log_info "自定义项目配置..."
    
    # 更新projectContext.md
    cat > memory-bank/projectContext.md << EOF
# 项目上下文

> 自动分析项目的核心功能和技术架构

## 项目概述

${PROJECT_NAME} - [请添加项目简短描述]

## 核心功能

- [功能1 - 请替换为实际功能]
- [功能2 - 请替换为实际功能]
- [功能3 - 请替换为实际功能]

## 技术架构

- **前端**: [请添加前端技术栈]
- **后端**: [请添加后端技术栈]
- **数据库**: [请添加数据库类型]
- **部署**: [请添加部署方式]

## 项目特色

- **技术亮点**: [请添加技术亮点]
- **业务价值**: [请添加业务价值]
- **创新点**: [请添加创新点]

*此文件由MCP Server自动维护*

## 设置提醒

⚠️ **请自定义以上内容以匹配您的项目！**

1. 更新项目概述
2. 填写核心功能
3. 完善技术架构
4. 描述项目特色
EOF
    
    # 重置其他文件为模板状态
    cat > memory-bank/learningInsights.md << 'EOF'
# 学习洞察

> 从对话中提取的学习要点

## 项目特定学习

- 项目相关的技术学习要点
- 业务逻辑理解
- 架构设计思考

## 技术栈学习

- 前端技术学习心得
- 后端技术最佳实践
- 数据库设计原则

*此文件由MCP Server自动维护*
EOF
    
    cat > memory-bank/problemSolutions.md << 'EOF'
# 问题解决方案

> 记录遇到的问题和解决方案

## 常见问题

### 环境配置问题
- **问题**: 开发环境配置相关问题
- **解决**: 具体解决步骤

### 依赖安装问题
- **问题**: npm/pip/composer 依赖问题
- **解决**: 解决方案和最佳实践

*此文件由MCP Server自动维护*
EOF
    
    cat > memory-bank/codePatterns.md << 'EOF'
# 代码模式

> 识别的代码模式和最佳实践

## 项目代码模式

- 项目特定的编程模式
- 代码组织结构
- 最佳实践总结

## 通用模式

- 错误处理机制
- 数据处理模式
- 性能优化技巧

*此文件由MCP Server自动维护*
EOF
    
    # 清空活动记录
    cat > memory-bank/recentActivity.md << 'EOF'
# 最近活动

> 记录最近的开发活动和讨论

## 今日活动

*待MCP Server自动更新*

## 本周活动

*待MCP Server自动更新*

*此文件由MCP Server自动维护*
EOF
    
    cat > memory-bank/technicalDecisions.md << 'EOF'
# 技术决策

> 记录重要的技术选择和架构决策

## 初始技术选择

- 选择的技术栈及理由
- 架构设计思路
- 关键技术决策

*此文件由MCP Server自动维护*
EOF
    
    log_success "项目配置自定义完成"
}

# 安装依赖
install_dependencies() {
    if [ "$NO_INSTALL" = true ]; then
        log_warning "跳过依赖安装 (--no-install)"
        return
    fi
    
    log_info "安装npm依赖..."
    
    if npm install; then
        log_success "依赖安装完成"
    else
        log_error "依赖安装失败"
        exit 1
    fi
}

# Git初始化
init_git() {
    if [ "$NO_GIT" = true ]; then
        log_warning "跳过Git初始化 (--no-git)"
        return
    fi
    
    if [ ! -d ".git" ]; then
        log_info "初始化Git仓库..."
        git init
        
        # 创建.gitignore
        cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*

# Memory Bank临时文件
memory-bank/.temp/
*.temp.md

# 系统文件
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# 环境配置
.env
.env.local
.env.production

# 日志
logs/
*.log
EOF
        
        git add .
        git commit -m "feat: initialize Memory Bank system for ${PROJECT_NAME}"
        log_success "Git仓库初始化完成"
    else
        log_info "Git仓库已存在，添加Memory Bank文件..."
        git add memory-bank/ src/mcp-server.js package.json cursor-mcp-config.json
        git commit -m "feat: add Memory Bank system to existing project" || true
    fi
}

# 创建README
create_readme() {
    if [ ! -f "README.md" ]; then
        log_info "创建项目README..."
        
        cat > README.md << EOF
# ${PROJECT_NAME}

[项目简短描述]

## 🧠 Memory Bank System

本项目集成了智能Memory Bank系统，用于：
- 🔍 自动提取和分析Cursor聊天历史
- 📚 积累项目知识和经验
- 🔧 记录问题解决方案
- 💡 总结代码模式和最佳实践

### 快速开始

\`\`\`bash
# 启动Memory Bank MCP服务器
npm start

# 同步今日聊天数据
npm run sync:today

# 查看Memory Bank状态
npm run status
\`\`\`

### Memory Bank文件说明

- \`memory-bank/quickReference.md\` - 🎯 快速引用指南
- \`memory-bank/projectContext.md\` - 📋 项目概览
- \`memory-bank/learningInsights.md\` - 🧠 学习洞察
- \`memory-bank/problemSolutions.md\` - 🔧 问题解决方案
- \`memory-bank/codePatterns.md\` - 💻 代码模式
- \`memory-bank/technicalDecisions.md\` - 📊 技术决策
- \`memory-bank/recentActivity.md\` - ⏰ 最近活动

### 使用建议

1. **首次使用**：编辑 \`memory-bank/projectContext.md\` 添加项目信息
2. **日常开发**：遇到问题时查看 \`problemSolutions.md\`
3. **定期维护**：每周运行 \`npm run sync:week\` 同步数据

## 项目结构

\`\`\`
${PROJECT_NAME}/
├── src/
│   └── mcp-server.js          # MCP服务器
├── memory-bank/               # Memory Bank核心
│   ├── quickReference.md      # 引用指南
│   └── ...                    # 其他Memory Bank文件
├── package.json
└── README.md
\`\`\`

## 开发

[添加开发相关说明]

## 部署

[添加部署相关说明]

## 贡献

[添加贡献指南]

## 许可证

MIT License
EOF
        
        log_success "创建项目README"
    fi
}

# 验证安装
verify_installation() {
    log_info "验证安装..."
    
    # 检查关键文件
    local files=(
        "memory-bank/quickReference.md"
        "memory-bank/projectContext.md"
        "src/mcp-server.js"
        "package.json"
    )
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            log_success "✅ $file"
        else
            log_error "❌ $file 缺失"
            return 1
        fi
    done
    
    # 测试MCP服务器语法
    if node -c src/mcp-server.js; then
        log_success "✅ MCP服务器语法检查通过"
    else
        log_error "❌ MCP服务器语法错误"
        return 1
    fi
    
    log_success "安装验证完成"
}

# 显示后续步骤
show_next_steps() {
    log_success "🎉 Memory Bank系统部署完成！"
    
    cat << EOF

📋 后续步骤:

1. 📝 自定义项目信息:
   编辑 memory-bank/projectContext.md

2. 🚀 启动MCP服务器:
   cd $(realpath "$TARGET_DIR")
   npm start

3. 🔗 配置Cursor:
   - 在Cursor设置中添加MCP服务器
   - 测试Memory Bank工具

4. 📊 同步数据:
   npm run sync:today

5. 📖 查看使用指南:
   cat NEW_PROJECT_SETUP_GUIDE.md

🎯 项目位置: $(realpath "$TARGET_DIR")
🧠 Memory Bank: $(realpath "$TARGET_DIR/memory-bank")

EOF
}

# 主函数
main() {
    echo "🚀 Memory Bank 新项目部署脚本"
    echo "================================"
    
    parse_arguments "$@"
    check_dependencies
    get_source_directory
    setup_target_directory
    copy_core_files
    create_package_json
    customize_project_config
    install_dependencies
    init_git
    create_readme
    verify_installation
    show_next_steps
}

# 运行主函数
main "$@" 