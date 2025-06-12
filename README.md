# 🧠 Cursor Memory Bank - AI驱动的聊天历史智能分析系统

一个强大的 Memory Bank 系统，可以提取、分析和优化 Cursor AI 聊天历史，构建智能知识库，让AI更好地理解你的项目上下文。

## ✨ 核心功能

### 📊 Memory Bank 系统
- 🧠 **智能Memory Bank** - 6大核心知识库（代码模式、问题解决、学习洞察等）
- 🤖 **MCP集成** - 通过Model Context Protocol与Cursor深度集成
- 🔍 **智能分析** - AI驱动的聊天数据挖掘和模式识别
- 💾 **知识积累** - 自动提取和存储技术决策、代码模式
- 🚀 **项目部署** - 一键将Memory Bank部署到新项目

### 📈 聊天历史查看器
- 🎯 **今日聊天** - 显示今天的所有AI对话
- 🔍 **智能搜索** - 快速搜索聊天内容  
- 📊 **统计信息** - 对话数量、活动时间等统计
- 🎨 **美观界面** - 现代化的响应式设计

## 🗂️ Memory Bank 系统架构

```
cursor-chat-memory/
├── 🧠 memory-bank/                 # Memory Bank核心目录
│   ├── 📝 projectContext.md        # 项目上下文和目标
│   ├── 🔧 codePatterns.md          # 代码模式和最佳实践
│   ├── 🛠️ problemSolutions.md      # 问题解决方案集
│   ├── 💡 learningInsights.md      # 学习洞察和经验
│   ├── ⚡ quickReference.md        # 快速参考指南
│   ├── 📊 recentActivity.md        # 近期活动记录
│   └── 🎯 technicalDecisions.md    # 技术决策记录
├── 🚀 src/mcp-server.js            # MCP服务器实现
├── 🔧 cursor-mcp-config.json       # Cursor MCP配置
├── 📋 deploy-to-new-project.sh     # 新项目部署脚本
├── 📖 NEW_PROJECT_SETUP_GUIDE.md   # 新项目设置指南
└── 🌐 聊天历史查看器相关文件...
```

## 🚀 快速开始

### 方式一：在当前项目使用Memory Bank

1. **安装依赖**
```bash
npm install
```

2. **配置Cursor MCP**
```bash
# 在Cursor设置中导入配置文件
cursor-mcp-config.json
```

3. **启动MCP服务器**
```bash
npm start
```

4. **测试Memory Bank**
在Cursor聊天中输入：
```
请列出可用的Memory Bank工具
```

### 方式二：部署到新项目（推荐）

使用自动部署脚本将Memory Bank快速部署到任何新项目：

```bash
# 部署到指定项目目录
./deploy-to-new-project.sh /path/to/your-project

# 带项目名称
./deploy-to-new-project.sh ~/projects/my-app "My App"

# 清空模式重新部署
./deploy-to-new-project.sh /path/to/project --clean
```

#### 部署脚本功能
- ✅ 自动检查系统依赖（Node.js >= 18）
- ✅ 复制完整Memory Bank系统
- ✅ 自动生成项目专用配置
- ✅ 安装npm依赖
- ✅ 初始化Git仓库
- ✅ 创建项目README和设置指南
- ✅ 验证安装完整性

## 🧠 Memory Bank 知识库详解

### 📝 projectContext.md
- 项目目标和愿景
- 技术栈选择理由  
- 架构设计思路
- 团队协作规范

### 🔧 codePatterns.md (5.8KB)
包含14个核心代码示例：
- 数据库访问模式
- API设计模式
- 错误处理策略
- 性能优化技巧
- 测试驱动开发
- 监控和日志记录

### 🛠️ problemSolutions.md (7.5KB) 
包含14个详细解决方案：
- 数据提取问题
- 性能优化方案
- 部署配置修复
- API集成挑战
- 前端开发难题
- 系统架构优化

### 💡 learningInsights.md (13KB)
包含18个核心技术洞察：
- 数据挖掘最佳实践
- 系统架构设计原则
- 用户体验优化策略
- AI/NLP开发技巧
- 性能监控方法论
- 项目管理经验

### ⚡ quickReference.md (4.7KB)
智能使用策略：
- 场景化查询模板
- Token预算管理
- 最佳实践决策树
- 快速参考索引

## 🔧 MCP工具集

部署完成后，以下工具将在Cursor中可用：

