# 🤖 Cursor Memory MCP Server

> 智能聊天历史分析和Memory Bank管理系统

## 🎯 项目概述

Cursor Memory MCP Server 是一个基于 Model Context Protocol (MCP) 的智能服务器，它将你现有的 `cursor-chat-memory` 项目的优势（自动SQLite数据提取）与 AI Memory 的结构化知识管理相结合，为Cursor用户提供无缝的AI增强开发体验。

### 🚀 核心特性

- **🔄 自动数据同步**: 从Cursor SQLite数据库自动提取聊天数据
- **🧠 AI驱动分析**: 智能内容分析和分类，无需手动维护
- **📁 结构化存储**: Memory Bank文件系统，有序组织知识
- **⚡ 原生集成**: 通过MCP协议与Cursor无缝交互
- **🎯 零配置**: 自动发现工作区，一键启动

## 📋 功能对比

| 特性 | AI Memory | Cursor Chat Memory | **MCP Server (融合)** |
|------|-----------|-------------------|---------------------|
| 数据获取 | 手动维护 | 自动提取 | ✅ **自动提取** |
| 知识结构 | 结构化 | 简单列表 | ✅ **智能结构化** |
| AI分析 | 手动分类 | 无分析 | ✅ **AI自动分析** |
| Cursor集成 | MCP原生 | Web界面 | ✅ **MCP原生** |
| 维护成本 | 高 | 低 | ✅ **极低** |

## 🛠️ 安装和设置

### 前置条件

- Node.js 18+
- Cursor IDE
- macOS (其他系统需要调整路径)

### 快速开始

1. **安装依赖**
```bash
npm install
```

2. **运行设置脚本**
```bash
npm run setup
```

3. **启动服务器**
```bash
./start-mcp-server.sh
```

或者使用npm脚本：
```bash
npm start
```

### 手动配置

如果自动设置失败，可以手动配置：

1. **创建MCP配置文件** (`~/.cursor/mcp/settings.json`)
```json
{
  "mcpServers": {
    "cursor-memory": {
      "command": "node",
      "args": ["/path/to/your/project/src/mcp-server.js"],
      "env": {
        "CURSOR_WORKSPACE_ID": "your-workspace-id"
      }
    }
  }
}
```

2. **初始化Memory Bank**
```bash
mkdir -p memory-bank
```

## 🎮 使用指南

### Cursor中的命令

在Cursor聊天中输入以下命令：

#### 📊 数据管理
```
/sync_chat_data                     # 同步最新聊天数据
/sync_chat_data timeRange:"week"    # 同步一周数据
/sync_chat_data analyze:false       # 仅同步，不分析
```

#### 🔍 搜索和查询
```
/search_conversations query:"MCP服务器"         # 搜索对话
/search_conversations query:"错误" limit:5     # 限制结果数量
```

#### 📋 项目洞察
```
/get_project_summary                # 获取项目智能摘要
/analyze_patterns                   # 全面模式分析
/analyze_patterns analysisType:"technical"    # 技术模式分析
/analyze_patterns analysisType:"problems"     # 问题解决分析
/analyze_patterns analysisType:"learning"     # 学习洞察分析
```

#### 🧠 Memory Bank管理
```
/get_memory_status                  # 查看Memory Bank状态
```

### Memory Bank文件结构

```
memory-bank/
├── projectContext.md      # 项目上下文和架构
├── recentActivity.md      # 最近活动记录
├── technicalDecisions.md # 技术决策记录
├── problemSolutions.md   # 问题解决方案
├── codePatterns.md       # 代码模式和最佳实践
└── learningInsights.md   # 学习洞察和要点
```

### 自动分析流程

1. **数据提取**: 从Cursor SQLite读取prompts和generations
2. **内容分析**: AI驱动的智能分类和摘要
3. **知识更新**: 自动更新相关Memory Bank文件
4. **模式识别**: 识别技术决策、问题解决、学习要点

## 🔧 技术架构

### 核心组件

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cursor AI     │◄──►│  MCP Server     │◄──►│ SQLite Database │
│   (Client)      │    │ (Memory Hub)    │    │ (Data Source)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │ Memory Bank     │
                       │ (Structured)    │
                       └─────────────────┘
