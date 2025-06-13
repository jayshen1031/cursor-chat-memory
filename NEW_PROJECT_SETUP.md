# Cursor Memory 新项目部署指南

本文档提供了在新项目中部署和启动 Cursor Memory 的详细步骤。

## 前提条件

- Node.js 18+ 已安装
- Git 已安装
- Cursor 编辑器已安装
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

## Cursor 配置

1. **打开 Cursor 设置**
   - 方法一：使用快捷键 `Cmd + ,`（Mac）或 `Ctrl + ,`（Windows/Linux）
   - 方法二：点击左下角的齿轮图标（⚙️）

2. **打开 JSON 设置文件**
   - 在设置界面中，选择 "User Settings"（用户设置）
   - 方法一：在设置界面右上角找到 "Open Settings (JSON)" 按钮
   - 方法二：使用快捷键 `Cmd/Ctrl + Shift + P` 打开命令面板，输入 "settings json"
   - 方法三：在设置界面右上角的 "..." 或 "More" 菜单中查找

3. **配置 MCP 服务器**
   - 在打开的 JSON 文件中，添加或修改以下配置：
   ```json
   {
     "mcp.servers": [
       {
         "name": "Cursor Memory",
         "url": "http://localhost:3000",
         "enabled": true
       }
     ]
   }
   ```
   - 注意：如果文件中已有其他配置，请确保正确添加逗号分隔
   - 重要：使用 User Settings 而不是 Workspace Settings，因为这是一个全局配置

4. **验证配置**
   - 保存 JSON 文件（`Cmd/Ctrl + S`）
   - 重启 Cursor 编辑器
   - 在命令面板（`Cmd/Ctrl + Shift + P`）中输入 "MCP"
   - 应该能看到 "Cursor Memory" 服务器选项

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

## 多项目记忆管理

### 1. 项目类型区分

在 `memory-bank` 目录下，按项目类型创建子目录：

```
memory-bank/
├── system-development/     # 系统开发项目记忆
│   ├── learningInsights/  # 技术洞察
│   ├── problemSolutions/  # 问题解决方案
│   └── codePatterns/      # 代码模式
├── data-analysis/         # 大数据分析项目记忆
│   ├── businessInsights/  # 业务洞察
│   ├── analysisPatterns/  # 分析模式
│   └── dataModels/        # 数据模型
└── shared/                # 共享知识
    ├── bestPractices/     # 最佳实践
    └── commonPatterns/    # 通用模式
```

### 2. 配置多项目支持

修改 `cursor-mcp-config.json` 配置：

```json
{
    "port": 3000,
    "host": "localhost",
    "logLevel": "info",
    "memoryBankPath": "./memory-bank",
    "outputPath": "./output",
    "logPath": "./logs",
    "projects": {
        "system-development": {
            "name": "系统开发",
            "path": "./memory-bank/system-development",
            "type": "development"
        },
        "data-analysis": {
            "name": "数据分析",
            "path": "./memory-bank/data-analysis",
            "type": "analysis"
        }
    }
}
```

### 3. 项目切换

1. **通过命令行切换**
   ```bash
   # 切换到系统开发项目
   ./switch-project.sh system-development

   # 切换到数据分析项目
   ./switch-project.sh data-analysis
   ```

2. **通过环境变量切换**
   ```bash
   # 设置当前项目
   export CURSOR_MEMORY_PROJECT=system-development
   ```

### 4. 记忆分类规则

1. **系统开发项目**
   - 技术架构决策
   - 代码设计模式
   - 性能优化方案
   - 安全最佳实践
   - 开发工具使用

2. **数据分析项目**
   - 业务分析模型
   - 数据处理流程
   - 可视化方案
   - 统计分析方法
   - 数据质量规则

3. **共享知识**
   - 项目管理经验
   - 团队协作模式
   - 通用工具使用
   - 跨项目最佳实践

### 5. 使用建议

1. **项目初始化**
   - 为每个新项目创建对应的记忆库目录
   - 设置适当的分类结构
   - 配置项目特定的规则

2. **内容管理**
   - 定期整理和更新记忆库
   - 及时归档过时的内容
   - 保持分类结构的一致性

3. **知识共享**
   - 将通用经验放入共享目录
   - 定期同步跨项目的知识
   - 建立知识索引和检索机制

4. **维护建议**
   - 每周检查记忆库结构
   - 每月整理和优化内容
   - 每季度评估知识价值

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

4. **Cursor 中找不到 MCP 设置**
   - 确保使用最新版本的 Cursor
   - 尝试手动编辑 settings.json
   - 重启 Cursor 编辑器

5. **MCP 服务器连接失败**
   - 确保 MCP Server 正在运行
   - 检查端口号是否匹配
   - 检查防火墙设置

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
5. 确保 Cursor 编辑器版本支持 MCP 功能

## 技术支持

如果遇到问题，请：
1. 检查日志文件 (`logs/mcp-server.log`)
2. 查看常见问题部分
3. 提交 Issue 到 GitHub 仓库 

## 新功能

### 1. 新增项目类型

现在你可以使用更新后的脚本来部署BI项目了。使用方法如下：

```bash
./deploy-to-new-project.sh /Users/jay/Documents/baidu/projects/BI --type bi --clean
```

这个命令会：
1. 清理目标目录（如果存在）
2. 创建新的BI项目结构，包括：
   - `businessInsights/`: 业务洞察和关键发现
   - `dataModels/`: 数据模型和维度设计
   - `reportTemplates/`: 报表模板和设计规范
   - `dashboardDesigns/`: 仪表盘设计和交互模式
   - `etlProcesses/`: ETL流程和数据转换规则
3. 创建必要的配置文件
4. 设置项目说明文档

部署完成后，你可以：
1. 进入项目目录：
   ```bash
   cd /Users/jay/Documents/baidu/projects/BI/cursor-memory
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 启动MCP服务器：
   ```bash
   npm run mcp
   ```

4. 配置Cursor编辑器使用这个MCP服务器

需要我帮你执行部署命令吗？或者你需要了解更详细的使用说明？ 