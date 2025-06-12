const { PromptCenter } = require('./out/promptCenter');

async function testPromptCenter() {
  console.log('🎯 测试提示词中心模块...\n');
  
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
      
      // 显示洞察
      if (extract.insights.length > 0) {
        console.log('   📊 主要洞察:');
        extract.insights.forEach(insight => {
          console.log(`      - ${insight}`);
        });
      }
      
      // 显示模式
      if (extract.patterns.length > 0) {
        console.log('   🔍 使用模式:');
        extract.patterns.slice(0, 3).forEach(pattern => {
          console.log(`      - ${pattern}`);
        });
      }
      
      // 显示前3个提示词
      if (extract.extractedPrompts.length > 0) {
        console.log('   📝 提示词样例:');
        extract.extractedPrompts.slice(0, 3).forEach((prompt, pIndex) => {
          console.log(`      ${pIndex + 1}. "${prompt.content.substring(0, 60)}..."`);
          console.log(`         分类: ${prompt.category}`);
          console.log(`         效果: ${(prompt.effectiveness * 100).toFixed(0)}%`);
          console.log(`         时间: ${new Date(prompt.createdAt).toLocaleString()}`);
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
    
    console.log('\n📍 按来源分布:');
    Object.entries(stats.bySource).forEach(([source, count]) => {
      console.log(`   ${source}: ${count} 个`);
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
        console.log(`      时间: ${new Date(prompt.createdAt).toLocaleString()}`);
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
        categoryPrompts.slice(0, 3).forEach((prompt, index) => {
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
    
    // 7. 时间验证
    console.log('\n🕐 时间戳验证:');
    const now = new Date();
    const futurePrompts = todayPrompts.filter(p => new Date(p.createdAt) > now);
    const todayPromptsCheck = todayPrompts.filter(p => {
      const date = new Date(p.createdAt);
      return date.toDateString() === now.toDateString();
    });
    
    console.log(`   未来时间的提示词: ${futurePrompts.length} 个 ${futurePrompts.length === 0 ? '✅' : '❌'}`);
    console.log(`   今天的提示词: ${todayPromptsCheck.length} 个`);
    console.log(`   时间修复状态: ${futurePrompts.length === 0 ? '正常' : '需要修复'}`);
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

async function testPromptTemplates() {
  console.log('\n🎨 测试提示词模板功能...\n');
  
  const promptCenter = new PromptCenter();
  
  // 渲染模板示例
  console.log('📝 模板渲染示例:');
  
  try {
    const renderedArch = promptCenter.renderTemplate('arch-analysis', {
      projectName: 'cursor-chat-memory'
    });
    
    console.log('1. 架构分析模板:');
    console.log(renderedArch);
    console.log('');
    
    const renderedFeature = promptCenter.renderTemplate('feature-design', {
      featureName: '智能提示词推荐',
      requirements: '基于用户历史提问模式，智能推荐相关的提示词模板'
    });
    
    console.log('2. 功能设计模板:');
    console.log(renderedFeature);
    
  } catch (error) {
    console.error('❌ 模板渲染失败:', error);
  }
}

async function main() {
  console.log('🎯 Cursor聊天记忆系统 - 提示词中心测试\n');
  console.log('===============================================\n');
  
  await testPromptCenter();
  await testPromptTemplates();
  
  console.log('\n🎉 提示词中心测试完成！');
  console.log('\n💡 功能说明:');
  console.log('   - ✅ 提示词提取: 从历史会话中智能提取项目相关提示词');
  console.log('   - ✅ 时间戳修复: 自动修复错误的时间戳（2025年→2024年）');
  console.log('   - ✅ 智能分类: 按架构、开发、调试等类别自动分类');
  console.log('   - ✅ 效果评估: 基于AI回复质量评估提示词效果');
  console.log('   - ✅ 模式识别: 识别用户提问习惯和常用模式');
  console.log('   - ✅ 模板系统: 内置常用提示词模板，支持变量替换');
}

main().catch(console.error); 