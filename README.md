# 📝 Cursor 聊天历史查看器

一个用于展示和浏览 Cursor AI 聊天历史的工具，让您轻松回顾和管理与AI的对话记录。

## ✨ 功能特色

- 🎯 **今日聊天** - 显示今天的所有AI对话
- 🔍 **智能搜索** - 快速搜索聊天内容  
- 📊 **统计信息** - 对话数量、活动时间等统计
- 🎨 **美观界面** - 现代化的响应式设计
- 💾 **数据提取** - 从Cursor SQLite数据库提取真实数据
- 🌐 **本地服务** - 内置HTTP服务器，避免CORS问题

## 📦 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 提取聊天数据
```bash
npm run extract
```

### 3. 启动本地服务器
```bash
npm run serve
```

### 4. 打开浏览器
访问 http://localhost:3000 查看聊天历史

### 或者一键启动
```bash
npm start
```

## 🗂️ 文件结构

```
cursor-chat-memory/
├── 📄 cursor-chat-viewer.html    # 聊天历史展示页面
├── 🔧 extract-chat-data.js       # 数据提取脚本
├── 🌐 serve.js                   # 本地HTTP服务器
├── 🔍 scan-cursor-data.sh        # Cursor数据扫描脚本
├── 📊 web-chat-data.json         # 网页用聊天数据
├── 💾 chat-data.json             # 完整聊天数据
└── 📝 README.md                  # 使用说明
```

## 🛠️ 工作原理

### 数据提取流程

1. **扫描Cursor目录** - 找到SQLite数据库文件
2. **查询聊天数据** - 提取 `aiService.prompts` 和 `aiService.generations`
3. **时间过滤** - 筛选今天的对话记录
4. **关联配对** - 将用户提问和AI回复配对
5. **生成JSON** - 输出网页可用的数据格式

### 数据库位置

```
~/Library/Application Support/Cursor/User/workspaceStorage/{workspace-id}/state.vscdb
```

## 📊 数据结构

### 输入数据 (SQLite)
```sql
-- aiService.prompts 用户提示词
SELECT value FROM ItemTable WHERE key = 'aiService.prompts'

-- aiService.generations AI回复
SELECT value FROM ItemTable WHERE key = 'aiService.generations'
```

### 输出数据 (JSON)
```json
[
  {
    "id": 1,
    "type": "prompt",
    "text": "用户提问内容",
    "timestamp": 1749605879161,
    "commandType": 4
  },
  {
    "id": 2,
    "type": "generation", 
    "text": "AI回复内容",
    "timestamp": 1749605880161,
    "uuid": "f362fd02-4942-4223-b7b0-c14c7eb86bfe"
  }
]
```

## 🚀 高级用法

### 自定义时间范围
修改 `extract-chat-data.js` 中的过滤条件：

```javascript
// 过滤最近7天的数据
const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
const recentGenerations = this.chatData.generations.filter(gen => {
    const timestamp = gen.unixMs || gen.timestamp;
    return timestamp >= sevenDaysAgo;
});
```

### 添加新的统计维度
在 `cursor-chat-viewer.html` 中添加新的统计卡片：

```html
<div class="stat-item">
    <div class="stat-number" id="avgResponseTime">--</div>
    <div class="stat-label">平均响应时间</div>
</div>
```

### 自定义搜索功能
扩展搜索算法以支持更复杂的查询：

```javascript
// 支持正则表达式搜索
const regex = new RegExp(searchTerm, 'i');
filteredChats = allChats.filter(chat => 
    regex.test(chat.text) || regex.test(chat.uuid)
);
```

## 🔧 开发命令

| 命令 | 说明 |
|------|------|
| `npm run extract` | 提取聊天数据 |
| `npm run serve` | 启动本地服务器 |
| `npm start` | 提取数据并启动服务器 |
| `npm run open` | 打开浏览器页面 |

## 📱 界面预览

### 统计面板
- 📊 今日对话数量
- 👤 用户提问次数  
- 🤖 AI回复次数
- ⏰ 最后活动时间

### 聊天记录
- 🎨 用户提问 - 橙色渐变背景
- 🤖 AI回复 - 紫色渐变背景
- 🔍 实时搜索过滤
- ⏰ 时间戳显示

## 🐛 故障排除

### 数据库文件不存在
```bash
# 重新扫描Cursor数据目录
./scan-cursor-data.sh
```

### CORS错误
使用内置的HTTP服务器而不是直接打开HTML文件：
```bash
npm run serve
```

### 空数据
检查是否有今天的聊天记录：
```bash
sqlite3 "数据库路径" "SELECT COUNT(*) FROM ItemTable WHERE key = 'aiService.generations'"
```

## 🔐 隐私说明

- ✅ 数据仅在本地处理，不上传到任何服务器
- ✅ 所有聊天记录保存在您的设备上
- ✅ 工具只读取Cursor的本地数据库
- ✅ 可以随时删除生成的JSON文件

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个工具！

### 开发环境设置
```bash
git clone https://github.com/your-repo/cursor-chat-memory
cd cursor-chat-memory
npm install
npm run extract
npm run serve
```

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

**💡 提示**: 这个工具可以帮助您更好地管理和回顾与Cursor AI的对话历史，提高工作效率！ 