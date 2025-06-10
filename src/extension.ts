import * as vscode from 'vscode';
import { ChatMemoryService } from './chatMemoryService';

let memoryService: ChatMemoryService;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  console.log('🧠 Enhanced Cursor Chat Memory Extension Activating...');

  // 初始化聊天记忆服务
  memoryService = new ChatMemoryService();
  
  // 创建状态栏项
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = '🧠 Memory: Loading...';
  statusBarItem.command = 'cursorChatMemory.showStatus';
  statusBarItem.show();

  // 注册命令
  registerCommands(context);

  // 启动记忆服务
  startMemoryService();

  // 监听服务事件
  setupServiceListeners();

  vscode.window.showInformationMessage('🧠 Enhanced Cursor Chat Memory is now active!');
  console.log('✅ Enhanced Cursor Chat Memory Extension Activated');
}

export function deactivate() {
  console.log('🧠 Deactivating Enhanced Cursor Chat Memory Extension...');
  
  if (memoryService) {
    memoryService.stop();
  }
  
  if (statusBarItem) {
    statusBarItem.dispose();
  }
  
  console.log('👋 Enhanced Cursor Chat Memory Extension Deactivated');
}

/**
 * 注册所有命令
 */
function registerCommands(context: vscode.ExtensionContext) {
  // 1. 智能引用命令 (原enhanceInput)
  const smartReferenceCmd = vscode.commands.registerCommand('cursorChatMemory.enhanceInput', async () => {
    if (!memoryService) {
      vscode.window.showErrorMessage('Memory service not available');
      return;
    }

    const sessions = memoryService.getAllSessions();
    
    if (sessions.length === 0) {
      vscode.window.showInformationMessage('📭 暂无历史对话记录');
      return;
    }

    // 显示智能选择界面
    await showSmartReferencePanel();
  });

  // 2. 快速引用命令 (智能项目上下文引用)
  const quickReferenceCmd = vscode.commands.registerCommand('cursorChatMemory.quickReference', async () => {
    if (!memoryService) {
      vscode.window.showErrorMessage('Memory service not available');
      return;
    }

    await showQuickReferencePanel();
  });

  // 3. 显示状态命令
  const showStatusCmd = vscode.commands.registerCommand('cursorChatMemory.showStatus', async () => {
    if (!memoryService) {
      vscode.window.showErrorMessage('Memory service not available');
      return;
    }

    await showMainMenu();
  });

  // 4. 智能推荐命令
  const intelligentRecommendCmd = vscode.commands.registerCommand('cursorChatMemory.intelligentRecommend', async () => {
    if (!memoryService) {
      vscode.window.showErrorMessage('Memory service not available');
      return;
    }

    const inputText = await vscode.window.showInputBox({
      prompt: '输入您的问题或关键词，获取智能推荐',
      placeHolder: '例如: React性能优化、JavaScript异步编程...'
    });

    if (!inputText) return;

    const recommendations = memoryService.getRecommendedSessions(inputText);
    
    if (recommendations.length === 0) {
      vscode.window.showInformationMessage('📭 没有找到相关的历史对话');
      return;
    }

    await showSessionSelectionPanel(recommendations, `智能推荐: ${inputText}`);
  });

  // 5. 模板引用命令
  const templateReferenceCmd = vscode.commands.registerCommand('cursorChatMemory.templateReference', async () => {
    if (!memoryService) {
      vscode.window.showErrorMessage('Memory service not available');
      return;
    }

    await showTemplateSelectionPanel();
  });

  // 6. 分类浏览命令
  const browseCategoriesCmd = vscode.commands.registerCommand('cursorChatMemory.browseCategories', async () => {
    if (!memoryService) {
      vscode.window.showErrorMessage('Memory service not available');
      return;
    }

    await showCategoryBrowser();
  });

  // 7. 重启服务命令
  const restartServiceCmd = vscode.commands.registerCommand('cursorChatMemory.restartService', () => {
    restartMemoryService();
  });

  // 8. 解决方案引用命令
  const solutionReferenceCmd = vscode.commands.registerCommand('cursorChatMemory.solutionReference', async () => {
    if (!memoryService) {
      vscode.window.showErrorMessage('Memory service not available');
      return;
    }

    const inputText = await vscode.window.showInputBox({
      prompt: '输入关键词搜索解决方案',
      placeHolder: '例如: 路径问题、配置错误、性能优化...'
    });

    if (!inputText) return;

    const keywords = inputText.split(/[,，\s]+/).filter(k => k);
    const reference = memoryService.getSolutionReference(keywords);
    
    if (reference.includes('没有找到')) {
      vscode.window.showInformationMessage('📭 没有找到相关的解决方案');
      return;
    }

    await vscode.env.clipboard.writeText(reference);
    
    vscode.window.showInformationMessage(
      '✅ 解决方案引用已复制! 现在可以在Cursor聊天中粘贴使用',
      '🚀 打开Cursor聊天'
    ).then((action) => {
      if (action === '🚀 打开Cursor聊天') {
        vscode.commands.executeCommand('workbench.panel.chat.view.focus');
      }
    });
  });

  // 🆕 9. 提示词管理命令
  const promptManagerCmd = vscode.commands.registerCommand('cursorChatMemory.promptManager', async () => {
    if (!memoryService) {
      vscode.window.showErrorMessage('Memory service not available');
      return;
    }

    vscode.window.showInformationMessage('🧠 提示词管理功能开发中，敬请期待！');
  });

  // 🆕 10. 增强引用命令（包含提示词）
  const enhancedReferenceCmd = vscode.commands.registerCommand('cursorChatMemory.enhancedReference', async () => {
    if (!memoryService) {
      vscode.window.showErrorMessage('Memory service not available');
      return;
    }

    const inputText = await vscode.window.showInputBox({
      prompt: '输入您的问题或上下文',
      placeHolder: '例如: 如何优化React性能、数据库查询问题...'
    });

    if (!inputText) return;

    const templates = memoryService.getAvailableTemplates();
    const templateItems = templates.map(t => ({
      label: `$(symbol-class) ${t.name}`,
      description: t.description,
      detail: `相关模板引用`,
      templateId: t.id
    }));

    const selectedTemplate = await vscode.window.showQuickPick(templateItems, {
      placeHolder: '选择引用模板'
    });

    if (!selectedTemplate) return;

    const reference = memoryService.getEnhancedReference(selectedTemplate.templateId, inputText, true);
    
    await vscode.env.clipboard.writeText(reference);
    
    vscode.window.showInformationMessage(
      '🧠 增强引用已复制! 包含相关历史对话和提示词模板',
      '🚀 打开Cursor聊天'
    ).then((action) => {
      if (action === '🚀 打开Cursor聊天') {
        vscode.commands.executeCommand('workbench.panel.chat.view.focus');
      }
    });
  });

  // 注册所有命令
      context.subscriptions.push(
      smartReferenceCmd,
      quickReferenceCmd,
      showStatusCmd,
      intelligentRecommendCmd,
      templateReferenceCmd,
      browseCategoriesCmd,
      restartServiceCmd,
      solutionReferenceCmd,
      promptManagerCmd,
      enhancedReferenceCmd,
      statusBarItem
    );
}

