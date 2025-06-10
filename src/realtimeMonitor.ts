import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

interface MonitoredChange {
  filePath: string;
  timestamp: number;
  changeType: 'created' | 'modified' | 'deleted';
  content?: string;
}

interface PreInsertData {
  prompts: any[];
  generations: any[];
  timestamp: number;
  workspaceId: string;
}

export class RealtimeMonitor extends EventEmitter {
  private isMonitoring: boolean = false;
  private fsWatchProcess: ChildProcess | null = null;
  private cursorDir: string;
  private dataBuffer: Map<string, PreInsertData> = new Map();
  private lastScanTime: number = 0;

  constructor() {
    super();
    this.cursorDir = path.join(os.homedir(), 'Library/Application Support/Cursor');
  }

  /**
   * 🚀 启动实时监控
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('⚠️ 监控已在运行中');
      return;
    }

    // 检查必要工具
    if (!await this.checkDependencies()) {
      throw new Error('监控依赖检查失败');
    }

    console.log('🔄 启动Cursor实时监控...');
    
    this.isMonitoring = true;
    this.startFileWatcher();
    
    // 定期扫描变化
    this.startPeriodicScanning();
    
    console.log('✅ 实时监控已启动');
    this.emit('monitoring-started');
  }

  /**
   * ⏹️ 停止监控
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    console.log('🛑 停止实时监控...');
    this.isMonitoring = false;

    if (this.fsWatchProcess) {
      this.fsWatchProcess.kill();
      this.fsWatchProcess = null;
    }

    console.log('✅ 监控已停止');
    this.emit('monitoring-stopped');
  }

  /**
   * 检查依赖工具
   */
  private async checkDependencies(): Promise<boolean> {
    return new Promise((resolve) => {
      const fswatch = spawn('which', ['fswatch']);
      fswatch.on('close', (code) => {
        if (code !== 0) {
          console.error('❌ 需要安装 fswatch: brew install fswatch');
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  /**
   * 启动文件监控
   */
  private startFileWatcher(): void {
    console.log(`📂 监控目录: ${this.cursorDir}`);
    
    this.fsWatchProcess = spawn('fswatch', ['-r', this.cursorDir]);
    
    this.fsWatchProcess.stdout?.on('data', (data) => {
      const changedFile = data.toString().trim();
      this.handleFileChange(changedFile);
    });

    this.fsWatchProcess.stderr?.on('data', (data) => {
      console.error('监控错误:', data.toString());
    });

    this.fsWatchProcess.on('close', (code) => {
      if (this.isMonitoring) {
        console.log(`fswatch 进程退出，代码: ${code}`);
      }
    });
  }

  /**
   * 处理文件变化
   */
  private async handleFileChange(filePath: string): Promise<void> {
    if (!this.isMonitoring) return;

    const change: MonitoredChange = {
      filePath,
      timestamp: Date.now(),
      changeType: 'modified'
    };

    // 🎯 重点关注SQLite数据库
    if (filePath.includes('state.vscdb')) {
      console.log(`🔍 数据库变化: ${filePath}`);
      await this.analyzeDatabase(filePath);
      this.emit('database-changed', { filePath, timestamp: change.timestamp });
    }

    // 🎯 关注JSON配置文件
    if (filePath.endsWith('.json') || filePath.includes('workbench')) {
      console.log(`📄 配置文件变化: ${filePath}`);
      await this.analyzeJsonFile(filePath);
    }

    // 发出通用变化事件
    this.emit('file-changed', change);
  }

  /**
   * 🔍 分析数据库变化（落库前捕获）
   */
  private async analyzeDatabase(dbPath: string): Promise<void> {
    try {
      // 提取工作区ID
      const workspaceId = this.extractWorkspaceId(dbPath);
      if (!workspaceId) return;

      // 🎯 尝试捕获落库前的数据结构
      const preInsertData = await this.capturePreInsertData(dbPath, workspaceId);
      
      if (preInsertData) {
        console.log(`🎯 捕获到落库前数据: ${preInsertData.prompts.length} 提示词, ${preInsertData.generations.length} 生成内容`);
        
        // 存储到缓冲区
        this.dataBuffer.set(workspaceId, preInsertData);
        
        // 🔗 分析问答关联
        const correlations = this.analyzeQACorrelations(preInsertData);
        
        this.emit('qa-correlation-found', {
          workspaceId,
          correlations,
          confidence: this.calculateOverallConfidence(correlations)
        });
      }

    } catch (error) {
      console.error('❌ 分析数据库失败:', error);
    }
  }

  /**
   * 📄 分析JSON文件变化
   */
  private async analyzeJsonFile(filePath: string): Promise<void> {
    try {
      if (!fs.existsSync(filePath)) return;

      const content = fs.readFileSync(filePath, 'utf8');
      const change: MonitoredChange = {
        filePath,
        timestamp: Date.now(),
        changeType: 'modified',
        content
      };

      // 🔍 检查是否包含聊天相关数据
      if (this.containsChatData(content)) {
        console.log(`🎯 发现聊天相关JSON: ${path.basename(filePath)}`);
        
        try {
          const jsonData = JSON.parse(content);
          this.emit('chat-json-found', {
            filePath,
            data: jsonData,
            timestamp: change.timestamp
          });
        } catch (parseError) {
          console.log('JSON解析失败，可能是部分数据');
        }
      }

    } catch (error) {
      console.error('❌ 分析JSON文件失败:', error);
    }
  }

  /**
   * 🎯 捕获落库前数据（核心功能）
   */
  private async capturePreInsertData(dbPath: string, workspaceId: string): Promise<PreInsertData | null> {
    const Database = require('sqlite3').Database;
    
    return new Promise((resolve) => {
      const db = new Database(dbPath);
      
      // 并行查询
      const queries = [
        new Promise<any>((res) => {
          db.get("SELECT value FROM ItemTable WHERE key = 'aiService.prompts'", (err: any, row: any) => {
            res(err ? null : row);
          });
        }),
        new Promise<any>((res) => {
          db.get("SELECT value FROM ItemTable WHERE key = 'aiService.generations'", (err: any, row: any) => {
            res(err ? null : row);
          });
        })
      ];

      Promise.all(queries).then(([promptsRow, generationsRow]) => {
        let prompts: any[] = [];
        let generations: any[] = [];

        try {
          if (promptsRow?.value) {
            prompts = JSON.parse(promptsRow.value);
          }
          if (generationsRow?.value) {
            generations = JSON.parse(generationsRow.value);
          }

          // 🎯 只有在有新数据时才返回
          if (prompts.length > 0 || generations.length > 0) {
            resolve({
              prompts,
              generations,
              timestamp: Date.now(),
              workspaceId
            });
          } else {
            resolve(null);
          }

        } catch (parseError) {
          console.error('解析数据失败:', parseError);
          resolve(null);
        }

        db.close();
      });
    });
  }

  /**
   * 🔗 分析问答关联
   */
  private analyzeQACorrelations(data: PreInsertData): any[] {
    const correlations: any[] = [];
    const { prompts, generations } = data;

    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      if (!prompt.text?.trim()) continue;

      // 🎯 多重匹配策略
      const matchingGeneration = this.findBestMatch(prompt, generations, i);
      
      if (matchingGeneration) {
        const correlation = {
          promptIndex: i,
          generationIndex: generations.indexOf(matchingGeneration),
          question: prompt.text,
          answer: matchingGeneration.text,
          questionTime: prompt.unixMs || Date.now(),
          answerTime: matchingGeneration.unixMs,
          generationUUID: matchingGeneration.generationUUID,
          confidence: this.calculateCorrelationConfidence(prompt, matchingGeneration, i)
        };

        correlations.push(correlation);
        console.log(`🔗 关联 [${i}]: 置信度 ${(correlation.confidence * 100).toFixed(0)}%`);
      }
    }

    return correlations;
  }

  /**
   * 寻找最佳匹配
   */
  private findBestMatch(prompt: any, generations: any[], promptIndex: number): any | null {
    if (!generations.length) return null;

    // 策略1: 直接索引匹配
    if (promptIndex < generations.length) {
      const directMatch = generations[promptIndex];
      if (this.isValidGeneration(directMatch)) {
        return directMatch;
      }
    }

    // 策略2: 时间戳匹配
    if (prompt.unixMs) {
      const timeMatches = generations
        .filter(gen => gen.unixMs && Math.abs(gen.unixMs - prompt.unixMs) < 300000)
        .sort((a, b) => Math.abs(a.unixMs - prompt.unixMs) - Math.abs(b.unixMs - prompt.unixMs));
      
      if (timeMatches.length > 0 && this.isValidGeneration(timeMatches[0])) {
        return timeMatches[0];
      }
    }

    // 策略3: 内容相关性匹配
    const contentMatches = generations.filter(gen => 
      this.isValidGeneration(gen) && 
      this.hasContentRelevance(prompt.text, gen.text)
    );

    return contentMatches.length > 0 ? contentMatches[0] : null;
  }

  /**
   * 验证生成内容
   */
  private isValidGeneration(generation: any): boolean {
    return !!(
      generation &&
      generation.text &&
      generation.text.trim().length > 0 &&
      generation.generationUUID
    );
  }

  /**
   * 内容相关性检查
   */
  private hasContentRelevance(question: string, answer: string): boolean {
    if (!question || !answer) return false;
    
    const questionWords = question.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const answerLower = answer.toLowerCase();
    
    const matches = questionWords.filter(word => answerLower.includes(word));
    return matches.length / questionWords.length > 0.1;
  }

  /**
   * 计算关联置信度
   */
  private calculateCorrelationConfidence(prompt: any, generation: any, index: number): number {
    let confidence = 0.4; // 基础置信度

    // 时间戳匹配
    if (prompt.unixMs && generation.unixMs) {
      const timeDiff = Math.abs(generation.unixMs - prompt.unixMs);
      if (timeDiff < 30000) confidence += 0.4;
      else if (timeDiff < 120000) confidence += 0.3;
      else if (timeDiff < 300000) confidence += 0.2;
    }

    // UUID存在
    if (generation.generationUUID) {
      confidence += 0.2;
    }

    // 内容相关性
    if (this.hasContentRelevance(prompt.text, generation.text)) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * 计算总体置信度
   */
  private calculateOverallConfidence(correlations: any[]): number {
    if (correlations.length === 0) return 0;
    
    const avgConfidence = correlations.reduce((sum, c) => sum + c.confidence, 0) / correlations.length;
    return avgConfidence;
  }

  /**
   * 检查是否包含聊天数据
   */
  private containsChatData(content: string): boolean {
    const chatKeywords = [
      'prompt', 'generation', 'chat', 'message', 
      'aiService', 'conversation', 'response'
    ];
    
    const contentLower = content.toLowerCase();
    return chatKeywords.some(keyword => contentLower.includes(keyword));
  }

  /**
   * 提取工作区ID
   */
  private extractWorkspaceId(dbPath: string): string | null {
    const match = dbPath.match(/workspaceStorage\/([^\/]+)\//);
    return match ? match[1] : null;
  }

  /**
   * 定期扫描
   */
  private startPeriodicScanning(): void {
    const scanInterval = setInterval(() => {
      if (!this.isMonitoring) {
        clearInterval(scanInterval);
        return;
      }

      // 每30秒扫描一次缓冲区
      this.processBufferedData();
    }, 30000);
  }

  /**
   * 处理缓冲数据
   */
  private processBufferedData(): void {
    const now = Date.now();
    const staleTime = 5 * 60 * 1000; // 5分钟

    for (const [workspaceId, data] of this.dataBuffer.entries()) {
      if (now - data.timestamp > staleTime) {
        // 清理过期数据
        this.dataBuffer.delete(workspaceId);
        console.log(`🧹 清理过期数据: ${workspaceId}`);
      }
    }
  }

  /**
   * 获取缓冲数据
   */
  getBufferedData(workspaceId?: string): PreInsertData | Map<string, PreInsertData> | null {
    if (workspaceId) {
      return this.dataBuffer.get(workspaceId) || null;
    }
    return this.dataBuffer;
  }

  /**
   * 获取监控状态
   */
  getMonitoringStatus(): { isMonitoring: boolean; bufferedCount: number; uptime: number } {
    return {
      isMonitoring: this.isMonitoring,
      bufferedCount: this.dataBuffer.size,
      uptime: this.lastScanTime > 0 ? Date.now() - this.lastScanTime : 0
    };
  }
} 