# 🚀 新项目Memory Bank设置指南

> 如何在任何新项目中快速部署和使用Cursor Memory Bank系统

## 🎯 快速开始 (5分钟设置)

### 步骤1: 复制核心文件
```bash
# 1. 复制Memory Bank模板到新项目
cp -r /path/to/cursor-chat-memory/memory-bank /path/to/your-new-project/

# 2. 复制MCP服务器
cp /path/to/cursor-chat-memory/src/mcp-server.js /path/to/your-new-project/src/

# 3. 复制配置文件
cp /path/to/cursor-chat-memory/package.json /path/to/your-new-project/
cp /path/to/cursor-chat-memory/cursor-mcp-config.json /path/to/your-new-project/
```

### 步骤2: 安装依赖
```bash
cd /path/to/your-new-project
npm install
```

### 步骤3: 配置项目信息
编辑 `memory-bank/projectContext.md`：
```markdown
# 项目上下文

> 自动分析项目的核心功能和技术架构

## 项目概述

[您的项目名称] - [项目简短描述]

## 核心功能

- [功能1]
- [功能2]
- [功能3]

## 技术架构

- **前端**: [技术栈]
- **后端**: [技术栈]
- **数据库**: [数据库类型]
- **部署**: [部署方式]

*此文件由MCP Server自动维护*
```

### 步骤4: 启动MCP服务器
```bash
node src/mcp-server.js
```

✅ **完成！** 您的新项目现在已经具备了智能Memory Bank功能！

---

## 📋 详细配置指南

### 🏗️ **项目结构设置**

#### 推荐的目录结构：
```
your-new-project/
├── src/
│   └── mcp-server.js          # MCP服务器
├── memory-bank/               # Memory Bank核心
│   ├── quickReference.md      # 🎯 引用指南
│   ├── projectContext.md     # 📋 项目概览
│   ├── learningInsights.md   # 🧠 学习洞察
│   ├── problemSolutions.md   # 🔧 问题解决
│   ├── codePatterns.md       # 💻 代码模式
│   ├── technicalDecisions.md # 📊 技术决策
│   └── recentActivity.md     # ⏰ 最近活动
├── package.json               # 依赖配置
├── cursor-mcp-config.json     # MCP配置
└── README.md                  # 项目说明
```

### ⚙️ **配置文件自定义**

#### 1. 更新 `package.json`
```json
{
  "name": "your-project-memory-bank",
  "version": "1.0.0",
  "description": "Your Project Memory Bank with Cursor Integration",
  "type": "module",
  "main": "src/mcp-server.js",
  "scripts": {
    "start": "node src/mcp-server.js",
    "sync": "node src/mcp-server.js sync",
    "status": "node src/mcp-server.js status"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "sqlite3": "^5.1.6"
  }
}
```

#### 2. 更新 `cursor-mcp-config.json`
```json
{
  "name": "your-project-memory-server",
  "description": "Your Project Memory Bank MCP Server",
  "version": "1.0.0",
  "author": "Your Name",
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  },
  "keywords": ["mcp", "cursor", "memory", "your-project"],
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/your-project"
  }
}
```

### 🛠️ **MCP服务器配置**

#### 编辑 `src/mcp-server.js` 的项目特定配置：

```javascript
class YourProjectMemoryMCPServer {
    constructor() {
        this.server = new Server(
            {
                name: 'your-project-memory-server',  // 改为您的项目名
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        // 项目特定路径配置
        this.memoryBankPath = path.join(process.cwd(), 'memory-bank');
        this.projectName = 'Your Project Name';  // 改为您的项目名
        
        // ... 其他配置
    }
}
```

---

## 🎨 **内容模板自定义**

### 📝 **初始化Memory Bank内容**

#### 1. 自定义 `projectContext.md`
```markdown
# 项目上下文

> 自动分析项目的核心功能和技术架构

## 项目概述

[项目名称] - [一句话描述项目的核心价值]

## 核心功能

- **主要功能1**: 详细描述
- **主要功能2**: 详细描述
- **主要功能3**: 详细描述

## 技术架构

- **前端**: React/Vue/Angular + TypeScript
- **后端**: Node.js/Python/Java + 框架名称
- **数据库**: PostgreSQL/MySQL/MongoDB
- **部署**: Docker + Kubernetes/Vercel/AWS

## 项目特色

- **技术亮点**: 使用了哪些先进技术
- **业务价值**: 解决了什么实际问题
- **创新点**: 有什么独特的设计思路

*此文件由MCP Server自动维护*
```

#### 2. 重置学习洞察模板
```bash
# 清空现有内容，保留基础结构
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
```

#### 3. 清空问题解决方案
```bash
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
```

---

## 🔄 **使用工作流**

### 🚀 **项目启动阶段**

#### Week 1: 基础设置
```bash
# 1. 克隆Memory Bank模板
# 2. 自定义项目信息
# 3. 启动MCP服务器
# 4. 验证Cursor集成
```

