# 🧠 Enhanced Cursor Chat Memory

一个智能的 Cursor IDE 插件，提供**选择性引用**聊天记忆功能，帮助你精准利用历史对话内容，提升开发效率。

## 🎉 最新发布 - v2.1.0 项目特定功能

### 🚀 重大更新：项目感知记忆系统
- **🏗️ 项目特定记忆**: 为每个项目提供独立的聊天记忆空间
- **🎯 智能过滤**: 自动识别并过滤项目相关的历史对话  
- **⚙️ 一键配置**: 新项目初始化脚本，快速启用记忆功能
- **📁 独立缓存**: 项目隔离的缓存系统，避免记忆混淆
- **🔧 上下文控制**: 智能token限制，防止上下文过载

### 📊 测试验证结果
✅ **成功测试场景**：
- 在`test-react-project`中成功识别Vite+React相关对话
- 项目特定过滤：从3个全局会话中精确筛选出1个项目相关会话
- 智能引用生成：自动生成项目上下文的精简引用 (~128 tokens)
- 跨项目隔离：不同项目的记忆完全独立，无干扰

### 🎯 使用效果演示
```bash
# 在任何新项目中
cd /path/to/your-project
./init-project.sh

# 查看项目相关会话
cursor-memory project-sessions
# 📋 项目 "your-project" 相关会话 (X个)

# 获取项目特定引用  
cursor-memory project-reference recent
# 💡 **最近会话 (项目相关)** (X个会话)
```

## ✨ 核心特性

### 🎯 智能选择性引用
- **智能推荐**：基于输入内容推荐最相关的历史对话
- **分类管理**：自动将对话分类（JavaScript、Python、Web开发等）
- **标签系统**：自动生成语义标签，便于快速筛选
- **重要性评分**：智能评估对话价值，优先显示重要内容

### 🏗️ 项目感知功能 (NEW!)
- **项目特定记忆**：每个项目独立的聊天记忆空间
- **智能过滤**：自动识别项目相关的历史对话
- **上下文控制**：智能token限制和内容截断
- **轻量级引用**：可配置的精简引用模式

### 📋 多种引用方式
- **预设模板**：快速使用"最近会话"、"问题解决"等模板
- **自定义选择**：手动选择特定对话组合
- **批量操作**：支持全选、按重要性筛选等批量引用
- **搜索引用**：通过关键词搜索并引用相关对话
- **项目引用**：专门的项目相关引用模板

### 🚀 便捷操作
- **一键复制**：引用内容自动复制到剪贴板
- **多界面支持**：VS Code 快捷键 + CLI 工具 + 外部集成
- **实时监听**：自动监听 Cursor 聊天文件变化
- **智能缓存**：高效缓存机制，快速访问历史内容
- **项目初始化**：自动化项目配置和便捷脚本生成

## 📦 安装

### 方式一：VS Code 插件安装
```bash
# 克隆项目
git clone <repository-url>
cd cursor-chat-memory

# 安装依赖
npm install

# 编译项目
npm run compile

# 启动插件（开发模式）
./start_ext.sh
```

### 方式二：独立 CLI 工具
```bash
# 全局安装
npm install -g cursor-chat-memory

# 或者本地编译使用
npm run compile
alias cursor-memory="node $(pwd)/out/cli.js"
```

## 🎮 使用方法

### VS Code 插件操作

#### 快捷键
- `Cmd+Shift+M` (macOS) / `Ctrl+Shift+M` (Windows/Linux): 智能引用面板
- `Cmd+Alt+M` (macOS) / `Ctrl+Alt+M` (Windows/Linux): 快速引用最近对话

#### 命令面板
按 `Cmd+Shift+P` 打开命令面板，输入 "Cursor Memory"：

- **Smart Reference**: 打开智能选择面板
- **Quick Reference**: 快速引用最近重要对话
- **Browse Categories**: 按分类浏览历史对话
- **Search Sessions**: 搜索特定关键词的对话

### CLI 工具操作

#### 基础命令
```bash
# 查看所有会话
cursor-memory list-sessions

# 按分类查看
cursor-memory list-sessions JavaScript

# 智能推荐
cursor-memory recommend "React性能优化问题"

# 搜索相关对话
cursor-memory search "性能优化"

# 查看分类统计
cursor-memory categories

# 查看可用模板
cursor-memory templates
```