/**
 * 显示快速引用面板 - 智能项目上下文引用
 */
async function showQuickReferencePanel(): Promise<void> {
  const quickPickItems: vscode.QuickPickItem[] = [
    {
      label: '🌍 全局工程知识',
      description: '软件架构、设计模式、最佳实践',
      detail: '获取跨项目的通用工程知识引用'
    },
    {
      label: '📁 当前项目上下文',
      description: '项目特定的技术选型和解决方案',
      detail: '基于当前项目的技术栈和配置'
    },
    {
      label: '🔄 项目迭代记录',
      description: '版本演进、重构历史、问题解决',
      detail: '项目开发过程中的关键决策和改进'
    },
    {
      label: '⚡ 智能组合引用',
      description: '自动组合最相关的引用',
      detail: '根据当前上下文智能选择最合适的引用内容'
    },
    {
      label: '🎯 基于关键词',
      description: '输入关键词获取相关引用',
      detail: '根据特定关键词搜索相关的历史对话和提示词'
    }
  ];

  const selected = await vscode.window.showQuickPick(quickPickItems, {
    placeHolder: '选择快速引用类型',
    title: '⚡ 快速引用上下文'
  });

  if (!selected) return;

  switch (selected.label) {
    case '🌍 全局工程知识':
      await showGlobalPromptReference();
      break;
    case '📁 当前项目上下文':
      await showProjectContextReference();
      break;
    case '🔄 项目迭代记录':
      await showIterationReference();
      break;
    case '⚡ 智能组合引用':
      await showSmartCombinedReference();
      break;
    case '🎯 基于关键词':
      await showKeywordBasedReference();
      break;
  }
}

