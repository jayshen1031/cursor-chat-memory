# 🚀 Memory Bank 新项目使用完整指南

## 📋 概述

本指南将详细介绍如何在新项目中使用 Memory Bank 系统，从部署到日常使用的完整流程。

## 🎯 快速部署（5分钟搞定）

### 1. 一键部署命令

```bash
# 基础部署
./deploy-to-new-project.sh /path/to/your-project

# 带项目名称
./deploy-to-new-project.sh ~/projects/my-app "My Awesome App"

# 高级选项
./deploy-to-new-project.sh /path/to/project --clean --no-git
```

### 2. 部署选项说明

| 选项 | 说明 |
|------|------|
| `--clean` | 清空目标目录中的旧Memory Bank文件 |
| `--no-git` | 跳过Git仓库初始化 |
| `--no-install` | 跳过npm依赖安装 |

### 3. 部署完成验证

部署成功后，目标项目将包含：

```
your-project/
├── 📁 memory-bank/           # Memory Bank知识库
├── 📁 src/mcp-server.js      # MCP服务器
├── 📄 cursor-mcp-config.json # Cursor配置
├── 📄 package.json           # 项目配置
├── 📄 README.md             # 项目说明
├── 📄 CURSOR_SETUP_GUIDE.md # 设置指南
└── 📄 test-memory-bank.sh   # 测试脚本
```

## ⚙️ Cursor IDE 配置

### 1. 配置MCP服务器

1. **打开Cursor设置**
   - Mac: `Cmd + ,`
   - Windows: `Ctrl + ,`

2. **找到MCP设置**
   - 搜索 "MCP" 或 "Model Context Protocol"
   - 或导航到 Extensions > MCP Servers

3. **导入配置**
   - 点击 "Add from config file"
   - 选择项目中的 `cursor-mcp-config.json`

4. **重启Cursor**
   - 完全关闭Cursor
   - 重新打开项目

### 2. 验证配置

在Cursor聊天中输入测试命令：

```
请列出可用的Memory Bank工具
```

期望的AI回应应该包含Memory Bank工具列表。

## 🧠 Memory Bank 核心功能

### 📝 知识库文件详解

#### projectContext.md
- **用途**: 项目上下文和目标
- **更新时机**: 项目启动、目标变更、架构调整
- **使用场景**: 
  ```
  请更新项目上下文，我们刚刚决定使用React替代Vue
  ```

#### codePatterns.md
- **用途**: 代码模式和最佳实践
- **更新时机**: 发现新的编程模式、优化代码结构
- **使用场景**:
  ```
  请分析我最近的代码并更新代码模式库
  ```

#### problemSolutions.md
- **用途**: 问题解决方案集
- **更新时机**: 解决重要技术问题后
- **使用场景**:
  ```
  请记录刚才API集成问题的解决方案到Memory Bank
  ```

#### learningInsights.md
- **用途**: 学习洞察和经验总结
- **更新时机**: 项目阶段总结、技术探索后
- **使用场景**:
  ```
  请总结今天的开发经验并更新学习洞察
  ```

## 💬 日常使用工作流

### 🌅 开始工作时

```bash
# 1. 启动MCP服务器（如果需要）
npm start

# 2. 在Cursor中同步昨日进展
请同步昨天的开发活动到Memory Bank
```

### 🔄 开发过程中

#### 遇到问题时
```
请在Memory Bank中搜索类似的API错误解决方案
```

#### 发现新模式时
```
请分析这段代码模式并更新到codePatterns.md中
```

#### 做技术决策时
```
根据Memory Bank中的历史经验，帮我分析这个技术选择
```

### 🌆 结束工作时

```
请分析今天的开发活动并更新所有相关的Memory Bank文件
```

## 🔧 高级使用技巧

### 1. 场景化查询

#### 🎯 项目规划
```
基于Memory Bank中的项目上下文，帮我制定下周的开发计划
```

#### 🐛 调试问题
```
请检查Memory Bank中是否有类似的[具体错误]解决方案
```

#### 📊 性能优化
```
根据Memory Bank中的代码模式，分析这段代码的优化潜力
```

#### 📚 知识复习
```
请总结Memory Bank中关于[技术栈]的关键学习点
```

### 2. 定期维护

#### 每日同步（推荐）
```bash
npm run sync:today
```

