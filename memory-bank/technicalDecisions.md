# 技术决策

> 记录重要的技术选择和架构决策

## MCP协议选择

- 选择MCP标准协议，确保与Cursor生态的兼容性
- 使用stdio传输，简化部署和调试

## 数据存储方案

- 直接读取Cursor SQLite数据库，避免数据重复
- 使用Markdown文件存储Memory Bank，便于人工查看和版本控制

*此文件由MCP Server自动维护*

## 2025-06-12 技术讨论

发现 3 个技术相关对话

- **问题**: https://marketplace.visualstudio.com/items?itemName=CoderOne.aimemory 参考它的设计，帮我设计一个MCP server和Cursor...
  **方案**: ...

- **问题**: 先实现基础MCP Server框架和数据提取吧，自动从SQLite提取数据（继承你的优势） AI驱动的内容分析和分类，无需手动维护Memory Bank文件...
  **方案**: ...

- **问题**: 帮我提交代码...
  **方案**: ...