#### Week 2-4: 内容积累
```bash
# 每次解决问题后：
1. 记录到 problemSolutions.md
2. 总结代码模式到 codePatterns.md
3. 记录技术决策到 technicalDecisions.md
```

### 📈 **日常开发阶段**

#### 每日工作流：
1. **开始开发** → 查看 `recentActivity.md` 了解昨天进展
2. **遇到问题** → 搜索 `problemSolutions.md` 寻找类似解决方案
3. **实现功能** → 参考 `codePatterns.md` 中的最佳实践
4. **解决问题** → 记录新的解决方案
5. **结束工作** → 同步Memory Bank数据

#### 每周回顾：
```bash
# 每周五执行
node src/mcp-server.js sync week
node src/mcp-server.js analyze
```

---

## 🎯 **不同项目类型的定制**

### 🌐 **Web应用项目**
```markdown
重点关注：
- API设计模式
- 前端组件复用
- 状态管理策略
- 性能优化技巧
```

### 📱 **移动应用项目**
```markdown
重点关注：
- 跨平台兼容性
- 性能优化
- 用户体验设计
- 设备适配问题
```

### 🤖 **AI/ML项目**
```markdown
重点关注：
- 模型训练经验
- 数据处理pipeline
- 性能调优
- 部署策略
```

### 🔧 **开源工具项目**
```markdown
重点关注：
- API设计原则
- 文档维护
- 社区反馈处理
- 版本管理策略
```

---

## 💡 **最佳实践**

### ✅ **DO - 推荐做法**

1. **及时记录**
   ```bash
   # 每次解决问题后立即记录
   echo "## $(date +%Y-%m-%d) 新问题解决" >> memory-bank/problemSolutions.md
   ```

2. **定期同步**
   ```bash
   # 每天结束时同步
   node src/mcp-server.js sync today
   ```

3. **版本控制**
   ```bash
   # Memory Bank内容也要版本控制
   git add memory-bank/
   git commit -m "docs: update memory bank with new insights"
   ```

4. **团队协作**
   ```bash
   # 分享给团队成员
   git push origin main
   ```

### ❌ **DON'T - 避免做法**

1. **不要忽略初始化** - 必须自定义项目特定信息
2. **不要复制敏感信息** - 避免在Memory Bank中记录密码、API密钥
3. **不要过度复杂化** - 保持内容简洁实用
4. **不要忘记维护** - 定期清理过时信息

---

## 🔧 **高级配置**

### 🎨 **自定义分析策略**

编辑 `src/mcp-server.js` 中的关键词配置：

```javascript
// 项目特定关键词
const projectKeywords = {
    technical: ['React', 'Node.js', 'MongoDB', 'Docker'],  // 您的技术栈
    business: ['用户', '订单', '支付', '数据分析'],        // 您的业务域
    problem: ['错误', '异常', '性能', 'bug'],              // 通用问题词
};
```

### 📊 **自定义Memory Bank结构**

您可以添加项目特定的文件：

```bash
# 添加项目特定文件
touch memory-bank/apiDesign.md        # API设计文档
touch memory-bank/deploymentNotes.md  # 部署笔记
touch memory-bank/performanceTips.md  # 性能优化
touch memory-bank/securityChecklist.md # 安全检查清单
```

---

## 🎉 **验证设置**

### 测试清单：

1. ✅ **MCP服务器启动** - `node src/mcp-server.js`
2. ✅ **Cursor连接正常** - 在Cursor中测试MCP工具
3. ✅ **数据同步功能** - 执行 `sync_chat_data` 工具
4. ✅ **Memory Bank更新** - 检查文件是否自动更新
5. ✅ **搜索功能** - 测试 `search_conversations` 工具

### 成功标志：
- 🎯 Cursor可以调用Memory Bank工具
- 📊 聊天数据可以自动同步
- 🧠 Memory Bank文件自动更新
- 🔍 可以搜索历史对话
- 📈 项目状态正确显示

---

## 🆘 **常见问题解决**

### Q1: MCP服务器启动失败
```bash
# 检查Node.js版本
node --version  # 需要 >=18.0.0

# 安装依赖
npm install

# 检查模块导入
node -e "import('sqlite3').then(console.log).catch(console.error)"
```

### Q2: Cursor无法连接
```bash
# 检查配置文件
cat cursor-mcp-config.json

# 确认服务器运行
ps aux | grep mcp-server
```

### Q3: 路径配置错误
```javascript
// 在 mcp-server.js 中添加调试信息
console.log('Memory Bank Path:', this.memoryBankPath);
console.log('Cursor Data Path:', this.cursorDataPath);
```

---

## 🎊 **总结**

通过这个设置指南，您可以在**任何新项目**中快速部署Memory Bank系统：

1. **5分钟快速设置** - 复制文件 → 安装依赖 → 自定义配置
2. **项目特定定制** - 根据技术栈和业务域调整关键词和模板
3. **渐进式使用** - 从基础记录开始，逐步建立项目知识库
4. **团队协作** - 版本控制确保团队共享知识

**Memory Bank将成为您项目的智能大脑，持续积累和优化开发经验！** 🚀 