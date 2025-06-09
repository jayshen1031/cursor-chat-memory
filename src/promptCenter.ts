import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { EventEmitter } from 'events';
import { AISummarizer } from './aiSummarizer';
import { LocalAnalyzer } from './localAnalyzer';

// 提示词类型定义
export interface PromptTemplate {
  id: string;
  name: string;
  type: 'global' | 'project' | 'iteration';
  category: string;
  content: string;
  description: string;
  tags: string[];
  version: string;
  createdAt: number;
  updatedAt: number;
  usage: number;  // 使用次数
  rating: number; // 效果评分 0-5
  metadata?: {
    projectPath?: string;
    relatedSessions?: string[];
    codeFiles?: string[];
    dependencies?: string[];
  };
  sourceSession?: string;
  aiEnhanced?: boolean;
}

// 迭代记录
export interface IterationRecord {
  id: string;
  phase: string;
  timestamp: number;
  description: string;
  keyChanges: string[];
  codeEvolution: {
    before: string;
    after: string;
    files: string[];
  };
  lessonsLearned: string[];
  nextSteps: string[];
}

// 提示词中心配置
interface PromptCenterConfig {
  maxGlobalPrompts: number;
  maxProjectPrompts: number;
  autoBackup: boolean;
  syncWithGit: boolean;
  compressionEnabled: boolean;
}

export class PromptCenter extends EventEmitter {
  private promptsDir: string;
  private iterationsDir: string;
  private currentProject?: string;
  private config: PromptCenterConfig;
  private templates: Map<string, PromptTemplate> = new Map();
  private iterations: Map<string, IterationRecord> = new Map();
  private aiSummarizer?: AISummarizer;
  private localAnalyzer: LocalAnalyzer;

  // 全局工程提示词模板
  private readonly globalPromptTemplates = [
    {
      id: 'software-architecture',
      name: '软件架构设计原则',
      category: '架构设计',
      content: `## 🏗️ 软件架构核心原则

### 📋 SOLID原则实践
- **单一职责** (SRP): 每个模块只负责一个功能领域
- **开闭原则** (OCP): 对扩展开放，对修改封闭
- **里氏替换** (LSP): 子类能够替换父类使用
- **接口隔离** (ISP): 细粒度接口，避免冗余依赖
- **依赖倒置** (DIP): 依赖抽象而非具体实现

### 🎯 架构模式选择
- **分层架构**: 表示层 → 业务层 → 数据层
- **微服务架构**: 服务拆分、独立部署、故障隔离
- **事件驱动**: 异步处理、松耦合、高并发
- **领域驱动设计** (DDD): 聚合根、值对象、领域服务

### ⚡ 性能与可靠性
- **缓存策略**: 多层缓存、缓存雪崩防护
- **限流熔断**: 服务保护、优雅降级
- **监控告警**: 全链路追踪、实时监控
- **容灾备份**: 数据备份、故障恢复`,
      description: '软件工程核心架构设计原则和最佳实践'
    },
    {
      id: 'code-quality',
      name: '代码质量管控体系',
      category: '代码质量',
      content: `## 📊 代码质量管控体系

### 🔍 静态代码分析
- **ESLint/TSLint**: 语法规范、潜在错误检测
- **SonarQube**: 代码复杂度、安全漏洞分析
- **TypeScript**: 类型安全、编译时错误检查
- **代码覆盖率**: 单元测试覆盖率 > 80%

### 🧪 测试策略金字塔
- **单元测试** (70%): 函数级别、快速反馈
- **集成测试** (20%): 模块间交互验证
- **端到端测试** (10%): 用户场景完整验证

### 📏 代码审查最佳实践
- **提交粒度**: 小而频繁的提交
- **审查清单**: 功能正确性、性能影响、安全风险
- **文档同步**: 代码变更必须更新相关文档
- **重构时机**: 技术债务及时清理`,
      description: '确保代码质量的完整管控体系'
    }
  ];

  constructor(projectPath?: string, config?: Partial<PromptCenterConfig>) {
    super();
    
    this.currentProject = projectPath;
    this.config = {
      maxGlobalPrompts: 50,
      maxProjectPrompts: 30,
      autoBackup: true,
      syncWithGit: false,
      compressionEnabled: true,
      ...config
    };

    // 设置存储路径
    if (projectPath) {
      const projectName = path.basename(projectPath);
      this.promptsDir = path.join(projectPath, '.cursor-memory', 'prompts');
      this.iterationsDir = path.join(projectPath, '.cursor-memory', 'iterations');
    } else {
      this.promptsDir = path.join(os.homedir(), '.cursor-memory', 'global-prompts');
      this.iterationsDir = path.join(os.homedir(), '.cursor-memory', 'global-iterations');
    }

    this.initializeDirectories();
    this.loadPrompts();
    this.loadIterations();
    // 🚫 移除内置模板创建，只从真实对话中提取
    console.log('📋 提示词中心已初始化 - 专注于从项目对话中提取实际内容');

    // Initialize analyzers
    this.localAnalyzer = new LocalAnalyzer();
    console.log('🧠 本地Claude分析器已初始化');
    
    try {
      this.aiSummarizer = new AISummarizer();
      console.log('🤖 Azure OpenAI分析器已初始化');
    } catch (error) {
      console.warn('⚠️ Azure OpenAI分析器初始化失败，将使用本地Claude分析器:', error);
    }
  }

