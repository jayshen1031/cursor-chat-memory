import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { EventEmitter } from 'events';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface SessionTag {
  name: string;
  category: string;
  confidence: number;
  color?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  summary: string;
  tags: SessionTag[];
  category: string;
  lastActivity: number;
  tokenCount?: number;
  importance: number; // 重要性评分 0-1
}

interface ContextCache {
  sessions: Map<string, ChatSession>;
  categories: Map<string, CategoryInfo>;
  lastUpdated: number;
}

interface CategoryInfo {
  name: string;
  count: number;
  keywords: string[];
  color: string;
}

interface ReferenceTemplate {
  id: string;
  name: string;
  description: string;
  filters: {
    categories?: string[];
    tags?: string[];
    maxSessions?: number;
    timeRange?: number; // 小时数
    importance?: number; // 最低重要性
  };
}

export class ChatMemoryService extends EventEmitter {
  private chatDir: string;
  private cacheDir: string;
  private watcher: fs.FSWatcher | null = null;
  private contextCache: ContextCache;
  private currentProject?: string;  // 当前项目路径
  
  // 上下文控制配置
  private readonly contextLimits = {
    maxTotalTokens: 8000,        // 总token限制 (留给用户输入空间)
    maxSessionsPerTemplate: 10,   // 每个模板最大会话数
    maxSummaryLength: 200,        // 摘要最大长度
    maxTitleLength: 50,           // 标题最大长度
    tokenBuffer: 2000             // 为用户输入预留的token缓冲
  };

