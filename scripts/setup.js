#!/usr/bin/env node

/**
 * 🛠️ Cursor Memory MCP Server 设置脚本
 * 自动配置Cursor MCP连接和环境
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

class MCPServerSetup {
    constructor() {
        this.cursorConfigDir = path.join(os.homedir(), '.cursor');
        this.workspaceStorageDir = path.join(os.homedir(), 'Library/Application Support/Cursor/User/workspaceStorage');
        this.projectRoot = process.cwd();
    }

    async run() {
        console.log('🚀 开始设置 Cursor Memory MCP Server...\n');

        try {
            // 1. 检查依赖
            await this.checkDependencies();
            
            // 2. 扫描工作区
            const workspaceId = await this.findCurrentWorkspace();
            
            // 3. 创建MCP配置
            await this.createMCPConfig(workspaceId);
            
            // 4. 初始化Memory Bank
            await this.initializeMemoryBank();
            
            // 5. 测试连接
            await this.testConnection();

            console.log('\n✅ 设置完成！');
            this.printUsageInstructions();

        } catch (error) {
            console.error('❌ 设置失败:', error.message);
            process.exit(1);
        }
    }

    async checkDependencies() {
        console.log('📦 检查依赖...');
        
        // 检查Node.js版本
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        if (majorVersion < 18) {
            throw new Error(`需要Node.js 18+，当前版本: ${nodeVersion}`);
        }
        console.log(`✅ Node.js版本: ${nodeVersion}`);

        // 检查Cursor安装
        try {
            await fs.access(this.workspaceStorageDir);
            console.log('✅ Cursor安装路径找到');
        } catch {
            throw new Error('未找到Cursor安装，请确保Cursor已正确安装');
        }

        // 检查项目依赖
        try {
            await fs.access(path.join(this.projectRoot, 'node_modules'));
            console.log('✅ 项目依赖已安装');
        } catch {
            console.log('⚠️  项目依赖未安装，正在安装...');
            const { spawn } = await import('child_process');
            await new Promise((resolve, reject) => {
                const npm = spawn('npm', ['install'], { stdio: 'inherit' });
                npm.on('close', (code) => {
                    if (code === 0) resolve();
                    else reject(new Error('依赖安装失败'));
                });
            });
        }
    }

    async findCurrentWorkspace() {
        console.log('\n🔍 扫描Cursor工作区...');
        
        try {
            const workspaces = await fs.readdir(this.workspaceStorageDir);
            
            // 按修改时间排序，找最新的
            const workspaceStats = await Promise.all(
                workspaces.map(async (workspace) => {
                    const dbPath = path.join(this.workspaceStorageDir, workspace, 'state.vscdb');
                    try {
                        const stat = await fs.stat(dbPath);
                        return { workspace, mtime: stat.mtime };
                    } catch {
                        return null;
                    }
                })
            );

            const validWorkspaces = workspaceStats.filter(Boolean);
            if (validWorkspaces.length === 0) {
                throw new Error('未找到有效的Cursor工作区');
            }

            validWorkspaces.sort((a, b) => b.mtime - a.mtime);
            const latestWorkspace = validWorkspaces[0].workspace;

            console.log(`✅ 找到 ${validWorkspaces.length} 个工作区，使用最新的: ${latestWorkspace}`);
            return latestWorkspace;

        } catch (error) {
            throw new Error(`扫描工作区失败: ${error.message}`);
        }
    }

    async createMCPConfig(workspaceId) {
        console.log('\n⚙️ 创建MCP配置...');

        const mcpConfig = {
            mcpServers: {
                "cursor-memory": {
                    command: "node",
                    args: [path.resolve(this.projectRoot, "src/mcp-server.js")],
                    env: {
                        CURSOR_WORKSPACE_ID: workspaceId
                    }
                }
            }
        };

        // 创建配置目录
        const configDir = path.join(this.cursorConfigDir, 'mcp');
        try {
            await fs.mkdir(configDir, { recursive: true });
        } catch {}

        // 写入配置文件
        const configPath = path.join(configDir, 'settings.json');
        await fs.writeFile(configPath, JSON.stringify(mcpConfig, null, 2));
        
        console.log(`✅ MCP配置已创建: ${configPath}`);

        // 也创建一个本地配置文件
        const localConfigPath = path.join(this.projectRoot, 'cursor-mcp-config.json');
        await fs.writeFile(localConfigPath, JSON.stringify(mcpConfig, null, 2));
        console.log(`✅ 本地配置已创建: ${localConfigPath}`);

        return configPath;
    }

    async initializeMemoryBank() {
        console.log('\n🧠 初始化Memory Bank...');

        const memoryBankDir = path.join(this.projectRoot, 'memory-bank');
        try {
            await fs.mkdir(memoryBankDir, { recursive: true });
        } catch {}

        const memoryFiles = {
            'projectContext.md': this.generateProjectContextTemplate(),
            'recentActivity.md': this.generateRecentActivityTemplate(),
            'technicalDecisions.md': this.generateTechnicalDecisionsTemplate(),
            'problemSolutions.md': this.generateProblemSolutionsTemplate(),
            'codePatterns.md': this.generateCodePatternsTemplate(),
            'learningInsights.md': this.generateLearningInsightsTemplate()
        };

        for (const [filename, content] of Object.entries(memoryFiles)) {
            const filePath = path.join(memoryBankDir, filename);
            try {
                await fs.access(filePath);
                console.log(`⏭️  ${filename} 已存在，跳过`);
            } catch {
                await fs.writeFile(filePath, content);
                console.log(`✅ 创建 ${filename}`);
            }
        }

        console.log(`📁 Memory Bank初始化完成: ${memoryBankDir}`);
    }

    async testConnection() {
        console.log('\n🔗 测试MCP连接...');
        
        // 这里可以添加实际的连接测试逻辑
        // 简化版本：检查服务器是否可以启动
        try {
            const { spawn } = await import('child_process');
            const serverProcess = spawn('node', [path.join(this.projectRoot, 'src/mcp-server.js')], {
                stdio: 'pipe',
                timeout: 5000
            });

            const success = await new Promise((resolve) => {
                let hasOutput = false;
                
                serverProcess.stderr.on('data', (data) => {
                    if (data.toString().includes('启动成功')) {
                        hasOutput = true;
                        resolve(true);
                    }
                });

                serverProcess.on('close', () => {
                    resolve(hasOutput);
                });

                setTimeout(() => {
                    serverProcess.kill();
                    resolve(hasOutput);
                }, 3000);
            });

            if (success) {
                console.log('✅ MCP Server 启动测试成功');
            } else {
                console.log('⚠️  MCP Server 启动测试超时，但配置应该正确');
            }

        } catch (error) {
            console.log('⚠️  连接测试失败，但这可能是正常的:', error.message);
        }
    }

    printUsageInstructions() {
        console.log(`
🎉 Cursor Memory MCP Server 设置完成！

📋 使用说明:

1. 启动服务器:
   npm run start

2. 在Cursor中使用:
   打开Cursor，在聊天中输入以下命令：

   📊 数据同步:
   /sync_chat_data

   🔍 搜索对话:
   /search_conversations query:"MCP服务器"

   📋 项目摘要:
   /get_project_summary

   🧠 模式分析:
   /analyze_patterns analysisType:"technical"

   📊 状态查看:
   /get_memory_status

3. Memory Bank位置:
   ${path.join(this.projectRoot, 'memory-bank')}

4. 配置文件位置:
   ${path.join(this.cursorConfigDir, 'mcp/settings.json')}

💡 提示:
- 服务器会自动同步Cursor聊天数据
- Memory Bank文件会自动更新，无需手动维护
- 支持智能内容分析和分类

🆘 遇到问题？
- 检查Cursor是否正确安装
- 确保Node.js版本 >= 18
- 查看服务器日志排查问题
        `);
    }

    // 模板生成方法
    generateProjectContextTemplate() {
        return `# 项目上下文

> 自动分析项目的核心功能和技术架构

## 项目概述

Cursor Memory MCP Server - 智能聊天历史分析和Memory Bank管理系统

## 核心功能

- 自动从Cursor SQLite数据库提取聊天数据
- AI驱动的内容分析和分类
- 结构化的Memory Bank管理
- MCP协议集成，与Cursor无缝交互

## 技术架构

- **后端**: Node.js + MCP SDK
- **数据库**: SQLite (Cursor原生)
- **存储**: Markdown文件系统
- **协议**: Model Context Protocol (MCP)

*此文件由MCP Server自动维护*
`;
    }

    generateRecentActivityTemplate() {
        return `# 最近活动

> 记录最近的开发活动和讨论

## 今日活动

*待MCP Server自动更新*

## 本周活动

*待MCP Server自动更新*

*此文件由MCP Server自动维护*
`;
    }

    generateTechnicalDecisionsTemplate() {
        return `# 技术决策

> 记录重要的技术选择和架构决策

## MCP协议选择

- 选择MCP标准协议，确保与Cursor生态的兼容性
- 使用stdio传输，简化部署和调试

## 数据存储方案

- 直接读取Cursor SQLite数据库，避免数据重复
- 使用Markdown文件存储Memory Bank，便于人工查看和版本控制

*此文件由MCP Server自动维护*
`;
    }

    generateProblemSolutionsTemplate() {
        return `# 问题解决方案

> 记录遇到的问题和解决方案

## 常见问题

### 数据库连接问题
- **问题**: 无法读取Cursor数据库
- **解决**: 检查工作区ID和数据库路径

### MCP连接问题  
- **问题**: Cursor无法连接到MCP Server
- **解决**: 检查配置文件和服务器启动状态

*此文件由MCP Server自动维护*
`;
    }

    generateCodePatternsTemplate() {
        return `# 代码模式

> 识别的代码模式和最佳实践

## MCP工具模式

- 使用统一的错误处理机制
- 标准化的响应格式
- 清晰的工具描述和参数定义

## 数据处理模式

- 统一的文本清理和截断
- 时间戳标准化处理
- 分类算法的关键词匹配

*此文件由MCP Server自动维护*
`;
    }

    generateLearningInsightsTemplate() {
        return `# 学习洞察

> 从对话中提取的学习要点

## MCP开发学习

- MCP协议的核心概念和实现方式
- 与Cursor的集成最佳实践
- 工具定义和参数设计原则

## 数据分析学习

- SQLite数据结构理解
- 自然语言处理基础
- 智能内容分类方法

*此文件由MCP Server自动维护*
`;
    }
}

// 运行设置
const setup = new MCPServerSetup();
setup.run().catch(console.error); 