/**
 * 显示全局工程知识引用
 */
async function showGlobalPromptReference(): Promise<void> {
  const promptCenter = memoryService.getPromptCenter();
  const globalPrompts = promptCenter.getAllPrompts('global');
  
  if (globalPrompts.length === 0) {
    vscode.window.showInformationMessage('📭 暂无全局工程知识提示词');
    return;
  }

  const items: vscode.QuickPickItem[] = globalPrompts.map(prompt => ({
    label: `🌐 ${prompt.name}`,
    description: `[GLOBAL] ${prompt.description}`,
    detail: `🏷️ 标签: ${prompt.tags.join(', ')} | 📅 ${new Date(prompt.createdAt).toLocaleDateString()}`,
    alwaysShow: true
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: '选择全局工程知识',
    title: '🌍 全局工程知识引用'
  });

  if (selected) {
    const prompt = globalPrompts.find(p => p.name === selected.label.replace('🌐 ', ''));
    if (prompt) {
      await copyReferenceToClipboard(prompt.content, '全局工程知识');
    }
  }
}

/**
 * 显示项目上下文引用
 */
async function showProjectContextReference(): Promise<void> {
  const promptCenter = memoryService.getPromptCenter();
  const projectPrompts = promptCenter.getAllPrompts('project');
  const allSessions = memoryService.getAllSessions();
  const recentSessions = allSessions
    .sort((a, b) => b.lastActivity - a.lastActivity)
    .slice(0, 5);
  
  if (projectPrompts.length === 0 && recentSessions.length === 0) {
    vscode.window.showInformationMessage('📭 暂无项目上下文数据');
    return;
  }

  const items: vscode.QuickPickItem[] = [];
  
  // 添加项目提示词
  projectPrompts.forEach((prompt: any) => {
    items.push({
      label: `📁 ${prompt.name}`,
      description: `[PROJECT] ${prompt.description}`,
      detail: `🏷️ 项目提示词 | ${prompt.tags.join(', ')} | 📅 ${new Date(prompt.createdAt || Date.now()).toLocaleDateString()}`,
      alwaysShow: true
    });
  });

  // 添加最近会话
  recentSessions.forEach((session: any, index: number) => {
    // 🆕 严格的项目相关性判断
    const sessionContent = (session.title + ' ' + session.summary).toLowerCase();
    
    const projectKeywords = [
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
      'reference generator'
    ];
    
    const hasProjectKeywords = projectKeywords.some(keyword => 
      sessionContent.includes(keyword.toLowerCase())
    );
    
    const hasProjectTags = session.tags?.some((tag: any) => 
      (tag.name || tag).toLowerCase().includes('项目') ||
      (tag.name || tag).toLowerCase().includes('project') ||
      (tag.name || tag).toLowerCase().includes('cursor-chat-memory')
    );
    
    const isDevelopmentRelated = hasProjectKeywords && (
      sessionContent.includes('代码') ||
      sessionContent.includes('开发') ||
      sessionContent.includes('功能') ||
      sessionContent.includes('实现') ||
      sessionContent.includes('优化') ||
      sessionContent.includes('修复') ||
      sessionContent.includes('插件') ||
      sessionContent.includes('扩展') ||
      sessionContent.includes('web界面') ||
      sessionContent.includes('api') ||
      sessionContent.includes('typescript')
    );
    
    const isUnrelated = (
      sessionContent.includes('客户') ||
      sessionContent.includes('汽车') ||
      sessionContent.includes('家电') ||
      sessionContent.includes('手机') ||
      sessionContent.includes('行业') ||
      sessionContent.includes('25年') ||
      sessionContent.includes('同步空间') ||
      sessionContent.includes('文件都没了') ||
      sessionContent.includes('git') && !sessionContent.includes('cursor') ||
      sessionContent.includes('分支') && !sessionContent.includes('cursor')
    );
    
    const isProjectRelated = !isUnrelated && (hasProjectKeywords || hasProjectTags || isDevelopmentRelated);
    const sourceIcon = isProjectRelated ? '📁' : '🌐';
    const sourceLabel = isProjectRelated ? 'PROJECT' : 'GLOBAL';
    
    items.push({
      label: `${sourceIcon} ${session.title}`,
      description: `[${sourceLabel}] [${session.category}] ${'⭐'.repeat(Math.floor(session.importance * 5))}`,
      detail: `💬 历史会话 | ${session.summary}`,
      alwaysShow: true
    });
  });

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: '选择项目上下文',
    title: '📁 当前项目上下文引用'
  });

  if (selected) {
    if (selected.detail?.includes('项目提示词')) {
      // 项目提示词 - 从label中提取名称，移除📁前缀
      const promptName = selected.label.replace('📁 ', '');
      const prompt = projectPrompts.find((p: any) => p.name === promptName);
      if (prompt) {
        await copyReferenceToClipboard(prompt.content, '项目上下文');
      }
    } else if (selected.detail?.includes('会话')) {
      // 最近会话 - 从label中提取标题，移除图标前缀
      const sessionTitle = selected.label.replace(/^[📁🌐]\s/, '');
      const session = recentSessions.find((s: any) => s.title === sessionTitle);
      if (session) {
        const reference = memoryService.getCustomReference([session.id], '最近会话');
        await copyReferenceToClipboard(reference, '最近会话');
      }
    }
  }
}

