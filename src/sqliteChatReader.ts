import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Database } from 'sqlite3';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  uuid?: string; // 用于关联
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
  importance: number;
  qaPairs?: QAPair[]; // 🆕 问答对
}

interface QAPair {
  question: string;
  answer: string;
  questionTimestamp: number;
  answerTimestamp: number;
  generationUUID?: string;
  confidence: number; // 关联置信度
}

interface CursorPrompt {
  text: string;
  timestamp?: number;
  unixMs?: number;
}

interface CursorGeneration {
  textDescription: string; // 实际字段名
  generationUUID: string;
  unixMs: number;
  type?: string;
}

export class SQLiteChatReader {
  private workspaceStoragePath: string;
  private sessionCache: ChatSession[] | null = null;
  private lastScanTime: number = 0;
  private CACHE_DURATION: number = 5 * 60 * 1000; // 5 minutes
  private monitoringEnabled: boolean = false;
  private monitorCallback?: (session: ChatSession) => void;

  constructor() {
    this.workspaceStoragePath = path.join(
      os.homedir(),
      'Library/Application Support/Cursor/User/workspaceStorage'
    );
  }

  /**
   * 扫描所有工作区目录
   */
  public async scanAllWorkspaces(projectPath?: string): Promise<ChatSession[]> {
    // 如果有缓存且时间较新，直接返回缓存
    const now = Date.now();
    if (this.sessionCache && (now - this.lastScanTime) < this.CACHE_DURATION) {
      return this.sessionCache;
    }

    const allSessions: ChatSession[] = [];
    
    try {
      if (!fs.existsSync(this.workspaceStoragePath)) {
        console.log(`⚠️  工作区存储路径不存在: ${this.workspaceStoragePath}`);
        return allSessions;
      }

      const workspaceDirs = fs.readdirSync(this.workspaceStoragePath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      console.log(`🔍 发现 ${workspaceDirs.length} 个工作区目录`);

      for (const workspaceId of workspaceDirs) {
        console.log(`📂 检查工作区: ${workspaceId}`);
        const dbPath = path.join(this.workspaceStoragePath, workspaceId, 'state.vscdb');
        
        if (fs.existsSync(dbPath)) {
          const sessions = await this.extractSessionsFromDatabase(dbPath, workspaceId, projectPath);
          allSessions.push(...sessions);
        }
      }

      console.log(`✅ 总共提取了 ${allSessions.length} 个聊天会话`);
      
      // 更新缓存
      this.sessionCache = allSessions;
      this.lastScanTime = now;
      
      return allSessions;
    } catch (error) {
      console.error('❌ 扫描工作区失败:', error);
      return allSessions;
    }
  }

  /**
   * 🆕 启用实时监控模式
   */
  enableRealTimeMonitoring(callback: (session: ChatSession) => void) {
    this.monitoringEnabled = true;
    this.monitorCallback = callback;
    console.log('🔄 启用实时监控模式');
  }

  /**
   * 🆕 禁用实时监控模式  
   */
  disableRealTimeMonitoring() {
    this.monitoringEnabled = false;
    this.monitorCallback = undefined;
    console.log('⏹️ 禁用实时监控模式');
  }

  /**
   * 🆕 增强版：从数据库提取会话（支持问答关联）
   */
  async extractSessionsFromDatabase(dbPath: string, workspaceId: string, projectPath?: string): Promise<ChatSession[]> {
    return new Promise((resolve) => {
      const sessions: ChatSession[] = [];
      const db = new Database(dbPath);

      // 并行查询prompts和generations
      const queries = [
        new Promise<any>((res) => {
          db.get("SELECT value FROM ItemTable WHERE key = 'aiService.prompts'", (err, row) => {
            res(err ? null : row);
          });
        }),
        new Promise<any>((res) => {
          db.get("SELECT value FROM ItemTable WHERE key = 'aiService.generations'", (err, row) => {
            res(err ? null : row);
          });
        })
      ];

      Promise.all(queries).then(([promptsRow, generationsRow]) => {
        try {
          let prompts: CursorPrompt[] = [];
          let generations: CursorGeneration[] = [];

          // 解析prompts
          if (promptsRow?.value) {
            prompts = JSON.parse(promptsRow.value);
          }

          // 解析generations  
          if (generationsRow?.value) {
            generations = JSON.parse(generationsRow.value);
          }

          console.log(`🔍 工作区 ${workspaceId}: 发现 ${prompts.length} 个提示词, ${generations.length} 个生成内容`);

          if (prompts.length > 0) {
            const session = this.convertToSessionWithQAPairs(prompts, generations, workspaceId, projectPath);
            if (session) {
              sessions.push(session);
              console.log(`✅ 成功创建会话: ${session.title} (${session.qaPairs?.length || 0} 个问答对)`);
              
              // 🔄 实时监控回调
              if (this.monitoringEnabled && this.monitorCallback) {
                this.monitorCallback(session);
              }
            }
          }
        } catch (parseError) {
          console.error('❌ 解析聊天数据失败:', parseError);
        }

        db.close();
        resolve(sessions);
      });
    });
  }

  /**
   * 🆕 将提示词和生成内容转换为带问答对的会话
   */
  private convertToSessionWithQAPairs(
    prompts: CursorPrompt[],
    generations: CursorGeneration[],
    workspaceId: string,
    projectPath?: string
  ): ChatSession | null {
    if (!Array.isArray(prompts) || prompts.length === 0) {
      return null;
    }

    const messages: ChatMessage[] = [];
    const qaPairs: QAPair[] = [];
    let sessionTitle = '';

    // 🎯 核心算法：基于数组索引和时间戳进行问答关联
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      if (!prompt.text?.trim()) continue;

      // 用户消息
      const userMessage: ChatMessage = {
        role: 'user',
        content: prompt.text.trim(),
        timestamp: prompt.unixMs || prompt.timestamp || (Date.now() - (prompts.length - i) * 60000)
      };
      messages.push(userMessage);

      // 设置会话标题
      if (i === 0) {
        sessionTitle = this.generateTitleFromText(prompt.text);
      }

      // 🔗 寻找对应的生成内容（答案）
      const matchingGeneration = this.findMatchingGeneration(prompt, generations, i);
      
      if (matchingGeneration) {
                 // AI回复消息
         const assistantMessage: ChatMessage = {
           role: 'assistant',
           content: matchingGeneration.textDescription,
           timestamp: matchingGeneration.unixMs,
           uuid: matchingGeneration.generationUUID
         };
         messages.push(assistantMessage);

         // 创建问答对
         const qaPair: QAPair = {
           question: prompt.text.trim(),
           answer: matchingGeneration.textDescription,
           questionTimestamp: userMessage.timestamp,
           answerTimestamp: matchingGeneration.unixMs,
           generationUUID: matchingGeneration.generationUUID,
           confidence: this.calculateAssociationConfidence(prompt, matchingGeneration, i)
         };
        qaPairs.push(qaPair);

                 console.log(`🔗 关联成功 [索引${i}]: Q: "${prompt.text.substring(0, 50)}..." -> A: "${matchingGeneration.textDescription.substring(0, 50)}..." (置信度: ${(qaPair.confidence * 100).toFixed(0)}%)`);
       }
    }

    if (messages.length === 0) {
      return null;
    }

    const summary = this.generateSummary(messages);

    // 项目相关性过滤
    if (!this.isRelevantToCurrentProject(sessionTitle, summary, projectPath)) {
      console.log(`🚫 跳过不相关会话: ${sessionTitle.substring(0, 40)}...`);
      return null;
    }

    const contentHash = this.generateContentHash(prompts);
    
    return {
      id: `sqlite-${workspaceId}-${contentHash}`,
      title: sessionTitle || 'Cursor聊天会话',
      messages,
      summary,
      tags: this.generateTags(messages, qaPairs),
      category: this.detectCategory(summary),
      lastActivity: messages[messages.length - 1]?.timestamp || Date.now(),
      importance: this.calculateImportance(messages, summary),
      qaPairs // 🆕 问答对数据
    };
  }

