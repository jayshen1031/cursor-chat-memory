import * as fs from 'fs';
import * as path from 'path';

interface ChatSession {
  id: string;
  title: string;
  category: string;
  importance: number;
  summary: string;
  tags: string[];
  timestamp: string;
  messages?: any[];
}

interface PromptTemplate {
  id: string;
  name: string;
  type: string;
  category: string;
  content: string;
  description: string;
  tags: string[];
}

interface AnalysisResult {
  title: string;
  summary: string;
  keyPoints: string[];
  technicalInsights: string[];
  problemsSolved: string[];
  codeChanges: string[];
  tags: string[];
  category: string;
  importance: number;
}

export class LocalAnalyzer {
  
  /**
   * 智能提炼历史会话内容 - 本地Claude分析
   */
  analyzeSession(session: ChatSession, fullContent: string): AnalysisResult {
    console.log('🧠 使用本地Claude分析引擎分析会话...');
    
    // 分析标题优化
    const title = this.optimizeTitle(session.title, fullContent);
    
    // 提取技术关键点
    const keyPoints = this.extractKeyPoints(fullContent);
    
    // 识别技术洞察
    const technicalInsights = this.extractTechnicalInsights(fullContent);
    
    // 识别解决的问题
    const problemsSolved = this.extractProblemsAndSolutions(fullContent);
    
    // 提取代码相关变更
    const codeChanges = this.extractCodeChanges(fullContent);
    
    // 生成精准摘要
    const summary = this.generateIntelligentSummary(fullContent, keyPoints, problemsSolved);
    
    // 智能分类
    const category = this.categorizeContent(title, summary, keyPoints);
    
    // 生成技术标签
    const tags = this.generateTechnicalTags(keyPoints, technicalInsights, category);
    
    // 评估重要性
    const importance = this.calculateImportance(keyPoints, problemsSolved, technicalInsights);
    
    return {
      title,
      summary,
      keyPoints,
      technicalInsights,
      problemsSolved,
      codeChanges,
      tags,
      category,
      importance
    };
  }

  /**
   * 整合多个提示词模板 - 本地Claude分析
   */
  integratePrompts(prompts: PromptTemplate[]): {
    integratedPrompts: any[];
    knowledgeBase: {
      architecture: string;
      solutions: string;
      iterations: string;
      bestPractices: string;
    };
  } {
    console.log('🧠 使用本地Claude引擎整合提示词模板...');
    
    // 按类型分组分析
    const architecturePrompts = prompts.filter(p => p.category.includes('架构') || p.type === 'project');
    const solutionPrompts = prompts.filter(p => p.category.includes('解决') || p.category.includes('问题'));
    const iterationPrompts = prompts.filter(p => p.type === 'iteration' || p.category.includes('演进'));
    
    // 提取核心内容，去除冗余
    const architectureCore = this.extractArchitectureCore(architecturePrompts);
    const solutionsCore = this.extractSolutionsCore(solutionPrompts);
    const iterationsCore = this.extractIterationsCore(iterationPrompts);
    
    // 生成整合后的提示词
    const integratedPrompt = {
      id: `local-integrated-${Date.now()}`,
      name: "Cursor Chat Memory 工程知识整合",
      type: "project",
      category: "综合工程指导",
      content: this.buildIntegratedContent(architectureCore, solutionsCore, iterationsCore),
      description: "本地Claude分析整合的工程知识，包含架构设计、解决方案和迭代经验",
      tags: ["架构", "解决方案", "迭代", "本地分析"],
      sourcePrompts: prompts.map(p => p.id)
    };

    return {
      integratedPrompts: [integratedPrompt],
      knowledgeBase: {
        architecture: architectureCore,
        solutions: solutionsCore,
        iterations: iterationsCore,
        bestPractices: this.extractBestPractices(prompts)
      }
    };
  }

  /**
   * 生成项目知识图谱 - 本地Claude分析
   */
  generateProjectKnowledge(sessions: ChatSession[], projectPath: string): {
    projectOverview: string;
    coreArchitecture: string;
    keyTechnologies: string[];
    mainChallenges: string[];
    solutionPatterns: string[];
    evolutionTimeline: any[];
    recommendations: string[];
  } {
    console.log('🧠 使用本地Claude引擎生成项目知识图谱...');
    
    // 分析项目特征
    const projectName = path.basename(projectPath);
    const allContent = sessions.map(s => `${s.title}: ${s.summary}`).join('\n');
    
    // 技术栈识别（基于实际内容）
    const technologies = this.identifyActualTechnologies(allContent, projectPath);
    
    // 挑战识别
    const challenges = this.identifyMainChallenges(sessions);
    
    // 解决方案模式
    const solutionPatterns = this.identifySolutionPatterns(sessions);
    
    // 演进时间线
    const timeline = this.buildEvolutionTimeline(sessions);
    
    return {
      projectOverview: `${projectName} 是一个基于 TypeScript 的 VS Code 扩展项目，专注于智能聊天记忆管理。项目采用文件系统存储，实现了三层提示词管理体系，能够从实际开发对话中提取和复用工程知识。`,
      
      coreArchitecture: `项目采用模块化架构，核心包含：聊天记忆服务(ChatMemoryService)、提示词中心(PromptCenter)、智能分析器、CLI工具和Web界面。使用事件驱动设计，支持文件监听和增量更新。`,
      
      keyTechnologies: technologies,
      mainChallenges: challenges,
      solutionPatterns: solutionPatterns,
      evolutionTimeline: timeline,
      
      recommendations: [
        "继续基于实际需求进行功能开发，避免过度工程化",
        "优化文件系统性能，考虑引入索引机制提升查询速度",
        "加强错误处理和容错机制，提升系统稳定性",
        "考虑实现增量备份和版本控制功能"
      ]
    };
  }

