# 🧠 Cursor Chat Memory

一个为 Cursor 编辑器设计的聊天记忆增强插件，旨在提供智能的上下文记忆和对话管理功能。

## 🚀 功能特性

- **状态栏集成** - 在编辑器状态栏显示记忆状态
- **命令面板支持** - 通过 "Enhance Input" 命令快速访问功能
- **自动激活** - 编辑器启动时自动激活插件

## 📦 安装与开发

### 环境要求
- Node.js >= 16.0.0
- VS Code 或 Cursor >= 1.74.0
- TypeScript >= 4.9.0

### 本地开发
```bash
# 安装依赖
npm install

# 编译 TypeScript
npm run compile

# 启动开发模式
./start_ext.sh
# 或者
./quick_start.sh
```

## 🛠️ 开发脚本

- `start_ext.sh` - 直接启动 Cursor 扩展开发模式
- `quick_start.sh` - 在当前目录打开 Cursor，然后按 F5 启动开发
- `start_correct.sh` - 启动脚本的备用版本

## 📋 TODO

- [ ] 实现聊天历史记录监听
- [ ] 添加上下文摘要提取功能
- [ ] 集成快捷键支持
- [ ] 优化用户界面交互
- [ ] 添加配置选项

## 🏗️ 技术架构

- **前端**: VS Code Extension API
- **语言**: TypeScript
- **构建**: TSC
- **许可证**: MIT

## 📝 更新日志

### v1.0.0
- 初始版本发布
- 基础框架搭建
- 状态栏集成
- 命令注册功能

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests！

## �� 许可证

MIT License 