  /**
   * 初始化目录结构
   */
  private initializeDirectories(): void {
    [this.promptsDir, this.iterationsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * 初始化全局提示词模板
   */
  private initializeGlobalPrompts(): void {
    this.globalPromptTemplates.forEach(template => {
      const prompt: PromptTemplate = {
        ...template,
        type: 'global',
        tags: template.category.split(' '),
        version: '1.0.0',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usage: 0,
        rating: 5.0
      };
      
      if (!this.templates.has(template.id)) {
        this.templates.set(template.id, prompt);
      }
    });
    
    this.savePrompts();
  }

  /**
   * 创建新的提示词模板
   */
  public createPrompt(data: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usage' | 'rating'>): string {
    const id = this.generateId(data.name);
    const prompt: PromptTemplate = {
      ...data,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usage: 0,
      rating: 0
    };

    this.templates.set(id, prompt);
    this.savePrompts();
    this.emit('promptCreated', prompt);
    
    console.log(`✅ 创建提示词模板: ${prompt.name} (${prompt.type})`);
    return id;
  }

  /**
   * 更新提示词模板
   */
  public updatePrompt(id: string, updates: Partial<PromptTemplate>): boolean {
    const existing = this.templates.get(id);
    if (!existing) return false;

    const updated: PromptTemplate = {
      ...existing,
      ...updates,
      id: existing.id, // 保持ID不变
      createdAt: existing.createdAt, // 保持创建时间不变
      updatedAt: Date.now()
    };

    this.templates.set(id, updated);
    this.savePrompts();
    this.emit('promptUpdated', updated);
    
    console.log(`📝 更新提示词模板: ${updated.name}`);
    return true;
  }

  /**
   * 删除提示词模板
   */
  public deletePrompt(id: string): boolean {
    const prompt = this.templates.get(id);
    if (!prompt) return false;

    this.templates.delete(id);
    this.savePrompts();
    this.emit('promptDeleted', { id, name: prompt.name });
    
    console.log(`🗑️  删除提示词模板: ${prompt.name}`);
    return true;
  }

  /**
   * 获取提示词模板
   */
  public getPrompt(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * 获取所有提示词模板
   */
  public getAllPrompts(type?: PromptTemplate['type']): PromptTemplate[] {
    const prompts = Array.from(this.templates.values());
    
    if (type) {
      return prompts.filter(p => p.type === type);
    }
    
    return prompts.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * 搜索提示词模板
   */
  public searchPrompts(query: string, category?: string): PromptTemplate[] {
    const keywords = query.toLowerCase().split(/\s+/);
    
    return Array.from(this.templates.values()).filter(prompt => {
      const searchText = `${prompt.name} ${prompt.description} ${prompt.content} ${prompt.tags.join(' ')}`.toLowerCase();
      const matchesQuery = keywords.every(keyword => searchText.includes(keyword));
      const matchesCategory = !category || prompt.category === category;
      
      return matchesQuery && matchesCategory;
    }).sort((a, b) => b.rating - a.rating || b.usage - a.usage);
  }

  /**
   * 记录项目迭代
   */
  public recordIteration(data: Omit<IterationRecord, 'id' | 'timestamp'>): string {
    const id = this.generateId(`iteration-${data.phase}`);
    const iteration: IterationRecord = {
      ...data,
      id,
      timestamp: Date.now()
    };

    this.iterations.set(id, iteration);
    this.saveIterations();
    
    // 自动生成迭代提示词
    this.generateIterationPrompt(iteration);
    
    console.log(`📈 记录项目迭代: ${iteration.phase}`);
    return id;
  }

  /**
   * 自动生成基于迭代的提示词
   */
  private generateIterationPrompt(iteration: IterationRecord): void {
    const promptContent = `## 🔄 项目迭代经验: ${iteration.phase}

### 📋 核心变更
${iteration.keyChanges.map(change => `- ${change}`).join('\n')}

### 💡 经验总结
${iteration.lessonsLearned.map(lesson => `- ${lesson}`).join('\n')}

### 🎯 后续规划
${iteration.nextSteps.map(step => `- ${step}`).join('\n')}

### 📊 代码演进
**变更前**:
\`\`\`
${iteration.codeEvolution.before}
\`\`\`

**变更后**:
\`\`\`
${iteration.codeEvolution.after}
\`\`\`

**影响文件**: ${iteration.codeEvolution.files.join(', ')}`;

    this.createPrompt({
      name: `${iteration.phase} - 迭代经验`,
      type: 'iteration',
      category: '项目迭代',
      content: promptContent,
      description: `${iteration.phase}阶段的核心迭代经验和代码演进记录`,
      tags: ['迭代', '经验', iteration.phase.toLowerCase()],
      version: '1.0.0',
      metadata: {
        projectPath: this.currentProject,
        codeFiles: iteration.codeEvolution.files
      }
    });
  }

  /**
   * 生成智能引用内容（增强版 - 包含精确来源标识）
   */
  public generateReference(templateIds: string[], context?: string): string {
    const selectedPrompts = templateIds
      .map(id => this.templates.get(id))
      .filter(prompt => prompt !== undefined) as PromptTemplate[];

    if (selectedPrompts.length === 0) {
      return '📭 没有找到相关的提示词模板';
    }

    // 🆕 添加项目和来源标识
    const projectInfo = this.getProjectInfo();
    const sourceTag = projectInfo.isProject ? `📁 项目: ${projectInfo.name}` : '🌐 全局知识库';
    
    let reference = `🧠 **提示词引用** (${selectedPrompts.length}个模板) | ${sourceTag}\n`;
    reference += `📍 来源: ${this.promptsDir}\n\n`;
    
    // 按类型分组
    const groupedPrompts = this.groupPromptsByType(selectedPrompts);
    
    for (const [type, prompts] of groupedPrompts) {
      const typeNames: { [key: string]: string } = {
        'global': '🌐 全局工程知识',
        'project': '📁 项目特定经验', 
        'iteration': '🔄 迭代演进记录'
      };
      
      reference += `### ${typeNames[type] || type}\n\n`;
      
      prompts.forEach((prompt, index) => {
        reference += this.formatSinglePromptReference(prompt, index + 1, type);
        
        // 更新使用次数
        this.updatePromptUsage(prompt.id);
      });
    }
    
    // 添加详细的上下文信息和来源标识
    const totalTokens = this.estimateTokens(reference);
    reference += `---\n`;
    reference += `📊 引用统计: ~${totalTokens} tokens | ${selectedPrompts.length}个模板\n`;
    reference += `🕒 生成时间: ${new Date().toLocaleString()}\n`;
    reference += `🔖 引用标识: [${sourceTag}] 提示词引用\n`;
    if (context) {
      reference += `🎯 应用场景: ${context}\n`;
    }
    reference += `\n`;
    
    return reference;
  }

  /**
   * 🆕 格式化单个提示词的引用内容，包含精确来源标识
   */
  private formatSinglePromptReference(prompt: PromptTemplate, index: number, type: string): string {
    const sourceIcon = type === 'global' ? '🌐' : type === 'project' ? '📁' : '🔄';
    const sourceLabel = type.toUpperCase();
    
    let content = `**${index}. ${prompt.name}** [${prompt.category}] ${sourceIcon} ${sourceLabel}\n`;
    content += `🆔 ID: ${prompt.id} | 📈 使用次数: ${prompt.usage || 0}\n`;
    
    if (prompt.tags && prompt.tags.length > 0) {
      content += `🏷️  标签: ${prompt.tags.map(tag => `#${tag}`).join(' ')}\n`;
    }
    
    content += `📝 描述: ${prompt.description}\n`;
    content += `🕐 更新时间: ${new Date(prompt.updatedAt || prompt.createdAt).toLocaleString()}\n\n`;
    content += `${prompt.content}\n\n`;
    content += `---\n\n`;
    
    return content;
  }

  /**
   * 🆕 获取当前项目信息
   */
  private getProjectInfo(): { isProject: boolean; name: string; path?: string } {
    if (this.currentProject) {
      return {
        isProject: true,
        name: path.basename(this.currentProject),
        path: this.currentProject
      };
    }
    return {
      isProject: false,
      name: '全局知识库'
    };
  }

  /**
   * 获取推荐的提示词模板
   */
  public getRecommendedPrompts(context: string, maxPrompts: number = 3): PromptTemplate[] {
    const keywords = context.toLowerCase().split(/\s+/);
    
    const scoredPrompts = Array.from(this.templates.values()).map(prompt => {
      let score = 0;
      
      // 关键词匹配
      const promptText = `${prompt.name} ${prompt.description} ${prompt.content}`.toLowerCase();
      const matchingKeywords = keywords.filter(kw => promptText.includes(kw));
      score += matchingKeywords.length * 0.4;
      
      // 使用频率权重
      score += Math.log(prompt.usage + 1) * 0.2;
      
      // 评分权重
      score += prompt.rating * 0.3;
      
      // 时间权重（最近更新的优先）
      const daysSinceUpdate = (Date.now() - prompt.updatedAt) / (1000 * 60 * 60 * 24);
      score += Math.exp(-daysSinceUpdate / 30) * 0.1;
      
      return { prompt, score };
    });
    
    return scoredPrompts
      .filter(item => item.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxPrompts)
      .map(item => item.prompt);
  }

  /**
   * 按类型分组提示词
   */
  private groupPromptsByType(prompts: PromptTemplate[]): Map<string, PromptTemplate[]> {
    const groups = new Map<string, PromptTemplate[]>();
    
    prompts.forEach(prompt => {
      if (!groups.has(prompt.type)) {
        groups.set(prompt.type, []);
      }
      groups.get(prompt.type)!.push(prompt);
    });
    
    return groups;
  }

  /**
   * 更新提示词使用次数
   */
  private updatePromptUsage(id: string): void {
    const prompt = this.templates.get(id);
    if (prompt) {
      prompt.usage += 1;
      this.templates.set(id, prompt);
      this.savePrompts();
    }
  }

  /**
   * 估算token数量
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * 生成唯一ID
   */
  private generateId(name: string): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    const nameHash = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
    return `${nameHash}-${timestamp}-${randomStr}`;
  }

  /**
   * 保存提示词到文件
   */
  private savePrompts(): void {
    try {
      const promptsFile = path.join(this.promptsDir, 'templates.json');
      const data = {
        prompts: Object.fromEntries(this.templates),
        metadata: {
          totalCount: this.templates.size,
          lastUpdated: Date.now(),
          projectPath: this.currentProject
        }
      };
      fs.writeFileSync(promptsFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ 保存提示词失败:', error);
    }
  }

  /**
   * 从文件加载提示词
   */
  private loadPrompts(): void {
    try {
      const promptsFile = path.join(this.promptsDir, 'templates.json');
      if (fs.existsSync(promptsFile)) {
        const data = JSON.parse(fs.readFileSync(promptsFile, 'utf8'));
        if (data.prompts) {
          const allPrompts = Object.entries(data.prompts);
          
          // 只加载project和iteration类型的提示词，过滤掉global模板
          const filteredPrompts = allPrompts.filter(([id, prompt]: [string, any]) => 
            prompt.type === 'project' || prompt.type === 'iteration'
          ) as [string, PromptTemplate][];
          
          this.templates = new Map(filteredPrompts);
          console.log(`📂 加载了 ${this.templates.size} 个项目相关提示词模板 (已过滤 ${allPrompts.length - filteredPrompts.length} 个通用模板)`);
        }
      }
    } catch (error) {
      console.error('❌ 加载提示词失败:', error);
    }
  }

  /**
   * 保存迭代记录
   */
  private saveIterations(): void {
    try {
      const iterationsFile = path.join(this.iterationsDir, 'records.json');
      const data = {
        iterations: Object.fromEntries(this.iterations),
        metadata: {
          totalCount: this.iterations.size,
          lastUpdated: Date.now(),
          projectPath: this.currentProject
        }
      };
      fs.writeFileSync(iterationsFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('❌ 保存迭代记录失败:', error);
    }
  }

  /**
   * 从文件加载迭代记录
   */
  private loadIterations(): void {
    try {
      const iterationsFile = path.join(this.iterationsDir, 'records.json');
      if (fs.existsSync(iterationsFile)) {
        const data = JSON.parse(fs.readFileSync(iterationsFile, 'utf8'));
        if (data.iterations) {
          this.iterations = new Map(Object.entries(data.iterations));
          console.log(`📂 加载了 ${this.iterations.size} 个迭代记录`);
        }
      }
    } catch (error) {
      console.error('❌ 加载迭代记录失败:', error);
    }
  }

  /**
   * 获取统计信息
   */
  public getStatistics() {
    const prompts = Array.from(this.templates.values());
    const iterations = Array.from(this.iterations.values());
    
    return {
      prompts: {
        total: prompts.length,
        byType: {
          global: prompts.filter(p => p.type === 'global').length,
          project: prompts.filter(p => p.type === 'project').length,
          iteration: prompts.filter(p => p.type === 'iteration').length
        },
        topUsed: prompts.sort((a, b) => b.usage - a.usage).slice(0, 5),
        topRated: prompts.sort((a, b) => b.rating - a.rating).slice(0, 5)
      },
      iterations: {
        total: iterations.length,
        phases: [...new Set(iterations.map(i => i.phase))],
        recentPhase: iterations.sort((a, b) => b.timestamp - a.timestamp)[0]?.phase
      }
    };
  }

  private createBuiltinTemplates(): void {
    // 🏗️ 项目工程理解模板
    this.createPrompt({
      name: '项目架构深度分析',
      type: 'project',
      category: '项目架构',
      content: `## 🏗️ 项目架构深度分析框架

### 📋 技术栈分析
- **前端技术栈**: React/Vue/Angular版本、状态管理方案、路由设计
- **后端架构**: 框架选择、数据库设计、API架构模式
- **基础设施**: 部署方式、CI/CD流程、监控告警体系
- **依赖关系**: 核心依赖分析、版本兼容性、安全漏洞评估

### 🎯 代码结构理解
- **目录组织**: 模块划分逻辑、分层架构实现
- **组件设计**: 组件复用性、Props接口设计、状态管理
- **数据流向**: 数据获取、状态更新、副作用处理
- **错误处理**: 异常捕获机制、用户友好的错误提示

### 🔍 业务逻辑挖掘
- **核心功能**: 主要业务流程、关键算法实现
- **用户交互**: 交互设计模式、用户体验优化点
- **数据模型**: 实体关系、数据验证规则
- **权限控制**: 认证授权机制、角色权限设计

### ⚡ 性能与可维护性
- **性能瓶颈**: 渲染性能、网络请求、内存使用
- **代码质量**: 代码复杂度、测试覆盖率、文档完整性
- **技术债务**: 代码异味、过时依赖、架构缺陷
- **扩展性**: 功能扩展、团队协作、长期维护

### 🚀 优化建议
基于以上分析，提供具体的改进方案和实施路径。`,
      description: '深度分析项目的技术架构、业务逻辑和优化方向',
      tags: ['项目分析', '架构设计', '代码审查'],
      version: '1.0.0'
    });

    // 🔄 项目迭代记录模板
    this.createPrompt({
      name: '项目迭代学习记录',
      type: 'iteration',
      category: '迭代总结',
      content: `## 🔄 项目迭代学习记录

### 📊 本次迭代概览
- **迭代版本**: v{{version}}
- **时间周期**: {{startDate}} - {{endDate}}
- **团队成员**: {{teamMembers}}
- **主要目标**: {{objectives}}

### 🎯 功能交付
#### ✅ 已完成功能
{{completedFeatures}}

#### 🔧 代码变更分析
- **新增文件**: {{newFiles}}
- **修改文件**: {{modifiedFiles}}
- **删除内容**: {{removedCode}}
- **重构模块**: {{refactoredModules}}

#### 🏗️ 架构演进
- **架构调整**: {{architectureChanges}}
- **技术选型**: {{technologyDecisions}}
- **设计模式**: {{designPatterns}}
- **性能优化**: {{performanceImprovements}}

### 💡 技术洞察
#### 🔍 遇到的挑战
{{technicalChallenges}}

#### 🎓 学到的经验
{{lessonsLearned}}

#### 🚫 踩过的坑
{{pitfallsAndSolutions}}

#### 🔮 最佳实践总结
{{bestPractices}}

### 📈 质量指标
- **代码覆盖率**: {{testCoverage}}%
- **性能指标**: {{performanceMetrics}}
- **用户反馈**: {{userFeedback}}
- **Bug修复**: {{bugFixes}}

### 🔄 持续改进
#### 📋 待优化项
{{improvementItems}}

#### 🎯 下个迭代计划
{{nextIterationPlan}}

#### 🧠 知识沉淀
{{knowledgeBase}}

---
*记录时间: {{timestamp}}*
*记录人: {{author}}*`,
      description: '记录项目迭代过程中的技术决策、学习心得和改进计划',
      tags: ['迭代总结', '技术成长', '知识管理'],
      version: '1.0.0'
    });

    // 🔧 工程实践指南模板
    this.createPrompt({  
      name: '工程实践指南',
      type: 'global',
      category: '工程实践',
      content: `## 🔧 软件工程最佳实践指南

### 📝 代码规范与质量
#### 代码风格统一
- **命名规范**: 变量、函数、类的命名约定
- **格式化**: ESLint/Prettier配置，代码格式一致性
- **注释规范**: JSDoc文档、复杂逻辑说明、TODO标记

#### 质量保证体系
- **静态分析**: SonarQube、CodeClimate代码质量检查
- **单元测试**: Jest/Vitest测试框架，TDD开发模式
- **集成测试**: API测试、端到端测试策略
- **代码审查**: Pull Request流程、审查清单

### 🏗️ 架构设计原则
#### 设计模式应用
- **SOLID原则**: 单一职责、开闭原则、里氏替换等
- **设计模式**: 工厂模式、观察者模式、策略模式
- **架构模式**: MVC、MVP、MVVM、微服务架构
- **领域驱动**: DDD设计、聚合根、值对象

#### 系统设计考虑
- **可扩展性**: 模块化设计、插件机制、配置化
- **可维护性**: 代码可读性、文档完整性、技术债务管理
- **可测试性**: 依赖注入、Mock机制、测试驱动开发
- **性能优化**: 缓存策略、数据库优化、前端性能

### 🚀 DevOps实践
#### CI/CD流水线
- **持续集成**: Git工作流、自动化构建、代码检查
- **持续部署**: 环境管理、自动化部署、回滚机制
- **监控告警**: 应用监控、日志聚合、性能指标
- **安全扫描**: 依赖安全检查、代码安全审计

#### 团队协作
- **版本控制**: Git最佳实践、分支策略、合并冲突处理
- **文档管理**: API文档、架构文档、操作手册
- **知识分享**: 技术分享会、代码评审、经验总结
- **项目管理**: 敏捷开发、任务跟踪、风险管理

### 🔒 安全与合规
- **数据安全**: 敏感数据加密、访问控制、审计日志
- **应用安全**: XSS防护、CSRF防护、SQL注入防护
- **基础设施**: 网络安全、服务器加固、备份恢复
- **合规要求**: GDPR、等保合规、数据治理

### 📊 度量与改进
- **开发效率**: 交付速度、缺陷率、重构频率
- **代码质量**: 复杂度、重复率、测试覆盖率
- **系统稳定**: 可用性、响应时间、错误率
- **团队成长**: 技能发展、知识分享、创新实践`,
      description: '全面的软件工程实践指南，涵盖代码质量、架构设计、DevOps和团队协作',
      tags: ['工程实践', 'DevOps', '团队协作', '质量管理'],
      version: '1.0.0'
    });

    // 🎯 问题排查方法论模板
    this.createPrompt({
      name: '问题排查方法论',
      type: 'global', 
      category: '问题解决',
      content: `## 🎯 系统化问题排查方法论

### 📋 问题定义阶段
#### 🔍 现象收集
- **问题描述**: 具体现象、错误信息、复现步骤
- **影响范围**: 用户群体、功能模块、系统组件
- **时间特征**: 发生时间、频率、持续时间
- **环境信息**: 操作系统、浏览器、网络环境

#### 📊 数据采集
- **日志分析**: 应用日志、系统日志、网络日志
- **监控指标**: CPU、内存、网络、数据库性能
- **用户反馈**: 错误截图、操作路径、用户描述
- **系统状态**: 服务状态、依赖服务、配置变更

### 🔬 问题分析阶段
#### 🎯 假设驱动分析
1. **提出假设**: 基于现象和经验提出可能原因
2. **设计验证**: 制定验证假设的具体方案
3. **收集证据**: 执行验证方案，收集支持或反驳证据
4. **结论判断**: 基于证据确认或否定假设

#### 🌳 系统性排查
- **分层排查**: 从表现层到数据层逐层分析
- **组件隔离**: 独立测试各个系统组件
- **时间线分析**: 梳理问题发生前后的系统变化
- **依赖关系**: 分析上下游服务的影响关系

### 🛠️ 解决方案阶段
#### ⚡ 临时修复
- **快速止血**: 立即缓解问题影响的临时方案
- **风险评估**: 临时方案的副作用和风险点
- **监控加强**: 加强对临时方案的监控和观察

#### 🏗️ 根本解决
- **根因分析**: 5Why分析法找到问题根本原因
- **方案设计**: 从根本上解决问题的长期方案
- **影响评估**: 解决方案对系统和业务的影响
- **实施计划**: 分阶段实施的详细计划

### 📚 经验总结阶段
#### 🎓 知识沉淀
- **问题档案**: 建立问题处理的完整档案
- **解决方案库**: 积累可复用的解决方案
- **最佳实践**: 提炼问题排查的最佳实践
- **团队分享**: 通过分享会传播经验

#### 🔄 预防机制
- **监控完善**: 增加相关的监控指标和告警
- **测试增强**: 添加相关的自动化测试用例
- **文档更新**: 更新运维文档和故障处理手册
- **流程优化**: 改进开发和运维流程

### 🧰 工具和技巧
#### 🔍 排查工具
- **日志分析**: ELK Stack、Splunk、Graylog
- **性能监控**: New Relic、Datadog、Prometheus
- **网络分析**: Wireshark、curl、netstat
- **数据库**: 慢查询日志、执行计划、性能监控

#### 🎯 分析技巧
- **二分法**: 缩小问题范围的有效方法
- **对比法**: 与正常状态或历史数据对比
- **假设验证**: 科学的假设-验证循环
- **协作排查**: 多人协作的高效排查方法`,
      description: '系统化的问题排查方法论，提供从问题定义到解决的完整流程',
      tags: ['问题排查', '故障处理', '根因分析', '运维'],
      version: '1.0.0'
    });

    console.log('✅ 已创建增强版内置提示词模板');
  }

  /**
   * 🆕 从项目对话中提取关键工程信息
   */
  public extractProjectKnowledge(sessions: any[]): void {
    if (!this.currentProject) {
      console.log('⚠️  未设置项目路径，跳过项目知识提取');
      return;
    }

    const projectSessions = sessions.filter(session => 
      this.isProjectRelated(session, this.currentProject)
    );

    if (projectSessions.length === 0) {
      console.log('⚠️  未找到项目相关对话，无法提取工程知识');
      return;
    }

    console.log(`🔍 找到 ${projectSessions.length} 个项目相关对话，开始提取工程知识...`);

    const projectName = path.basename(this.currentProject);
    
    // 检查是否已提取过项目知识，避免重复
    const existingTemplates = Array.from(this.templates.values());
    const hasArchitecture = existingTemplates.some(t => t.name.includes(`${projectName} 架构决策记录`));
    const hasSolutions = existingTemplates.some(t => t.name.includes(`${projectName} 关键解决方案`));
    const hasIteration = existingTemplates.some(t => t.name.includes(`${projectName} 迭代演进记录`));
    
    if (hasArchitecture && hasSolutions && hasIteration) {
      console.log(`⏭️  ${projectName} 项目知识已存在，跳过重复提取`);
      return;
    }

    // 只提取必要的类型：架构决策、解决方案、迭代演进
    if (!hasArchitecture) this.extractArchitectureDecisions(projectSessions);
    if (!hasSolutions) this.extractSolutions(projectSessions);
    if (!hasIteration) this.extractIterationProgress(projectSessions);
    
    console.log(`✅ 从 ${projectSessions.length} 个项目对话中提取了关键工程信息`);
  }

  /**
   * 判断对话是否与项目相关
   */
  private isProjectRelated(session: any, projectPath?: string): boolean {
    if (!projectPath) return false;
    
    const projectName = path.basename(projectPath);
    const content = (session.title + ' ' + session.summary + ' ' + 
                    session.messages?.map((m: any) => m.content).join(' ') || '').toLowerCase();
    
    // 检查是否包含项目相关关键词
    return content.includes(projectName.toLowerCase()) ||
           content.includes('cursor-chat-memory') ||
           content.includes('提示词中心') ||
           content.includes('chat memory') ||
           content.includes('vscode extension') ||
           content.includes('扩展开发') ||
           content.includes('prompt center') ||
           content.includes('memory service');
  }

  /**
   * 提取架构决策
   */
  private extractArchitectureDecisions(sessions: any[]): void {
    const architectureKeywords = ['架构', '设计', 'architecture', '模块', 'service', '接口', 'api', 'class'];
    const relevantSessions = sessions.filter(session =>
      architectureKeywords.some(keyword => 
        session.summary.toLowerCase().includes(keyword) ||
        session.title.toLowerCase().includes(keyword)
      )
    );

    if (relevantSessions.length > 0) {
      const content = this.buildKnowledgeContent(relevantSessions, '架构决策');
      this.createPrompt({
        name: `${path.basename(this.currentProject || 'Project')} 架构决策记录`,
        type: 'project',
        category: '架构设计',
        content,
        description: '从项目对话中提取的实际架构决策和设计思路',
        tags: ['架构', '设计决策', '项目特定'],
        version: '1.0.0'
      });
      console.log(`📐 提取了 ${relevantSessions.length} 个架构决策相关对话`);
    }
  }

  /**
   * 提取解决方案
   */
  private extractSolutions(sessions: any[]): void {
    const solutionKeywords = ['解决', 'fix', 'solution', '实现', '修复', '优化', 'bug', 'error', 'issue'];
    const relevantSessions = sessions.filter(session =>
      solutionKeywords.some(keyword => 
        session.summary.toLowerCase().includes(keyword) ||
        session.title.toLowerCase().includes(keyword)
      ) && session.importance > 0.7
    );

    if (relevantSessions.length > 0) {
      const content = this.buildKnowledgeContent(relevantSessions, '解决方案');
      this.createPrompt({
        name: `${path.basename(this.currentProject || 'Project')} 关键解决方案`,
        type: 'project',
        category: '问题解决',
        content,
        description: '从项目对话中提取的实际问题解决方案',
        tags: ['解决方案', '问题修复', '项目特定'],
        version: '1.0.0'
      });
      console.log(`🛠️ 提取了 ${relevantSessions.length} 个解决方案相关对话`);
    }
  }

  /**
   * 提取迭代演进
   */
  private extractIterationProgress(sessions: any[]): void {
    const iterationKeywords = ['迭代', '版本', '更新', '功能', '改进', 'feature', 'version', 'update', 'enhance'];
    const relevantSessions = sessions.filter(session =>
      iterationKeywords.some(keyword => 
        session.summary.toLowerCase().includes(keyword) ||
        session.title.toLowerCase().includes(keyword)
      )
    );

    if (relevantSessions.length > 0) {
      // 按时间排序，展示演进过程
      relevantSessions.sort((a, b) => a.lastActivity - b.lastActivity);
      const content = this.buildIterationContent(relevantSessions);
      
      this.createPrompt({
        name: `${path.basename(this.currentProject || 'Project')} 迭代演进记录`,
        type: 'iteration',
        category: '项目演进',
        content,
        description: '从项目对话中提取的实际迭代演进过程',
        tags: ['迭代', '演进', '功能发展'],
        version: '1.0.0'
      });
      console.log(`📈 提取了 ${relevantSessions.length} 个迭代演进相关对话`);
    }
  }

  /**
   * 构建知识内容 - 增强版，包含完整的工程信息
   */
  private buildKnowledgeContent(sessions: any[], type: string): string {
    const projectName = path.basename(this.currentProject || 'Unknown Project');
    let content = `## 🎯 ${projectName} - ${type}\n\n`;
    content += `> 📅 提取时间: ${new Date().toLocaleString()}\n`;
    content += `> 📊 基于 ${sessions.length} 个真实项目对话生成\n`;
    content += `> 🎯 这是从实际开发过程中提取的工程知识，不是理论模板\n\n`;
    
    // 根据类型生成不同的内容结构
    if (type === '架构决策') {
      content += this.buildArchitectureContent(sessions, projectName);
    } else if (type === '解决方案') {
      content += this.buildSolutionsContent(sessions, projectName);
    } else if (type === '技术选型') {
      content += this.buildTechChoicesContent(sessions, projectName);
    } else {
      content += this.buildGenericContent(sessions);
    }
    
    return content;
  }

  /**
   * 构建架构决策内容
   */
  private buildArchitectureContent(sessions: any[], projectName: string): string {
    let content = `### 🏗️ 核心架构设计\n\n`;
    
    sessions.forEach((session, index) => {
      content += `#### 第${index + 1}阶段: ${session.title}\n`;
      content += `**⭐ 重要性**: ${(session.importance * 5).toFixed(1)}/5.0 | **📅 时间**: ${new Date(session.lastActivity).toLocaleDateString()}\n\n`;
      
      // 提取用户问题
      const userMessages = session.messages?.filter((m: any) => m.role === 'user') || [];
      if (userMessages.length > 0) {
        content += `**💭 原始需求/问题**:\n`;
        userMessages.forEach((msg: any, i: number) => {
          content += `${i + 1}. ${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}\n`;
        });
        content += '\n';
      }
      
      // 提取助手回答中的关键架构信息
      const assistantMessages = session.messages?.filter((m: any) => m.role === 'assistant') || [];
      if (assistantMessages.length > 0) {
        content += `**🎯 架构解决方案**:\n`;
        assistantMessages.forEach((msg: any, i: number) => {
          // 提取关键的架构决策点
          const keyPoints = this.extractArchitecturePoints(msg.content);
          if (keyPoints.length > 0) {
            keyPoints.forEach(point => {
              content += `- ${point}\n`;
            });
          } else {
            // 如果没有提取到结构化信息，显示前500字符
            content += `${msg.content.substring(0, 800)}${msg.content.length > 800 ? '...' : ''}\n`;
          }
        });
        content += '\n';
      }
      
      content += `**📊 关键指标**: 类别(${session.category}) | 摘要长度(${session.summary.length}字符)\n\n`;
      content += '---\n\n';
    });
    
    content += `### 💡 架构总结\n`;
    content += `- **总体评估**: 基于 ${sessions.length} 个真实开发对话\n`;
    content += `- **平均重要性**: ${(sessions.reduce((sum: number, s: any) => sum + s.importance, 0) / sessions.length * 5).toFixed(1)}/5.0\n`;
    content += `- **主要特点**: 从实际问题驱动的架构演进过程\n`;
    content += `- **适用场景**: ${projectName} 项目及类似技术栈的开发\n\n`;
    
    return content;
  }

  /**
   * 从文本中提取架构要点
   */
  private extractArchitecturePoints(text: string): string[] {
    const points: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      // 查找列表项、标题、关键术语
      if (trimmed.match(/^[- *•]\s+/) || trimmed.match(/^\d+\.\s+/) || 
          trimmed.includes('架构') || trimmed.includes('设计') || 
          trimmed.includes('模块') || trimmed.includes('组件') ||
          trimmed.includes('接口') || trimmed.includes('服务')) {
        if (trimmed.length > 10 && trimmed.length < 200) {
          points.push(trimmed.replace(/^[- *•\d.]\s*/, ''));
        }
      }
    }
    
    return points.slice(0, 8); // 最多8个要点
  }

  /**
   * 构建解决方案内容
   */
  private buildSolutionsContent(sessions: any[], projectName: string): string {
    let content = `### 🛠️ 关键问题解决方案\n\n`;
    
    sessions.forEach((session, index) => {
      content += `#### 解决方案 ${index + 1}: ${session.title}\n`;
      content += `**⭐ 重要性**: ${(session.importance * 5).toFixed(1)}/5.0 | **📅 解决时间**: ${new Date(session.lastActivity).toLocaleDateString()}\n\n`;
      
      // 问题描述
      const userMessages = session.messages?.filter((m: any) => m.role === 'user') || [];
      if (userMessages.length > 0) {
        content += `**❓ 遇到的问题**:\n`;
        userMessages.forEach((msg: any) => {
          content += `> ${msg.content.substring(0, 300)}${msg.content.length > 300 ? '...' : ''}\n\n`;
        });
      }
      
      // 解决过程
      const assistantMessages = session.messages?.filter((m: any) => m.role === 'assistant') || [];
      if (assistantMessages.length > 0) {
        content += `**✅ 解决过程与方案**:\n`;
        assistantMessages.forEach((msg: any) => {
          const solutions = this.extractSolutionSteps(msg.content);
          if (solutions.length > 0) {
            solutions.forEach((step, i) => {
              content += `${i + 1}. ${step}\n`;
            });
          } else {
            content += `${msg.content.substring(0, 1000)}${msg.content.length > 1000 ? '...' : ''}\n`;
          }
          content += '\n';
        });
      }
      
      content += '---\n\n';
    });
    
    return content;
  }

  /**
   * 提取解决方案步骤
   */
  private extractSolutionSteps(text: string): string[] {
    const steps: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^[- *•]\s+/) || trimmed.match(/^\d+\.\s+/) ||
          trimmed.includes('解决') || trimmed.includes('修复') || 
          trimmed.includes('实现') || trimmed.includes('配置') ||
          trimmed.includes('检查') || trimmed.includes('启动')) {
        if (trimmed.length > 15 && trimmed.length < 300) {
          steps.push(trimmed.replace(/^[- *•\d.]\s*/, ''));
        }
      }
    }
    
    return steps.slice(0, 10); // 最多10个步骤
  }

  /**
   * 构建技术选型内容
   */
  private buildTechChoicesContent(sessions: any[], projectName: string): string {
    let content = `### 🔧 技术选型决策\n\n`;
    // 类似的实现...
    return content + this.buildGenericContent(sessions);
  }

  /**
   * 构建通用内容
   */
  private buildGenericContent(sessions: any[]): string {
    let content = '';
    sessions.forEach((session, index) => {
      content += `### ${index + 1}. ${session.title}\n`;
      content += `- **重要性**: ${(session.importance * 5).toFixed(1)}/5.0\n`;
      content += `- **类别**: ${session.category}\n`;
      content += `- **时间**: ${new Date(session.lastActivity).toLocaleDateString()}\n`;
      content += `- **摘要**: ${session.summary}\n\n`;
      content += '---\n\n';
    });
    return content;
  }

  /**
   * 构建迭代内容
   */
  private buildIterationContent(sessions: any[]): string {
    const projectName = path.basename(this.currentProject || 'Unknown Project');
    let content = `## 📈 ${projectName} - 迭代演进时间线\n\n`;
    content += `> 📅 提取时间: ${new Date().toLocaleString()}\n`;
    content += `> 📊 跟踪 ${sessions.length} 个迭代节点\n\n`;
    
    sessions.forEach((session, index) => {
      const date = new Date(session.lastActivity).toLocaleDateString();
      content += `### 第 ${index + 1} 阶段 (${date})\n`;
      content += `**📋 ${session.title}**\n`;
      content += `- 重要性: ${(session.importance * 5).toFixed(1)}/5.0\n`;
      content += `- 类别: ${session.category}\n`;
      content += `- 关键成果: ${session.summary}\n\n`;
      
      if (session.tags && session.tags.length > 0) {
        content += `- 标签: ${session.tags.map((t: any) => `#${t.name}`).join(' ')}\n\n`;
      }
    });
    
    content += `\n## 📊 演进总结\n`;
    content += `- 总迭代轮次: ${sessions.length}\n`;
    content += `- 平均重要性: ${(sessions.reduce((sum: number, s: any) => sum + s.importance, 0) / sessions.length * 5).toFixed(1)}/5.0\n`;
    if (sessions.length > 1) {
      content += `- 时间跨度: ${new Date(sessions[0]?.lastActivity).toLocaleDateString()} - ${new Date(sessions[sessions.length - 1]?.lastActivity).toLocaleDateString()}\n`;
    }
    
    return content;
  }

  /**
   * 🆕 智能提炼历史会话内容 - 支持本地Claude和Azure OpenAI
   */
  async smartSummarizeSession(session: any, fullContent: string, useLocal: boolean = true): Promise<PromptTemplate> {
    console.log(`🧠 正在智能分析会话内容... (使用${useLocal ? '本地Claude' : 'Azure OpenAI'}分析器)`);
    
    let aiSummary: any;
    
    if (useLocal) {
      // 使用本地Claude分析器
      aiSummary = this.localAnalyzer.analyzeSession({
        id: session.id,
        title: session.title,
        category: session.category || 'general',
        importance: session.importance || 3,
        summary: session.summary || '',
        tags: session.tags || [],
        timestamp: session.timestamp || new Date().toISOString()
      }, fullContent);
    } else {
      // 使用Azure OpenAI
      if (!this.aiSummarizer) {
        throw new Error('Azure OpenAI分析器未初始化，请使用本地分析器');
      }
      
      aiSummary = await this.aiSummarizer.summarizeSession({
        id: session.id,
        title: session.title,
        category: session.category || 'general',
        importance: session.importance || 3,
        summary: session.summary || '',
        tags: session.tags || [],
        timestamp: session.timestamp || new Date().toISOString()
      }, fullContent);
    }

    // 创建智能提炼后的提示词
    const promptTemplate: PromptTemplate = {
      id: `${useLocal ? 'claude' : 'openai'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: aiSummary.title,
      type: 'project',
      category: aiSummary.category,
      content: this.formatSmartContent(aiSummary, useLocal),
      description: aiSummary.summary,
      tags: aiSummary.tags,
      version: '1.0.0',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usage: 0,
      rating: 0,
      sourceSession: session.id,
      aiEnhanced: true
    };

    this.templates.set(promptTemplate.id, promptTemplate);
    this.savePrompts();

    console.log(`✅ 智能提炼完成: ${promptTemplate.name}`);
    return promptTemplate;
  }

  private formatSmartContent(aiSummary: any, useLocal: boolean): string {
    const analyzerType = useLocal ? '本地Claude分析器' : 'Azure OpenAI';
    
    return `# 🎯 ${aiSummary.title}

> 🧠 **${analyzerType}智能提炼** | 重要性: ${aiSummary.importance}/5

## 📋 核心摘要
${aiSummary.summary}

## 🔑 关键技术点
${aiSummary.keyPoints.map((point: string) => `- ${point}`).join('\n')}

## 💡 技术洞察
${aiSummary.technicalInsights.map((insight: string) => `- ${insight}`).join('\n')}

## ❓ 解决的问题
${aiSummary.problemsSolved.map((problem: string) => `- ${problem}`).join('\n')}

## 🔧 代码变更
${aiSummary.codeChanges.map((change: string) => `- ${change}`).join('\n')}

---
*📅 提炼时间: ${new Date().toLocaleString('zh-CN')}*
*🏷️ 标签: ${aiSummary.tags.join(', ')}*
*🤖 分析引擎: ${analyzerType}*`;
  }

  /**
   * 🆕 智能整合现有提示词模板 - 支持本地Claude和Azure OpenAI
   */
  async smartIntegratePrompts(useLocal: boolean = true): Promise<{
    integrated: PromptTemplate[];
    knowledgeBase: any;
  }> {
    console.log(`🧠 正在智能整合提示词模板... (使用${useLocal ? '本地Claude' : 'Azure OpenAI'}分析器)`);
    
    const existingPrompts = Array.from(this.templates.values());
    if (existingPrompts.length === 0) {
      console.log('📝 没有找到需要整合的提示词');
      return { integrated: [], knowledgeBase: {} };
    }

    let result: any;
    
    if (useLocal) {
      // 使用本地Claude分析器
      result = this.localAnalyzer.integratePrompts(existingPrompts.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        category: p.category,
        content: p.content,
        description: p.description,
        tags: p.tags
      })));
    } else {
      // 使用Azure OpenAI
      if (!this.aiSummarizer) {
        throw new Error('Azure OpenAI分析器未初始化，请使用本地分析器');
      }
      
      result = await this.aiSummarizer.integratePrompts(existingPrompts.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        category: p.category,
        content: p.content,
        description: p.description,
        tags: p.tags
      })));
    }

    // 备份原始提示词
    const promptsFile = path.join(this.promptsDir, 'templates.json');
    const backupFile = path.join(path.dirname(this.promptsDir), `templates_backup_${Date.now()}.json`);
    if (fs.existsSync(promptsFile)) {
      fs.copyFileSync(promptsFile, backupFile);
      console.log(`💾 原始提示词已备份到: ${path.basename(backupFile)}`);
    }

    // 清除旧的提示词
    this.templates.clear();

    // 添加整合后的提示词
    const integratedPrompts: PromptTemplate[] = [];
    for (const integrated of result.integratedPrompts) {
      const promptTemplate: PromptTemplate = {
        id: integrated.id,
        name: integrated.name,
        type: integrated.type as 'global' | 'project' | 'iteration',
        category: integrated.category,
        content: integrated.content,
        description: integrated.description,
        tags: integrated.tags,
        version: '1.0.0',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usage: 0,
        rating: 0,
        aiEnhanced: true
      };
      
      this.templates.set(promptTemplate.id, promptTemplate);
      integratedPrompts.push(promptTemplate);
    }

    // 保存知识库
    const knowledgeBaseFile = path.join(path.dirname(this.promptsDir), 'knowledge_base.json');
    fs.writeFileSync(knowledgeBaseFile, JSON.stringify({
      ...result.knowledgeBase,
      generatedAt: new Date().toISOString(),
      sourcePrompts: existingPrompts.length,
      analyzer: useLocal ? '本地Claude' : 'Azure OpenAI'
    }, null, 2));

    this.savePrompts();
    
    console.log(`✅ 智能整合完成，生成 ${integratedPrompts.length} 个优化提示词`);
    console.log(`📚 知识库已保存到: knowledge_base.json`);
    
    return {
      integrated: integratedPrompts,
      knowledgeBase: result.knowledgeBase
    };
  }

  /**
   * 🆕 生成智能项目知识总结 - 支持本地Claude和Azure OpenAI
   */
  async generateProjectKnowledge(sessions: any[], useLocal: boolean = true): Promise<any> {
    console.log(`🧠 正在分析历史会话，生成项目知识图谱... (使用${useLocal ? '本地Claude' : 'Azure OpenAI'}分析器)`);
    
    let knowledge: any;
    
    if (useLocal) {
      // 使用本地Claude分析器
      knowledge = this.localAnalyzer.generateProjectKnowledge(
        sessions.map(s => ({
          id: s.id,
          title: s.title,
          category: s.category || 'general',
          importance: s.importance || 3,
          summary: s.summary || '',
          tags: s.tags || [],
          timestamp: s.timestamp || new Date().toISOString()
        })),
        this.currentProject || process.cwd()
      );
    } else {
      // 使用Azure OpenAI
      if (!this.aiSummarizer) {
        throw new Error('Azure OpenAI分析器未初始化，请使用本地分析器');
      }
      
      knowledge = await this.aiSummarizer.generateProjectKnowledge(
        sessions.map(s => ({
          id: s.id,
          title: s.title,
          category: s.category || 'general',
          importance: s.importance || 3,
          summary: s.summary || '',
          tags: s.tags || [],
          timestamp: s.timestamp || new Date().toISOString()
        })),
        this.currentProject || process.cwd()
      );
    }

    // 保存项目知识
    const projectKnowledgeFile = path.join(path.dirname(this.promptsDir), 'project_knowledge.json');
    fs.writeFileSync(projectKnowledgeFile, JSON.stringify({
      ...knowledge,
      generatedAt: new Date().toISOString(),
      projectPath: this.currentProject || process.cwd(),
      sessionsAnalyzed: sessions.length,
      analyzer: useLocal ? '本地Claude' : 'Azure OpenAI'
    }, null, 2));

    console.log(`📚 项目知识图谱已生成并保存到: project_knowledge.json`);
    return knowledge;
  }

  /**
   * 生成智能引用内容
   */
  async generateSmartReference(
    sessionIds: string[] = [],
    promptIds: string[] = [],
    context: string = ''
  ): Promise<string> {
    if (!this.aiSummarizer) {
      throw new Error('AI摘要器未初始化');
    }

    // 这里需要从外部获取sessions，暂时返回空数组
    const sessions: any[] = [];
    const prompts = promptIds.map(id => this.templates.get(id)).filter(Boolean) as PromptTemplate[];

    console.log('🤖 正在生成智能引用内容...');
    
    const reference = await this.aiSummarizer.generateSmartReference(
      sessions,
      prompts.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        category: p.category,
        content: p.content,
        description: p.description,
        tags: p.tags
      })),
      context
    );

    return `# 🤖 AI智能引用

${reference}

---
*📅 生成时间: ${new Date().toLocaleString('zh-CN')}*
*📊 数据源: ${sessions.length} 个会话 + ${prompts.length} 个提示词*
*🎯 上下文: ${context || '通用开发指导'}*`;
  }

  /**
   * 批量智能提炼历史会话
   */
  async batchSmartSummarize(sessions: any[]): Promise<PromptTemplate[]> {
    if (!this.aiSummarizer) {
      throw new Error('AI摘要器未初始化');
    }

    const results: PromptTemplate[] = [];
    
    console.log(`🤖 开始批量智能提炼 ${sessions.length} 个历史会话...`);
    
    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i];
      try {
        console.log(`[${i + 1}/${sessions.length}] 提炼会话: ${session.title}`);
        
        // 这里需要获取完整对话内容，暂时使用summary作为内容
        const fullContent = session.content || session.summary || `Title: ${session.title}\nCategory: ${session.category}`;
        
        const prompt = await this.smartSummarizeSession(session, fullContent);
        results.push(prompt);
        
        // 避免API请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ 提炼失败 [${session.title}]:`, error);
      }
    }
    
    console.log(`✅ 批量提炼完成，成功处理 ${results.length}/${sessions.length} 个会话`);
    return results;
  }
} 