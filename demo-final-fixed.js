const { PromptCenter } = require('./out/promptCenter');

async function demonstrateFinalFix() {
  console.log('🎯 最终修复版本 - Cursor聊天记忆提示词中心演示\n');
  console.log('================================================\n');
  
  const promptCenter = new PromptCenter();
  
  try {
    // 🔍 从会话中提取提示词
    console.log('📂 从Cursor会话中提取提示词...');
    const projectPath = '/Users/jay/Documents/baidu/projects/cursor-chat-memory';
    const extracts = await promptCenter.extractFromConversations(projectPath);
    
    console.log(`✅ 成功提取 ${extracts.length} 个会话的数据\n`);
    
    // 🔄 更新提示词数据库
    promptCenter.updatePromptsFromExtracts(extracts);
    
    // 📊 显示统计信息
    const stats = promptCenter.getStatistics();
    console.log('📊 提示词统计信息:');
    console.log(`   总提示词数量: ${stats.total}`);
    console.log(`   平均效果评分: ${(stats.avgEffectiveness * 100).toFixed(1)}%`);
    console.log(`   分类分布:`);
    Object.entries(stats.byCategory).forEach(([category, count]) => {
      console.log(`     ${category}: ${count}个`);
    });
    console.log('');
    
    // 🗓️ 今天的提示词（修复时间戳后）
    console.log('📅 今天的提示词 (修复时间戳后):');
    const todayPrompts = promptCenter.getTodayPrompts();
    console.log(`   找到 ${todayPrompts.length} 个今天的提示词\n`);
    
    // 显示前5个今天的提示词
    todayPrompts.slice(0, 5).forEach((prompt, index) => {
      const date = new Date(prompt.createdAt);
      console.log(`${index + 1}. [${prompt.category}] "${prompt.content.substring(0, 60)}..."`);
      console.log(`   时间: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`);
      console.log(`   标签: ${prompt.tags.join(', ')}`);
      console.log(`   效果: ${(prompt.effectiveness * 100).toFixed(0)}%\n`);
    });
    
    // 🏷️ 标签统计
    console.log('🏷️ 热门标签:');
    const tagCounts = {};
    todayPrompts.forEach(prompt => {
      prompt.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    const sortedTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
      
    sortedTags.forEach(([tag, count]) => {
      console.log(`   ${tag}: ${count}次`);
    });
    console.log('');
    
    // 🛠️ 测试模板系统
    console.log('🛠️ 内置模板演示:');
    const templates = promptCenter.getTemplates();
    console.log(`   可用模板: ${templates.length}个\n`);
    
    // 使用架构分析模板
    const archTemplate = templates.find(t => t.id === 'architecture-analysis');
    if (archTemplate) {
      console.log('📋 架构分析模板示例:');
      const rendered = promptCenter.renderTemplate('architecture-analysis', {
        component: 'PromptCenter类',
        context: 'cursor-chat-memory项目中的提示词管理'
      });
      console.log(`   渲染结果: "${rendered.substring(0, 100)}..."\n`);
    }
    
    // 🎯 洞察分析
    console.log('🧠 智能洞察:');
    extracts.forEach((extract, index) => {
      if (extract.insights.length > 0) {
        console.log(`   会话 ${index + 1}:`);
        extract.insights.forEach(insight => {
          console.log(`     💡 ${insight}`);
        });
        console.log('');
      }
    });
    
    // ⚡ 使用模式分析
    console.log('⚡ 使用模式:');
    extracts.forEach((extract, index) => {
      if (extract.patterns.length > 0) {
        console.log(`   会话 ${index + 1}:`);
        extract.patterns.forEach(pattern => {
          console.log(`     🔄 ${pattern}`);
        });
        console.log('');
      }
    });
    
    // 🔍 测试特定场景
    console.log('🔍 特定场景测试:');
    
    // 测试包含"2025/1/14"的提示词是否被修复
    const dateTestPrompts = todayPrompts.filter(p => 
      p.content.includes('2024/1/14') || p.content.includes('2025/1/14')
    );
    
    if (dateTestPrompts.length > 0) {
      console.log(`   ✅ 找到 ${dateTestPrompts.length} 个包含日期的提示词:`);
      dateTestPrompts.forEach((prompt, index) => {
        console.log(`   ${index + 1}. "${prompt.content.substring(0, 80)}..."`);
        console.log(`      创建时间: ${new Date(prompt.createdAt).toLocaleString()}`);
        
        // 检查是否包含修复后的日期
        if (prompt.content.includes('2024/1/14')) {
          console.log(`      ✅ 日期已修复: 2025/1/14 -> 2024/1/14`);
        }
        console.log('');
      });
    } else {
      console.log('   📝 未找到包含特定日期的提示词');
    }
    
    // ⏰ 时间戳验证
    console.log('⏰ 时间戳验证:');
    const now = new Date();
    const futurePrompts = todayPrompts.filter(p => new Date(p.createdAt).getFullYear() === 2025);
    const currentYearPrompts = todayPrompts.filter(p => new Date(p.createdAt).getFullYear() === 2024);
    
    console.log(`   当前年份 (2024): ${currentYearPrompts.length} 个提示词`);
    console.log(`   未来年份 (2025): ${futurePrompts.length} 个提示词`);
    
    if (futurePrompts.length === 0) {
      console.log(`   ✅ 时间戳修复成功！所有提示词都显示正确年份`);
    } else {
      console.log(`   ⚠️  还有 ${futurePrompts.length} 个提示词显示为2025年`);
    }
    
    console.log('\n🎉 提示词中心演示完成！');
    console.log('\n💡 功能总结:');
    console.log('   ✅ 智能提示词提取和分类');
    console.log('   ✅ 时间戳修复 (2025年 -> 2024年)');
    console.log('   ✅ 内容日期修复 (文本中的2025/1/14 -> 2024/1/14)');
    console.log('   ✅ 效果评估和统计分析');
    console.log('   ✅ 内置模板系统');
    console.log('   ✅ 标签和模式识别');
    console.log('   ✅ 项目相关性过滤');
    
  } catch (error) {
    console.error('❌ 演示过程中出现错误:', error);
    console.error('堆栈跟踪:', error.stack);
  }
}

demonstrateFinalFix().catch(console.error); 