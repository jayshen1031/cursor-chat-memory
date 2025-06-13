# Cursor Memory 新项目部署指南

本文档提供了在新项目中部署和启动 Cursor Memory 的详细步骤。

## 前提条件

- Node.js 18+ 已安装
- Git 已安装
- 目标项目目录已创建

## 部署步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/jayshen1031/cursor-chat-memory.git
   cd cursor-chat-memory
   ```

2. **设置部署脚本权限**
   ```bash
   chmod +x deploy-to-new-project.sh
   ```

3. **部署到新项目**
   ```bash
   ./deploy-to-new-project.sh /path/to/your/project --clean
   ```
   注意：
   - `/path/to/your/project` 替换为你的目标项目路径
   - `--clean` 参数会在目标目录已存在时清理它

4. **启动 MCP Server**
   ```bash
   cd /path/to/your/project/cursor-memory
   ./start-mcp-server.sh
   ```

## 目录结构

部署后的目录结构如下：
```
your-project/
├── cursor-memory/           # Cursor Memory 项目目录
│   ├── src/                # 源代码目录
│   ├── memory-bank/        # 记忆库目录
│   ├── output/            # 输出文件目录
│   ├── logs/              # 日志目录
│   ├── node_modules/      # 依赖目录
│   ├── package.json       # 项目配置
│   └── start-mcp-server.sh # 启动脚本
└── ...                    # 你的项目其他文件
```

## 配置说明

MCP Server 的配置文件为 `cursor-mcp-config.json`，默认配置如下：
```json
{
    "port": 3000,
    "host": "localhost",
    "logLevel": "info",
    "memoryBankPath": "./memory-bank",
    "outputPath": "./output",
    "logPath": "./logs"
}
```

## 常见问题

1. **启动失败：MCP Server 文件不存在**
   - 检查 `src/mcp-server.js` 文件是否存在
   - 确保部署脚本执行成功

2. **依赖安装失败**
   - 确保有足够的磁盘空间
   - 检查网络连接
   - 尝试手动运行 `npm install`

3. **端口被占用**
   - 修改 `cursor-mcp-config.json` 中的 `port` 配置
   - 确保没有其他服务占用该端口

## 维护说明

1. **更新项目**
   ```bash
   cd /path/to/your/project/cursor-memory
   git pull
   npm install
   ```

2. **清理日志**
   ```bash
   rm -rf logs/*
   ```

3. **备份记忆库**
   ```bash
   cp -r memory-bank /path/to/backup/
   ```

## 注意事项

1. 确保目标项目目录有足够的磁盘空间
2. 建议定期备份 `memory-bank` 目录
3. 不要修改 `src` 目录下的核心文件
4. 保持 Node.js 版本在 18 或以上

## 技术支持

如果遇到问题，请：
1. 检查日志文件 (`logs/mcp-server.log`)
2. 查看常见问题部分
3. 提交 Issue 到 GitHub 仓库 