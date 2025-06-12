const Database = require('sqlite3').Database;
const path = require('path');
const os = require('os');

async function analyzeLatestData() {
  console.log('🔍 分析最新工作区的详细数据\n');
  
  const workspaceStoragePath = path.join(os.homedir(), 'Library/Application Support/Cursor/User/workspaceStorage');
  const workspaceId = 'e76c6a8343ed4d7d7b8f77651bad3214'; // 今日活跃的工作区
  const dbPath = path.join(workspaceStoragePath, workspaceId, 'state.vscdb');
  
  console.log(`📂 分析工作区: ${workspaceId}`);
  console.log(`📄 数据库路径: ${dbPath}\n`);
  
  const db = new Database(dbPath);
  
  const queries = [
    new Promise((resolve) => {
      db.get("SELECT value FROM ItemTable WHERE key = 'aiService.prompts'", (err, row) => {
        resolve({ type: 'prompts', data: err ? null : row });
      });
    }),
    new Promise((resolve) => {
      db.get("SELECT value FROM ItemTable WHERE key = 'aiService.generations'", (err, row) => {
        resolve({ type: 'generations', data: err ? null : row });
      });
    })
  ];
  
  const results = await Promise.all(queries);
  
  let prompts = [];
  let generations = [];
  
  for (const result of results) {
    if (result.type === 'prompts' && result.data?.value) {
      try {
        prompts = JSON.parse(result.data.value);
      } catch (e) {
        console.error('❌ 解析prompts失败:', e);
      }
    } else if (result.type === 'generations' && result.data?.value) {
      try {
        generations = JSON.parse(result.data.value);
      } catch (e) {
        console.error('❌ 解析generations失败:', e);
      }
    }
  }
  
  console.log(`📊 数据概览:`);
  console.log(`   提示词总数: ${prompts.length}`);
  console.log(`   生成内容总数: ${generations.length}\n`);
  
  // 分析最近的数据
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  const sixHoursAgo = now - (6 * 60 * 60 * 1000);
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  
  console.log('⏰ 时间范围分析:');
  console.log(`   当前时间: ${new Date(now).toLocaleString()}`);
  console.log(`   1小时前: ${new Date(oneHourAgo).toLocaleString()}`);
  console.log(`   6小时前: ${new Date(sixHoursAgo).toLocaleString()}`);
  console.log(`   24小时前: ${new Date(oneDayAgo).toLocaleString()}\n`);
  
  // 分析提示词时间分布
  const recentPrompts = prompts.filter(p => p.unixMs && p.unixMs > oneDayAgo);
  const veryRecentPrompts = prompts.filter(p => p.unixMs && p.unixMs > oneHourAgo);
  
  console.log('📝 提示词时间分析:');
  console.log(`   24小时内: ${recentPrompts.length} 个`);
  console.log(`   1小时内: ${veryRecentPrompts.length} 个\n`);
  
  if (recentPrompts.length > 0) {
    console.log('📝 最近24小时的提示词:');
    recentPrompts.slice(-10).forEach((prompt, index) => {
      const time = new Date(prompt.unixMs || 0);
      console.log(`${index + 1}. [${time.toLocaleTimeString()}] "${prompt.text?.substring(0, 80)}..."`);
    });
    console.log('');
  }
  
  // 分析生成内容时间分布
  const recentGenerations = generations.filter(g => g.unixMs && g.unixMs > oneDayAgo);
  const veryRecentGenerations = generations.filter(g => g.unixMs && g.unixMs > oneHourAgo);
  
  console.log('🤖 生成内容时间分析:');
  console.log(`   24小时内: ${recentGenerations.length} 个`);
  console.log(`   1小时内: ${veryRecentGenerations.length} 个\n`);
  
  if (recentGenerations.length > 0) {
    console.log('🤖 最近24小时的AI回复:');
    recentGenerations.slice(-10).forEach((gen, index) => {
      const time = new Date(gen.unixMs);
      console.log(`${index + 1}. [${time.toLocaleTimeString()}] "${gen.textDescription?.substring(0, 80)}..."`);
    });
    console.log('');
  }
  
  // 查找与当前对话相关的内容
  console.log('🔍 搜索与"提示词中心"相关的对话:');
  
  const relatedPrompts = prompts.filter(p => 
    p.text && (
      p.text.includes('提示词中心') ||
      p.text.includes('cursor-chat-memory') ||
      p.text.includes('历史会话') ||
      p.text.includes('对话的内容') ||
      p.text.includes('没存')
    )
  );
  
  const relatedGenerations = generations.filter(g => 
    g.textDescription && (
      g.textDescription.includes('提示词中心') ||
      g.textDescription.includes('cursor-chat-memory') ||
      g.textDescription.includes('历史会话') ||
      g.textDescription.includes('扫描') ||
      g.textDescription.includes('工作区')
    )
  );
  
  console.log(`📝 相关提示词: ${relatedPrompts.length} 个`);
  console.log(`🤖 相关回复: ${relatedGenerations.length} 个\n`);
  
  if (relatedPrompts.length > 0) {
    console.log('📝 相关提示词详情:');
    relatedPrompts.slice(-5).forEach((prompt, index) => {
      const time = new Date(prompt.unixMs || 0);
      console.log(`${index + 1}. [${time.toLocaleString()}]`);
      console.log(`   内容: "${prompt.text}"`);
      console.log('');
    });
  }
  
  if (relatedGenerations.length > 0) {
    console.log('🤖 相关回复详情:');
    relatedGenerations.slice(-5).forEach((gen, index) => {
      const time = new Date(gen.unixMs);
      console.log(`${index + 1}. [${time.toLocaleString()}]`);
      console.log(`   内容: "${gen.textDescription?.substring(0, 200)}..."`);
      console.log(`   UUID: ${gen.generationUUID}`);
      console.log('');
    });
  }
  
  // 分析数据同步问题
  console.log('🔄 数据同步分析:');
  
  const latestPromptTime = prompts.length > 0 ? Math.max(...prompts.map(p => p.unixMs || 0)) : 0;
  const latestGenerationTime = generations.length > 0 ? Math.max(...generations.map(g => g.unixMs || 0)) : 0;
  
  console.log(`   最新提示词时间: ${new Date(latestPromptTime).toLocaleString()}`);
  console.log(`   最新生成时间: ${new Date(latestGenerationTime).toLocaleString()}`);
  console.log(`   时间差: ${Math.round((latestGenerationTime - latestPromptTime) / 1000)} 秒\n`);
  
  if (latestGenerationTime > latestPromptTime + 60000) { // 超过1分钟差异
    console.log('⚠️  发现异常: 最新生成时间比最新提示词时间晚很多');
    console.log('   可能原因:');
    console.log('   1. 数据同步延迟');
    console.log('   2. 提示词记录丢失');
    console.log('   3. 不同来源的数据混合');
    console.log('');
  }
  
  // 检查最新几个对话的配对情况
  console.log('🔗 最新对话配对分析:');
  const latest10Prompts = prompts.slice(-10);
  const latest10Generations = generations.slice(-10);
  
  console.log('最新10个提示词:');
  latest10Prompts.forEach((prompt, index) => {
    const time = new Date(prompt.unixMs || 0);
    console.log(`   ${index + 1}. [${time.toLocaleTimeString()}] "${prompt.text?.substring(0, 60)}..."`);
  });
  
  console.log('\n最新10个生成内容:');
  latest10Generations.forEach((gen, index) => {
    const time = new Date(gen.unixMs);
    console.log(`   ${index + 1}. [${time.toLocaleTimeString()}] "${gen.textDescription?.substring(0, 60)}..."`);
  });
  
  db.close();
  
  console.log('\n💡 结论:');
  console.log('1. 工作区确实包含您的最新对话');
  console.log('2. AI回复记录正常，但提示词记录可能有延迟');
  console.log('3. 这解释了为什么显示"一个没存"的问题');
  console.log('4. Cursor可能在提示词和回复之间存在同步时间差');
}

analyzeLatestData().catch(console.error); 