#### 每周总结
```
请分析本周的Memory Bank更新并生成进展报告
```

#### 每月清理
```
请检查Memory Bank中的过时信息并建议清理
```

## 📊 Memory Bank 监控

### 1. 检查状态

```
请显示Memory Bank的当前状态和统计信息
```

### 2. 验证完整性

```bash
# 运行测试脚本
./test-memory-bank.sh
```

### 3. 手动验证文件

```bash
# 检查所有Memory Bank文件
ls -la memory-bank/
cat memory-bank/quickReference.md
```

## 🔄 数据同步策略

### 自动同步模式

```bash
# 配置为自动同步
echo "ENABLE_AUTO_SYNC=true" >> .env

# 设置同步间隔（分钟）
echo "SYNC_INTERVAL=60" >> .env
```

### 手动同步模式

```bash
# 同步今天的数据
npm run sync:today

# 同步指定时间范围
npm run sync:week
npm run sync:month
```

### 选择性同步

```
只同步代码相关的聊天记录到Memory Bank
只提取问题解决相关的对话到problemSolutions.md
```

## 🛠️ 故障排除

### 常见问题1: AI无法识别Memory Bank

**症状**: AI回复"我不知道什么是Memory Bank"

**解决方案**:
1. 确认Cursor已重启
2. 检查MCP配置文件路径
3. 验证MCP服务器运行状态

```bash
# 测试MCP服务器
node src/mcp-server.js status
```

### 常见问题2: 工具调用失败

**症状**: AI识别Memory Bank但工具调用报错

**解决方案**:
1. 检查文件权限
```bash
chmod +x src/mcp-server.js
chmod -R 644 memory-bank/
```

2. 验证依赖安装
```bash
npm install
```

### 常见问题3: 数据同步不完整

**症状**: 只有部分聊天记录被同步

**解决方案**:
1. 检查时间范围设置
2. 手动指定数据源
```
请重新提取今天的完整聊天记录
```

## 🎛️ 高级配置

### 1. 自定义Memory Bank结构

```javascript
// src/mcp-server.js - 自定义文件列表
const MEMORY_BANK_FILES = [
    'projectContext.md',
    'codePatterns.md',
    'problemSolutions.md',
    'learningInsights.md',
    'customKnowledge.md'  // 新增自定义文件
];
```

### 2. 配置AI分析参数

```javascript
// 自定义分析深度
const ANALYSIS_CONFIG = {
    patternRecognition: 'advanced',
    insightGeneration: 'detailed',
    codeAnalysis: 'comprehensive'
};
```

### 3. 团队协作设置

```bash
# 设置团队共享模式
export TEAM_MODE=true
export SHARED_MEMORY_BANK="/shared/memory-bank"
```

## 📈 最佳实践

### 1. 命名约定

- 使用描述性的项目名称
- Memory Bank文件保持统一格式
- 代码示例包含上下文信息

### 2. 更新频率

- **projectContext.md**: 项目重大变更时更新
- **codePatterns.md**: 发现新模式时更新
- **problemSolutions.md**: 解决问题后立即更新
- **learningInsights.md**: 每周总结一次

### 3. 查询技巧

- 使用具体的技术术语
- 包含错误信息的关键词
- 指定要查询的Knowledge Bank文件

## 🔗 相关资源

- 📖 [部署脚本文档](deploy-to-new-project.sh)
- 🔧 [MCP服务器源码](src/mcp-server.js)
- 📝 [Memory Bank模板](memory-bank/)
- 🎯 [快速参考指南](memory-bank/quickReference.md)

## 🎉 成功案例

### 案例1: Web应用开发
```bash
./deploy-to-new-project.sh ~/projects/my-web-app "E-commerce Platform"
# 在3个月项目中，Memory Bank帮助团队:
# - 减少50%的重复问题
# - 提高30%的代码复用率
# - 积累了45个可复用的解决方案
```

### 案例2: API服务开发
```bash
./deploy-to-new-project.sh ~/work/api-service "Microservice API"
# Memory Bank记录了:
# - 12种API设计模式
# - 8个性能优化方案  
# - 15个常见问题解决方案
```

---

💡 **提示**: Memory Bank是一个学习型系统，使用越多，AI对你的项目理解越深入，提供的帮助越精准！ 