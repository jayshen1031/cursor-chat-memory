# 运维操作指南

> Cursor Memory MCP Server 运维和维护指南

## 🚀 快速启动

### 1. 启动MCP服务器
```bash
npm run mcp
# 或直接运行
node src/mcp-server.js
```

**成功标志**: 看到消息 `🤖 Cursor Memory MCP Server 启动成功!`

### 2. Cursor配置
在 Cursor 中查找 MCP 设置：
- 重启 Cursor 后搜索：`MCP` / `Model Context Protocol` / `Server`
- 如果找不到设置，检查配置文件：`.cursor/mcp.json`

### 3. 使用 Agent 模式
要使用 MCP 工具，需要确保在聊天中使用 **Agent 模式**，而不是普通的 Ask 模式。

## 🛠️ 可用的 MCP 工具

一旦配置成功，您将可以使用以下工具：
- `sync_chat_data` - 同步聊天数据
- `get_memory_bank` - 获取记忆库内容
- `update_memory_bank` - 更新记忆库
- `analyze_conversations` - 分析对话
- `generate_summary` - 生成摘要

## 📁 项目结构 (2025-06-12 更新)

### 新的目录布局
```
cursor-chat-memory/
├── src/mcp-server.js          # MCP服务器核心
├── memory-bank/               # 知识库目录
├── output/                    # 输出文件目录 (新增)
│   ├── data/                  # 数据文件
│   │   ├── chat-data.json
│   │   └── web-chat-data.json
│   ├── reports/               # 报告文件
│   │   ├── chat-summary-*.md
│   │   └── cursor-chat-history-*.md
│   └── logs/                  # 日志文件 (预留)
├── .cursor/mcp.json          # MCP配置文件
└── package.json              # 项目配置
```

## 🔄 数据管理操作

### 提取聊天数据
```bash
npm run extract    # 提取到 output/data/chat-data.json
```

### 生成报告
```bash
npm run summary    # 生成摘要到 output/reports/
npm run markdown   # 生成历史记录到 output/reports/
npm run export     # 执行完整导出流程
```

### 清理输出文件
```bash
# 清理所有输出文件
rm -rf output/

# 清理特定类型
rm output/data/*.json
rm output/reports/*.md
```

## 🧹 维护操作

### 项目清理 (已完成 2025-06-12)
- ✅ 删除过时文档: NEW_PROJECT_*_GUIDE.md, deploy-to-new-project.sh
- ✅ 整理文件结构: 创建output目录，移动散乱文件
- ✅ 更新脚本路径: 5个脚本的输入输出路径标准化
- ✅ 优化版本控制: 更新.gitignore规则

### 定期维护任务
```bash
# 每日同步 (如果需要)
npm run extract

# 每周清理老旧输出文件
find output/ -name "*.md" -mtime +7 -delete
find output/ -name "*.json" -mtime +7 -delete

# 记忆库备份
cp -r memory-bank/ backup/memory-bank-$(date +%Y%m%d)/
```

## 🔧 故障排除

### 问题1: MCP服务器无法启动
**症状**: 运行`npm run mcp`失败
**检查步骤**:
```bash
# 检查Node.js版本
node --version  # 需要 >=18.0.0

# 检查依赖
npm install

# 检查权限
chmod +x src/mcp-server.js
```

### 问题2: Cursor找不到MCP设置
**可能原因**: Cursor版本不支持MCP
**解决方案**: 
1. 更新Cursor到最新版本
2. 检查配置文件路径：`.cursor/mcp.json`
3. 尝试重启Cursor

### 问题3: 数据提取失败
**症状**: `npm run extract`报错
**检查步骤**:
```bash
# 检查数据库路径
ls "/Users/jay/Library/Application Support/Cursor/User/workspaceStorage/"

# 检查输出目录
mkdir -p output/data

# 查看详细错误
DEBUG=* npm run extract
```

### 问题4: 输出文件路径错误
**症状**: 文件生成到错误位置
**解决方案**: 检查更新后的脚本路径配置
```javascript
// 确认路径配置正确
outputFile: './output/data/chat-data.json'  // ✅
outputFile: './chat-data.json'              // ❌ 旧路径
```

## 📊 监控指标

### 健康检查
```bash
# 检查MCP服务器状态
ps aux | grep mcp-server

# 检查数据文件状态
ls -la output/data/
ls -la output/reports/

# 检查记忆库文件
ls -la memory-bank/
```

### 性能指标
- 聊天数据提取时间: ~5-10秒
- 记忆库文件大小: ~50KB
- 输出文件总大小: ~50KB

## 🔄 部署和恢复

### 快速部署
```bash
# 基础部署
git clone [项目地址]
cd cursor-chat-memory
npm install
mkdir -p output/{data,reports,logs}
npm run mcp
```

### 数据恢复
```bash
# 恢复记忆库
cp -r backup/memory-bank-latest/* memory-bank/

# 重新生成输出文件
npm run export
```

## 📈 项目监控

### 关键文件监控
- `src/mcp-server.js` - 核心服务器文件
- `memory-bank/*.md` - 知识库文件
- `.cursor/mcp.json` - MCP配置
- `output/` - 输出目录

### 异常警报
- MCP服务器无法启动
- 数据提取连续失败
- 记忆库文件损坏
- 输出目录空间不足

*最后更新: 2025-06-12 - 项目清理和结构优化后*