import axios from 'axios';

interface AzureOpenAIConfig {
  endpoint: string;
  apiKey: string;
  deploymentName: string;
  apiVersion: string;
}

interface ChatSession {
  id: string;
  title: string;
  category: string;
  importance: number;
  summary: string;
  tags: string[];
  timestamp: string;
  content?: string;
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

export class AISummarizer {
  private config: AzureOpenAIConfig;

  constructor() {
    this.config = {
      endpoint: 'https://bondex.openai.azure.com',
      apiKey: '45288eb7fea64b628abb290a9505a709',
      deploymentName: 'global-gpt-4o',
      apiVersion: '2025-01-01-preview'
    };
  }

  private async callAzureOpenAI(messages: any[], maxTokens: number = 2000): Promise<string> {
    const url = `${this.config.endpoint}/openai/deployments/${this.config.deploymentName}/chat/completions?api-version=${this.config.apiVersion}`;
    
    try {
      const response = await axios.post(url, {
        messages,
        max_tokens: maxTokens,
        temperature: 0.3,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      }, {
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey
        }
      });

      return response.data.choices[0].message.content;
    } catch (error: any) {
      console.error('Azure OpenAI API调用失败:', error.response?.data || error.message);
      throw new Error(`AI摘要生成失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  private parseAIResponse(content: string): any {
    // 移除可能的markdown代码块标记
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    try {
      return JSON.parse(cleanContent);
    } catch (error) {
      console.error('AI响应解析失败:', cleanContent);
      throw new Error('AI响应格式错误');
    }
  }

  /**
   * 智能提炼历史会话内容
   */
  async summarizeSession(session: ChatSession, fullContent: string): Promise<{
    title: string;
    summary: string;
    keyPoints: string[];
    technicalInsights: string[];
    problemsSolved: string[];
    codeChanges: string[];
    tags: string[];
    category: string;
    importance: number;
  }> {
    const messages = [
      {
        role: 'system',
        content: `你是一个专业的软件工程知识提炼专家。请分析以下软件开发对话，提炼出核心的工程知识和技术洞察。

要求：
1. 提取技术关键点，不要冗长的对话片段
2. 结构化组织信息，便于后续引用
3. 识别解决的问题和采用的方案
4. 评估内容的重要性（1-5分）
5. 提供准确的分类标签

请用以下JSON格式回复：
{
  "title": "简洁的技术主题标题",
  "summary": "核心内容摘要（100-200字）",
  "keyPoints": ["关键技术点1", "关键技术点2", "..."],
  "technicalInsights": ["技术洞察1", "技术洞察2", "..."],
  "problemsSolved": ["解决的问题1", "解决的问题2", "..."],
  "codeChanges": ["代码变更1", "代码变更2", "..."],
  "tags": ["标签1", "标签2", "..."],
  "category": "分类名称",
  "importance": 评分数字
}`
      },
      {
        role: 'user',
        content: `原始会话标题: ${session.title}
当前分类: ${session.category}
对话内容:\n${fullContent}`
      }
    ];

    const result = await this.callAzureOpenAI(messages, 1500);
    return this.parseAIResponse(result);
  }

  /**
   * 整合和提炼多个提示词模板
   */
  async integratePrompts(prompts: PromptTemplate[]): Promise<{
    integratedPrompts: {
      id: string;
      name: string;
      type: string;
      category: string;
      content: string;
      description: string;
      tags: string[];
      sourcePrompts: string[];
    }[];
    knowledgeBase: {
      architecture: string;
      solutions: string;
      iterations: string;
      bestPractices: string;
    };
  }> {
    const messages = [
      {
        role: 'system',
        content: `你是一个专业的技术知识整合专家。请分析以下提示词模板，将它们整合成结构化的工程知识库。

要求：
1. 去除冗长的对话片段，提取核心技术要点
2. 按照架构设计、解决方案、迭代过程、最佳实践等维度重新组织
3. 消除重复内容，突出关键信息
4. 生成可直接应用的工程指导

请用以下简化JSON格式回复，注意不要使用复杂的嵌套结构：
{
  "integratedPrompts": [
    {
      "id": "cursorchat-integrated-architecture",
      "name": "整合后的名称",
      "type": "project",
      "category": "分类",
      "content": "整合提炼后的内容（markdown格式）",
      "description": "简短描述",
      "tags": ["标签1", "标签2"],
      "sourcePrompts": ["原始提示词ID1", "原始提示词ID2"]
    }
  ],
  "knowledgeBase": {
    "architecture": "架构设计核心要点总结",
    "solutions": "关键解决方案总结",
    "iterations": "迭代演进规律总结",
    "bestPractices": "最佳实践建议总结"
  }
}`
      },
      {
        role: 'user',
        content: `需要整合的提示词模板:\n${JSON.stringify(prompts, null, 2)}`
      }
    ];

    const result = await this.callAzureOpenAI(messages, 2500);
    return this.parseAIResponse(result);
  }

  /**
   * 生成智能化的项目知识总结
   */
  async generateProjectKnowledge(sessions: ChatSession[], projectPath: string): Promise<{
    projectOverview: string;
    coreArchitecture: string;
    keyTechnologies: string[];
    mainChallenges: string[];
    solutionPatterns: string[];
    evolutionTimeline: {
      phase: string;
      description: string;
      keyChanges: string[];
      timestamp: string;
    }[];
    recommendations: string[];
  }> {
    const sessionSummary = sessions.map(s => ({
      title: s.title,
      category: s.category,
      importance: s.importance,
      summary: s.summary,
      tags: s.tags,
      timestamp: s.timestamp
    }));

    const messages = [
      {
        role: 'system',
        content: `你是一个专业的软件项目分析专家。请基于历史开发会话，生成项目的整体技术知识图谱。

⚠️ 重要要求：
1. 只基于实际的历史会话内容进行分析，不要添加未提及的技术栈
2. 不要假设使用了MongoDB、Redis等数据库，除非会话中明确提到
3. 根据会话内容推断实际使用的技术和架构
4. 如果信息不足，明确说明而不是编造

请用以下JSON格式回复：
{
  "projectOverview": "基于会话内容的项目描述",
  "coreArchitecture": "从会话中提取的架构信息",
  "keyTechnologies": ["仅列出会话中明确提到的技术"],
  "mainChallenges": ["从会话中识别的实际挑战"],
  "solutionPatterns": ["从会话中提取的实际解决方案"],
  "evolutionTimeline": [
    {
      "phase": "从会话提取的阶段名称",
      "description": "基于会话的阶段描述",
      "keyChanges": ["会话中提到的具体变更"],
      "timestamp": "会话时间戳"
    }
  ],
  "recommendations": ["基于实际项目情况的建议"]
}`
      },
      {
        role: 'user',
        content: `项目路径: ${projectPath}
项目名称: cursor-chat-memory (VS Code扩展项目)

历史会话摘要:
${JSON.stringify(sessionSummary, null, 2)}

请注意：这是一个VS Code扩展项目，主要使用TypeScript和文件系统存储，请不要假设使用了数据库等未提及的技术。`
      }
    ];

    const result = await this.callAzureOpenAI(messages, 2000);
    return this.parseAIResponse(result);
  }

  /**
   * 生成智能引用内容
   */
  async generateSmartReference(
    sessions: ChatSession[],
    prompts: PromptTemplate[],
    context: string = ''
  ): Promise<string> {
    const messages = [
      {
        role: 'system',
        content: `你是一个专业的软件开发助手。请基于历史会话和提示词模板，生成一个智能的开发引用内容。

要求：
1. 结合历史经验和技术模板
2. 突出关键的工程洞察
3. 提供具体可行的建议
4. 保持内容简洁但信息丰富

格式要求：
- 使用markdown格式
- 包含相关技术栈和解决方案
- 添加代码示例或架构建议
- 标明信息来源和适用场景`
      },
      {
        role: 'user',
        content: `上下文需求: ${context}

历史会话参考:
${sessions.map(s => `- ${s.title} (${s.category}): ${s.summary}`).join('\n')}

提示词模板:
${prompts.map(p => `- ${p.name}: ${p.description}`).join('\n')}

请生成智能引用内容：`
      }
    ];

    return await this.callAzureOpenAI(messages, 2000);
  }
} 