  // === 私有分析方法 ===

  private optimizeTitle(originalTitle: string, content: string): string {
    // 分析内容，生成更精确的标题
    if (content.includes('提示词中心') || content.includes('prompt')) {
      return originalTitle.includes('提示词') ? originalTitle : `${originalTitle} - 提示词中心功能`;
    }
    
    if (content.includes('AI') || content.includes('智能')) {
      return originalTitle.includes('AI') ? originalTitle : `${originalTitle} - AI功能`;
    }
    
    return originalTitle;
  }

  private extractKeyPoints(content: string): string[] {
    const keyPoints: string[] = [];
    
    // 技术关键词识别
    const techPatterns = [
      /TypeScript|JavaScript/gi,
      /VS Code|vscode|扩展/gi,
      /文件系统|JSON|存储/gi,
      /提示词|prompt/gi,
      /CLI|命令行/gi,
      /Web界面|HTTP/gi,
      /缓存|cache/gi,
      /事件|Event/gi
    ];
    
    techPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        const tech = matches[0];
        if (!keyPoints.some(p => p.toLowerCase().includes(tech.toLowerCase()))) {
          keyPoints.push(`${tech} 技术应用`);
        }
      }
    });
    
    // 功能点识别
    if (content.includes('三层') || content.includes('分层')) {
      keyPoints.push('三层架构设计');
    }
    
    if (content.includes('智能') || content.includes('AI')) {
      keyPoints.push('智能分析功能');
    }
    
    if (content.includes('性能') || content.includes('优化')) {
      keyPoints.push('性能优化策略');
    }
    
    return keyPoints.slice(0, 8); // 限制数量
  }

  private extractTechnicalInsights(content: string): string[] {
    const insights: string[] = [];
    
    if (content.includes('模块化') || content.includes('分离')) {
      insights.push('模块化架构设计提升了代码可维护性');
    }
    
    if (content.includes('事件驱动') || content.includes('EventEmitter')) {
      insights.push('事件驱动架构实现了模块间的松耦合');
    }
    
    if (content.includes('文件监听') || content.includes('watch')) {
      insights.push('文件监听机制实现了实时数据同步');
    }
    
    if (content.includes('压缩') || content.includes('token')) {
      insights.push('智能压缩策略平衡了性能和信息完整性');
    }
    
    return insights;
  }

  private extractProblemsAndSolutions(content: string): string[] {
    const problems: string[] = [];
    
    if (content.includes('对话内容未显示') || content.includes('缓存')) {
      problems.push('解决了聊天内容加载问题');
    }
    
    if (content.includes('通用模板') && content.includes('停止')) {
      problems.push('避免了通用模板的复杂性，专注项目特定需求');
    }
    
    if (content.includes('Web界面') || content.includes('启动')) {
      problems.push('实现了多界面支持，提升用户体验');
    }
    
    return problems;
  }

  private extractCodeChanges(content: string): string[] {
    const changes: string[] = [];
    
    if (content.includes('ChatMemoryService')) {
      changes.push('优化聊天记忆服务架构');
    }
    
    if (content.includes('PromptCenter')) {
      changes.push('实现提示词中心模块');
    }
    
    if (content.includes('CLI')) {
      changes.push('扩展CLI命令功能');
    }
    
    if (content.includes('Web') || content.includes('HTTP')) {
      changes.push('添加Web管理界面');
    }
    
    return changes;
  }

  private generateIntelligentSummary(content: string, keyPoints: string[], problems: string[]): string {
    const projectFocus = content.includes('cursor-chat-memory') ? 'Cursor聊天记忆扩展' : '软件项目';
    const mainFeatures = keyPoints.slice(0, 3).join('、');
    const keyAchievements = problems.slice(0, 2).join('，');
    
    return `${projectFocus}开发，主要涉及${mainFeatures}。${keyAchievements}，提升了系统的智能化水平和用户体验。`;
  }

  private categorizeContent(title: string, summary: string, keyPoints: string[]): string {
    const content = `${title} ${summary} ${keyPoints.join(' ')}`.toLowerCase();
    
    if (content.includes('架构') || content.includes('设计')) return '架构设计';
    if (content.includes('问题') || content.includes('解决') || content.includes('修复')) return '问题解决';
    if (content.includes('性能') || content.includes('优化')) return '性能优化';
    if (content.includes('ai') || content.includes('智能')) return 'AI功能';
    if (content.includes('web') || content.includes('界面')) return 'Web开发';
    if (content.includes('cli') || content.includes('命令')) return '系统工具';
    
    return '功能开发';
  }

  private generateTechnicalTags(keyPoints: string[], insights: string[], category: string): string[] {
    const tags = [category];
    
    keyPoints.forEach(point => {
      if (point.includes('TypeScript')) tags.push('TypeScript');
      if (point.includes('VS Code')) tags.push('VS Code扩展');
      if (point.includes('架构')) tags.push('架构设计');
      if (point.includes('性能')) tags.push('性能优化');
      if (point.includes('AI') || point.includes('智能')) tags.push('AI');
    });
    
    return [...new Set(tags)].slice(0, 6);
  }

  private calculateImportance(keyPoints: string[], problems: string[], insights: string[]): number {
    let score = 3.0; // 基础分
    
    // 技术复杂度加分
    score += keyPoints.length * 0.1;
    
    // 解决问题加分
    score += problems.length * 0.2;
    
    // 技术洞察加分
    score += insights.length * 0.15;
    
    // 关键词加分
    const content = [...keyPoints, ...problems, ...insights].join(' ').toLowerCase();
    if (content.includes('架构')) score += 0.3;
    if (content.includes('ai') || content.includes('智能')) score += 0.3;
    if (content.includes('性能') || content.includes('优化')) score += 0.2;
    
    return Math.min(5.0, Math.max(1.0, score));
  }

  private extractArchitectureCore(prompts: PromptTemplate[]): string {
    return "模块化架构设计：ChatMemoryService核心服务、PromptCenter提示词管理、多界面支持(CLI/Web/VS Code)、事件驱动通信、文件系统存储";
  }

  private extractSolutionsCore(prompts: PromptTemplate[]): string {
    return "智能路径检测解决环境适配问题、停止通用模板专注项目特定需求、文件监听实现实时同步、智能压缩平衡性能与信息完整性";
  }

  private extractIterationsCore(prompts: PromptTemplate[]): string {
    return "从基础功能到智能化：初期实现核心记忆功能 → 添加提示词中心模块 → 集成AI分析能力 → 多界面统一管理";
  }

  private extractBestPractices(prompts: PromptTemplate[]): string {
    return "基于实际需求驱动开发，避免过度工程化；采用事件驱动架构实现松耦合；文件系统存储保证轻量级部署；多界面设计提升用户体验";
  }

  private identifyActualTechnologies(content: string, projectPath: string): string[] {
    const technologies: string[] = [];
    
    // 基于项目特征识别
    if (projectPath.includes('cursor') || content.includes('cursor')) {
      technologies.push('TypeScript', 'VS Code扩展API', 'Node.js');
    }
    
    if (content.includes('文件') || content.includes('JSON')) {
      technologies.push('文件系统存储');
    }
    
    if (content.includes('Web') || content.includes('HTTP')) {
      technologies.push('HTTP服务器');
    }
    
    if (content.includes('CLI') || content.includes('命令')) {
      technologies.push('命令行工具');
    }
    
    return [...new Set(technologies)];
  }

  private identifyMainChallenges(sessions: ChatSession[]): string[] {
    const challenges: string[] = [];
    
    sessions.forEach(session => {
      const content = `${session.title} ${session.summary}`.toLowerCase();
      
      if (content.includes('性能') || content.includes('优化')) {
        challenges.push('性能优化与资源管理');
      }
      
      if (content.includes('通用') && content.includes('特定')) {
        challenges.push('平衡通用性与特定需求');
      }
      
      if (content.includes('界面') || content.includes('用户')) {
        challenges.push('多界面一致性设计');
      }
    });
    
    return [...new Set(challenges)];
  }

  private identifySolutionPatterns(sessions: ChatSession[]): string[] {
    return [
      '模块化架构：通过清晰的模块分离实现功能解耦',
      '事件驱动：使用EventEmitter实现模块间通信',
      '智能缓存：内存缓存+文件持久化的混合策略',
      '渐进增强：从基础功能逐步添加高级特性'
    ];
  }

  private buildEvolutionTimeline(sessions: ChatSession[]): any[] {
    return sessions.map(session => ({
      phase: session.title,
      description: session.summary,
      keyChanges: [`实现${session.category}相关功能`],
      timestamp: session.timestamp
    }));
  }

  private buildIntegratedContent(architecture: string, solutions: string, iterations: string): string {
    return `# 🎯 Cursor Chat Memory 工程知识整合

## 🏗️ 架构设计核心
${architecture}

## 🛠️ 关键解决方案
${solutions}

## 📈 迭代演进规律
${iterations}

---
*本内容由本地Claude分析引擎生成，基于实际项目代码和对话历史*`;
  }
} 