  // 预定义分类和关键词
  private readonly categoryKeywords = new Map<string, string[]>([
    ['JavaScript', ['javascript', 'js', 'node', 'npm', 'react', 'vue', 'angular', 'typescript', 'es6']],
    ['Python', ['python', 'py', 'django', 'flask', 'pandas', 'numpy', 'pip', 'conda']],
    ['Web开发', ['html', 'css', 'web', 'frontend', 'backend', 'api', 'http', 'cors', 'websocket']],
    ['数据库', ['sql', 'mysql', 'mongodb', 'redis', 'database', 'query', 'schema', 'orm']],
    ['DevOps', ['docker', 'kubernetes', 'nginx', 'deployment', 'ci/cd', 'jenkins', 'git', 'github']],
    ['AI/ML', ['ai', 'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'model', 'neural']],
    ['系统工具', ['linux', 'shell', 'bash', 'terminal', 'vim', 'vscode', 'config', 'setup']],
    ['问题解决', ['error', 'bug', 'fix', 'debug', 'troubleshoot', 'issue', 'problem', 'solution']],
    ['性能优化', ['optimize', 'performance', 'speed', 'memory', 'cpu', 'cache', 'profiling']],
    ['其他', []]
  ]);

  // 预设引用模板
  private readonly referenceTemplates: ReferenceTemplate[] = [
    {
      id: 'recent',
      name: '最近会话',
      description: '最近3个重要会话',
      filters: { maxSessions: 3, importance: 0.3 }
    },
    {
      id: 'current-topic',
      name: '当前主题',
      description: '与当前主题相关的会话',
      filters: { maxSessions: 5, importance: 0.4 }
    },
    {
      id: 'problem-solving',
      name: '问题解决',
      description: '问题解决相关的历史经验',
      filters: { categories: ['问题解决'], maxSessions: 4 }
    },
    {
      id: 'optimization',
      name: '性能优化',
      description: '性能优化相关经验',
      filters: { categories: ['性能优化'], maxSessions: 3 }
    },
    {
      id: 'all-important',
      name: '重要精选',
      description: '所有高重要性会话',
      filters: { importance: 0.7, maxSessions: 10 }
    }
  ];

  constructor(projectPath?: string) {
    super();
    this.currentProject = projectPath;
    this.chatDir = path.join(os.homedir(), '.cursor', 'chat');
    
    // 项目特定的缓存目录
    if (projectPath) {
      const projectName = path.basename(projectPath);
      this.cacheDir = path.join(os.homedir(), '.cursor-memory', 'projects', projectName);
      console.log(`📁 使用项目特定缓存: ${projectName}`);
    } else {
      this.cacheDir = path.join(os.homedir(), '.cursor-memory');
    }
    
    this.contextCache = {
      sessions: new Map(),
      categories: new Map(),
      lastUpdated: 0
    };
    
    this.initializeCategories();
    this.ensureCacheDir();
    this.loadCache();
  }

  /**
   * 启动文件监听服务
   */
  public async start(): Promise<void> {
    try {
      if (!fs.existsSync(this.chatDir)) {
        console.log('🔍 Creating cursor chat directory...');
        fs.mkdirSync(this.chatDir, { recursive: true });
      }

      await this.scanExistingChats();

      this.watcher = fs.watch(this.chatDir, { recursive: true }, (eventType, filename) => {
        if (filename && filename.endsWith('.json')) {
          this.handleFileChange(eventType, filename);
        }
      });

      console.log('🧠 Enhanced Chat Memory Service started');
      this.emit('started');
    } catch (error) {
      console.error('❌ Failed to start service:', error);
      this.emit('error', error);
    }
  }

  /**
   * 停止监听服务
   */
  public stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    this.saveCache();
    console.log('🛑 Enhanced Chat Memory Service stopped');
    this.emit('stopped');
  }

  /**
   * 获取所有会话（按重要性排序）
   */
  public getAllSessions(): ChatSession[] {
    return Array.from(this.contextCache.sessions.values())
      .sort((a, b) => b.importance - a.importance || b.lastActivity - a.lastActivity);
  }

  /**
   * 根据类别获取会话
   */
  public getSessionsByCategory(category: string): ChatSession[] {
    return this.getAllSessions().filter(session => session.category === category);
  }

  /**
   * 根据标签获取会话
   */
  public getSessionsByTag(tagName: string): ChatSession[] {
    return this.getAllSessions().filter(session => 
      session.tags.some(tag => tag.name === tagName)
    );
  }

  /**
   * 智能推荐相关会话
   */
  public getRecommendedSessions(inputText: string, maxSessions: number = 5): ChatSession[] {
    const inputKeywords = this.extractKeywords(inputText.toLowerCase());
    const allSessions = this.getAllSessions();
    
    // 计算相关性分数
    const scoredSessions = allSessions.map(session => {
      let score = 0;
      
      // 关键词匹配
      const sessionKeywords = this.extractKeywords(session.summary.toLowerCase());
      const matchingKeywords = inputKeywords.filter(kw => sessionKeywords.includes(kw));
      score += matchingKeywords.length * 0.3;
      
      // 标签匹配
      const inputCategory = this.detectCategory(inputText);
      if (session.category === inputCategory) {
        score += 0.4;
      }
      
      // 重要性权重
      score += session.importance * 0.2;
      
      // 时间衰减
      const daysSinceActivity = (Date.now() - session.lastActivity) / (1000 * 60 * 60 * 24);
      score *= Math.exp(-daysSinceActivity / 30); // 30天半衰期
      
      return { session, score };
    });
    
    return scoredSessions
      .filter(item => item.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSessions)
      .map(item => item.session);
  }

  /**
   * 根据模板获取引用内容 (增强版 - 智能上下文控制)
   */
  public getReferenceByTemplate(templateId: string, inputText?: string): string {
    const template = this.referenceTemplates.find(t => t.id === templateId);
    if (!template) {
      return '模板不存在';
    }

    let sessions = this.getAllSessions();

    // 应用过滤器
    if (template.filters.categories) {
      sessions = sessions.filter(s => template.filters.categories!.includes(s.category));
    }

    if (template.filters.importance !== undefined) {
      sessions = sessions.filter(s => s.importance >= template.filters.importance!);
    }

    if (template.filters.timeRange) {
      const cutoffTime = Date.now() - (template.filters.timeRange * 60 * 60 * 1000);
      sessions = sessions.filter(s => s.lastActivity >= cutoffTime);
    }

    // 智能推荐模式
    if (templateId === 'current-topic' && inputText) {
      sessions = this.getRecommendedSessions(inputText, template.filters.maxSessions || 5);
    } else {
      // 应用上下文限制
      const maxSessions = Math.min(
        template.filters.maxSessions || this.contextLimits.maxSessionsPerTemplate,
        this.contextLimits.maxSessionsPerTemplate
      );
      sessions = sessions.slice(0, maxSessions);
    }

    return this.formatReferenceContent(sessions, template.name);
  }

  /**
   * 获取轻量级引用 (用于上下文敏感场景)
   */
  public getLightweightReference(maxTokens: number = 3000): string {
    const sessions = this.getAllSessions()
      .filter(s => s.importance >= 0.5)  // 只选择重要会话
      .slice(0, 3);  // 最多3个会话
    
    // 临时调整限制
    const originalLimits = { ...this.contextLimits };
    this.contextLimits.maxTotalTokens = maxTokens;
    this.contextLimits.maxSummaryLength = 100;  // 更短的摘要
    this.contextLimits.maxTitleLength = 30;     // 更短的标题
    
    const result = this.formatReferenceContent(sessions, '精简引用');
    
    // 恢复原始限制
    Object.assign(this.contextLimits, originalLimits);
    
    return result;
  }

  /**
   * 自定义选择会话生成引用
   */
  public getCustomReference(sessionIds: string[], title: string = '自定义引用'): string {
    const sessions = sessionIds
      .map(id => this.contextCache.sessions.get(id))
      .filter(session => session !== undefined) as ChatSession[];
    
    return this.formatReferenceContent(sessions, title);
  }

  /**
   * 获取所有可用的引用模板
   */
  public getAvailableTemplates(): ReferenceTemplate[] {
    return this.referenceTemplates.map(template => ({
      ...template,
      filters: {
        ...template.filters,
        // 添加匹配的会话数量信息
        matchingSessions: this.getSessionCountForTemplate(template)
      }
    }));
  }

  /**
   * 获取分类统计信息
   */
  public getCategoryStats(): Map<string, CategoryInfo> {
    // 重新计算分类统计
    const stats = new Map<string, CategoryInfo>();
    
    for (const [category, info] of this.contextCache.categories) {
      const sessionCount = this.getSessionsByCategory(category).length;
      stats.set(category, {
        ...info,
        count: sessionCount
      });
    }
    
    return stats;
  }

  /**
   * 搜索会话
   */
  public searchSessions(query: string): ChatSession[] {
    const keywords = this.extractKeywords(query.toLowerCase());
    return this.getAllSessions().filter(session => {
      const sessionText = (session.title + ' ' + session.summary).toLowerCase();
      return keywords.some(keyword => sessionText.includes(keyword));
    });
  }

  /**
   * 处理文件变化事件
   */
  private async handleFileChange(eventType: string, filename: string): Promise<void> {
    try {
      const filePath = path.join(this.chatDir, filename);
      
      if (eventType === 'change' && fs.existsSync(filePath)) {
        await this.processChangedFile(filePath);
      }
    } catch (error) {
      console.error('❌ Error handling file change:', error);
    }
  }

  /**
   * 处理变化的聊天文件
   */
  private async processChangedFile(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const chatData = JSON.parse(content);
      
      const messages = this.extractMessages(chatData);
      if (messages.length === 0) return;

      const sessionId = path.basename(filePath, '.json');
      const assistantMessages = messages.filter(m => m.role === 'assistant');
      
      if (assistantMessages.length === 0) return;

      // 生成会话摘要和标题
      const summary = this.generateEnhancedSummary(messages);
      const title = this.generateSessionTitle(messages);
      const category = this.detectCategory(summary);
      const tags = this.generateTags(summary, category);
      const importance = this.calculateImportance(messages, summary);

      const session: ChatSession = {
        id: sessionId,
        title,
        messages,
        summary,
        tags,
        category,
        lastActivity: Date.now(),
        importance
      };

      this.contextCache.sessions.set(sessionId, session);
      this.updateCategoryStats();
      this.contextCache.lastUpdated = Date.now();
      
      console.log(`📝 Processed session: ${title} [${category}] (${importance.toFixed(2)})`);
      this.emit('sessionUpdated', session);
      this.saveCache();
      
    } catch (error) {
      console.error('❌ Error processing chat file:', error);
    }
  }

