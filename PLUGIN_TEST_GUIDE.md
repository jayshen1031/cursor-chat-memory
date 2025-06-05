# 🧪 Cursor Chat Memory 插件测试指南

## 🚀 启动插件开发环境

### 1. 编译项目
```bash
cd cursor-chat-memory
npm run compile
```

### 2. 启动插件开发模式
```bash
./start_ext.sh
# 或手动运行:
/Applications/Cursor.app/Contents/MacOS/Cursor --extensionDevelopmentPath="$(pwd)" --disable-extensions --new-window
```

## ✅ 插件加载验证

### 1. 检查插件状态
- 新Cursor窗口应该自动打开
- 状态栏可能显示插件相关信息
- 输出面板可能显示插件日志

### 2. 查看开发者工具
- `View > Developer Tools` 或 `Cmd+Shift+I`
- 在Console中查看是否有插件启动日志
- 查找 "Enhanced Chat Memory Service" 相关信息

## 🎯 功能测试清单

### A. 命令面板测试 (`Cmd+Shift+P`)

搜索 "Cursor Memory" 应该显示：

- [ ] `🧠 增强输入` (cursorChatMemory.enhanceInput)
- [ ] `⚡ 快速引用上下文` (cursorChatMemory.quickReference)  
- [ ] `📊 显示状态面板` (cursorChatMemory.showStatus)
- [ ] `🔄 重启记忆服务` (cursorChatMemory.restartService)

### B. 快捷键测试

- [ ] `Cmd+Shift+M`: 快速引用上下文
- [ ] `Cmd+Alt+M`: 增强输入

### C. 配置设置测试 (`Cmd+,`)

搜索 "cursorChatMemory" 应该显示：

- [ ] `Show Update Notifications` (默认: false)
- [ ] `Max Context Items` (默认: 10)
- [ ] `Auto Refresh Interval` (默认: 30秒)
- [ ] `Summary Max Lines` (默认: 3)

## 🔧 实际使用测试

### 1. 创建测试聊天文件

在 `~/.cursor/chat/` 目录创建测试文件：

```bash
mkdir -p ~/.cursor/chat
cat > ~/.cursor/chat/test-plugin.json << 'EOF'
{
  "id": "test-plugin-001",
  "title": "插件功能测试",
  "messages": [
    {
      "id": "msg1",
      "content": "这是一个测试VS Code插件功能的对话",
      "role": "user",
      "timestamp": "2025-01-06T08:00:00Z"
    },
    {
      "id": "msg2", 
      "content": "插件应该能够自动检测和分析这个对话，将其分类为系统工具类别。",
      "role": "assistant",
      "timestamp": "2025-01-06T08:01:00Z"
    }
  ],
  "createdAt": "2025-01-06T08:00:00Z",
  "updatedAt": "2025-01-06T08:01:00Z"
}
EOF
```

### 2. 测试实时监听

- [ ] 创建新的聊天文件后，插件应该自动检测
- [ ] 使用 `📊 显示状态面板` 查看会话数量是否更新
- [ ] 检查是否出现新的会话分类

### 3. 测试引用生成

- [ ] 使用 `⚡ 快速引用上下文` 命令
- [ ] 检查是否生成了包含历史对话的引用内容
- [ ] 验证引用内容是否合理且格式正确

### 4. 测试状态面板

- [ ] 使用 `📊 显示状态面板` 命令
- [ ] 检查显示的统计信息：
  - 总会话数
  - 分类统计
  - 最近会话列表
  - 重要性评分

## 🐛 故障排除

### 插件未加载
1. 检查编译是否成功：`npm run compile`
2. 确认Cursor版本兼容性（VS Code 1.74.0+）
3. 查看开发者工具Console是否有错误
4. 重启插件开发环境

### 命令不可用
1. 确认插件激活：检查 `package.json` 中的 `activationEvents`
2. 查看输出面板的"Extension Host"日志
3. 尝试手动激活：在命令面板运行任意插件命令

### 文件监听不工作
1. 确认 `~/.cursor/chat/` 目录存在
2. 检查文件权限
3. 查看插件日志中的文件系统监听信息

## 📊 预期结果

### 成功标志
- [ ] 插件正常加载且命令可用
- [ ] 能够检测到现有聊天文件
- [ ] 自动分类功能正常工作
- [ ] 引用生成功能正常工作
- [ ] 状态面板显示准确信息

### 性能指标
- [ ] 插件启动时间 < 2秒
- [ ] 文件监听响应时间 < 1秒
- [ ] 引用生成时间 < 3秒
- [ ] 内存使用合理（< 50MB）

## 📝 测试记录

### 测试环境
- 操作系统: ___________
- Cursor版本: ___________
- 插件版本: v2.1.1
- Node.js版本: ___________

### 测试结果
- [ ] 基础功能测试通过
- [ ] 快捷键测试通过  
- [ ] 配置设置测试通过
- [ ] 实际使用测试通过
- [ ] 性能测试通过

### 发现的问题
1. ___________
2. ___________
3. ___________

### 改进建议
1. ___________
2. ___________
3. ___________ 