/**
 * 显示迭代记录引用
 */
async function showIterationReference(): Promise<void> {
  const promptCenter = memoryService.getPromptCenter();
  const iterationPrompts = promptCenter.getAllPrompts('iteration');
  
  if (iterationPrompts.length === 0) {
    vscode.window.showInformationMessage('📭 暂无项目迭代记录');
    return;
  }

  const items: vscode.QuickPickItem[] = iterationPrompts.map((iteration: any) => ({
    label: `🔄 ${iteration.name}`,
    description: `[ITERATION] ${iteration.description}`,
    detail: `🏷️ 标签: ${iteration.tags.join(', ')} | 📅 ${new Date(iteration.updatedAt).toLocaleDateString()}`,
    alwaysShow: true
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: '选择项目迭代记录',
    title: '🔄 项目迭代记录引用'
  });

  if (selected) {
    const iteration = iterationPrompts.find((i: any) => i.name === selected.label.replace('🔄 ', ''));
    if (iteration) {
      await copyReferenceToClipboard(iteration.content, '迭代记录');
    }
  }
}

/**
 * 显示智能组合引用
 */
async function showSmartCombinedReference(): Promise<void> {
  const inputText = await vscode.window.showInputBox({
    prompt: '输入您的问题或上下文描述',
    placeHolder: '例如: 需要优化React组件性能、解决API调用问题...'
  });

  if (!inputText) return;

  // 生成智能组合引用
  const reference = memoryService.getEnhancedReference('smart-combined', inputText, true);
  
  if (reference.includes('没有找到')) {
    vscode.window.showInformationMessage('📭 没有找到相关的引用内容');
    return;
  }

  await copyReferenceToClipboard(reference, '智能组合引用');
}

/**
 * 显示基于关键词的引用
 */
async function showKeywordBasedReference(): Promise<void> {
  const inputText = await vscode.window.showInputBox({
    prompt: '输入关键词（用空格或逗号分隔）',
    placeHolder: '例如: React 性能优化, TypeScript 类型推断...'
  });

  if (!inputText) return;

  const keywords = inputText.split(/[,，\s]+/).filter(k => k.trim());
  
  if (keywords.length === 0) {
    vscode.window.showInformationMessage('请输入有效的关键词');
    return;
  }

  // 搜索相关会话
  const sessions = memoryService.getRecommendedSessions(inputText);
  
  // 搜索相关提示词
  const promptCenter = memoryService.getPromptCenter();
  const prompts = promptCenter.searchPrompts(keywords.join(' '));
  
  if (sessions.length === 0 && prompts.length === 0) {
    vscode.window.showInformationMessage('📭 没有找到相关的引用内容');
    return;
  }

  const items: vscode.QuickPickItem[] = [];
  
  // 添加相关会话
  sessions.forEach((session: any, index: number) => {
    // 🆕 严格的项目相关性判断
    const sessionContent = (session.title + ' ' + session.summary).toLowerCase();
    
    const projectKeywords = [
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
      'reference generator'
    ];
    
    const hasProjectKeywords = projectKeywords.some(keyword => 
      sessionContent.includes(keyword.toLowerCase())
    );
    
    const hasProjectTags = session.tags?.some((tag: any) => 
      (tag.name || tag).toLowerCase().includes('项目') ||
      (tag.name || tag).toLowerCase().includes('project') ||
      (tag.name || tag).toLowerCase().includes('cursor-chat-memory')
    );
    
    const isDevelopmentRelated = hasProjectKeywords && (
      sessionContent.includes('代码') ||
      sessionContent.includes('开发') ||
      sessionContent.includes('功能') ||
      sessionContent.includes('实现') ||
      sessionContent.includes('优化') ||
      sessionContent.includes('修复') ||
      sessionContent.includes('插件') ||
      sessionContent.includes('扩展') ||
      sessionContent.includes('web界面') ||
      sessionContent.includes('api') ||
      sessionContent.includes('typescript')
    );
    
    const isUnrelated = (
      sessionContent.includes('客户') ||
      sessionContent.includes('汽车') ||
      sessionContent.includes('家电') ||
      sessionContent.includes('手机') ||
      sessionContent.includes('行业') ||
      sessionContent.includes('25年') ||
      sessionContent.includes('同步空间') ||
      sessionContent.includes('文件都没了') ||
      sessionContent.includes('git') && !sessionContent.includes('cursor') ||
      sessionContent.includes('分支') && !sessionContent.includes('cursor')
    );
    
    const isProjectRelated = !isUnrelated && (hasProjectKeywords || hasProjectTags || isDevelopmentRelated);
    const sourceIcon = isProjectRelated ? '📁' : '🌐';
    const sourceLabel = isProjectRelated ? 'PROJECT' : 'GLOBAL';
    
    items.push({
      label: `${sourceIcon} ${session.title}`,
      description: `[${sourceLabel}] [${session.category}] ${'⭐'.repeat(Math.floor(session.importance * 5))}`,
      detail: `💬 历史会话 | ${session.summary}`,
      alwaysShow: true
    });
  });

  // 添加相关提示词
  prompts.forEach((prompt: any) => {
    const typeIcon = prompt.type === 'project' ? '📁' : prompt.type === 'iteration' ? '🔄' : '🌐';
    const typeLabel = prompt.type === 'project' ? 'PROJECT' : prompt.type === 'iteration' ? 'ITERATION' : 'GLOBAL';
    
    items.push({
      label: `${typeIcon} ${prompt.name}`,
      description: `[${typeLabel}] ${prompt.description}`,
      detail: `🧠 ${prompt.type} 提示词 | 🏷️ ${prompt.tags.join(', ')}`,
      alwaysShow: true
    });
  });

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: '选择引用内容',
    title: `🎯 关键词引用: ${keywords.join(', ')}`
  });

  if (selected) {
    if (selected.detail?.includes('历史会话')) {
      // 历史会话 - 从label中提取标题，移除图标前缀
      const sessionTitle = selected.label.replace(/^[📁🌐]\s/, '');
      const session = sessions.find((s: any) => s.title === sessionTitle);
      if (session) {
        const reference = memoryService.getCustomReference([session.id], '历史会话');
        await copyReferenceToClipboard(reference, '历史会话');
      }
    } else if (selected.detail?.includes('提示词')) {
      // 提示词 - 从label中提取名称，移除图标前缀
      const promptName = selected.label.replace(/^[📁🌐🔄]\s/, '');
      const prompt = prompts.find((p: any) => p.name === promptName);
      if (prompt) {
        await copyReferenceToClipboard(prompt.content, '提示词');
      }
    }
  }
}

