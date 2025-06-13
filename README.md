# 🧠 Cursor Memory Bank - AI驱动的聊天历史智能分析系统

一个强大的 Memory Bank 系统，可以提取、分析和优化 Cursor AI 聊天历史，构建智能知识库，让AI更好地理解你的项目上下文。

## ✨ 核心功能

### 📊 Memory Bank 系统
- 🧠 **智能Memory Bank** - 6大核心知识库（代码模式、问题解决、学习洞察等）
- 🤖 **MCP集成** - 通过Model Context Protocol与Cursor深度集成
- 🔍 **智能分析** - AI驱动的聊天数据挖掘和模式识别
- 💾 **知识积累** - 自动提取和存储技术决策、代码模式
- 🚀 **项目部署** - 一键将Memory Bank部署到新项目
- 🔧 **配置验证** - 启动时自动检查所有必需配置项
- 🩺 **健康监控** - 实时监控服务状态和系统健康

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
├── 🚀 src/
│   ├── mcp-server.js               # MCP服务器实现
│   └── config-validator.js         # 配置验证器
├── 🔧 cursor-mcp-config.json       # Cursor MCP配置
├── 📋 deploy-to-new-project.sh     # 新项目部署脚本
├── 📖 NEW_PROJECT_SETUP.md         # 新项目设置指南
└── 🌐 聊天历史查看器相关文件...
```

## 🚀 快速开始

### 方式一：在当前项目使用Memory Bank

1. **安装依赖**
```bash
npm install
```

2. **验证配置**
```bash
npm run validate-config
```

3. **启动MCP服务器**
```bash
npm run mcp
```

4. **检查服务状态**
```bash
npm run health-check
```

5. **测试Memory Bank**
在Cursor聊天中输入：
```
同步聊天数据
```

### 方式二：部署到新项目（推荐）

使用自动部署脚本将Memory Bank快速部署到任何新项目：

```bash
# 部署到指定项目目录
./deploy-to-new-project.sh /path/to/your-project

# 指定项目类型
./deploy-to-new-project.sh /path/to/project --type bi

# 安全模式（不删除现有文件）
./deploy-to-new-project.sh /path/to/project --type development
```

#### 部署脚本功能
- ✅ 自动检查系统依赖（Node.js >= 18）
- ✅ 根据项目类型创建专用Memory Bank内容
- ✅ 自动生成项目专用配置
- ✅ 支持多种项目类型（development, analysis, bi）
- ✅ 安全部署（保护现有文件）
- ✅ 配置验证和健康检查
- ✅ 智能统计Memory Bank文件和大小
- ✅ 创建项目README和设置指南

#### 项目类型说明
| 项目类型 | 适用场景 | Memory Bank内容 | 文件数量 |
|---------|---------|----------------|----------|
| `development` | 通用开发项目 | 代码模式、技术洞察、问题解决方案 | 8个文件 |
| `analysis` | 数据分析项目 | 数据挖掘、统计分析、机器学习 | 待完善 |
| `bi` | 商业智能项目 | 业务洞察、数据模型、ETL流程、报表模板 | 10个文件，40KB |

## 🔧 配置验证系统

### 🛡️ 启动时自动验证
系统会在启动时自动检查：
- ✅ 配置文件存在性和格式正确性
- ✅ 必需字段完整性（port, host, memoryBankPath等）
- ✅ 端口可用性和Node.js版本兼容性
- ✅ 目录权限和Cursor数据库连接
- ✅ 项目配置有效性

### 🔍 独立配置验证
```bash
# 验证当前配置
npm run validate-config

# 查看详细验证结果
node src/config-validator.js
```

### 🩺 健康检查
```bash
# 检查服务健康状态
npm run health-check