  /**
   * 提取聊天消息
   */
  private extractMessages(chatData: any): ChatMessage[] {
    const messages: ChatMessage[] = [];
    
    try {
      if (chatData.messages && Array.isArray(chatData.messages)) {
        for (const msg of chatData.messages) {
          if (msg.role && msg.content) {
            messages.push({
              role: msg.role,
              content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
              timestamp: msg.timestamp || Date.now()
            });
          }
        }
      }
    } catch (error) {
      console.error('❌ Error extracting messages:', error);
    }
    
    return messages;
  }

  /**
   * 生成增强摘要
   */
  private generateEnhancedSummary(messages: ChatMessage[]): string {
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    if (assistantMessages.length === 0) return '';

    // 取最后一个assistant消息作为主要内容
    const lastAssistant = assistantMessages[assistantMessages.length - 1];
    const content = lastAssistant.content;
    
    // 提取关键点
    const lines = content.split('\n').filter(line => line.trim());
    const keyPoints: string[] = [];
    
    // 查找标题、列表项、代码块等重要内容
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('##') || trimmed.startsWith('**') || 
          trimmed.startsWith('- ') || trimmed.startsWith('* ') ||
          trimmed.startsWith('1.') || trimmed.startsWith('2.')) {
        keyPoints.push(trimmed.replace(/[#*-]/g, '').trim());
      }
    }
    
    if (keyPoints.length > 0) {
      return keyPoints.slice(0, 3).join(' | ');
    }
    
    // 如果没有结构化内容，取前100字符
    return content.substring(0, 100) + (content.length > 100 ? '...' : '');
  }

  /**
   * 生成会话标题
   */
  private generateSessionTitle(messages: ChatMessage[]): string {
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) return '未知对话';

    const firstUserMessage = userMessages[0].content;
    
    // 提取问题的关键词作为标题
    const title = firstUserMessage.length > 30 
      ? firstUserMessage.substring(0, 30) + '...'
      : firstUserMessage;
      
    return title.replace(/\n/g, ' ');
  }