/**
 * 复制引用到剪贴板并显示提示
 */
async function copyReferenceToClipboard(content: string, type: string): Promise<void> {
  await vscode.env.clipboard.writeText(content);
  
  vscode.window.showInformationMessage(
    `⚡ ${type}引用已复制到剪贴板!`,
    '🚀 打开Cursor聊天'
  ).then((action) => {
    if (action === '🚀 打开Cursor聊天') {
      vscode.commands.executeCommand('workbench.panel.chat.view.focus');
    }
  });
}

/**
 * 显示智能引用面板
 */
async function showSmartReferencePanel(): Promise<void> {
  const items: vscode.QuickPickItem[] = [
    {
      label: '🎯 智能推荐',
      description: '基于输入获取相关对话',
      detail: '输入关键词，AI将推荐最相关的历史对话'
    },
    {
      label: '📋 使用模板',
      description: '预设的引用模板',
      detail: '快速使用预定义的引用模板'
    },
    {
      label: '📂 分类浏览',
      description: '按分类查看对话',
      detail: '根据技术分类浏览历史对话'
    },
    {
      label: '🔍 搜索对话',
      description: '搜索特定内容',
      detail: '在所有历史对话中搜索关键词'
    }
  ];

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: '选择引用方式',
    title: '🧠 智能聊天引用'
  });

  if (selected) {
    switch (selected.label) {
      case '🎯 智能推荐':
        vscode.commands.executeCommand('cursorChatMemory.intelligentRecommend');
        break;
      case '📋 使用模板':
        vscode.commands.executeCommand('cursorChatMemory.templateReference');
        break;
      case '📂 分类浏览':
        vscode.commands.executeCommand('cursorChatMemory.browseCategories');
        break;
      case '🔍 搜索对话':
        await showSearchPanel();
        break;
    }
  }
}

