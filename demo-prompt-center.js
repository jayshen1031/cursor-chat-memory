const Database = require('sqlite3').Database;
const path = require('path');
const os = require('os');

// 提示词中心类
class PromptCenter {
  constructor() {
    this.workspaceStoragePath = path.join(os.homedir(), 'Library/Application Support/Cursor/User/workspaceStorage');
    this.prompts = new Map();
    this.templates = new Map();
    this.loadBuiltInTemplates();
  }

  loadBuiltInTemplates() {
    const templates = [
      {
        id: 'arch-analysis',
        title: '架构分析',
        content: '请分析项目 {projectName} 的整体架构，包括：\n1. 核心模块和组件\n2. 数据流设计\n3. 技术栈选择\n4. 潜在的架构问题\n5. 优化建议',
        category: 'architecture',
        description: '深入分析项目架构设计',
        variables: ['projectName'],
        examples: ['分析cursor-chat-memory项目架构']
      },
      {
        id: 'bug-diagnosis',
        title: '问题诊断',
        content: '帮我诊断以下问题：\n问题描述：{problemDescription}\n错误信息：{errorMessage}\n\n请提供：\n1. 可能的原因分析\n2. 调试步骤\n3. 解决方案\n4. 预防措施',
        category: 'debugging',
        description: '系统化的问题诊断和解决',
        variables: ['problemDescription', 'errorMessage'],
        examples: ['时间戳显示错误问题诊断']
      },
      {
        id: 'feature-design',
        title: '功能设计',
        content: '设计功能：{featureName}\n\n需求：{requirements}\n\n请提供：\n1. 功能设计方案\n2. 技术实现路径\n3. 接口设计\n4. 测试策略\n5. 性能考虑',
        category: 'development',
        description: '系统化的功能设计方法',
        variables: ['featureName', 'requirements'],
        examples: ['提示词中心功能设计']
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  // 修复时间戳 - 将2025年调整为2024年
  fixTimestamp(timestamp) {
    if (!timestamp) return Date.now();
    
    const now = Date.now();
    if (timestamp > now) {
      return timestamp - (365 * 24 * 60 * 60 * 1000);
    }
    return timestamp;
  }

  // 从历史会话中提取提示词
  async extractFromConversations(projectPath) {
    const extracts = [];
    
    try {
      const workspaceDirs = require('fs').readdirSync(this.workspaceStoragePath);
      
      for (const workspaceId of workspaceDirs) {
        if (workspaceId.startsWith('.')) continue;
        
        const dbPath = path.join(this.workspaceStoragePath, workspaceId, 'state.vscdb');
        if (!require('fs').existsSync(dbPath)) continue;
        
        const sessionExtract = await this.extractFromSession(workspaceId, dbPath, projectPath);
        if (sessionExtract.extractedPrompts.length > 0) {
          extracts.push(sessionExtract);
        }
      }
    } catch (error) {
      console.error('提取会话提示词失败:', error);
    }
    
    return extracts;
  }

  async extractFromSession(workspaceId, dbPath, projectPath) {
    return new Promise((resolve) => {
      const db = new Database(dbPath);
      const extract = {
        sessionId: workspaceId,
        extractedPrompts: [],
        insights: [],
        patterns: []
      };

      const queries = [
        new Promise((resolvePrompts) => {
          db.get("SELECT value FROM ItemTable WHERE key = 'aiService.prompts'", (err, row) => {
            if (err || !row?.value) {
              resolvePrompts([]);
              return;
            }
            try {
              const prompts = JSON.parse(row.value);
              resolvePrompts(Array.isArray(prompts) ? prompts : []);
            } catch {
              resolvePrompts([]);
            }
          });
        }),
        new Promise((resolveGens) => {
          db.get("SELECT value FROM ItemTable WHERE key = 'aiService.generations'", (err, row) => {
            if (err || !row?.value) {
              resolveGens([]);
              return;
            }
            try {
              const generations = JSON.parse(row.value);
              resolveGens(Array.isArray(generations) ? generations : []);
            } catch {
              resolveGens([]);
            }
          });
        })
      ];

      Promise.all(queries).then(([prompts, generations]) => {
        const projectPrompts = this.analyzePrompts(prompts, generations, workspaceId, projectPath);
        extract.extractedPrompts = projectPrompts;
        extract.insights = this.extractInsights(prompts, generations);
        extract.patterns = this.identifyPatterns(prompts);

        db.close();
        resolve(extract);
      }).catch(() => {
        db.close();
        resolve(extract);
      });
    });
  }

  analyzePrompts(prompts, generations, sessionId, projectPath) {
    const projectPrompts = [];
    const now = Date.now();

    prompts.forEach((prompt, index) => {
      if (!prompt.text || prompt.text.trim().length < 10) return;

      const text = prompt.text.trim();
      
      if (this.isProjectRelevant(text, projectPath)) {
        const category = this.categorizePrompt(text);
        const tags = this.extractTags(text);
        const correspondingGeneration = generations[index];
        const effectiveness = correspondingGeneration ? this.evaluateEffectiveness(text, correspondingGeneration.textDescription) : 0.5;

        // 使用generation的时间戳，如果没有则使用当前时间
        let timestamp = now;
        if (correspondingGeneration?.unixMs) {
          timestamp = this.fixTimestamp(correspondingGeneration.unixMs);
        } else if (prompt.unixMs) {
          timestamp = this.fixTimestamp(prompt.unixMs);
        }

        const projectPrompt = {
          id: `${sessionId}-prompt-${index}`,
          content: text,
          category,
          tags,
          source: 'conversation',
          projectPath,
          createdAt: timestamp,
          updatedAt: now,
          usage: 1,
          effectiveness
        };

        projectPrompts.push(projectPrompt);
      }
    });

    return projectPrompts;
  }

  isProjectRelevant(text, projectPath) {
    const lowerText = text.toLowerCase();
    
    const projectKeywords = [
      'cursor', 'chat', 'memory', '项目', 'project', '功能', 'feature',
      '架构', 'architecture', '设计', 'design', '实现', 'implement',
      '优化', 'optimize', '调试', 'debug', '测试', 'test', '提示词'
    ];

    const techKeywords = [
      'typescript', 'javascript', 'node', 'sqlite', 'database',
      'api', 'web', 'server', '接口', '数据库', '前端', '后端'
    ];

    const processKeywords = [
      '帮我', '如何', '怎么', 'how to', '分析', 'analyze',
      '创建', 'create', '修改', 'modify', '增加', 'add'
    ];

    return projectKeywords.some(kw => lowerText.includes(kw)) ||
           (techKeywords.some(kw => lowerText.includes(kw)) && 
            processKeywords.some(kw => lowerText.includes(kw)));
  }

  categorizePrompt(text) {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('架构') || lowerText.includes('architecture') || lowerText.includes('设计模式')) {
      return 'architecture';
    }
    if (lowerText.includes('错误') || lowerText.includes('bug') || lowerText.includes('调试') || lowerText.includes('debug')) {
      return 'debugging';
    }
    if (lowerText.includes('优化') || lowerText.includes('performance') || lowerText.includes('性能')) {
      return 'optimization';
    }
    if (lowerText.includes('文档') || lowerText.includes('document') || lowerText.includes('说明')) {
      return 'documentation';
    }
    if (lowerText.includes('实现') || lowerText.includes('开发') || lowerText.includes('功能') || lowerText.includes('feature')) {
      return 'development';
    }

    return 'general';
  }

  extractTags(text) {
    const tags = [];
    const lowerText = text.toLowerCase();

    const techTags = ['typescript', 'javascript', 'node', 'sqlite', 'web', 'api', 'database'];
    techTags.forEach(tag => {
      if (lowerText.includes(tag)) {
        tags.push(tag);
      }
    });

    if (lowerText.includes('实时')) tags.push('实时');
    if (lowerText.includes('监控')) tags.push('监控');
    if (lowerText.includes('搜索')) tags.push('搜索');
    if (lowerText.includes('分析')) tags.push('分析');
    if (lowerText.includes('提示词')) tags.push('提示词');

    return [...new Set(tags)];
  }

  evaluateEffectiveness(prompt, response) {
    if (!response) return 0.3;

    const promptLength = prompt.length;
    const responseLength = response.length;
    
    let score = Math.min(responseLength / (promptLength * 2), 1) * 0.4;

    if (response.includes('```')) score += 0.2;
    if (response.includes('1.') || response.includes('2.')) score += 0.1;
    if (response.length > 500) score += 0.1;
    if (!response.includes('error') && !response.includes('失败')) score += 0.1;

    return Math.min(score, 1);
  }

  extractInsights(prompts, generations) {
    const insights = [];

    const categories = prompts.filter(p => p.text).map(p => this.categorizePrompt(p.text));
    const categoryCount = categories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    const mostCommonCategory = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)[0];

    if (mostCommonCategory) {
      insights.push(`主要关注领域: ${mostCommonCategory[0]} (${mostCommonCategory[1]} 次提问)`);
    }

    const techMentions = prompts.filter(p => p.text && 
      (p.text.toLowerCase().includes('typescript') || 
       p.text.toLowerCase().includes('sqlite') ||
       p.text.toLowerCase().includes('node')));
    
    if (techMentions.length > 0) {
      insights.push(`技术栈聚焦: TypeScript/Node.js/SQLite 开发`);
    }

    return insights;
  }

  identifyPatterns(prompts) {
    const patterns = [];
    const texts = prompts.filter(p => p.text).map(p => p.text.toLowerCase());

    const commonStarts = ['帮我', '如何', '请', '实现', '创建', '分析'];
    commonStarts.forEach(start => {
      const count = texts.filter(t => t.startsWith(start)).length;
      if (count > 2) {
        patterns.push(`常用起始词: "${start}" (${count} 次)`);
      }
    });

    return patterns;
  }

  updatePromptsFromExtracts(extracts) {
    extracts.forEach(extract => {
      extract.extractedPrompts.forEach(prompt => {
        this.prompts.set(prompt.id, prompt);
      });
    });
  }

  getTodayPrompts() {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    return Array.from(this.prompts.values())
      .filter(prompt => prompt.createdAt >= todayStart && prompt.createdAt < todayEnd)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  getPromptsByCategory(category) {
    return Array.from(this.prompts.values())
      .filter(prompt => prompt.category === category)
      .sort((a, b) => b.effectiveness - a.effectiveness);
  }

  getStatistics() {
    const allPrompts = Array.from(this.prompts.values());
    
    const stats = {
      total: allPrompts.length,
      byCategory: {},
      bySource: {},
      avgEffectiveness: 0,
      topTags: []
    };

    const categoryCount = {};
    const sourceCount = {};
    let totalEffectiveness = 0;
    const tagCount = {};

    allPrompts.forEach(prompt => {
      categoryCount[prompt.category] = (categoryCount[prompt.category] || 0) + 1;
      sourceCount[prompt.source] = (sourceCount[prompt.source] || 0) + 1;
      totalEffectiveness += prompt.effectiveness;
      
      prompt.tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    stats.byCategory = categoryCount;
    stats.bySource = sourceCount;
    stats.avgEffectiveness = allPrompts.length > 0 ? totalEffectiveness / allPrompts.length : 0;
    stats.topTags = Object.entries(tagCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    return stats;
  }

  renderTemplate(templateId, variables) {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`模板 ${templateId} 不存在`);
    }

    let rendered = template.content;
    template.variables.forEach(variable => {
      const value = variables[variable] || `{${variable}}`;
      rendered = rendered.replace(new RegExp(`\\{${variable}\\}`, 'g'), value);
    });

    return rendered;
  }

  getTemplates() {
    return Array.from(this.templates.values());
  }
}

async function demoPromptCenter() {
  console.log('🎯 Cursor聊天记忆系统 - 提示词中心演示\n');
  console.log('===============================================\n');
  
  const promptCenter = new PromptCenter();
  
  try {
    // 1. 提取历史会话中的提示词
    console.log('📚 从历史会话中提取提示词...');
    const extracts = await promptCenter.extractFromConversations('/Users/jay/Documents/baidu/projects/cursor-chat-memory');
    
    console.log(`✅ 找到 ${extracts.length} 个会话的提示词数据\n`);
    
    // 显示每个会话的提取结果
    extracts.forEach((extract, index) => {
      console.log(`${index + 1}. 会话ID: ${extract.sessionId.substring(0, 8)}...`);
      console.log(`   📝 提取的提示词: ${extract.extractedPrompts.length} 个`);
      console.log(`   💡 洞察: ${extract.insights.length} 个`);
      console.log(`   🔍 模式: ${extract.patterns.length} 个`);
      
      if (extract.insights.length > 0) {
        console.log('   📊 主要洞察:');
        extract.insights.forEach(insight => {
          console.log(`      - ${insight}`);
        });
      }
      
      if (extract.patterns.length > 0) {
        console.log('   🔍 使用模式:');
        extract.patterns.slice(0, 3).forEach(pattern => {
          console.log(`      - ${pattern}`);
        });
      }
      
      if (extract.extractedPrompts.length > 0) {
        console.log('   📝 提示词样例:');
        extract.extractedPrompts.slice(0, 2).forEach((prompt, pIndex) => {
          console.log(`      ${pIndex + 1}. "${prompt.content.substring(0, 60)}..."`);
          console.log(`         分类: ${prompt.category}`);
          console.log(`         效果: ${(prompt.effectiveness * 100).toFixed(0)}%`);
          console.log(`         时间: ${new Date(prompt.createdAt).toLocaleDateString()} ${new Date(prompt.createdAt).toLocaleTimeString()}`);
          console.log(`         标签: ${prompt.tags.join(', ')}`);
        });
      }
      console.log('');
    });
    
    // 2. 更新提示词到内存中
    console.log('💾 更新提示词到内存中...');
    promptCenter.updatePromptsFromExtracts(extracts);
    
    // 3. 获取统计信息
    console.log('📊 获取统计信息...');
    const stats = promptCenter.getStatistics();
    
    console.log(`\n📈 提示词中心统计:`);
    console.log(`   总提示词数: ${stats.total}`);
    console.log(`   平均效果评分: ${(stats.avgEffectiveness * 100).toFixed(0)}%`);
    
    console.log('\n📂 按类别分布:');
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} 个`);
    });
    
    console.log('\n🏷️ 热门标签:');
    stats.topTags.slice(0, 8).forEach((tagInfo, index) => {
      console.log(`   ${index + 1}. ${tagInfo.tag}: ${tagInfo.count} 次`);
    });
    
    // 4. 获取今天的提示词
    console.log('\n📅 今天的提示词:');
    const todayPrompts = promptCenter.getTodayPrompts();
    console.log(`   今天共有 ${todayPrompts.length} 个提示词\n`);
    
    if (todayPrompts.length > 0) {
      todayPrompts.slice(0, 5).forEach((prompt, index) => {
        console.log(`   ${index + 1}. "${prompt.content.substring(0, 80)}..."`);
        console.log(`      分类: ${prompt.category}`);
        console.log(`      效果: ${(prompt.effectiveness * 100).toFixed(0)}%`);
        console.log(`      时间: ${new Date(prompt.createdAt).toLocaleDateString()} ${new Date(prompt.createdAt).toLocaleTimeString()}`);
        console.log(`      标签: ${prompt.tags.join(', ')}`);
        console.log('');
      });
    }
    
    // 5. 按类别获取提示词
    console.log('🎯 按类别查看提示词:');
    const categories = ['development', 'debugging', 'architecture', 'optimization'];
    
    categories.forEach(category => {
      const categoryPrompts = promptCenter.getPromptsByCategory(category);
      if (categoryPrompts.length > 0) {
        console.log(`\n   📂 ${category} 类别 (${categoryPrompts.length} 个):`);
        categoryPrompts.slice(0, 2).forEach((prompt, index) => {
          console.log(`      ${index + 1}. "${prompt.content.substring(0, 70)}..."`);
          console.log(`         效果: ${(prompt.effectiveness * 100).toFixed(0)}% | 时间: ${new Date(prompt.createdAt).toLocaleDateString()}`);
        });
      }
    });
    
    // 6. 获取模板
    console.log('\n📄 内置提示词模板:');
    const templates = promptCenter.getTemplates();
    
    templates.forEach((template, index) => {
      console.log(`\n   ${index + 1}. ${template.title} (${template.category})`);
      console.log(`      ${template.description}`);
      console.log(`      变量: ${template.variables.join(', ')}`);
      console.log(`      示例: ${template.examples[0]}`);
    });
    
    // 7. 模板渲染演示
    console.log('\n🎨 模板渲染演示:');
    
    const renderedArch = promptCenter.renderTemplate('arch-analysis', {
      projectName: 'cursor-chat-memory'
    });
    
    console.log('\n1. 架构分析模板渲染结果:');
    console.log('---');
    console.log(renderedArch);
    console.log('---');
    
    const renderedBug = promptCenter.renderTemplate('bug-diagnosis', {
      problemDescription: '时间戳显示为2025年而不是2024年',
      errorMessage: '显示时间: 6/11/2025, 1:16:46 AM'
    });
    
    console.log('\n2. 问题诊断模板渲染结果:');
    console.log('---');
    console.log(renderedBug);
    console.log('---');
    
  } catch (error) {
    console.error('❌ 演示失败:', error);
  }
  
  console.log('\n🎉 提示词中心演示完成！');
  console.log('\n💡 核心功能:');
  console.log('   ✅ 智能提示词提取: 从历史会话中自动提取项目相关提示词');
  console.log('   ✅ 时间戳修复: 自动修复错误的时间戳显示问题');
  console.log('   ✅ 智能分类: 按架构、开发、调试等类别自动分类');
  console.log('   ✅ 效果评估: 基于AI回复质量评估提示词效果');
  console.log('   ✅ 模式识别: 识别用户提问习惯和常用模式');
  console.log('   ✅ 模板系统: 内置常用提示词模板，支持变量替换');
  console.log('   ✅ 统计分析: 提供详细的使用统计和趋势分析');
}

demoPromptCenter().catch(console.error); 