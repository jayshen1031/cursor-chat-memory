## **Cursor 聊天存储机制分析** 🔍

### **1. 多层存储架构**

Cursor使用了一个多层的存储架构：

### **主要存储位置**：

- **工作区级SQLite**: `/Users/jay/Library/Application Support/Cursor/User/workspaceStorage/[workspaceId]/state.vscdb`
- **全局级SQLite**: `/Users/jay/Library/Application Support/Cursor/User/globalStorage/state.vscdb`
- **JSON聊天文件**: `~/.cursor/chat/[session-id].json`

### **2. 实时存储策略** ⏱️

从日志分析可以看到，Cursor的存储不是每条消息立即保存，而是采用**智能批量保存策略**：

### **触发保存的条件**：

1. **会话暂停时** - 用户停止输入一段时间后
2. **上下文切换时** - 切换到其他文件或窗口
3. **达到消息阈值** - 累积一定数量的消息后
4. **应用关闭时** - Cursor关闭前的清理保存
5. **内存压力时** - 系统内存不足时的自动保存