/**
 * 显示主菜单
 */
async function showMainMenu(): Promise<void> {
  const sessions = memoryService.getAllSessions();
  const categories = memoryService.getCategoryStats();
  const totalSessions = sessions.length;
  const activeCategories = Array.from(categories.values()).filter(c => c.count > 0).length;

  const items: vscode.QuickPickItem[] = [
    {
      label: '⚡ 快速引用',
      description: '最近重要对话',
      detail: '立即引用最近的重要对话内容'
    },
    {
      label: '🎯 智能引用',
      description: '基于上下文推荐',
      detail: '打开智能引用选择面板'
    },
    {
      label: '📊 查看统计',
      description: `${totalSessions}个会话，${activeCategories}个分类`,
      detail: '查看详细的会话统计信息'
    },
    {
      label: '🔄 刷新缓存',
      description: '重新扫描聊天文件',
      detail: '强制刷新内存缓存'
    },
    {
      label: '⚙️ 设置',
      description: '配置插件选项',
      detail: '打开设置页面'
    }
  ];

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: '选择一个操作',
    title: '🧠 Enhanced Cursor Chat Memory'
  });

  if (selected) {
    switch (selected.label) {
      case '⚡ 快速引用':
        vscode.commands.executeCommand('cursorChatMemory.quickReference');
        break;
      case '🎯 智能引用':
        await showSmartReferencePanel();
        break;
      case '📊 查看统计':
        await showStatisticsPanel();
        break;
      case '🔄 刷新缓存':
        refreshCache();
        break;
      case '⚙️ 设置':
        vscode.commands.executeCommand('workbench.action.openSettings', 'cursorChatMemory');
        break;
    }
  }
}

/**
 * 显示模板选择面板
 */
async function showTemplateSelectionPanel(): Promise<void> {
  const templates = memoryService.getAvailableTemplates();
  
  const items: vscode.QuickPickItem[] = templates.map(template => ({
    label: template.name,
    description: template.description,
    detail: `ID: ${template.id}`,
    alwaysShow: true
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: '选择引用模板',
    title: '📋 预设引用模板'
  });

  if (selected) {
    const templateId = templates.find(t => t.name === selected.label)?.id;
    if (templateId) {
      let inputText: string | undefined;
      
      // 如果是智能推荐模板，需要用户输入
      if (templateId === 'current-topic') {
        inputText = await vscode.window.showInputBox({
          prompt: '输入当前讨论的主题',
          placeHolder: '例如: React组件优化'
        });
        if (!inputText) return;
      }
      
      const reference = memoryService.getReferenceByTemplate(templateId, inputText);
      
      if (reference.includes('没有找到')) {
        vscode.window.showInformationMessage('📭 该模板没有匹配的对话');
        return;
      }

      await vscode.env.clipboard.writeText(reference);
      vscode.window.showInformationMessage(`✅ ${selected.label} 引用已复制到剪贴板！`);
    }
  }
}

/**
 * 显示分类浏览器
 */
async function showCategoryBrowser(): Promise<void> {
  const categories = memoryService.getCategoryStats();
  
  const items: vscode.QuickPickItem[] = Array.from(categories.entries())
    .filter(([_, info]) => info.count > 0)
    .map(([name, info]) => ({
      label: `📁 ${name}`,
      description: `${info.count} 个会话`,
      detail: `关键词: ${info.keywords.slice(0, 3).join(', ')}`,
      alwaysShow: true
    }));

  if (items.length === 0) {
    vscode.window.showInformationMessage('📭 暂无分类数据');
    return;
  }

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: '选择一个分类',
    title: '📂 按分类浏览'
  });

  if (selected) {
    const categoryName = selected.label.replace('📁 ', '');
    const sessions = memoryService.getSessionsByCategory(categoryName);
    await showSessionSelectionPanel(sessions, `分类: ${categoryName}`);
  }
}

/**
 * 显示会话选择面板
 */
