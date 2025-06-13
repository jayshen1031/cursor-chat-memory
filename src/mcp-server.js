#!/usr/bin/env node

/**
 * 🤖 Cursor Memory MCP Server
 * 集成Cursor Chat Memory的数据提取优势，提供AI驱动的智能分析
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import sqlite3 from 'sqlite3';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { createServer } from 'http';
import { parse } from 'url';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { validateConfig } from './config-validator.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// MCP Server configuration
const PORT = process.env.PORT || 3000;
const HOST = 'localhost';

class CursorMemoryMCPServer {
    constructor() {
        this.server = new Server(
            {
                name: 'cursor-memory-server',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        // 路径配置
        this.memoryBankPath = path.join(process.cwd(), 'memory-bank');
        this.cursorDataPath = path.join(os.homedir(), 'Library/Application Support/Cursor/User/workspaceStorage');
        this.workspaceDbPath = this.findWorkspaceDb();
        
        // 数据缓存
        this.chatData = {
            prompts: [],
            generations: [],
            conversations: [],
            lastSync: null
        };
    }

    /**
     * 🚀 初始化服务器
     */
    async initialize() {
        console.log('🔧 初始化 Cursor Memory MCP Server...');
        
        // 1. 验证配置
        const configResult = await validateConfig();
        if (!configResult.isValid) {
            console.error('❌ 配置验证失败，服务器无法启动');
            throw new Error('配置验证失败');
        }
        
        console.log('✅ 配置验证通过');
        
        // 2. 设置工具处理器
        this.setupToolHandlers();
        
        // 3. 初始化Memory Bank
        await this.setupMemoryBank();
        
        // 4. 启动时自动同步数据
        try {
            await this.syncChatData();
            console.log('✅ 初始数据同步完成');
        } catch (error) {
            console.warn('⚠️ 初始数据同步失败:', error.message);
        }
        
        console.log('🎉 服务器初始化完成');
    }

    /**
     * 🔍 查找当前工作区的数据库路径
     */
    findWorkspaceDb() {
        // 这里可以扫描所有工作区，找到最新的
        // 简化版本：使用固定路径或从环境变量获取
        const workspaceId = process.env.CURSOR_WORKSPACE_ID || 'e76c6a8343ed4d7d7b8f77651bad3214';
        return path.join(this.cursorDataPath, workspaceId, 'state.vscdb');
    }

    /**
     * 🏗️ 初始化Memory Bank
     */
    async setupMemoryBank() {
        try {
            await fs.access(this.memoryBankPath);
        } catch {
            await fs.mkdir(this.memoryBankPath, { recursive: true });
        }

        // Memory Bank文件结构
        const memoryFiles = {
            'projectContext.md': '# 项目上下文\n\n> 自动分析项目的核心功能和技术架构\n\n',
            'recentActivity.md': '# 最近活动\n\n> 记录最近的开发活动和讨论\n\n',
            'technicalDecisions.md': '# 技术决策\n\n> 记录重要的技术选择和架构决策\n\n',
            'problemSolutions.md': '# 问题解决方案\n\n> 记录遇到的问题和解决方案\n\n',
            'codePatterns.md': '# 代码模式\n\n> 识别的代码模式和最佳实践\n\n',
            'learningInsights.md': '# 学习洞察\n\n> 从对话中提取的学习要点\n\n'
        };

        for (const [filename, content] of Object.entries(memoryFiles)) {
            const filePath = path.join(this.memoryBankPath, filename);
            try {
                await fs.access(filePath);
            } catch {
                await fs.writeFile(filePath, content);
            }
        }
    }

    /**
     * 🛠️ 设置工具处理器
     */
    setupToolHandlers() {
        // 列出可用工具
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'sync_chat_data',
                        description: '同步Cursor聊天数据并更新Memory Bank',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                timeRange: {
                                    type: 'string',
                                    description: '同步时间范围',
                                    enum: ['today', 'week', 'month', 'all'],
                                    default: 'today'
                                },
                                analyze: {
                                    type: 'boolean',
                                    description: '是否进行AI分析',
                                    default: true
                                }
                            }
                        }
                    },
                    {
                        name: 'search_conversations',
                        description: '搜索历史对话',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                query: {
                                    type: 'string',
                                    description: '搜索关键词'
                                },
                                limit: {
                                    type: 'number',
                                    description: '返回结果数量',
                                    default: 10
                                }
                            },
                            required: ['query']
                        }
                    },
                    {
                        name: 'get_project_summary',
                        description: '获取项目智能摘要',
                        inputSchema: {
                            type: 'object',
                            properties: {}
                        }
                    },
                    {
                        name: 'analyze_patterns',
                        description: '分析对话中的模式和趋势',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                analysisType: {
                                    type: 'string',
                                    description: '分析类型',
                                    enum: ['technical', 'problems', 'learning', 'all'],
                                    default: 'all'
                                }
                            }
                        }
                    },
                    {
                        name: 'get_memory_status',
                        description: '获取Memory Bank状态',
                        inputSchema: {
                            type: 'object',
                            properties: {}
                        }
                    }
                ]
            };
        });

        // 处理工具调用
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                switch (name) {
                    case 'sync_chat_data':
                        return await this.handleSyncChatData(args);
                    case 'search_conversations':
                        return await this.handleSearchConversations(args);
                    case 'get_project_summary':
                        return await this.handleGetProjectSummary();
                    case 'analyze_patterns':
                        return await this.handleAnalyzePatterns(args);
                    case 'get_memory_status':
                        return await this.handleGetMemoryStatus();
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            } catch (error) {
                return {
                    content: [{
                        type: 'text',
                        text: `❌ Error executing ${name}: ${error.message}`
                    }],
                    isError: true
                };
            }
        });
    }

    /**
     * 🔄 处理数据同步
     */
    async handleSyncChatData(args = {}) {
        const { timeRange = 'today', analyze = true } = args;
        
        try {
            const syncResult = await this.syncChatData(timeRange);
            
            if (analyze && syncResult.newConversations > 0) {
                await this.performAIAnalysis();
            }

            return {
                content: [{
                    type: 'text',
                    text: `✅ 数据同步完成\n\n` +
                          `📊 统计信息:\n` +
                          `- 新对话: ${syncResult.newConversations} 条\n` +
                          `- 总对话: ${syncResult.totalConversations} 条\n` +
                          `- 同步时间: ${syncResult.syncTime}\n` +
                          `- AI分析: ${analyze ? '已完成' : '跳过'}`
                }]
            };
        } catch (error) {
            throw new Error(`数据同步失败: ${error.message}`);
        }
    }

    /**
     * 🔍 处理对话搜索
     */
    async handleSearchConversations(args) {
        const { query, limit = 10 } = args;
        
        const results = this.searchConversations(query, limit);
        
        return {
            content: [{
                type: 'text',
                text: `🔍 搜索结果 (关键词: "${query}")\n\n` +
                      results.map((conv, i) => 
                          `${i + 1}. **${new Date(conv.timestamp).toLocaleDateString()}**\n` +
                          `   问: ${conv.prompt.text.substring(0, 100)}...\n` +
                          `   答: ${conv.response.text.substring(0, 100)}...\n`
                      ).join('\n')
            }]
        };
    }

    /**
     * 📊 处理项目摘要请求
     */
    async handleGetProjectSummary() {
        const summary = await this.generateProjectSummary();
        
        return {
            content: [{
                type: 'text',
                text: `## 📋 项目智能摘要\n\n${summary}`
            }]
        };
    }

    /**
     * 🧠 处理模式分析
     */
    async handleAnalyzePatterns(args) {
        const { analysisType = 'all' } = args;
        
        const analysis = await this.analyzeConversationPatterns(analysisType);
        
        return {
            content: [{
                type: 'text',
                text: `## 🔍 ${analysisType} 模式分析\n\n${analysis}`
            }]
        };
    }

    /**
     * 📊 处理状态查询
     */
    async handleGetMemoryStatus() {
        const status = await this.getMemoryBankStatus();
        
        return {
            content: [{
                type: 'text',
                text: `## 🧠 Memory Bank 状态\n\n${status}`
            }]
        };
    }

    /**
     * 🔄 同步Cursor聊天数据
     */
    async syncChatData(timeRange = 'today') {
        return new Promise(async (resolve, reject) => {
            try {
                await fs.access(this.workspaceDbPath);
            } catch {
                reject(new Error(`数据库文件不存在: ${this.workspaceDbPath}`));
                return;
            }

            const db = new sqlite3.Database(this.workspaceDbPath, sqlite3.OPEN_READONLY);
            
            // 重置数据
            this.chatData = { prompts: [], generations: [], conversations: [], lastSync: new Date() };

            // 查询prompts
            db.get("SELECT value FROM ItemTable WHERE key = 'aiService.prompts'", (err, row) => {
                if (!err && row) {
                    try {
                        this.chatData.prompts = JSON.parse(row.value);
                    } catch (e) {
                        console.error('解析prompts失败:', e);
                    }
                }

                // 查询generations
                db.get("SELECT value FROM ItemTable WHERE key = 'aiService.generations'", (err, row) => {
                    if (!err && row) {
                        try {
                            this.chatData.generations = JSON.parse(row.value);
                        } catch (e) {
                            console.error('解析generations失败:', e);
                        }
                    }

                    // 过滤时间范围
                    this.filterByTimeRange(timeRange);
                    
                    // 分析对话
                    this.chatData.conversations = this.analyzeConversations();

                    db.close();

                    resolve({
                        newConversations: this.chatData.conversations.length,
                        totalConversations: this.chatData.conversations.length,
                        syncTime: new Date().toISOString()
                    });
                });
            });
        });
    }

    /**
     * ⏰ 按时间范围过滤数据
     */
    filterByTimeRange(timeRange) {
        const now = Date.now();
        let startTime = 0;

        switch (timeRange) {
            case 'today':
                const today = new Date();
                startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
                break;
            case 'week':
                startTime = now - 7 * 24 * 60 * 60 * 1000;
                break;
            case 'month':
                startTime = now - 30 * 24 * 60 * 60 * 1000;
                break;
            case 'all':
            default:
                return; // 不过滤
        }

        this.chatData.generations = this.chatData.generations.filter(gen => {
            const timestamp = gen.unixMs || gen.timestamp || 0;
            return timestamp >= startTime;
        });
    }

    /**
     * 🔍 分析对话对
     */
    analyzeConversations() {
        const conversations = [];
        
        this.chatData.generations.forEach((generation, index) => {
            if (!generation.textDescription || generation.textDescription.trim().length < 2) {
                return;
            }
            
            const timestamp = generation.unixMs || Date.now();
            
            conversations.push({
                id: conversations.length + 1,
                timestamp,
                prompt: {
                    text: this.cleanText(generation.textDescription),
                    timestamp: timestamp - 1000
                },
                response: {
                    text: this.cleanText(generation.text || generation.output || ''),
                    timestamp
                },
                uuid: generation.generationUUID,
                type: generation.type
            });
        });
        
        return conversations.sort((a, b) => a.timestamp - b.timestamp);
    }

    /**
     * 🔍 搜索对话
     */
    searchConversations(query, limit) {
        const lowerQuery = query.toLowerCase();
        
        return this.chatData.conversations
            .filter(conv => 
                conv.prompt.text.toLowerCase().includes(lowerQuery) ||
                conv.response.text.toLowerCase().includes(lowerQuery)
            )
            .slice(0, limit);
    }

    /**
     * 🤖 执行AI分析并更新Memory Bank
     */
    async performAIAnalysis() {
        const conversations = this.chatData.conversations;
        if (conversations.length === 0) return;

        // 分析不同类型的内容
        const analyses = {
            technical: this.analyzeTechnicalContent(conversations),
            problems: this.analyzeProblemSolutions(conversations),
            learning: this.analyzeLearningInsights(conversations),
            activity: this.analyzeRecentActivity(conversations)
        };

        // 更新Memory Bank文件
        await this.updateMemoryBankFiles(analyses);
    }

    /**
     * 🔧 分析技术内容
     */
    analyzeTechnicalContent(conversations) {
        const techKeywords = ['实现', '代码', '函数', 'API', '数据库', '架构', '设计', '配置'];
        
        const techConversations = conversations.filter(conv =>
            techKeywords.some(keyword => 
                conv.prompt.text.includes(keyword) || conv.response.text.includes(keyword)
            )
        );

        return {
            count: techConversations.length,
            summary: `发现 ${techConversations.length} 个技术相关对话`,
            examples: techConversations.slice(0, 3).map(conv => ({
                question: conv.prompt.text.substring(0, 100),
                answer: conv.response.text.substring(0, 100)
            }))
        };
    }

    /**
     * 🐛 分析问题解决方案
     */
    analyzeProblemSolutions(conversations) {
        const problemKeywords = ['错误', '问题', '失败', '修复', '解决', '调试'];
        
        const problemConversations = conversations.filter(conv =>
            problemKeywords.some(keyword => 
                conv.prompt.text.includes(keyword) || conv.response.text.includes(keyword)
            )
        );

        return {
            count: problemConversations.length,
            summary: `识别 ${problemConversations.length} 个问题解决对话`,
            examples: problemConversations.slice(0, 3).map(conv => ({
                problem: conv.prompt.text.substring(0, 100),
                solution: conv.response.text.substring(0, 100)
            }))
        };
    }

    /**
     * 📚 分析学习洞察
     */
    analyzeLearningInsights(conversations) {
        const learningKeywords = ['学习', '理解', '原理', '概念', '为什么', '如何'];
        
        const learningConversations = conversations.filter(conv =>
            learningKeywords.some(keyword => 
                conv.prompt.text.includes(keyword) || conv.response.text.includes(keyword)
            )
        );

        return {
            count: learningConversations.length,
            summary: `提取 ${learningConversations.length} 个学习要点`,
            examples: learningConversations.slice(0, 3).map(conv => ({
                question: conv.prompt.text.substring(0, 100),
                insight: conv.response.text.substring(0, 100)
            }))
        };
    }

    /**
     * 📊 分析最近活动
     */
    analyzeRecentActivity(conversations) {
        const recent = conversations.slice(-10); // 最近10个对话
        
        return {
            count: recent.length,
            summary: `最近活动：${recent.length} 个对话`,
            topics: this.extractTopics(recent)
        };
    }

    /**
     * 🏷️ 提取话题
     */
    extractTopics(conversations) {
        const allText = conversations.map(conv => conv.prompt.text + ' ' + conv.response.text).join(' ');
        const words = allText.toLowerCase().match(/\b\w{3,}\b/g) || [];
        
        // 简单的词频统计
        const frequency = {};
        words.forEach(word => {
            frequency[word] = (frequency[word] || 0) + 1;
        });

        return Object.entries(frequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([word]) => word);
    }

    /**
     * 📝 更新Memory Bank文件
     */
    async updateMemoryBankFiles(analyses) {
        const timestamp = new Date().toISOString().split('T')[0];
        
        // 更新技术决策
        if (analyses.technical.count > 0) {
            await this.appendToMemoryFile('technicalDecisions.md', 
                `## ${timestamp} 技术讨论\n\n${analyses.technical.summary}\n\n` +
                analyses.technical.examples.map(ex => `- **问题**: ${ex.question}...\n  **方案**: ${ex.answer}...\n`).join('\n')
            );
        }

        // 更新问题解决方案
        if (analyses.problems.count > 0) {
            await this.appendToMemoryFile('problemSolutions.md',
                `## ${timestamp} 问题解决\n\n${analyses.problems.summary}\n\n` +
                analyses.problems.examples.map(ex => `- **问题**: ${ex.problem}...\n  **解决**: ${ex.solution}...\n`).join('\n')
            );
        }

        // 更新学习洞察
        if (analyses.learning.count > 0) {
            await this.appendToMemoryFile('learningInsights.md',
                `## ${timestamp} 学习要点\n\n${analyses.learning.summary}\n\n` +
                analyses.learning.examples.map(ex => `- **问题**: ${ex.question}...\n  **洞察**: ${ex.insight}...\n`).join('\n')
            );
        }

        // 更新最近活动
        await this.appendToMemoryFile('recentActivity.md',
            `## ${timestamp} 活动摘要\n\n${analyses.activity.summary}\n\n` +
            `**主要话题**: ${analyses.activity.topics.join(', ')}\n\n`
        );
    }

    /**
     * 📝 追加内容到Memory Bank文件
     */
    async appendToMemoryFile(filename, content) {
        const filePath = path.join(this.memoryBankPath, filename);
        try {
            const existing = await fs.readFile(filePath, 'utf-8');
            await fs.writeFile(filePath, existing + '\n' + content + '\n');
        } catch (error) {
            console.error(`更新${filename}失败:`, error.message);
        }
    }

    /**
     * 📊 生成项目摘要
     */
    async generateProjectSummary() {
        const memoryFiles = await this.readAllMemoryFiles();
        const conversations = this.chatData.conversations;
        
        return `**项目概览**
- 总对话数: ${conversations.length}
- 最后同步: ${this.chatData.lastSync?.toLocaleString() || '未同步'}
- Memory Bank文件: ${Object.keys(memoryFiles).length}

**最近活动**
${conversations.slice(-3).map(conv => 
    `- ${new Date(conv.timestamp).toLocaleDateString()}: ${conv.prompt.text.substring(0, 50)}...`
).join('\n')}

**文件状态**
${Object.entries(memoryFiles).map(([name, content]) => 
    `- ${name}: ${content.length > 200 ? '✅ 已更新' : '⏳ 待完善'}`
).join('\n')}`;
    }

    /**
     * 🔍 分析对话模式
     */
    async analyzeConversationPatterns(analysisType) {
        const conversations = this.chatData.conversations;
        
        switch (analysisType) {
            case 'technical':
                return this.analyzeTechnicalContent(conversations).summary;
            case 'problems':
                return this.analyzeProblemSolutions(conversations).summary;
            case 'learning':
                return this.analyzeLearningInsights(conversations).summary;
            default:
                return `**全面分析**
- 技术讨论: ${this.analyzeTechnicalContent(conversations).count} 次
- 问题解决: ${this.analyzeProblemSolutions(conversations).count} 次  
- 学习交流: ${this.analyzeLearningInsights(conversations).count} 次
- 总对话: ${conversations.length} 次`;
        }
    }

    /**
     * 📊 获取Memory Bank状态
     */
    async getMemoryBankStatus() {
        const memoryFiles = await this.readAllMemoryFiles();
        const totalChars = Object.values(memoryFiles).reduce((sum, content) => sum + content.length, 0);
        
        return `**基本信息**
- 文件数量: ${Object.keys(memoryFiles).length}
- 总字符数: ${totalChars.toLocaleString()}
- 最后更新: ${new Date().toLocaleString()}

**文件详情**
${Object.entries(memoryFiles).map(([name, content]) => {
    const status = content.length > 200 ? '✅ 活跃' : '⚠️ 待更新';
    const size = Math.round(content.length / 100) / 10; // KB
    return `- ${name}: ${status} (${size}KB)`;
}).join('\n')}`;
    }

    /**
     * 📖 读取所有Memory Bank文件
     */
    async readAllMemoryFiles() {
        const files = {};
        try {
            const fileList = await fs.readdir(this.memoryBankPath);
            for (const file of fileList.filter(f => f.endsWith('.md'))) {
                const content = await fs.readFile(path.join(this.memoryBankPath, file), 'utf-8');
                files[file] = content;
            }
        } catch (error) {
            console.error('读取Memory Bank文件失败:', error);
        }
        return files;
    }

    /**
     * 🧹 清理文本
     */
    cleanText(text) {
        if (!text) return '';
        return text.trim().replace(/\s+/g, ' ').substring(0, 1000);
    }

    /**
     * 🩺 获取健康状态
     */
    async getHealthStatus() {
        try {
            const memoryFiles = await this.readAllMemoryFiles();
            const dbExists = this.workspaceDbPath && await fs.access(this.workspaceDbPath).then(() => true).catch(() => false);
            
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                memoryBank: {
                    files: Object.keys(memoryFiles).length,
                    totalSize: Object.values(memoryFiles).reduce((sum, content) => sum + content.length, 0)
                },
                database: {
                    connected: dbExists,
                    path: this.workspaceDbPath
                },
                conversations: {
                    total: this.chatData.conversations.length,
                    lastSync: this.chatData.lastSync
                }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message
            };
        }
    }

    /**
     * 🚀 启动服务器
     */
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('🤖 Cursor Memory MCP Server 启动成功!');
    }
}

// 导出类
export { CursorMemoryMCPServer };

// 如果是直接运行此文件，则启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
    async function startServer() {
        try {
            const server = new CursorMemoryMCPServer();
            await server.initialize();
            await server.run();
        } catch (error) {
            console.error('❌ 服务器启动失败:', error.message);
            process.exit(1);
        }
    }
    
    startServer();
}

// MCP Server implementation
const server = createServer((req, res) => {
  const { pathname } = parse(req.url, true);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Handle MCP protocol requests
  if (pathname === '/mcp') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'success',
      message: 'Cursor Memory MCP Server is running',
      version: '1.0.0'
    }));
    return;
  }

  // Handle root path
  if (pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'running',
      name: 'cursor-memory-server',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      configValid: true
    }));
    return;
  }

  // Handle health check
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }));
    return;
  }

  // Handle 404
  res.writeHead(404);
  res.end('Not Found');
});

// Start the server
server.listen(PORT, HOST, () => {
  console.log(`🤖 MCP Server running at http://${HOST}:${PORT}`);
  console.log('📝 Available endpoints:');
  console.log('   - GET /mcp      - MCP protocol endpoint');
  console.log('   - GET /         - Server status');
  console.log('   - GET /health   - Health check');
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down MCP Server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
}); 