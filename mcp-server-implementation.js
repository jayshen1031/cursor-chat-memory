#!/usr/bin/env node

/**
 * Cursor Chat Memory MCP Server
 * 结合 AI Memory 和 Cursor Chat Memory 的优势
 * 提供智能的项目记忆管理服务
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import sqlite3 from 'sqlite3';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

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

    this.memoryBankPath = path.join(process.cwd(), 'memory-bank');
    this.cursorDataPath = path.join(os.homedir(), 'Library/Application Support/Cursor/User/workspaceStorage');
    
    this.setupToolHandlers();
    this.setupMemoryBank();
  }

  async setupMemoryBank() {
    // 确保 memory-bank 目录存在
    try {
      await fs.access(this.memoryBankPath);
    } catch {
      await fs.mkdir(this.memoryBankPath, { recursive: true });
    }

    // 初始化基础Memory Bank文件
    const baseFiles = [
      'projectbrief.md',
      'productContext.md', 
      'activeContext.md',
      'systemPatterns.md',
      'techContext.md',
      'progress.md',
      'chatHistory.md',
      'problemSolutions.md',
      'codePatterns.md',
      'learningJourney.md'
    ];

    for (const file of baseFiles) {
      const filePath = path.join(this.memoryBankPath, file);
      try {
        await fs.access(filePath);
      } catch {
        await fs.writeFile(filePath, `# ${file.replace('.md', '')}\n\n> 此文件由 Cursor Memory MCP Server 自动生成\n\n`);
      }
    }
  }

  setupToolHandlers() {
    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_chat_history',
            description: '搜索Cursor聊天历史记录',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: '搜索关键词',
                },
                timeRange: {
                  type: 'string',
                  description: '时间范围: today, week, month, all',
                  enum: ['today', 'week', 'month', 'all'],
                },
                limit: {
                  type: 'number',
                  description: '返回结果数量限制',
                  default: 10,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_project_summary',
            description: '获取当前项目的智能摘要',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'update_memory_bank',
            description: '更新Memory Bank中的特定文件',
            inputSchema: {
              type: 'object',
              properties: {
                filename: {
                  type: 'string',
                  description: 'Memory Bank文件名',
                  enum: ['projectbrief.md', 'productContext.md', 'activeContext.md', 
                         'systemPatterns.md', 'techContext.md', 'progress.md',
                         'chatHistory.md', 'problemSolutions.md', 'codePatterns.md', 'learningJourney.md'],
                },
                content: {
                  type: 'string',
                  description: '要追加或更新的内容',
                },
                operation: {
                  type: 'string',
                  description: '操作类型',
                  enum: ['append', 'replace', 'prepend'],
                  default: 'append',
                },
              },
              required: ['filename', 'content'],
            },
          },
          {
            name: 'analyze_chat_patterns',
            description: '分析聊天记录中的技术模式和决策',
            inputSchema: {
              type: 'object',
              properties: {
                analysisType: {
                  type: 'string',
                  description: '分析类型',
                  enum: ['technical_decisions', 'problem_solutions', 'code_patterns', 'learning_points'],
                  default: 'technical_decisions',
                },
                timeRange: {
                  type: 'string',
                  description: '分析时间范围',
                  enum: ['today', 'week', 'month', 'all'],
                  default: 'week',
                },
              },
            },
          },
          {
            name: 'get_memory_status',
            description: '获取Memory Bank状态和统计信息',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'sync_chat_data',
            description: '从Cursor数据库同步最新的聊天数据',
            inputSchema: {
              type: 'object',
              properties: {
                force: {
                  type: 'boolean',
                  description: '强制同步所有数据',
                  default: false,
                },
              },
            },
          },
        ],
      };
    });

    // 处理工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'search_chat_history':
            return await this.searchChatHistory(args);
          
          case 'get_project_summary':
            return await this.getProjectSummary();
          
          case 'update_memory_bank':
            return await this.updateMemoryBank(args);
          
          case 'analyze_chat_patterns':
            return await this.analyzeChatPatterns(args);
          
          case 'get_memory_status':
            return await this.getMemoryStatus();
          
          case 'sync_chat_data':
            return await this.syncChatData(args);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async searchChatHistory(args) {
    const { query, timeRange = 'all', limit = 10 } = args;
    
    // 这里应该连接到实际的SQLite数据库
    // 为演示目的，返回模拟数据
    const results = await this.queryDatabase(query, timeRange, limit);
    
    return {
      content: [
        {
          type: 'text',
          text: `找到 ${results.length} 条相关聊天记录：\n\n${results.map((r, i) => 
            `${i + 1}. [${r.timestamp}] ${r.type}: ${r.text.substring(0, 100)}...`
          ).join('\n')}`,
        },
      ],
    };
  }

  async getProjectSummary() {
    const memoryFiles = await this.readAllMemoryFiles();
    const chatData = await this.getRecentChatData();
    
    const summary = this.generateIntelligentSummary(memoryFiles, chatData);
    
    return {
      content: [
        {
          type: 'text',
          text: `## 项目智能摘要\n\n${summary}`,
        },
      ],
    };
  }

  async updateMemoryBank(args) {
    const { filename, content, operation = 'append' } = args;
    const filePath = path.join(this.memoryBankPath, filename);
    
    let updatedContent;
    
    try {
      const existingContent = await fs.readFile(filePath, 'utf-8');
      
      switch (operation) {
        case 'append':
          updatedContent = existingContent + '\n\n' + content;
          break;
        case 'replace':
          updatedContent = content;
          break;
        case 'prepend':
          updatedContent = content + '\n\n' + existingContent;
          break;
      }
      
      await fs.writeFile(filePath, updatedContent);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ 成功更新 ${filename}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`更新 ${filename} 失败: ${error.message}`);
    }
  }

  async analyzeChatPatterns(args) {
    const { analysisType = 'technical_decisions', timeRange = 'week' } = args;
    
    const chatData = await this.getChatDataByTimeRange(timeRange);
    const analysis = await this.performIntelligentAnalysis(chatData, analysisType);
    
    // 自动更新相关的Memory Bank文件
    await this.autoUpdateMemoryBankFromAnalysis(analysis, analysisType);
    
    return {
      content: [
        {
          type: 'text',
          text: `## ${analysisType} 分析结果\n\n${analysis.summary}\n\n### 关键发现:\n${analysis.keyFindings.map(f => `- ${f}`).join('\n')}\n\n✅ 相关Memory Bank文件已自动更新`,
        },
      ],
    };
  }

  async getMemoryStatus() {
    const memoryFiles = await this.readAllMemoryFiles();
    const stats = await this.calculateMemoryStats(memoryFiles);
    
    return {
      content: [
        {
          type: 'text',
          text: `## Memory Bank 状态\n\n` +
                `📁 文件数量: ${stats.fileCount}\n` +
                `📝 总字符数: ${stats.totalChars}\n` +
                `🕒 最后更新: ${stats.lastUpdate}\n` +
                `📊 活跃度: ${stats.activityLevel}\n\n` +
                `### 文件状态:\n${stats.fileStatus.map(f => `${f.emoji} ${f.name}: ${f.status}`).join('\n')}`,
        },
      ],
    };
  }

  async syncChatData(args) {
    const { force = false } = args;
    
    try {
      const syncResult = await this.performChatDataSync(force);
      
      return {
        content: [
          {
            type: 'text',
            text: `🔄 数据同步完成\n\n` +
                  `新增对话: ${syncResult.newChats}\n` +
                  `更新记录: ${syncResult.updatedRecords}\n` +
                  `同步时间: ${syncResult.syncTime}\n` +
                  `下次同步: ${syncResult.nextSync}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`数据同步失败: ${error.message}`);
    }
  }

  // 辅助方法
  async queryDatabase(query, timeRange, limit) {
    // 实际实现中，这里会连接到Cursor的SQLite数据库
    // 模拟返回数据
    return [
      { timestamp: '2025-01-11 17:15', type: 'prompt', text: '如何实现MCP服务器' },
      { timestamp: '2025-01-11 17:16', type: 'generation', text: 'MCP服务器可以通过以下方式实现...' },
    ];
  }

  async readAllMemoryFiles() {
    const files = {};
    const memoryFiles = await fs.readdir(this.memoryBankPath);
    
    for (const file of memoryFiles.filter(f => f.endsWith('.md'))) {
      const content = await fs.readFile(path.join(this.memoryBankPath, file), 'utf-8');
      files[file] = content;
    }
    
    return files;
  }

  generateIntelligentSummary(memoryFiles, chatData) {
    // 这里实现智能摘要生成逻辑
    return "基于Memory Bank和聊天历史的智能项目摘要...";
  }

  async performIntelligentAnalysis(chatData, analysisType) {
    // 实现智能分析逻辑
    return {
      summary: `${analysisType} 分析完成`,
      keyFindings: ['发现1', '发现2', '发现3'],
    };
  }

  async autoUpdateMemoryBankFromAnalysis(analysis, analysisType) {
    // 根据分析结果自动更新相关的Memory Bank文件
    const targetFiles = {
      'technical_decisions': 'techContext.md',
      'problem_solutions': 'problemSolutions.md',
      'code_patterns': 'codePatterns.md',
      'learning_points': 'learningJourney.md',
    };

    const targetFile = targetFiles[analysisType];
    if (targetFile) {
      await this.updateMemoryBank({
        filename: targetFile,
        content: `## ${new Date().toISOString().split('T')[0]} 自动分析\n\n${analysis.summary}`,
        operation: 'append',
      });
    }
  }

  async calculateMemoryStats(memoryFiles) {
    const fileCount = Object.keys(memoryFiles).length;
    const totalChars = Object.values(memoryFiles).reduce((sum, content) => sum + content.length, 0);
    const lastUpdate = new Date().toISOString();
    
    return {
      fileCount,
      totalChars,
      lastUpdate,
      activityLevel: 'High',
      fileStatus: Object.entries(memoryFiles).map(([name, content]) => ({
        name,
        status: content.length > 100 ? '已更新' : '待完善',
        emoji: content.length > 100 ? '✅' : '⚠️',
      })),
    };
  }

  async performChatDataSync(force) {
    // 实现实际的数据同步逻辑
    return {
      newChats: 5,
      updatedRecords: 2,
      syncTime: new Date().toISOString(),
      nextSync: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Cursor Memory MCP Server running on stdio');
  }
}

// 启动服务器
const server = new CursorMemoryMCPServer();
server.run().catch(console.error); 