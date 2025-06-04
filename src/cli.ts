#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ChatMemoryService } from './chatMemoryService';

/**
 * 增强CLI工具 - 支持智能选择性引用
 */
class EnhancedChatMemoryCLI {
  private memoryService: ChatMemoryService;

  constructor() {
    this.memoryService = new ChatMemoryService();
  }

  /**
   * 执行CLI命令
   */
  async execute(args: string[]): Promise<void> {
    const command = args[2] || 'help';
    const params = args.slice(3);

    try {
      switch (command) {
        case 'list-sessions':
          await this.listSessions(params[0]);
          break;
        case 'get-template':
          await this.getTemplate(params[0], params[1]);
          break;
        case 'recommend':
          await this.getRecommendations(params.join(' '));
          break;
        case 'search':
          await this.searchSessions(params.join(' '));
          break;
        case 'categories':
          await this.showCategories();
          break;
        case 'templates':
          await this.showTemplates();
          break;
        case 'custom':
          await this.getCustomReference(params);
          break;
        case 'refresh':
          await this.refresh();
          break;
        case 'status':
          await this.getStatus();
          break;
        case 'help':
        default:
          this.showHelp();
          break;
      }
    } catch (error) {
      console.error('❌ CLI Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  /**
   * 列出所有会话
   */
  private async listSessions(category?: string): Promise<void> {
    await this.memoryService.start();
    
    let sessions = this.memoryService.getAllSessions();
    if (category) {
      sessions = this.memoryService.getSessionsByCategory(category);
    }
    
    if (sessions.length === 0) {
      console.log('📭 没有找到会话');
      this.memoryService.stop();
      return;
    }

    console.log(`📋 ${category ? `[${category}] ` : ''}共找到 ${sessions.length} 个会话:\n`);
    
    sessions.forEach((session, index) => {
      const tagsText = session.tags.map(tag => `#${tag.name}`).join(' ');
      const importanceStars = '⭐'.repeat(Math.floor(session.importance * 5));
      
      console.log(`${index + 1}. ${session.title}`);
      console.log(`   ID: ${session.id}`);
      console.log(`   分类: [${session.category}] ${tagsText}`);
      console.log(`   重要性: ${importanceStars} (${session.importance.toFixed(2)})`);
      console.log(`   摘要: ${session.summary}`);
      console.log(`   时间: ${new Date(session.lastActivity).toLocaleString()}`);
      console.log('');
    });
    
    this.memoryService.stop();
  }

  /**
   * 使用模板获取引用
   */
  private async getTemplate(templateId: string, inputText?: string): Promise<void> {
    if (!templateId) {
      console.log('❌ 请指定模板ID');
      console.log('💡 使用 "templates" 命令查看可用模板');
      return;
    }

    await this.memoryService.start();
    const reference = this.memoryService.getReferenceByTemplate(templateId, inputText);
    console.log(reference);
    this.memoryService.stop();
  }

  /**
   * 获取智能推荐
   */
  private async getRecommendations(inputText: string): Promise<void> {
    if (!inputText.trim()) {
      console.log('❌ 请提供输入文本以获取推荐');
      return;
    }

    await this.memoryService.start();
    const recommendations = this.memoryService.getRecommendedSessions(inputText);
    
    if (recommendations.length === 0) {
      console.log('📭 没有找到相关推荐');
      this.memoryService.stop();
      return;
    }

    console.log(`🎯 基于输入 "${inputText}" 的智能推荐:\n`);
    
    recommendations.forEach((session, index) => {
      const tagsText = session.tags.map(tag => `#${tag.name}`).join(' ');
      console.log(`${index + 1}. ${session.title} [${session.category}]`);
      console.log(`   ${tagsText}`);
      console.log(`   📝 ${session.summary}`);
      console.log('');
    });
    
    this.memoryService.stop();
  }

  /**
   * 搜索会话
   */
  private async searchSessions(query: string): Promise<void> {
    if (!query.trim()) {
      console.log('❌ 请提供搜索关键词');
      return;
    }

    await this.memoryService.start();
    const results = this.memoryService.searchSessions(query);
    
    if (results.length === 0) {
      console.log(`📭 没有找到包含 "${query}" 的会话`);
      this.memoryService.stop();
      return;
    }

    console.log(`🔍 搜索 "${query}" 的结果 (${results.length}个):\n`);
    
    results.forEach((session, index) => {
      const tagsText = session.tags.map(tag => `#${tag.name}`).join(' ');
      console.log(`${index + 1}. ${session.title} [${session.category}]`);
      console.log(`   ID: ${session.id}`);
      console.log(`   ${tagsText}`);
      console.log(`   📝 ${session.summary}`);
      console.log('');
    });
    
    this.memoryService.stop();
  }

  /**
   * 显示分类统计
   */
  private async showCategories(): Promise<void> {
    await this.memoryService.start();
    const categories = this.memoryService.getCategoryStats();
    
    console.log('📊 分类统计:\n');
    
    for (const [name, info] of categories) {
      if (info.count > 0) {
        console.log(`${name}: ${info.count} 个会话`);
        console.log(`   关键词: ${info.keywords.slice(0, 5).join(', ')}`);
        console.log('');
      }
    }
    
    this.memoryService.stop();
  }

  /**
   * 显示可用模板
   */
  private async showTemplates(): Promise<void> {
    await this.memoryService.start();
    const templates = this.memoryService.getAvailableTemplates();
    
    console.log('📋 可用引用模板:\n');
    
    templates.forEach(template => {
      // 手动计算匹配的会话数量
      let sessions = this.memoryService.getAllSessions();
      
      if (template.filters.categories) {
        sessions = sessions.filter(s => template.filters.categories!.includes(s.category));
      }
      
      if (template.filters.importance !== undefined) {
        sessions = sessions.filter(s => s.importance >= template.filters.importance!);
      }
      
      const matchingCount = Math.min(sessions.length, template.filters.maxSessions || 10);
      
      console.log(`${template.id}: ${template.name}`);
      console.log(`   描述: ${template.description}`);
      console.log(`   匹配会话: ${matchingCount} 个`);
      
      const filters = [];
      if (template.filters.categories) {
        filters.push(`分类: ${template.filters.categories.join(', ')}`);
      }
      if (template.filters.importance) {
        filters.push(`重要性 ≥ ${template.filters.importance}`);
      }
      if (template.filters.maxSessions) {
        filters.push(`最多 ${template.filters.maxSessions} 个`);
      }
      if (filters.length > 0) {
        console.log(`   过滤条件: ${filters.join(' | ')}`);
      }
      console.log('');
    });
    
    this.memoryService.stop();
  }

  /**
   * 自定义引用
   */
  private async getCustomReference(sessionIds: string[]): Promise<void> {
    if (sessionIds.length === 0) {
      console.log('❌ 请提供会话ID列表');
      console.log('💡 使用 "list-sessions" 命令查看可用会话');
      return;
    }

    await this.memoryService.start();
    const reference = this.memoryService.getCustomReference(sessionIds, '自定义引用');
    console.log(reference);
    this.memoryService.stop();
  }

  /**
   * 刷新缓存
   */
  private async refresh(): Promise<void> {
    console.log('🔄 刷新缓存中...');
    await this.memoryService.start();
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const sessionCount = this.memoryService.getAllSessions().length;
    console.log(`✅ 缓存刷新完成，共 ${sessionCount} 个会话`);
    this.memoryService.stop();
  }

  /**
   * 获取状态信息
   */
  private async getStatus(): Promise<void> {
    const cacheDir = path.join(os.homedir(), '.cursor-memory');
    const chatDir = path.join(os.homedir(), '.cursor', 'chat');
    
    await this.memoryService.start();
    const sessions = this.memoryService.getAllSessions();
    const categories = this.memoryService.getCategoryStats();
    
    const status = {
      directories: {
        cacheExists: fs.existsSync(cacheDir),
        chatDirExists: fs.existsSync(chatDir),
        cacheFiles: fs.existsSync(cacheDir) ? fs.readdirSync(cacheDir).length : 0,
        chatFiles: fs.existsSync(chatDir) ? fs.readdirSync(chatDir).filter(f => f.endsWith('.json')).length : 0
      },
      sessions: {
        total: sessions.length,
        categories: Object.fromEntries(categories),
        topSessions: sessions.slice(0, 3).map(s => ({
          title: s.title,
          category: s.category,
          importance: s.importance
        }))
      }
    };

    console.log(JSON.stringify(status, null, 2));
    this.memoryService.stop();
  }

  /**
   * 显示帮助信息
   */
  private showHelp(): void {
    console.log(`
🧠 Enhanced Cursor Chat Memory CLI

基础命令:
  list-sessions [category]     列出所有会话或指定分类的会话
  get-template <templateId> [input]  使用模板获取引用内容
  recommend <text>             基于输入文本获取智能推荐
  search <query>               搜索包含关键词的会话
  categories                   显示分类统计信息
  templates                    显示可用的引用模板
  custom <id1> <id2> ...       自定义选择会话生成引用
  refresh                      刷新缓存
  status                       显示详细状态信息
  help                         显示此帮助信息

使用示例:
  # 列出所有会话
  cursor-memory list-sessions
  
  # 列出JavaScript相关会话
  cursor-memory list-sessions JavaScript
  
  # 使用"最近会话"模板
  cursor-memory get-template recent
  
  # 智能推荐与React相关的会话
  cursor-memory recommend "React组件优化问题"
  
  # 搜索性能相关的会话
  cursor-memory search "性能优化"
  
  # 查看所有可用模板
  cursor-memory templates
  
  # 自定义引用指定会话
  cursor-memory custom session1 session2
  
  # 复制到剪贴板 (macOS)
  cursor-memory get-template recent | pbcopy

集成示例:
  Alfred Workflow: cursor-memory get-template current-topic {query} | pbcopy
  Raycast Script: cursor-memory recommend {query}
    `);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  const cli = new EnhancedChatMemoryCLI();
  cli.execute(process.argv).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { EnhancedChatMemoryCLI }; 