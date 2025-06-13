# 技术决策

> 记录重要的技术选择和架构决策

## MCP协议选择

- 选择MCP标准协议，确保与Cursor生态的兼容性
- 使用stdio传输，简化部署和调试

## 数据存储方案

- 直接读取Cursor SQLite数据库，避免数据重复
- 使用Markdown文件存储Memory Bank，便于人工查看和版本控制

*此文件由MCP Server自动维护*

## 🆕 2025-06-12 技术决策

### 决策1: 移除Web展示功能
**背景**: 用户反馈Web功能不是核心需求，希望简化项目结构
**决策**: 完全移除Web相关功能，专注于MCP和数据导出
**影响**: 
- ✅ 项目结构更简洁，维护成本降低
- ✅ 减少依赖，提高稳定性
- ❌ 失去可视化界面，但可通过Markdown文件补偿

**实施方案**:
```bash
# 删除的文件
- serve.js (Web服务器)
- cursor-chat-viewer.html (前端页面)  
- web-chat-data.json (Web数据)
- web/ 目录及其内容

# 修改的文件
- package.json (移除web相关脚本)
- extract-chat-data.js (移除Web数据生成)
- README.md (更新使用说明)
```

### 决策2: 数据导出质量优化策略
**问题**: 6/12导出质量不如6/11，AI回复内容过于模板化
**分析**: 
- 数据量影响：6/11有95组对话 vs 6/12只有21组
- 内容深度：历史积累的技术讨论更丰富
- 生成策略：需要更智能的AI回复生成算法

**决策**: 保持现有的fix-missing-ai-responses.js机制，但增强智能化
**改进方向**:
```javascript
// 当前：基于关键词的模板匹配
// 未来：基于语义理解的个性化回复生成
const generateIntelligentResponse = (prompt, context) => {
    // 分析提问类型、技术领域、复杂度
    // 生成更有针对性的回复
};
```

### 决策3: MCP配置问题的应对策略
**问题**: Cursor设置中找不到MCP配置选项
**可能原因**:
1. Cursor版本不支持MCP
2. MCP功能需要特殊启用
3. 配置方式与预期不同

**决策**: 采用多重配置策略
```json
// 方案1: 直接配置文件 (.cursor/mcp.json)
{
  "mcpServers": {
    "cursor-memory": {
      "command": "node",
      "args": ["src/mcp-server.js"],
      "cwd": "/path/to/cursor-chat-memory"
    }
  }
}

// 方案2: 环境变量配置
// 方案3: 命令行参数配置
```

### 决策4: 项目定位重构 (2025-06-12 下午新增)
**背景**: 通过文件分析发现项目定位模糊，存在大量过时的"部署工具包"相关内容
**问题分析**: 
- 过时文档内容达60%以上不准确
- 项目已从"通用工具"演进为"专用VSCode扩展"
- 部署脚本和使用指南与实际功能脱节

**重大决策**: 明确项目定位为"专用VSCode扩展"
```
旧定位: 可部署到任何项目的通用Memory Bank工具包
新定位: Cursor Memory MCP Server - 专用的智能聊天记忆扩展
```

**实施策略**:
1. **删除过时文件** (30KB内容清理)
   - NEW_PROJECT_SETUP_GUIDE.md (9.9KB)
   - NEW_PROJECT_USAGE_GUIDE.md (7.4KB)  
   - deploy-to-new-project.sh (13KB)

2. **目录结构规范化**
   ```
   新增: output/{data,reports,logs}/ 三级目录
   移动: 所有输出文件到对应目录
   更新: 5个脚本的路径配置
   ```

3. **版本控制优化**
   ```gitignore
   # 新增忽略规则
   output/           # 输出目录
   *.md             # 临时报告
   ```

### 决策5: 配置文件重复问题解决
**发现**: 同时存在`cursor-mcp-config.json`和`.cursor/mcp.json`
**分析**: 两文件内容完全相同，属于历史遗留问题
**决策**: 保留`.cursor/mcp.json`作为主配置文件
**原因**: 符合Cursor的标准配置路径约定

### 决策6: 输出文件管理策略
**问题**: 数据文件和报告散乱存放，影响项目整洁度
**解决方案**: 实施分类存储策略
```javascript
const outputStructure = {
    'output/data/': ['chat-data.json', 'web-chat-data.json'],
    'output/reports/': ['chat-summary-*.md', 'cursor-chat-history-*.md'],
    'output/logs/': ['*.log', 'debug-*.txt']
};
```