  /**
   * 🔗 寻找匹配的生成内容
   */
  private findMatchingGeneration(prompt: CursorPrompt, generations: CursorGeneration[], promptIndex: number): CursorGeneration | null {
    if (!generations || generations.length === 0) return null;

    // 策略1: 数组索引对应
    if (promptIndex < generations.length) {
      const directMatch = generations[promptIndex];
      if (directMatch && this.isValidGeneration(directMatch)) {
        return directMatch;
      }
    }

         // 策略2: 时间戳邻近匹配
     if (prompt.unixMs) {
       const timeBasedMatch = generations.find(gen => 
         gen.unixMs && 
         Math.abs(gen.unixMs - prompt.unixMs!) < 300000 && // 5分钟内
         this.isValidGeneration(gen)
       );
       if (timeBasedMatch) return timeBasedMatch;
     }

    // 策略3: 顺序匹配（回退策略）
    const availableGenerations = generations.filter(gen => this.isValidGeneration(gen));
    if (promptIndex < availableGenerations.length) {
      return availableGenerations[promptIndex];
    }

    return null;
  }

     /**
    * 验证生成内容的有效性
    */
   private isValidGeneration(generation: CursorGeneration): boolean {
     return !!(
       generation.textDescription && 
       generation.textDescription.trim().length > 0 &&
       generation.generationUUID &&
       generation.unixMs
     );
   }