# 访问健康检查端点
curl http://localhost:3000/health
```

## 🧠 Memory Bank 知识库详解

### 📝 通用开发项目 (development)
适用于通用软件开发项目，包含：
- **projectContext.md** - 项目目标和技术架构
- **codePatterns.md** - 代码模式和最佳实践
- **problemSolutions.md** - 问题解决方案集
- **learningInsights.md** - 技术洞察和经验
- **quickReference.md** - 快速参考指南
- **recentActivity.md** - 近期活动记录
- **technicalDecisions.md** - 技术决策记录

### 📊 BI项目专用 (bi)
专为商业智能项目定制，包含：
- **projectContext.md** - BI项目上下文和业务领域
- **businessInsights.md** - 物流行业分析洞察
- **dataModels.md** - 数据仓库模型设计
- **reportTemplates.md** - 运营报表SQL模板
- **etlProcesses.md** - ETL流程和数据质量管控
- **problemSolutions.md** - BI项目常见问题解决方案
- **technicalDecisions.md** - 数据架构和技术选型
- **learningInsights.md** - 数据分析和BI项目洞察
- **quickReference.md** - 常用SQL查询和命令
- **recentActivity.md** - BI项目活动记录

#### BI项目Memory Bank特色
- 🚛 **物流行业专用**: 运输成本、路线优化、客户价值分析
- 🌱 **碳排放管理**: 运输碳排放计算和绿色物流优化
- 📊 **数据仓库架构**: ODS-DWD-DWS-ADS四层架构设计
- 📈 **报表自动化**: 周报、客户分析、供应商绩效等SQL模板
- 🔧 **ETL流程**: 数据处理、质量监控、异常处理机制

### 🔬 数据分析项目 (analysis)
专为数据科学和分析项目设计（开发中）：
- 数据探索性分析(EDA)
- 统计建模和假设检验
- 机器学习模型开发
- 数据可视化和报告生成

## 🔧 MCP工具集

部署完成后，以下工具将在Cursor中可用：

| 工具名称 | 功能描述 |
|---------|---------|
| `sync_chat_data` | 同步Cursor聊天数据并更新Memory Bank |
| `search_conversations` | 搜索历史对话 |
| `get_project_summary` | 获取项目智能摘要 |
| `analyze_patterns` | 分析对话中的模式和趋势 |
| `get_memory_status` | 获取Memory Bank状态 |

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
搜索关键词：配置验证
```

### 📊 项目总结
```
获取项目摘要
```

## 🎛️ 高级配置

### 项目类型配置
```json
{
  "projects": {
    "bi-project": {
      "name": "BI项目",
      "path": "./memory-bank",
      "type": "bi",
      "categories": {
        "businessInsights": "业务洞察",
        "dataModels": "数据模型",
        "reportTemplates": "报表模板"
      }
    }
  }
}
```

### 服务器配置
```json
{
  "port": 3000,
  "host": "localhost",
  "logLevel": "info",
  "memoryBankPath": "./memory-bank",
  "outputPath": "./output",
  "logPath": "./logs"
}
```

## 📱 新项目设置完整流程

### 1. 一键部署
```bash
./deploy-to-new-project.sh /path/to/your-project --type bi
```

### 2. 验证配置
```bash
cd /path/to/your-project
npm run validate-config
```

### 3. 启动服务
```bash
npm run mcp
```

### 4. 配置Cursor
- 打开Cursor设置 (`Cmd + ,`)
- 点击右上角 "Open Settings (JSON)"
- 添加MCP配置：
```json
{
  "mcp.servers": [
    {
      "name": "Cursor Memory",
      "url": "http://localhost:3000",
      "enabled": true
    }
  ]
}
```

### 5. 测试连接
```
同步聊天数据
```

详细步骤请参考：`NEW_PROJECT_SETUP.md`

## 🔄 数据同步策略

### NPM脚本
```bash
# 验证配置
npm run validate-config

# 启动MCP服务器
npm run mcp

# 提取聊天数据
npm run extract

# 生成摘要
npm run summary

# 健康检查
npm run health-check
```

### MCP工具
在Cursor中使用：
```
同步聊天数据
分析模式：技术
获取Memory Bank状态
```

## 🧪 开发和测试

### 配置验证测试
```bash
# 测试配置验证器
node src/config-validator.js

# 验证特定配置文件
CONFIG_PATH=./custom-config.json npm run validate-config
```

### 服务健康检查
```bash
# 检查服务状态
curl http://localhost:3000/health

# 检查MCP端点
curl http://localhost:3000/mcp

# 查看服务信息
curl http://localhost:3000/
```

### 调试模式
```bash
# 启用详细日志
DEBUG=true npm run mcp

# 查看配置验证详情
VERBOSE=true npm run validate-config
```