**技术实现**: 批量更新所有脚本的输入输出路径
- extract-chat-data.js → output/data/
- generate-summary.js → output/reports/
- generate-markdown.js → output/reports/
- fix-missing-ai-responses.js → output/data/

## 2025-06-12 技术讨论

发现 8 个技术相关对话

- **问题**: 帮我快速开始的设置
  **方案**: 提供了MCP Server的快速启动指南和配置步骤

- **问题**: 在Cursor设置中导入配置文件cursor-mcp-config.json 这一步呢，不用了么
  **方案**: 分析了MCP配置的不同方式，确认配置文件的必要性

- **问题**: 2. 搜索 MCP 相关设置...这里搜索不到
  **方案**: 识别了Cursor MCP支持的版本兼容性问题

- **问题**: 帮我去掉网页展示历史数据的功能
  **方案**: 制定了Web功能移除的完整方案和文件清理策略

- **问题**: 导出的质量在哪里控制的，没有11号的好，很多核心信息没有提取
  **方案**: 分析了数据导出质量的影响因素和改进方向

- **问题**: MCP server要如何使用
  **方案**: 提供了MCP Server的使用指南和集成方法

- **问题**: 配置 MCP Server...显示no settings found
  **方案**: 深入分析了MCP配置问题的根本原因和解决思路

- **问题**: 获取记忆库内容 / 帮我更新记忆库
  **方案**: 实现了记忆库的动态管理和更新机制

### 今日决策成果总结

**项目重构效果**:
- ✅ 项目定位明确化: 从模糊工具包到专用扩展
- ✅ 结构规范化: 创建标准的output目录体系
- ✅ 代码质量提升: 删除30KB过时内容，更新5个脚本路径
- ✅ 维护效率改善: 简化文件查找和项目部署流程

**技术债务清理**:
- 解决了文档过时问题(60%+内容不准确)
- 消除了配置文件重复问题
- 统一了版本控制策略
- 规范了输出文件管理

这些决策显著提升了项目的专业化程度和长期可维护性！

## 2025-06-13 技术决策

### 🛡️ 部署安全性改进
**决策**: 修改 `deploy-to-new-project.sh` 脚本的清理逻辑
**背景**: 原有的 `--clean` 参数会删除目标目录的所有文件，导致误删重要项目文件
**解决方案**: 
```bash
# 注释掉危险的清理操作
# rm -rf "$TARGET_DIR"/*
echo "[跳过] 不再清理目标目录，保留所有原有文件。"
```
**影响**: 提高部署安全性，避免数据丢失

### 🏗️ MCP Server 架构设计
**决策**: 采用模块化的Memory Bank结构
**技术选择**: 
- **服务器**: Node.js + Express
- **数据库**: SQLite (Cursor原生数据库)
- **协议**: MCP (Model Context Protocol)
- **端口**: 3000 (可配置)

**目录结构**:
```
memory-bank/
├── businessInsights/    # BI项目专用
├── dataModels/         # 数据模型
├── reportTemplates/    # 报表模板
├── dashboardDesigns/   # 仪表盘设计
└── etlProcesses/       # ETL流程
```

### 📊 数据同步策略
**决策**: 实时同步 + 定时批处理
**实现方式**:
1. **实时监控**: 监听Cursor数据库变化
2. **批量处理**: 定时提取和分析聊天数据
3. **智能过滤**: 只处理有意义的对话内容

**数据流程**:
```
Cursor SQLite → 数据提取 → 对话分析 → Memory Bank更新
```

### 🔧 项目类型支持
**决策**: 支持多种项目类型的差异化配置
**支持类型**:
- `development`: 开发项目 (learningInsights, problemSolutions, codePatterns)
- `analysis`: 分析项目 (businessInsights, analysisPatterns, dataModels)  
- `bi`: BI项目 (businessInsights, dataModels, reportTemplates, dashboardDesigns, etlProcesses)

**配置示例**:
```json
{
  "projects": {
    "bi-project": {
      "name": "BI项目",
      "path": "./memory-bank",
      "type": "bi"
    }
  }
}
```

### 🚀 部署策略优化
**决策**: 非破坏性部署
**原则**:
1. **保护现有文件**: 不删除目标目录中的原有文件
2. **增量更新**: 只添加或更新必要的文件
3. **配置隔离**: 每个项目独立的配置文件

**实施效果**: 
- ✅ 避免误删重要文件
- ✅ 支持多项目并存
- ✅ 降低部署风险

---
*决策记录时间: 2025-06-13 20:23*