async function showSessionSelectionPanel(sessions: any[], title: string): Promise<void> {
  if (sessions.length === 0) {
    vscode.window.showInformationMessage('📭 没有找到相关会话');
    return;
  }

  const items: vscode.QuickPickItem[] = sessions.map((session, index) => {
    const tagsText = session.tags.map((tag: any) => `#${tag.name}`).join(' ');
    const importanceStars = '⭐'.repeat(Math.floor(session.importance * 5));
    
    return {
      label: `${index + 1}. ${session.title}`,
      description: `[${session.category}] ${importanceStars}`,
      detail: `${tagsText} | ${session.summary}`,
      alwaysShow: true
    };
  });

  // 添加批量选择选项
  items.unshift(
    {
      label: '📋 全部引用',
      description: '引用所有列出的会话',
      detail: `将 ${sessions.length} 个会话全部添加到引用中`
    },
    {
      label: '⭐ 仅重要会话',
      description: '只引用重要性高的会话',
      detail: '筛选重要性 ≥ 0.6 的会话'
    }
  );

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: '选择要引用的会话',
    title: title,
    canPickMany: true
  });

  if (selected && selected.length > 0) {
    let selectedSessions: any[] = [];
    
    // 处理特殊选项
    if (selected.some(item => item.label === '📋 全部引用')) {
      selectedSessions = sessions;
    } else if (selected.some(item => item.label === '⭐ 仅重要会话')) {
      selectedSessions = sessions.filter(s => s.importance >= 0.6);
    } else {
      // 处理具体会话选择
      selectedSessions = selected
        .filter(item => !item.label.startsWith('📋') && !item.label.startsWith('⭐'))
        .map(item => {
          const index = parseInt(item.label.split('.')[0]) - 1;
          return sessions[index];
        })
        .filter(session => session !== undefined);
    }

    if (selectedSessions.length === 0) {
      vscode.window.showInformationMessage('❌ 没有选择有效的会话');
      return;
    }

    const sessionIds = selectedSessions.map(s => s.id);
    const reference = memoryService.getCustomReference(sessionIds, title);
    
    await vscode.env.clipboard.writeText(reference);
    vscode.window.showInformationMessage(`✅ ${selectedSessions.length}个会话的引用已复制到剪贴板！`);
  }
}

/**
 * 显示搜索面板
 */
async function showSearchPanel(): Promise<void> {
  const query = await vscode.window.showInputBox({
    prompt: '输入搜索关键词',
    placeHolder: '例如: 性能优化、错误处理、API设计...'
  });

  if (!query) return;

  const results = memoryService.searchSessions(query);
  
  if (results.length === 0) {
    vscode.window.showInformationMessage(`📭 没有找到包含 "${query}" 的对话`);
    return;
  }

  await showSessionSelectionPanel(results, `搜索结果: ${query}`);
}

/**
 * 显示统计面板
 */
async function showStatisticsPanel(): Promise<void> {
  const sessions = memoryService.getAllSessions();
  const categories = memoryService.getCategoryStats();
  
  const panel = vscode.window.createWebviewPanel(
    'chatMemoryStats',
    '📊 聊天记忆统计',
    vscode.ViewColumn.Beside,
    { enableScripts: true }
  );

  panel.webview.html = getStatisticsHtml(sessions, categories);
}

/**
 * 获取统计HTML
 */
