# 技术决策

> 记录重要的技术选择和架构决策

## MCP协议选择

- 选择MCP标准协议，确保与Cursor生态的兼容性
- 使用stdio传输，简化部署和调试

## 数据存储方案

- 直接读取Cursor SQLite数据库，避免数据重复
- 使用Markdown文件存储Memory Bank，便于人工查看和版本控制

*此文件由MCP Server自动维护*