  /**
   * 检测对话类别
   */
  private detectCategory(content: string): string {
    const contentLower = content.toLowerCase();
    
    for (const [category, keywords] of this.categoryKeywords) {
      if (keywords.some(keyword => contentLower.includes(keyword))) {
        return category;
      }
    }
    
    return '其他';
  }

  /**
   * 生成标签
   */
  private generateTags(summary: string, category: string): SessionTag[] {
    const tags: SessionTag[] = [];
    const summaryLower = summary.toLowerCase();
    
    // 添加主类别标签
    tags.push({
      name: category,
      category: 'main',
      confidence: 1.0,
      color: this.getCategoryColor(category)
    });
    
    // 检测特殊标签
    const specialTags = [
      { keywords: ['error', 'bug', 'problem'], tag: '问题', color: '#ff4444' },
      { keywords: ['optimize', 'performance'], tag: '优化', color: '#44ff44' },
      { keywords: ['tutorial', 'how to', '如何'], tag: '教程', color: '#4444ff' },
      { keywords: ['config', 'setup', '配置'], tag: '配置', color: '#ff8844' },
      { keywords: ['api', 'interface'], tag: 'API', color: '#8844ff' }
    ];
    
    for (const { keywords, tag, color } of specialTags) {
      if (keywords.some(kw => summaryLower.includes(kw))) {
        tags.push({
          name: tag,
          category: 'special',
          confidence: 0.8,
          color
        });
      }
    }
    
    return tags;
  }