| 工具名称 | 功能描述 |
|---------|---------|
| `memory_bank_status` | 检查Memory Bank状态 |
| `extract_chat_data` | 提取并分析聊天数据 |
| `analyze_patterns` | 分析代码模式和最佳实践 |
| `search_knowledge` | 搜索Memory Bank知识库 |
| `update_context` | 更新项目上下文信息 |
| `sync_daily_activity` | 同步每日开发活动 |

## 💬 典型使用场景

### 🎯 项目启动阶段
```
请帮我同步项目上下文到Memory Bank
```

### 🔍 开发过程中
```
请分析我最近的代码模式并提供优化建议
```

### 🛠️ 问题解决
```
请在Memory Bank中搜索类似的问题解决方案
```

### 📊 项目总结
```
请分析今天的开发活动并更新学习洞察
```

## 🎛️ 高级配置

### 自定义Memory Bank目录
```javascript
// src/mcp-server.js
const MEMORY_BANK_DIR = process.env.MEMORY_BANK_DIR || './memory-bank';
```

### 配置数据源
```javascript
// 自定义Cursor数据库路径
const CURSOR_DB_PATH = process.env.CURSOR_DB_PATH || DEFAULT_PATH;
```

### 调整分析算法
```javascript
// 自定义模式识别参数
const PATTERN_ANALYSIS_CONFIG = {
    minPatternOccurrence: 3,
    timeWindowDays: 7,
    relevanceThreshold: 0.8
};
```

## 📱 新项目设置完整流程

### 1. 一键部署
```bash
./deploy-to-new-project.sh /path/to/your-project "Your Project Name"
```

### 2. 配置Cursor
- 打开Cursor设置 (`Cmd + ,`)
- 搜索 "MCP"
- 导入配置文件: `项目目录/cursor-mcp-config.json`

### 3. 重启Cursor并测试
```
请显示Memory Bank状态
```

### 4. 开始使用
```
请帮我同步今天的聊天数据到Memory Bank
```

详细步骤请参考：`NEW_PROJECT_SETUP_GUIDE.md`

## 🔄 数据同步策略

### 自动同步
```bash
# 每日自动同步
npm run sync:today

# 每周完整同步  
npm run sync:week
```

### 手动同步
在Cursor中使用命令：
```
请提取今天的聊天数据并分析技术模式
```

## 🧪 开发和测试

### 本地测试MCP服务器
```bash
node src/mcp-server.js status
```

### 验证部署
```bash
./test-memory-bank.sh  # 仅在已部署的项目中可用
```

### 查看详细日志
```bash
VERBOSE=true npm start
```

## 📊 Memory Bank统计信息

当前Memory Bank容量：
- 📝 **总内容**: 27.3KB
- 🔧 **代码示例**: 14个
- 🛠️ **解决方案**: 14个  
- 💡 **技术洞察**: 18个
- ⚡ **快速参考**: 4.7KB

## 🔐 隐私和安全

- ✅ **本地处理** - 所有数据仅在本地处理
- ✅ **项目隔离** - 每个项目独立的Memory Bank
- ✅ **数据安全** - 不上传任何敏感信息
- ✅ **可控性** - 完全控制数据存储和访问

## 🚀 部署选项

### 🏠 本地部署
适合个人开发者和小团队
```bash
./deploy-to-new-project.sh ~/my-project
```

### 🏢 团队部署
通过Git子模块共享Memory Bank模板
```bash
git submodule add https://github.com/your-org/cursor-memory-bank.git memory-bank-template
```

### ☁️ 企业部署
自定义企业级配置和策略
```bash
ENTERPRISE_MODE=true ./deploy-to-new-project.sh /company/projects/app
```

## 🤝 贡献指南

### 提交Memory Bank模板
1. Fork项目
2. 创建新的知识库模板
3. 提交Pull Request

### 报告问题
使用Issue模板报告bug或功能请求

### 开发环境
```bash
git clone https://github.com/your-repo/cursor-chat-memory
cd cursor-chat-memory
npm install
npm run dev
```

## 📚 相关资源

- 📖 [NEW_PROJECT_SETUP_GUIDE.md](NEW_PROJECT_SETUP_GUIDE.md) - 详细设置指南
- 🔧 [MCP官方文档](https://modelcontextprotocol.io/)
- 🎯 [Cursor AI文档](https://cursor.sh/docs)
- 💡 [最佳实践指南](memory-bank/quickReference.md)

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

🌟 **让AI更智能地理解你的项目，构建属于你的智能编程助手！** 