  /**
   * 计算问答关联的置信度
   */
  private calculateAssociationConfidence(prompt: CursorPrompt, generation: CursorGeneration, index: number): number {
    let confidence = 0.5; // 基础置信度

    // 时间戳匹配度
    if (prompt.unixMs && generation.unixMs) {
      const timeDiff = Math.abs(generation.unixMs - prompt.unixMs);
      if (timeDiff < 60000) confidence += 0.3; // 1分钟内
      else if (timeDiff < 300000) confidence += 0.2; // 5分钟内
      else if (timeDiff < 600000) confidence += 0.1; // 10分钟内
    }

    // UUID存在性
    if (generation.generationUUID) {
      confidence += 0.2;
    }

         // 内容相关性（简单检查）
     if (prompt.text && this.hasContentRelevance(prompt.text, generation.textDescription)) {
       confidence += 0.1;
     }

    return Math.min(confidence, 1.0);
  }

  /**
   * 检查内容相关性
   */
  private hasContentRelevance(question: string, answer: string): boolean {
    const questionWords = question.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const answerLower = answer.toLowerCase();
    
    const matches = questionWords.filter(word => answerLower.includes(word));
    return matches.length / questionWords.length > 0.2; // 20%的关键词匹配
  }

     /**
    * 🆕 生成标签（包含问答对信息）
    */
   private generateTags(messages: ChatMessage[], qaPairs: QAPair[]): SessionTag[] {
     const tags: SessionTag[] = [];
     
     // 基于消息内容的标签
     const content = messages.map(m => m.content).join(' ').toLowerCase();
     
     if (content.includes('代码') || content.includes('code')) {
       tags.push({ name: '编程', category: 'technical', confidence: 0.8 });
     }
     if (content.includes('错误') || content.includes('error')) {
       tags.push({ name: '调试', category: 'problem-solving', confidence: 0.9 });
     }
     if (content.includes('如何') || content.includes('怎么')) {
       tags.push({ name: '教程', category: 'learning', confidence: 0.7 });
     }
     if (content.includes('项目') || content.includes('project')) {
       tags.push({ name: '项目', category: 'project', confidence: 0.8 });
     }
     
     // 基于问答对的标签
     if (qaPairs.length > 0) {
       tags.push({ name: '问答', category: 'qa', confidence: 0.9 });
       if (qaPairs.length > 5) {
         tags.push({ name: '深度讨论', category: 'discussion', confidence: 0.8 });
       }
       
       const avgConfidence = qaPairs.reduce((sum, qa) => sum + qa.confidence, 0) / qaPairs.length;
       if (avgConfidence > 0.8) {
         tags.push({ name: '高质量对话', category: 'quality', confidence: avgConfidence });
       }
     }
     
     // 去重（基于name字段）
     const uniqueTags = tags.filter((tag, index, self) => 
       index === self.findIndex(t => t.name === tag.name)
     );
     
     return uniqueTags;
   }