function getStatisticsHtml(sessions: any[], categories: Map<string, any>): string {
  const totalSessions = sessions.length;
  const totalImportance = sessions.reduce((sum, s) => sum + s.importance, 0);
  const avgImportance = totalSessions > 0 ? (totalImportance / totalSessions).toFixed(2) : '0';
  
  const categoryStats = Array.from(categories.entries())
    .filter(([_, info]) => info.count > 0)
    .sort((a, b) => b[1].count - a[1].count);

  const categoryHtml = categoryStats.map(([name, info]) => `
    <div class="category-item">
      <span class="category-name" style="color: ${info.color}">${name}</span>
      <span class="category-count">${info.count}</span>
    </div>
  `).join('');

  const recentSessions = sessions.slice(0, 5);
  const recentHtml = recentSessions.map(session => `
    <div class="session-item">
      <div class="session-title">${session.title}</div>
      <div class="session-meta">[${session.category}] ${'⭐'.repeat(Math.floor(session.importance * 5))}</div>
      <div class="session-summary">${session.summary}</div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: var(--vscode-editor-foreground);
                background-color: var(--vscode-editor-background);
                padding: 20px;
            }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            .stat-card {
                background: var(--vscode-textCodeBlock-background);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 8px;
                padding: 15px;
                text-align: center;
            }
            .stat-number {
                font-size: 2em;
                font-weight: bold;
                color: var(--vscode-textLink-foreground);
            }
            .stat-label {
                color: var(--vscode-descriptionForeground);
                margin-top: 5px;
            }
            .section {
                margin: 30px 0;
            }
            .section-title {
                font-size: 1.2em;
                font-weight: bold;
                margin-bottom: 15px;
                border-bottom: 1px solid var(--vscode-panel-border);
                padding-bottom: 5px;
            }
            .category-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid var(--vscode-widget-border);
            }
            .category-name {
                font-weight: 500;
            }
            .category-count {
                background: var(--vscode-badge-background);
                color: var(--vscode-badge-foreground);
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 0.9em;
            }
            .session-item {
                background: var(--vscode-textCodeBlock-background);
                border-radius: 6px;
                padding: 12px;
                margin-bottom: 10px;
            }
            .session-title {
                font-weight: 500;
                margin-bottom: 5px;
            }
            .session-meta {
                color: var(--vscode-descriptionForeground);
                font-size: 0.9em;
                margin-bottom: 5px;
            }
            .session-summary {
                font-size: 0.9em;
                color: var(--vscode-editor-foreground);
            }
        </style>
    </head>
    <body>
        <h1>📊 Cursor Chat Memory 统计</h1>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${totalSessions}</div>
                <div class="stat-label">总会话数</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${categoryStats.length}</div>
                <div class="stat-label">活跃分类</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${avgImportance}</div>
                <div class="stat-label">平均重要性</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">📂 分类分布</div>
            ${categoryHtml}
        </div>

        <div class="section">
            <div class="section-title">🕒 最近会话</div>
            ${recentHtml}
        </div>
    </body>
    </html>
  `;
}

/**
 * 启动记忆服务
 */
async function startMemoryService() {
  try {
    await memoryService.start();
  } catch (error) {
    console.error('❌ Failed to start memory service:', error);
    vscode.window.showErrorMessage(`启动记忆服务失败: ${error instanceof Error ? error.message : String(error)}`);
    updateStatusBar('❌ Error', '记忆服务启动失败');
  }
}

/**
 * 重启记忆服务
 */
async function restartMemoryService() {
  try {
    updateStatusBar('🔄 Restarting...', '正在重启服务');
    
    if (memoryService) {
      memoryService.stop();
    }
    
    memoryService = new ChatMemoryService();
    setupServiceListeners();
    await startMemoryService();
    
    vscode.window.showInformationMessage('✅ 记忆服务已重启');
  } catch (error) {
    console.error('❌ Failed to restart memory service:', error);
    vscode.window.showErrorMessage(`重启服务失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 设置服务事件监听
 */
function setupServiceListeners() {
  memoryService.on('started', () => {
    console.log('✅ Enhanced Memory service started');
    updateStatusBar('🧠 Memory: Active', '增强记忆服务已激活');
  });

  memoryService.on('stopped', () => {
    console.log('🛑 Enhanced Memory service stopped');
    updateStatusBar('🧠 Memory: Stopped', '增强记忆服务已停止');
  });

  memoryService.on('sessionUpdated', (session) => {
    console.log(`🔄 Session updated: ${session.title} [${session.category}]`);
    updateStatusBar('🧠 Memory: Updated', '会话已更新');
    
    const config = vscode.workspace.getConfiguration('cursorChatMemory');
    if (config.get('showUpdateNotifications', false)) {
      vscode.window.showInformationMessage(`📝 新会话: ${session.title}`);
    }
  });

  memoryService.on('error', (error) => {
    console.error('❌ Enhanced Memory service error:', error);
    updateStatusBar('❌ Error', '服务出错');
    vscode.window.showErrorMessage(`记忆服务错误: ${error instanceof Error ? error.message : String(error)}`);
  });
}

/**
 * 更新状态栏
 */
function updateStatusBar(text: string, tooltip?: string) {
  if (statusBarItem) {
    statusBarItem.text = text;
    if (tooltip) {
      statusBarItem.tooltip = tooltip;
    }
  }
}

/**
 * 刷新缓存
 */
async function refreshCache() {
  try {
    updateStatusBar('🔄 Refreshing...', '正在刷新缓存');
    
    await restartMemoryService();
    
    vscode.window.showInformationMessage('✅ 缓存已刷新');
  } catch (error) {
    console.error('❌ Failed to refresh cache:', error);
    vscode.window.showErrorMessage(`刷新缓存失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}
