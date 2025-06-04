#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ChatMemoryService } from './chatMemoryService';

/**
 * 增强CLI工具 - 支持智能选择性引用和项目特定上下文
 */
class EnhancedChatMemoryCLI {
  private memoryService: ChatMemoryService;

  constructor() {
    // 尝试从当前工作目录获取项目路径
    const currentDir = process.cwd();
    this.memoryService = new ChatMemoryService(currentDir);
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
          if (params.length < 1) {
            console.log('❌ 请指定模板ID: get-template <templateId> [inputText]');
            process.exit(1);
          }
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
        case 'light-reference':
          const maxTokens = params.length > 0 ? parseInt(params[0]) : 3000;
          console.log(this.memoryService.getLightweightReference(maxTokens));
          break;
        case 'project-sessions':
          await this.showProjectSessions(params[0]);
          break;
        case 'project-reference':
          await this.getProjectReference(params[0], params[1]);
          break;
        case 'set-project':
          if (params.length < 1) {
            console.log('❌ 请指定项目路径: set-project <projectPath>');
            process.exit(1);
          }
          this.memoryService.setCurrentProject(params[0]);
          console.log(`✅ 项目上下文已设置`);
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
🧠 Enhanced Cursor Chat Memory CLI v1.0.0

📋 基础命令:
  list-sessions [category]     查看所有会话（可选：按分类筛选）
  search <query>              搜索包含关键词的会话
  categories                  查看分类统计信息
  status                      显示系统状态

🎯 引用生成:
  get-template <id> [input]   使用预设模板生成引用
  light-reference [tokens]    生成轻量级引用（默认3000 tokens）
  custom <id1> <id2> ...      自定义选择会话生成引用
  project-reference [id] [path]  获取项目相关引用
  
📝 可用模板:
  recent                      最近重要会话（3个）
  current-topic               当前主题相关（5个）
  problem-solving             问题解决经验（4个）
  optimization               性能优化相关（3个）
  all-important              高重要性精选（10个）

🏗️  项目功能:
  project-sessions [path]     查看项目相关会话
  set-project <path>          设置当前项目路径

⚙️  管理操作:
  templates                   查看所有可用模板
  refresh                     刷新缓存
  help                        显示帮助信息

💡 上下文控制:
  - 自动限制总token数 (~8000 tokens)
  - 智能截断长标题和摘要
  - 显示实际使用的tokens统计
  - 支持轻量级引用模式

📊 使用示例:
  cursor-memory get-template recent
  cursor-memory search "React优化"
  cursor-memory light-reference 2000
  cursor-memory custom session1 session2
  cursor-memory project-sessions
  cursor-memory project-reference recent ./my-project
    `);
  }

  /**
   * 显示项目相关会话
   */
  private async showProjectSessions(projectPath?: string): Promise<void> {
    await this.memoryService.start();
    
    const sessions = this.memoryService.getProjectSessions(projectPath);
    const currentProject = projectPath || process.cwd();
    const projectName = path.basename(currentProject);
    
    if (sessions.length === 0) {
      console.log(`📭 没有找到与项目 "${projectName}" 相关的会话`);
      this.memoryService.stop();
      return;
    }

    console.log(`📋 项目 "${projectName}" 相关会话 (${sessions.length}个):\n`);
    
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
   * 获取项目相关引用
   */
  private async getProjectReference(templateId: string = 'recent', projectPath?: string): Promise<void> {
    await this.memoryService.start();
    const reference = this.memoryService.getProjectReference(templateId, projectPath);
    console.log(reference);
    this.memoryService.stop();
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