  /**
   * 🆕 获取问答对
   */
  async getQAPairs(sessionId?: string): Promise<QAPair[]> {
    const sessions = await this.scanAllWorkspaces();
    
    if (sessionId) {
      const session = sessions.find(s => s.id === sessionId);
      return session?.qaPairs || [];
    }
    
    // 返回所有问答对，按置信度排序
    const allQAPairs = sessions
      .flatMap(s => s.qaPairs || [])
      .sort((a, b) => b.confidence - a.confidence);
    
    return allQAPairs;
  }

  /**
   * 🆕 搜索问答对
   */
  async searchQAPairs(query: string, minConfidence: number = 0.6): Promise<QAPair[]> {
    const allQAPairs = await this.getQAPairs();
    const queryLower = query.toLowerCase();
    
    return allQAPairs.filter(qa => {
      if (qa.confidence < minConfidence) return false;
      
      const questionMatch = qa.question.toLowerCase().includes(queryLower);
      const answerMatch = qa.answer.toLowerCase().includes(queryLower);
      
      return questionMatch || answerMatch;
    });
  }

  /**
   * 🆕 检查会话是否与当前项目相关 - 动态项目匹配
   */
  private isRelevantToCurrentProject(title: string, summary: string, projectPath?: string): boolean {
    const content = (title + ' ' + summary).toLowerCase();
    
    // 如果没有项目路径，使用默认的cursor-chat-memory规则
    if (!projectPath) {
      const cursorKeywords = [
        'cursor-chat-memory',
        'chat memory',
        'memory service',
        'chat服务',
        '聊天记忆',
        '引用生成',
        '提示词中心',
        'vs code插件',
        'vscode扩展',
        'sqlite聊天',
        'prompt center',
        'reference generator',
        'cursor chat',
        'memory管理',
        '智能引用'
      ];
      
      return cursorKeywords.some(keyword => 
        content.includes(keyword.toLowerCase())
      );
    }
    
    // 🎯 动态项目关键词匹配
    const projectName = path.basename(projectPath).toLowerCase();
    const projectKeywords = [
      projectName,
      projectName.replace(/[-_]/g, ' '),
      projectName.replace(/[-_]/g, ''),
    ];
    
    // 🎯 特殊项目的额外关键词
    if (projectName.includes('cursor') || projectName.includes('chat') || projectName.includes('memory')) {
      projectKeywords.push(
        'cursor-chat-memory',
        'chat memory',
        'memory service',
        'chat服务',
        '聊天记忆',
        '引用生成',
        '提示词中心',
        'vs code插件',
        'vscode扩展',
        'sqlite聊天',
        'prompt center',
        'reference generator',
        'cursor chat',
        'memory管理',
        '智能引用',
        // 🆕 添加今天讨论的相关关键词
        '项目过滤',
        '动态过滤',
        'bi项目',
        '会话过滤',
        '项目相关性',
        '过滤逻辑',
        '项目匹配',
        '会话管理',
        '智能匹配',
        '上下文切换',
        'sqlite读取器',
        'web服务器',
        '项目目录',
        '25年',
        '客户',
        '汽车',
        '家电',
        '手机',
        '行业',
        '测试一下',
        '帮我看下'
      );
    }
    
    if (projectName.includes('bi') || projectName.includes('dashboard') || projectName.includes('数据')) {
      projectKeywords.push(
        'bi项目',
        'dashboard',
        '数据分析',
        '客户',
        '汽车',
        '家电',
        '手机',
        '行业',
        '25年',
        '业务',
        '销售',
        '市场',
        '报表',
        '数据库',
        '数据源'
      );
    }
    
    // 检查是否包含项目关键词
    const hasProjectKeywords = projectKeywords.some(keyword => 
      content.includes(keyword.toLowerCase())
    );
    
    // 检查是否是技术开发相关
    const isDevelopmentRelated = (
      content.includes('代码') ||
      content.includes('开发') ||
      content.includes('功能') ||
      content.includes('实现') ||
      content.includes('优化') ||
      content.includes('修复') ||
      content.includes('插件') ||
      content.includes('扩展') ||
      content.includes('web界面') ||
      content.includes('api') ||
      content.includes('typescript') ||
      content.includes('错误') ||
      content.includes('报错') ||
      content.includes('问题') ||
      content.includes('启动') ||
      content.includes('git') ||
      content.includes('分支')
    );
    
         // 🆕 宽松的相关性判断 - 默认保留更多内容
     return hasProjectKeywords || isDevelopmentRelated;
  }

