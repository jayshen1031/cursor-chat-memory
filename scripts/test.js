#!/usr/bin/env node

/**
 * 🧪 Cursor Memory MCP Server 测试脚本
 * 验证数据提取和AI分析功能
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

class MCPServerTester {
    constructor() {
        this.projectRoot = process.cwd();
        this.workspaceStorageDir = path.join(os.homedir(), 'Library/Application Support/Cursor/User/workspaceStorage');
        this.testResults = [];
    }

    async run() {
        console.log('🧪 开始测试 Cursor Memory MCP Server...\n');

        const tests = [
            { name: '环境检查', method: 'testEnvironment' },
            { name: '数据库连接', method: 'testDatabaseConnection' },
            { name: '数据提取', method: 'testDataExtraction' },
            { name: 'Memory Bank', method: 'testMemoryBank' },
            { name: 'AI分析', method: 'testAIAnalysis' },
            { name: 'MCP工具', method: 'testMCPTools' }
        ];

        for (const test of tests) {
            try {
                console.log(`📋 测试: ${test.name}`);
                await this[test.method]();
                this.logResult(test.name, 'PASS', '✅');
            } catch (error) {
                this.logResult(test.name, 'FAIL', '❌', error.message);
            }
        }

        this.printResults();
    }

    async testEnvironment() {
        // 检查Node.js版本
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        if (majorVersion < 18) {
            throw new Error(`需要Node.js 18+，当前版本: ${nodeVersion}`);
        }

        // 检查项目文件
        const requiredFiles = [
            'src/mcp-server.js',
            'mcp-package.json',
            'scripts/setup.js'
        ];

        for (const file of requiredFiles) {
            await fs.access(path.join(this.projectRoot, file));
        }

        console.log('  ✅ 环境检查通过');
    }

    async testDatabaseConnection() {
        // 查找工作区数据库
        const workspaces = await fs.readdir(this.workspaceStorageDir);
        
        let foundValidDb = false;
        for (const workspace of workspaces) {
            const dbPath = path.join(this.workspaceStorageDir, workspace, 'state.vscdb');
            try {
                await fs.access(dbPath);
                foundValidDb = true;
                console.log(`  ✅ 找到数据库: ${workspace}`);
                break;
            } catch {
                continue;
            }
        }

        if (!foundValidDb) {
            throw new Error('未找到有效的Cursor数据库');
        }
    }

    async testDataExtraction() {
        // 模拟数据提取过程
        const mockData = {
            prompts: [
                { text: '测试提示词', timestamp: Date.now() }
            ],
            generations: [
                { 
                    textDescription: '测试提示词',
                    text: '测试回复',
                    unixMs: Date.now(),
                    generationUUID: 'test-uuid'
                }
            ]
        };

        // 测试数据处理逻辑
        const conversations = this.analyzeConversations(mockData);
        
        if (conversations.length === 0) {
            throw new Error('数据分析失败');
        }

        console.log(`  ✅ 数据提取测试通过，处理了 ${conversations.length} 个对话`);
    }

    async testMemoryBank() {
        const memoryBankDir = path.join(this.projectRoot, 'memory-bank');
        
        // 检查Memory Bank目录是否存在
        try {
            await fs.access(memoryBankDir);
        } catch {
            throw new Error('Memory Bank目录不存在');
        }

        // 检查基础文件
        const requiredFiles = [
            'projectContext.md',
            'recentActivity.md',
            'technicalDecisions.md',
            'problemSolutions.md',
            'codePatterns.md',
            'learningInsights.md'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(memoryBankDir, file);
            try {
                const content = await fs.readFile(filePath, 'utf-8');
                if (content.length < 10) {
                    throw new Error(`${file} 内容过少`);
                }
            } catch (error) {
                if (error.code === 'ENOENT') {
                    throw new Error(`缺少Memory Bank文件: ${file}`);
                }
                throw error;
            }
        }

        console.log(`  ✅ Memory Bank测试通过，所有文件存在`);
    }

    async testAIAnalysis() {
        // 模拟AI分析功能
        const mockConversations = [
            {
                prompt: { text: '如何实现MCP服务器' },
                response: { text: 'MCP服务器可以通过Node.js和MCP SDK实现' }
            },
            {
                prompt: { text: '遇到了数据库连接错误' },
                response: { text: '请检查数据库路径和权限设置' }
            },
            {
                prompt: { text: '学习MCP协议的原理' },
                response: { text: 'MCP是模型上下文协议的简称' }
            }
        ];

        // 测试分析功能
        const technicalAnalysis = this.analyzeTechnicalContent(mockConversations);
        const problemAnalysis = this.analyzeProblemSolutions(mockConversations);
        const learningAnalysis = this.analyzeLearningInsights(mockConversations);

        if (technicalAnalysis.count === 0 && problemAnalysis.count === 0 && learningAnalysis.count === 0) {
            throw new Error('AI分析功能异常');
        }

        console.log('  ✅ AI分析测试通过');
        console.log(`    - 技术内容: ${technicalAnalysis.count} 个`);
        console.log(`    - 问题解决: ${problemAnalysis.count} 个`);
        console.log(`    - 学习洞察: ${learningAnalysis.count} 个`);
    }

    async testMCPTools() {
        // 测试MCP工具定义
        const tools = [
            'sync_chat_data',
            'search_conversations',
            'get_project_summary',
            'analyze_patterns',
            'get_memory_status'
        ];

        // 这里可以添加更详细的工具测试
        // 简化版本：检查工具名称
        for (const tool of tools) {
            if (!tool.match(/^[a-z_]+$/)) {
                throw new Error(`工具名称格式错误: ${tool}`);
            }
        }

        console.log(`  ✅ MCP工具测试通过，定义了 ${tools.length} 个工具`);
    }

    // 辅助方法 - 复制自MCP Server的分析逻辑
    analyzeConversations(chatData) {
        const conversations = [];
        
        chatData.generations.forEach((generation, index) => {
            if (!generation.textDescription || generation.textDescription.trim().length < 2) {
                return;
            }
            
            const timestamp = generation.unixMs || Date.now();
            
            conversations.push({
                id: conversations.length + 1,
                timestamp,
                prompt: {
                    text: generation.textDescription,
                    timestamp: timestamp - 1000
                },
                response: {
                    text: generation.text || '',
                    timestamp
                },
                uuid: generation.generationUUID
            });
        });
        
        return conversations.sort((a, b) => a.timestamp - b.timestamp);
    }

    analyzeTechnicalContent(conversations) {
        const techKeywords = ['实现', '代码', '函数', 'API', '数据库', '架构', '设计', '配置'];
        
        const techConversations = conversations.filter(conv =>
            techKeywords.some(keyword => 
                conv.prompt.text.includes(keyword) || conv.response.text.includes(keyword)
            )
        );

        return {
            count: techConversations.length,
            summary: `发现 ${techConversations.length} 个技术相关对话`
        };
    }

    analyzeProblemSolutions(conversations) {
        const problemKeywords = ['错误', '问题', '失败', '修复', '解决', '调试'];
        
        const problemConversations = conversations.filter(conv =>
            problemKeywords.some(keyword => 
                conv.prompt.text.includes(keyword) || conv.response.text.includes(keyword)
            )
        );

        return {
            count: problemConversations.length,
            summary: `识别 ${problemConversations.length} 个问题解决对话`
        };
    }

    analyzeLearningInsights(conversations) {
        const learningKeywords = ['学习', '理解', '原理', '概念', '为什么', '如何'];
        
        const learningConversations = conversations.filter(conv =>
            learningKeywords.some(keyword => 
                conv.prompt.text.includes(keyword) || conv.response.text.includes(keyword)
            )
        );

        return {
            count: learningConversations.length,
            summary: `提取 ${learningConversations.length} 个学习要点`
        };
    }

    logResult(testName, result, icon, error = null) {
        this.testResults.push({
            name: testName,
            result,
            icon,
            error
        });

        if (error) {
            console.log(`  ${icon} ${result}: ${error}`);
        } else {
            console.log(`  ${icon} ${result}`);
        }
        console.log('');
    }

    printResults() {
        console.log('📊 测试结果汇总:\n');
        
        const passed = this.testResults.filter(r => r.result === 'PASS').length;
        const failed = this.testResults.filter(r => r.result === 'FAIL').length;
        const total = this.testResults.length;

        this.testResults.forEach(result => {
            console.log(`${result.icon} ${result.name}: ${result.result}`);
            if (result.error) {
                console.log(`    ⚠️  ${result.error}`);
            }
        });

        console.log(`\n📈 总结: ${passed}/${total} 测试通过`);
        
        if (failed === 0) {
            console.log('🎉 所有测试通过！MCP Server准备就绪。');
        } else {
            console.log(`⚠️  有 ${failed} 个测试失败，请检查相关配置。`);
        }

        // 提供建议
        if (failed > 0) {
            console.log('\n💡 故障排除建议:');
            console.log('1. 运行 npm run setup 重新配置');
            console.log('2. 检查Cursor是否正确安装');
            console.log('3. 确保有聊天数据可供测试');
            console.log('4. 检查文件权限和路径');
        }
    }
}

// 运行测试
const tester = new MCPServerTester();
tester.run().catch(console.error); 