## 📊 Memory Bank统计信息

### 📝 通用开发项目 (development)
- **文件数量**: 8个核心文件
- **总大小**: ~35KB
- **核心内容**: 配置验证、健康检查、代码模式、技术洞察

### 📊 BI项目专用 (bi)
- **文件数量**: 10个专业文件
- **总大小**: 40KB
- **核心内容**: 
  - 物流行业业务洞察
  - 数据仓库模型设计
  - ETL流程和数据质量管控
  - 运营报表SQL模板
  - 碳排放管理和分析

### 🔬 数据分析项目 (analysis)
- **状态**: 开发中
- **规划内容**: 数据挖掘、统计分析、机器学习模板

## 🔐 隐私和安全

- ✅ **本地处理** - 所有数据仅在本地处理
- ✅ **配置验证** - 启动前检查安全配置
- ✅ **项目隔离** - 每个项目独立的Memory Bank
- ✅ **健康监控** - 实时监控服务安全状态
- ✅ **数据安全** - 不上传任何敏感信息

## 🚀 部署选项

### 🏠 本地部署
适合个人开发者和小团队
```bash
./deploy-to-new-project.sh ~/my-project --type development
```

### 🏢 团队部署
支持不同项目类型
```bash
# BI项目
./deploy-to-new-project.sh /team/bi-project --type bi

# 数据分析项目
./deploy-to-new-project.sh /team/analysis-project --type analysis
```

### ☁️ 企业部署
自定义企业级配置和策略
```bash
# 企业级配置验证
ENTERPRISE_MODE=true npm run validate-config
```

## 🆕 最新更新 (2025-06-13)

### ✨ 新功能
- 🔧 **配置验证系统** - 启动时自动检查所有配置项
- 🩺 **健康检查端点** - 实时监控服务状态
- 🚀 **改进的初始化流程** - 更可靠的服务启动
- 🛡️ **安全部署模式** - 保护现有项目文件
- 📊 **项目类型专用Memory Bank** - 根据项目类型创建专用内容

### 🔧 技术改进
- 分离配置验证和服务启动逻辑
- 增强错误处理和诊断信息
- 添加多项目类型支持（development, analysis, bi）
- 优化Memory Bank更新机制
- 修复部署脚本，支持项目类型专用内容生成

### 📊 BI项目专用功能
- 🚛 **物流行业Memory Bank** - 海程邦达物流业务专用模板
- 📈 **数据仓库架构** - ODS-DWD-DWS-ADS四层架构设计
- 🌱 **碳排放管理** - 运输碳排放计算和分析模板
- 📋 **报表自动化** - 运营周报、客户分析等SQL模板
- 🔧 **ETL流程管理** - 数据处理和质量监控流程

### 📋 新增命令
```bash
npm run validate-config  # 配置验证
npm run health-check     # 健康检查
```

### 🧹 优化改进
- 清理BI项目Memory Bank，从18个项目减少到10个专用文件
- 部署脚本增加Memory Bank统计信息显示
- 删除不必要的空目录和通用开发文件

## 🤝 贡献指南

### 提交Memory Bank模板
1. Fork项目
2. 创建新的知识库模板
3. 运行配置验证测试
4. 提交Pull Request

### 报告问题
使用Issue模板报告bug或功能请求，包含：
- 配置验证结果
- 健康检查输出
- 错误日志

### 开发环境
```bash
git clone https://github.com/your-repo/cursor-chat-memory
cd cursor-chat-memory
npm install
npm run validate-config
npm run mcp
```

## 📚 相关资源

- 📖 [NEW_PROJECT_SETUP.md](NEW_PROJECT_SETUP.md) - 详细设置指南
- 🔧 [MCP官方文档](https://modelcontextprotocol.io/)
- 🎯 [Cursor AI文档](https://cursor.sh/docs)
- 💡 [最佳实践指南](memory-bank/quickReference.md)
- 🛡️ [配置验证指南](src/config-validator.js)

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

🌟 **让AI更智能地理解你的项目，构建属于你的智能编程助手！** 

🔧 **现在支持配置验证和健康监控，让你的Memory Bank更加可靠！** 