```

### 数据流

1. **提取**: 从 `~/Library/Application Support/Cursor/User/workspaceStorage/{id}/state.vscdb`
2. **处理**: 分析对话内容，提取关键信息
3. **分类**: 技术讨论、问题解决、学习洞察
4. **存储**: 更新Memory Bank markdown文件
5. **响应**: 通过MCP返回分析结果

### 智能分析算法

#### 技术内容识别
- 关键词: `实现`, `代码`, `函数`, `API`, `数据库`, `架构`, `设计`, `配置`
- 自动提取技术决策和架构讨论

#### 问题解决识别
- 关键词: `错误`, `问题`, `失败`, `修复`, `解决`, `调试`
- 记录问题-解决方案对

#### 学习洞察识别
- 关键词: `学习`, `理解`, `原理`, `概念`, `为什么`, `如何`
- 提取知识要点和概念解释

## 🚀 开发和调试

### 开发模式
```bash
./start-mcp-server.sh dev
```

### 运行测试
```bash
npm test
# 或
./start-mcp-server.sh test
```

### 日志查看
```bash
tail -f mcp-server.log
```

### 调试配置

开发模式会启用Node.js调试器，可以在Chrome DevTools中连接：
1. 打开Chrome
2. 访问 `chrome://inspect`
3. 点击 "inspect" 连接到Node.js进程

## 📊 性能和优化

### 数据处理优化
- 智能时间过滤（今天/本周/本月）
- 增量数据同步
- 文本长度限制（避免过长内容）

### Memory Bank优化
- 自动清理过期内容
- 智能摘要生成
- 文件大小监控

### 缓存机制
- 内存中缓存对话数据
- 避免重复数据库查询
- 智能同步间隔

## 🐛 故障排除

### 常见问题

#### 1. 数据库连接失败
```
❌ 数据库文件不存在: /path/to/state.vscdb
```
**解决方案**: 
- 检查Cursor是否正确安装
- 确认工作区ID是否正确
- 运行 `npm run setup` 重新配置

#### 2. MCP连接问题
```
❌ Cursor无法连接到MCP Server
```
**解决方案**:
- 检查MCP配置文件是否正确
- 确认服务器是否正在运行
- 重启Cursor和MCP Server

#### 3. Memory Bank文件异常
```
⚠️ Memory Bank文件不存在或内容过少
```
**解决方案**:
- 运行 `npm run setup` 重新初始化
- 检查文件权限
- 手动创建缺失文件

#### 4. 依赖安装问题
```
❌ 依赖安装失败
```
**解决方案**:
- 检查Node.js版本 (需要18+)
- 清理缓存: `npm cache clean --force`
- 重新安装: `rm -rf node_modules && npm install`

### 调试技巧

1. **查看详细日志**
```bash
tail -f mcp-server.log
```

2. **测试数据提取**
```bash
node scripts/test.js
```

3. **手动验证数据库**
```bash
sqlite3 "数据库路径" "SELECT COUNT(*) FROM ItemTable WHERE key = 'aiService.generations'"
```

4. **检查MCP配置**
```bash
cat cursor-mcp-config.json
```

## 🔮 未来规划

### Phase 1: 基础功能 ✅
- [x] MCP Server框架
- [x] SQLite数据提取
- [x] 基础Memory Bank
- [x] AI内容分析

### Phase 2: 智能增强 (进行中)
- [ ] 更精确的内容分类
- [ ] 上下文关联分析
- [ ] 智能摘要生成
- [ ] 个性化推荐

### Phase 3: 高级功能 (计划中)
- [ ] 多项目支持
- [ ] 团队协作功能
- [ ] 知识图谱构建
- [ ] 插件生态

### Phase 4: 生态集成 (未来)
- [ ] VS Code支持
- [ ] 其他编辑器集成
- [ ] 云端同步
- [ ] API服务

## 🤝 贡献指南

### 开发环境
```bash
git clone https://github.com/your-repo/cursor-memory-mcp-server
cd cursor-memory-mcp-server
npm install
npm run setup
```

### 代码规范
- 使用ES模块语法
- 遵循JavaScript Standard Style
- 添加适当的错误处理
- 编写清晰的注释

### 提交指南
1. Fork项目
2. 创建特性分支
3. 编写测试
4. 提交代码
5. 创建Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Model Context Protocol](https://github.com/modelcontextprotocol) - 提供标准协议
- [AI Memory](https://marketplace.visualstudio.com/items?itemName=CoderOne.aimemory) - Memory Bank概念启发
- [Cursor](https://cursor.sh/) - 优秀的AI编程工具

---

**💡 提示**: 这个MCP Server将你的聊天历史转化为结构化的项目知识，让AI助手更好地理解项目上下文，提高开发效率！ 