  /**
   * 生成基于内容的哈希值
   */
  private generateContentHash(prompts: any[]): string {
    // 使用内容和顺序生成稳定的哈希
    const content = prompts.map((p, index) => `${index}:${p.text || ''}`).join('|');
    let hash = 0;
    
    // 使用更稳定的哈希算法
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // 生成6位的字母数字字符串
    return Math.abs(hash).toString(36).padStart(6, '0').substring(0, 6);
  }

  /**
   * 从文本生成标题
   */
  private generateTitleFromText(text: string): string {
    // 清理文本
    const cleanText = text.replace(/[@#]\S+/g, '').trim();
    
    // 提取前50个字符作为标题
    if (cleanText.length > 50) {
      return cleanText.substring(0, 47) + '...';
    }
    
    return cleanText || 'Cursor聊天会话';
  }

  /**
   * 生成会话摘要
   */
  private generateSummary(messages: ChatMessage[]): string {
    const userMessages = messages.filter(m => m.role === 'user');
    const recentMessages = userMessages.slice(-3); // 最近3条用户消息
    
    return recentMessages.map(m => {
      const content = m.content.substring(0, 100);
      return content.length < m.content.length ? content + '...' : content;
    }).join(' | ');
  }

  /**
   * 检测会话分类
   */
  private detectCategory(content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('cursor') || lowerContent.includes('chat') || lowerContent.includes('memory')) {
      return '项目开发';
    }
    if (lowerContent.includes('代码') || lowerContent.includes('code') || lowerContent.includes('bug')) {
      return '编程问题';
    }
    if (lowerContent.includes('优化') || lowerContent.includes('performance')) {
      return '性能优化';
    }
    if (lowerContent.includes('数据库') || lowerContent.includes('sql')) {
      return '数据库';
    }
    
    return '其他';
  }

  /**
   * 计算重要性评分
   */
  private calculateImportance(messages: ChatMessage[], summary: string): number {
    let score = 0.5; // 基础分数
    
    // 消息数量影响重要性
    score += Math.min(messages.length * 0.05, 0.3);
    
    // 关键词影响重要性
    const importantKeywords = ['cursor', 'chat', 'memory', '项目', '开发', '代码', '优化'];
    const lowerSummary = summary.toLowerCase();
    
    for (const keyword of importantKeywords) {
      if (lowerSummary.includes(keyword)) {
        score += 0.1;
      }
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * 获取特定项目的聊天会话
   */
  public async getProjectSessions(projectPath?: string): Promise<ChatSession[]> {
    // 使用缓存的会话数据，如果缓存为空则扫描一次
    let allSessions = this.sessionCache;
    if (!allSessions) {
      allSessions = await this.scanAllWorkspaces(projectPath);
    }
    
    if (!projectPath) {
      return allSessions;
    }
    
    const projectName = path.basename(projectPath).toLowerCase();
    
    return allSessions.filter(session => {
      const content = (session.title + ' ' + session.summary).toLowerCase();
      return content.includes(projectName) || 
             content.includes('cursor') || 
             content.includes('chat') || 
             content.includes('memory');
    });
  }
} 