#### 项目特定功能 (NEW!)
```bash
# 初始化新项目
./init-project.sh

# 查看项目相关会话
cursor-memory project-sessions

# 获取项目特定引用
cursor-memory project-reference recent
cursor-memory project-reference current-topic

# 设置项目路径
cursor-memory set-project /path/to/project

# 轻量级引用 (控制token数量)
cursor-memory light-reference 2000
```

#### 引用生成
```bash
# 使用预设模板
cursor-memory get-template recent
cursor-memory get-template current-topic "React Hooks"
cursor-memory get-template problem-solving

# 自定义选择会话
cursor-memory custom session1 session2 session3

# 复制到剪贴板 (macOS)
cursor-memory get-template recent | pbcopy
```

#### 管理操作
```bash
# 刷新缓存
cursor-memory refresh

# 查看详细状态
cursor-memory status

# 帮助信息
cursor-memory help
```

## 🔧 预设引用模板

| 模板ID | 名称 | 描述 | 适用场景 |
|--------|------|------|----------|
| `recent` | 最近会话 | 最近3个重要对话 | 快速继续上次话题 |
| `current-topic` | 当前主题 | 基于输入智能推荐 | 深入特定技术主题 |
| `problem-solving` | 问题解决 | 问题解决相关经验 | 调试和错误处理 |
| `optimization` | 性能优化 | 性能优化相关对话 | 性能调优和优化 |
| `all-important` | 重要精选 | 高重要性精选对话 | 重要知识点回顾 |

## 🏗️ 架构设计

### 核心服务
```typescript
ChatMemoryService {
  // 会话管理
  getAllSessions(): ChatSession[]
  getSessionsByCategory(category: string): ChatSession[]
  getSessionsByTag(tagName: string): ChatSession[]
  
  // 智能推荐
  getRecommendedSessions(inputText: string): ChatSession[]
  
  // 模板引用
  getReferenceByTemplate(templateId: string): string
  
  // 自定义引用
  getCustomReference(sessionIds: string[]): string
}
```

### 数据结构
```typescript
interface ChatSession {
  id: string;
  title: string;           // 自动生成的会话标题
  messages: ChatMessage[];
  summary: string;         // 智能摘要
  tags: SessionTag[];      // 自动标签
  category: string;        // 技术分类
  importance: number;      // 重要性评分 (0-1)
  lastActivity: number;
}

interface SessionTag {
  name: string;            // 标签名称
  category: string;        // 标签类别 (main/special)
  confidence: number;      // 置信度
  color?: string;          // 显示颜色
}
```

## 🔌 外部工具集成

### Alfred Workflow
```bash
# Alfred Script Filter
/usr/local/bin/node /path/to/cursor-memory get-template current-topic {query} | pbcopy
```

### Raycast Extension
```bash
# Raycast Script Command
#!/bin/bash
cursor-memory recommend "$1" | pbcopy
echo "智能推荐已复制到剪贴板"
```

### Keyboard Maestro
```bash
# 快捷键触发
cursor-memory get-template recent | pbcopy
```

## ⚙️ 配置选项

在 VS Code 设置中搜索 `cursorChatMemory`：

```json
{
  "cursorChatMemory.showUpdateNotifications": false,
  "cursorChatMemory.maxContextLength": 5000,
  "cursorChatMemory.refreshInterval": 5000,
  "cursorChatMemory.enableAutoRefresh": true
}
```

## 📊 智能特性详解

### 会话分类算法
系统根据内容关键词自动识别技术分类：
- **JavaScript**: 识别 JS、React、Node.js 等关键词
- **Python**: 识别 Python、Django、Flask 等关键词
- **Web开发**: 识别 HTML、CSS、API 等关键词
- **数据库**: 识别 SQL、MongoDB、Redis 等关键词
- **DevOps**: 识别 Docker、K8s、部署等关键词

### 重要性评分机制
基于多个维度计算会话重要性：
- **内容长度**: 详细的回答获得更高分数
- **消息数量**: 深入讨论的会话重要性更高
- **关键词匹配**: 包含"解决方案"、"最佳实践"等词汇加分
- **时间衰减**: 最近的会话具有时间优势

