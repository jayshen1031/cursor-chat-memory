# Cursor Chat Memory 安装使用指南

## 🚀 快速安装

### 1. 克隆并编译项目

```bash
git clone <repository-url>
cd cursor-chat-memory
npm install
npm run compile
```

### 2. 安装 CLI 工具

```bash
# 运行安装脚本
./install-cli.sh
```

安装脚本会：
- 将编译后的文件复制到 `~/.cursor-memory/cli/`
- 尝试创建全局符号链接到 `/usr/local/bin/cursor-memory`（需要sudo权限）
- 如果全局安装失败，会安装到用户本地 `~/.local/bin/cursor-memory`

### 3. 配置 PATH（如果需要）

如果选择了本地安装，需要将 `~/.local/bin` 添加到 PATH：

```bash
# 添加到 ~/.zshrc 或 ~/.bashrc
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### 4. 验证安装

```bash
cursor-memory help
```

## 🏗️ 项目初始化

在任何项目目录中运行：

```bash
# 复制初始化脚本到项目或使用绝对路径
/path/to/cursor-chat-memory/init-project.sh
```

初始化脚本会：
- ✅ 自动检测 cursor-memory CLI 工具
- 📝 创建项目特定的配置文件 `cursor-memory.config.json`
- 🚀 生成便捷脚本 `cursor-memory.sh`（支持完整功能或简化版）
- 📋 添加必要的 .gitignore 规则

## 📋 使用方法

### 在已初始化项目中

```bash
# 查看项目相关会话
./cursor-memory.sh project-sessions

# 获取项目相关引用（默认使用 recent 模板）
./cursor-memory.sh project-reference

# 获取轻量级引用（控制token数量）
./cursor-memory.sh light-reference 2000

# 查看系统状态
./cursor-memory.sh status

# 查看所有可用命令
./cursor-memory.sh help
```

### 直接使用 CLI 工具

```bash
# 查看所有会话
cursor-memory list-sessions

# 按分类查看
cursor-memory list-sessions JavaScript

# 搜索相关会话
cursor-memory search "React优化"

# 使用模板生成引用
cursor-memory get-template recent
cursor-memory get-template current-topic "我正在做React项目"

# 项目特定功能
cursor-memory set-project /path/to/project
cursor-memory project-sessions
cursor-memory project-reference recent

# 获取轻量级引用
cursor-memory light-reference 3000

# 系统管理
cursor-memory status
cursor-memory refresh
cursor-memory categories
cursor-memory templates
```

## 🔧 故障排除

### 问题1: `cursor-memory CLI 未安装`

**解决方案:**
```bash
cd /path/to/cursor-chat-memory
npm run compile
./install-cli.sh
```

### 问题2: `command not found: cursor-memory`

**解决方案:**
1. 检查PATH设置：
```bash
echo $PATH | grep -q "$HOME/.local/bin" && echo "✅ PATH正确" || echo "❌ 需要添加PATH"
```

2. 如果需要，添加PATH：
```bash
export PATH="$HOME/.local/bin:$PATH"
# 或永久添加到 shell 配置文件
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
```

3. 使用完整路径：
```bash
~/.local/bin/cursor-memory help
# 或
~/.cursor-memory/cli/cursor-memory help
```

### 问题3: Node.js 模块错误

**解决方案:**
1. 确保所有依赖文件已复制：
```bash
ls -la ~/.cursor-memory/cli/
# 应该包含: cli.js, chatMemoryService.js, cursor-memory
```

2. 重新安装：
```bash
cd /path/to/cursor-chat-memory
npm run compile
./install-cli.sh
```

### 问题4: 项目初始化无法找到CLI工具

**解决方案:**
1. 项目初始化脚本会自动检测多个位置的CLI工具
2. 如果检测失败，会提供简化版功能
3. 可以选择继续使用简化版或先安装完整CLI工具

## 🎯 功能特性

### ✅ 完整版功能（需要CLI工具）
- 智能会话分类和标签管理
- 项目特定的上下文过滤
- 多种引用模板（recent, current-topic, problem-solving等）
- Token控制和轻量级引用
- 实时聊天文件监听
- 跨项目独立缓存

### ⚠️ 简化版功能（无需CLI工具）
- 基本状态查看
- 聊天文件列表
- 配置文件显示
- 项目信息查看

## 📊 配置选项

项目配置文件 `cursor-memory.config.json`：

```json
{
  "project": {
    "name": "项目名称",
    "path": ".",
    "description": "项目描述"
  },
  "memory": {
    "enableProjectSpecific": true,
    "maxProjectSessions": 20,
    "projectKeywords": ["项目关键词"]
  },
  "filters": {
    "includeCategories": ["JavaScript", "Python", "Web开发"],
    "excludeKeywords": ["test", "测试"],
    "minImportance": 0.3
  },
  "output": {
    "format": "markdown",
    "includeTimestamps": true,
    "maxSummaryLength": 150
  }
}
```

## 🛠️ 开发者信息

- **版本**: v2.1.0
- **作者**: Cursor Chat Memory Team
- **邮箱**: jayshen1031@gmail.com
- **许可**: MIT

## 📞 支持

如果遇到问题，请：
1. 查看本指南的故障排除部分
2. 检查 GitHub Issues
3. 发送邮件到 jayshen1031@gmail.com 