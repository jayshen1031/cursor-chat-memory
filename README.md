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

### 🚀 方式一：一键安装（推荐）

```bash
# 克隆项目
git clone <repository-url>
cd cursor-chat-memory

# 一键安装（包含依赖、编译、CLI工具、环境配置）
./quick-install.sh
```

一键安装脚本会自动：
- ✅ 安装npm依赖
- ✅ 编译TypeScript代码
- ✅ 安装CLI工具到 `~/.local/bin/cursor-memory`
- ✅ 配置PATH环境变量
- ✅ 提供使用指南

### 📋 方式二：分步安装

```bash
# 1. 克隆并安装依赖
git clone <repository-url>
cd cursor-chat-memory
npm install

# 2. 编译项目
npm run compile

# 3. 安装CLI工具
./install-cli.sh

# 4. 配置环境（如果需要）
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### 🔧 方式三：VS Code 插件开发模式

```bash
# 克隆项目
git clone <repository-url>
cd cursor-chat-memory

# 安装依赖并编译
npm install
npm run compile

# 启动插件（开发模式）
./start_ext.sh
```

### ✅ 验证安装

```bash
# 测试CLI工具
cursor-memory help

# 如果命令不可用，使用完整路径
~/.local/bin/cursor-memory help
```

### 🔧 故障排除

如果遇到 "cursor-memory 命令未找到" 错误，请查看详细的 [安装指南](INSTALL_GUIDE.md)。

常见解决方案：
1. 确保PATH配置正确：`echo $PATH | grep "$HOME/.local/bin"`
2. 重新加载shell配置：`source ~/.zshrc` 或重启终端
3. 使用完整路径：`~/.local/bin/cursor-memory help`

## 🎮 使用方法

### 🎯 在Cursor IDE中使用 (核心功能)

#### 第一步：项目初始化
在任何新的Cursor项目中，首先初始化聊天记忆功能：

```bash
# 进入你的项目目录
cd /path/to/your-cursor-project

# 运行初始化脚本
/path/to/cursor-chat-memory/init-project.sh
```

初始化完成后，你的项目会自动生成：
- `cursor-memory.config.json` - 项目配置文件
- `cursor-memory.sh` - 便捷使用脚本  
- `.gitignore` 更新 - 忽略缓存文件

#### 第二步：在Cursor中开始聊天
正常使用Cursor IDE的聊天功能，系统会自动：
- 📝 记录你的对话内容
- 🏷️ 自动分类和标记
- 💾 保存到项目特定的缓存

#### 第三步：智能引用历史上下文

**方法1: 使用便捷脚本**
```bash
# 获取项目相关的最近对话
./cursor-memory.sh project-reference recent

# 获取当前主题相关的对话
./cursor-memory.sh project-reference current-topic

# 查看项目相关的所有会话
./cursor-memory.sh project-sessions
```

**方法2: 直接复制引用内容**
```bash
# 生成引用并复制到剪贴板 (macOS)
./cursor-memory.sh project-reference recent | pbcopy

# 然后在Cursor聊天中粘贴使用
```

**方法3: 轻量级引用（控制token数量）**
```bash
# 生成最多2000 tokens的精简引用
./cursor-memory.sh light-reference 2000 | pbcopy
```

#### 第四步：在新聊天中引用上下文

在Cursor的新聊天中，你可以这样开始：

```
## 上下文引用
[粘贴通过cursor-memory获取的相关历史对话]

## 当前问题
基于上述上下文，我现在遇到了一个新问题...
```

### 🌟 实际使用场景演示

#### 场景1：React项目开发
```bash
# 项目结构
my-react-app/
├── src/
├── package.json
├── cursor-memory.config.json  ← 自动生成
└── cursor-memory.sh           ← 自动生成

# 在Cursor中讨论React性能优化后
./cursor-memory.sh project-reference optimization

# 输出示例：
## 💡 项目相关引用 (2个会话, ~156 tokens)

### 🔧 React性能优化 (2024-01-05)
**摘要**: 讨论了React.memo、useMemo优化策略
**关键点**: 
- 使用React.memo包装组件避免不必要渲染
- useMemo缓存计算结果
- 代码分割和懒加载

### ⚡ 组件渲染优化 (2024-01-04)  
**摘要**: 解决了列表渲染性能问题
**解决方案**: 实现虚拟滚动和分页加载
```

#### 场景2：跨项目学习
```bash
# 在新的Vue项目中
cd /path/to/vue-project
/path/to/cursor-chat-memory/init-project.sh

# 搜索所有项目中的相关经验
cursor-memory search "组件通信" --global

# 或只看当前项目相关
./cursor-memory.sh project-sessions
```

#### 场景3：问题解决追踪
```bash
# 当遇到相似bug时
./cursor-memory.sh search "API错误" 

# 获取问题解决相关的历史对话
./cursor-memory.sh project-reference problem-solving

# 在Cursor中粘贴引用，继续深入讨论解决方案
```

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

### 🔄 多项目管理和切换

#### 项目间独立记忆
每个项目的聊天记忆完全独立，互不干扰：

```bash
# 项目A - React应用
cd ~/projects/react-app
./cursor-memory.sh project-sessions
# 显示: React相关的3个会话

# 项目B - Python API  
cd ~/projects/python-api
./cursor-memory.sh project-sessions  
# 显示: Python相关的5个会话
```

#### 全局vs项目特定命令对比

| 功能 | 全局命令 | 项目特定命令 |
|------|----------|-------------|
| 查看会话 | `cursor-memory list-sessions` | `./cursor-memory.sh project-sessions` |
| 生成引用 | `cursor-memory get-template recent` | `./cursor-memory.sh project-reference recent` |
| 搜索对话 | `cursor-memory search "关键词"` | `./cursor-memory.sh search "关键词"` |
| 设置项目 | `cursor-memory set-project $(pwd)` | 自动检测当前项目 |

#### 项目配置管理
```bash
# 查看当前项目配置
cat cursor-memory.config.json

# 示例配置内容:
{
  "projectName": "my-react-app",
  "projectPath": "/Users/jay/projects/my-react-app", 
  "cacheDir": "~/.cursor-memory/projects/my-react-app",
  "maxSessions": 50,
  "tokenLimit": 8000
}
```

#### 批量项目管理
```bash
# 为多个现有项目批量初始化
for dir in ~/projects/*/; do
  cd "$dir"
  if [ -f "package.json" ] || [ -f "requirements.txt" ]; then
    echo "初始化项目: $(basename "$dir")"
    curl -s https://raw.githubusercontent.com/jayshen1031/cursor-chat-memory/master/init-project.sh | bash
  fi
done
```

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