  /**
   * 计算重要性分数
   */
  private calculateImportance(messages: ChatMessage[], summary: string): number {
    let score = 0.5; // 基础分数
    
    // 消息数量权重
    score += Math.min(messages.length * 0.05, 0.2);
    
    // 内容长度权重
    const totalLength = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    score += Math.min(totalLength / 1000 * 0.1, 0.2);
    
    // 关键词权重
    const importantKeywords = ['optimize', 'solution', 'fix', 'best practice', '最佳实践', '解决方案'];
    const summaryLower = summary.toLowerCase();
    const keywordMatches = importantKeywords.filter(kw => summaryLower.includes(kw));
    score += keywordMatches.length * 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * 格式化引用内容 (增强版 - 控制上下文长度)
   */
  private formatReferenceContent(sessions: ChatSession[], title: string): string {
    if (sessions.length === 0) {
      return '📭 没有找到相关的历史对话';
    }

    let content = `💡 **${title}** (${sessions.length}个会话)\n\n`;
    let estimatedTokens = this.estimateTokens(content);
    const maxTokensForSessions = this.contextLimits.maxTotalTokens - this.contextLimits.tokenBuffer;
    
    const validSessions: ChatSession[] = [];
    
    for (const session of sessions) {
      const tagsText = session.tags.map(tag => `#${tag.name}`).join(' ');
      const sessionContent = `**${validSessions.length + 1}. ${this.truncateText(session.title, this.contextLimits.maxTitleLength)}** [${session.category}]\n${tagsText}\n📝 ${this.truncateText(session.summary, this.contextLimits.maxSummaryLength)}\n\n`;
      
      const sessionTokens = this.estimateTokens(sessionContent);
      
      if (estimatedTokens + sessionTokens <= maxTokensForSessions) {
        validSessions.push(session);
        estimatedTokens += sessionTokens;
      } else {
        console.log(`⚠️  上下文限制: 跳过会话 "${session.title}" (tokens: ${sessionTokens})`);
        break;
      }
    }
    
    validSessions.forEach((session, index) => {
      const tagsText = session.tags.map(tag => `#${tag.name}`).join(' ');
      content += `**${index + 1}. ${this.truncateText(session.title, this.contextLimits.maxTitleLength)}** [${session.category}]\n`;
      content += `${tagsText}\n`;
      content += `📝 ${this.truncateText(session.summary, this.contextLimits.maxSummaryLength)}\n\n`;
    });
    
    // 添加上下文使用情况提示
    const finalTokens = this.estimateTokens(content);
    content += `---\n`;
    content += `📊 上下文使用: ~${finalTokens} tokens (${validSessions.length}/${sessions.length}个会话)\n\n`;
    
    return content;
  }

  /**
   * 估算文本的token数量 (简单估算: 1个中文字符≈1.5tokens, 英文单词≈1.3tokens)
   */
  private estimateTokens(text: string): number {
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    const otherChars = text.length - chineseChars - englishWords;
    
    return Math.ceil(chineseChars * 1.5 + englishWords * 1.3 + otherChars * 0.5);
  }

  /**
   * 截断文本到指定长度
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * 获取模板匹配的会话数量
   */
  private getSessionCountForTemplate(template: ReferenceTemplate): number {
    let sessions = this.getAllSessions();
    
    if (template.filters.categories) {
      sessions = sessions.filter(s => template.filters.categories!.includes(s.category));
    }
    
    if (template.filters.importance !== undefined) {
      sessions = sessions.filter(s => s.importance >= template.filters.importance!);
    }
    
    return Math.min(sessions.length, template.filters.maxSessions || 10);
  }

  /**
   * 提取关键词
   */
  private extractKeywords(text: string): string[] {
    // 简单的关键词提取逻辑
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    return [...new Set(words)];
  }

  /**
   * 获取分类颜色
   */
  private getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'JavaScript': '#f7df1e',
      'Python': '#3776ab',
      'Web开发': '#61dafb',
      '数据库': '#336791',
      'DevOps': '#326ce5',
      'AI/ML': '#ff6f00',
      '系统工具': '#4caf50',
      '问题解决': '#f44336',
      '性能优化': '#ff9800',
      '其他': '#9e9e9e'
    };
    return colors[category] || '#9e9e9e';
  }

  /**
   * 初始化分类信息
   */
  private initializeCategories(): void {
    for (const [category, keywords] of this.categoryKeywords) {
      this.contextCache.categories.set(category, {
        name: category,
        count: 0,
        keywords,
        color: this.getCategoryColor(category)
      });
    }
  }

  /**
   * 更新分类统计
   */
  private updateCategoryStats(): void {
    for (const [category, info] of this.contextCache.categories) {
      const count = this.getSessionsByCategory(category).length;
      this.contextCache.categories.set(category, { ...info, count });
    }
  }

  /**
   * 扫描现有聊天文件
   */
  private async scanExistingChats(): Promise<void> {
    try {
      if (!fs.existsSync(this.chatDir)) return;
      
      const files = fs.readdirSync(this.chatDir);
      const chatFiles = files.filter(file => file.endsWith('.json'));
      
      console.log(`🔍 Found ${chatFiles.length} existing chat files`);
      
      for (const file of chatFiles) {
        const filePath = path.join(this.chatDir, file);
        await this.processChangedFile(filePath);
      }
      
    } catch (error) {
      console.error('❌ Error scanning existing chats:', error);
    }
  }

  /**
   * 确保缓存目录存在
   */
  private ensureCacheDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * 加载缓存
   */
  private loadCache(): void {
    try {
      const cacheFile = path.join(this.cacheDir, 'enhanced-cache.json');
      if (fs.existsSync(cacheFile)) {
        const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        
        // 恢复Map结构
        if (data.sessions) {
          this.contextCache.sessions = new Map(Object.entries(data.sessions));
        }
        if (data.categories) {
          this.contextCache.categories = new Map(Object.entries(data.categories));
        }
        this.contextCache.lastUpdated = data.lastUpdated || 0;
        
        console.log(`📂 Loaded ${this.contextCache.sessions.size} sessions from cache`);
      }
    } catch (error) {
      console.error('❌ Error loading cache:', error);
    }
  }

  /**
   * 保存缓存
   */
  private saveCache(): void {
    try {
      const cacheFile = path.join(this.cacheDir, 'enhanced-cache.json');
      const data = {
        sessions: Object.fromEntries(this.contextCache.sessions),
        categories: Object.fromEntries(this.contextCache.categories),
        lastUpdated: this.contextCache.lastUpdated
      };
      fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ Error saving cache:', error);
    }
  }

  /**
   * 根据项目过滤会话
   */
  public getProjectSessions(projectPath?: string): ChatSession[] {
    const targetProject = projectPath || this.currentProject;
    if (!targetProject) {
      return this.getAllSessions();
    }
    
    const projectName = path.basename(targetProject);
    return this.getAllSessions().filter(session => {
      // 检查会话内容是否与项目相关
      const content = (session.title + ' ' + session.summary).toLowerCase();
      return content.includes(projectName.toLowerCase()) || 
             session.tags.some(tag => tag.name.toLowerCase().includes(projectName.toLowerCase()));
    });
  }

  /**
   * 设置当前项目上下文
   */
  public setCurrentProject(projectPath: string): void {
    this.currentProject = projectPath;
    const projectName = path.basename(projectPath);
    console.log(`🎯 切换到项目: ${projectName}`);
  }

  /**
   * 获取当前项目相关的引用
   */
  public getProjectReference(templateId: string = 'recent', projectPath?: string): string {
    const sessions = this.getProjectSessions(projectPath);
    const template = this.referenceTemplates.find(t => t.id === templateId);
    const title = template ? `${template.name} (项目相关)` : '项目相关会话';
    
    const limitedSessions = sessions.slice(0, template?.filters.maxSessions || 5);
    return this.formatReferenceContent(limitedSessions, title);
  }
} 