### 智能推荐算法
推荐系统综合考虑：
- **语义相似度**: 基于关键词匹配的相关性
- **类别匹配**: 优先推荐同类别的历史对话
- **重要性权重**: 重要对话获得推荐优势
- **时间因子**: 平衡新鲜度和相关性

## 🛠️ 开发者指南

### 项目结构
```
src/
├── chatMemoryService.ts    # 核心服务类
├── extension.ts            # VS Code 插件入口
├── cli.ts                  # CLI 工具
└── package.json           # 插件配置

out/                        # 编译输出
tests/                      # 测试文件
docs/                       # 文档
```

### 构建脚本
```bash
npm run compile           # 编译 TypeScript
npm run watch            # 监听模式编译
npm run test             # 运行测试
npm run package          # 打包插件
```

### 调试模式
1. 在 VS Code 中打开项目
2. 按 `F5` 启动调试
3. 在新窗口中测试插件功能

## 🔍 故障排除

### 常见问题

**Q: 插件没有检测到聊天文件？**
A: 确保 `~/.cursor/chat/` 目录存在且包含 JSON 文件

**Q: 智能推荐不准确？**
A: 系统需要一定数量的历史对话来训练，建议积累 10+ 个会话

**Q: CLI 工具无法使用？**
A: 检查 Node.js 版本 >= 14，并确保编译完成

**Q: 缓存数据丢失？**
A: 检查 `~/.cursor-memory/` 目录权限，或运行 `cursor-memory refresh`

### 日志查看
```bash
# VS Code 开发者工具中查看
# 或检查系统日志
tail -f ~/.cursor-memory/debug.log
```

## 🚀 使用示例

### 场景1：快速继续上次讨论
```bash
# 1. 获取最近重要对话
cursor-memory get-template recent | pbcopy

# 2. 在 Cursor 中粘贴，继续深入讨论
```

### 场景2：解决类似问题
```bash
# 1. 搜索相关历史经验
cursor-memory search "API错误处理"

# 2. 选择相关会话生成引用
cursor-memory custom api-error-1 api-error-2 | pbcopy
```

### 场景3：学习特定技术
```bash
# 1. 按分类浏览
cursor-memory list-sessions JavaScript

# 2. 智能推荐相关内容
cursor-memory recommend "React Hooks优化" | pbcopy
```

## 📈 更新日志

### v2.1.0 - 项目感知记忆系统 🎯
- ✨ **项目特定记忆**: 为每个项目提供独立的聊天记忆空间
- 🎯 **智能过滤**: 自动识别项目相关对话，精准匹配项目上下文
- ⚙️ **项目初始化**: `init-project.sh` 脚本一键配置新项目
- 📁 **独立缓存**: `~/.cursor-memory/projects/` 项目隔离缓存系统
- 🔧 **上下文控制**: 智能token限制，最大8000 tokens，支持轻量级引用
- 📋 **新增命令**: `project-sessions`, `project-reference`, `set-project`, `light-reference`
- 🧪 **测试验证**: 完整的项目特定功能测试，确保跨项目隔离

#### 技术改进
- **智能token估算**: 中文1.5 tokens，英文1.3 tokens，精确控制上下文长度  
- **项目识别算法**: 基于项目名称和关键词的智能匹配机制
- **缓存优化**: 项目特定缓存目录，避免全局记忆污染
- **便捷脚本**: 自动生成项目专用的 `cursor-memory.sh` 脚本

### v2.0.0 - 智能选择性引用
- ✨ 全新的智能推荐算法
- 🏷️ 自动会话分类和标签系统
- 📋 多种预设引用模板
- 🎯 批量选择和自定义引用
- 📊 详细的统计和分析面板

### v1.0.0 - 基础功能
- 🔍 基础聊天文件监听
- 📝 简单的上下文提取
- ⚡ 快速引用功能

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 提交 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 💬 反馈与支持

- 🐛 [报告 Bug](../../issues)
- 💡 [功能建议](../../discussions)
- 📧 邮件支持: jayshen1031@gmail.com

---

**让 AI 助手的记忆更智能，让你的开发更高效！** 🚀

<!-- Cache buster: 2025-01-06 02:47 UTC --> 