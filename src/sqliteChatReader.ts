import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Database } from 'sqlite3';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  summary: string;
  tags: any[];
  category: string;
  lastActivity: number;
  importance: number;
}

export class SQLiteChatReader {
  private workspaceStoragePath: string;
  private sessionCache: ChatSession[] | null = null;
  private lastScanTime: number = 0;

  constructor() {
    this.workspaceStoragePath = path.join(
      os.homedir(),
      'Library/Application Support/Cursor/User/workspaceStorage'
    );
  }

  /**
   * 扫描所有工作区的SQLite数据库并提取聊天历史
   */
  public async scanAllWorkspaces(): Promise<ChatSession[]> {
    const now = Date.now();
    if (this.sessionCache && (now - this.lastScanTime) < 5 * 60 * 1000) {
      console.log('📂 使用缓存的SQLite会话数据');
      return this.sessionCache;
    }

    const sessions: ChatSession[] = [];
    
    try {
      if (!fs.existsSync(this.workspaceStoragePath)) {
        console.log('⚠️  Cursor workspaceStorage目录不存在');
        return sessions;
      }

      const workspaceDirs = fs.readdirSync(this.workspaceStoragePath)
        .filter(dir => fs.statSync(path.join(this.workspaceStoragePath, dir)).isDirectory());

      console.log(`🔍 发现 ${workspaceDirs.length} 个工作区目录`);

      for (const workspaceDir of workspaceDirs) {
        const dbPath = path.join(this.workspaceStoragePath, workspaceDir, 'state.vscdb');
        
        if (fs.existsSync(dbPath)) {
          console.log(`📂 检查工作区: ${workspaceDir}`);
          const workspaceSessions = await this.extractSessionsFromDatabase(dbPath, workspaceDir);
          sessions.push(...workspaceSessions);
        }
      }

      console.log(`✅ 总共提取了 ${sessions.length} 个聊天会话`);
      
      this.sessionCache = sessions;
      this.lastScanTime = now;
      
      return sessions;
    } catch (error) {
      console.error('❌ 扫描工作区时出错:', error);
      return sessions;
    }
  }

  /**
   * 从单个SQLite数据库中提取聊天会话
   */
  private async extractSessionsFromDatabase(dbPath: string, workspaceId: string): Promise<ChatSession[]> {
    return new Promise((resolve, reject) => {
      const sessions: ChatSession[] = [];
             const db = new Database(dbPath, (err: Error | null) => {
         if (err) {
           console.error(`❌ 无法打开数据库 ${dbPath}:`, err);
           resolve(sessions);
           return;
         }

         // 查询聊天提示词历史
         db.get(
           "SELECT value FROM ItemTable WHERE key = 'aiService.prompts'",
           (err: Error | null, row: any) => {
             if (err) {
               console.error('❌ 查询提示词历史失败:', err);
               db.close();
               resolve(sessions);
               return;
             }

            if (row && row.value) {
              try {
                const prompts = JSON.parse(row.value);
                const session = this.convertPromptsToSession(prompts, workspaceId);
                if (session) {
                  sessions.push(session);
                  console.log(`✅ 从工作区 ${workspaceId} 提取了聊天会话: ${session.title}`);
                }
              } catch (parseError) {
                console.error('❌ 解析提示词数据失败:', parseError);
              }
            }

            db.close();
            resolve(sessions);
          }
        );
      });
    });
  }

  /**
   * 将提示词数组转换为聊天会话
   */
  private convertPromptsToSession(prompts: any[], workspaceId: string): ChatSession | null {
    if (!Array.isArray(prompts) || prompts.length === 0) {
      return null;
    }

    // 提取聊天消息
    const messages: ChatMessage[] = [];
    let sessionTitle = '';
    
    // 使用固定的基础时间戳，避免每次扫描时间都不同
    const baseTimestamp = 1700000000000; // 2023年11月15日的固定时间戳
    
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      if (prompt.text && prompt.text.trim()) {
        // 用户消息
        messages.push({
          role: 'user',
          content: prompt.text.trim(),
          timestamp: baseTimestamp + i * 60000 // 每条消息间隔1分钟
        });

        // 如果是第一条消息，用作标题
        if (i === 0) {
          sessionTitle = this.generateTitleFromText(prompt.text);
        }
      }
    }

    if (messages.length === 0) {
      return null;
    }

    // 生成摘要
    const summary = this.generateSummary(messages);
    
    // 生成基于内容的稳定ID
    const contentHash = this.generateContentHash(prompts);
    
    return {
      id: `sqlite-${workspaceId}-${contentHash}`,
      title: sessionTitle || 'Cursor聊天会话',
      messages,
      summary,
      tags: [],
      category: this.detectCategory(summary),
      lastActivity: messages[messages.length - 1]?.timestamp || Date.now(),
      importance: this.calculateImportance(messages, summary)
    };
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
      allSessions = await this.scanAllWorkspaces();
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