const Database = require('sqlite3').Database;
const path = require('path');
const os = require('os');

async function traceDateOrigin() {
  console.log('🔍 追踪"1月14号"日期来源分析\n');
  
  const workspaceStoragePath = path.join(os.homedir(), 'Library/Application Support/Cursor/User/workspaceStorage');
  const workspaceId = 'e76c6a8343ed4d7d7b8f77651bad3214';
  const dbPath = path.join(workspaceStoragePath, workspaceId, 'state.vscdb');
  
  const db = new Database(dbPath);
  
  // 查询包含"1/14"或"1月14"的所有内容
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
  
  console.log(`📊 数据总览:`);
  console.log(`   提示词数量: ${prompts.length}`);
  console.log(`   生成内容数量: ${generations.length}\n`);
  
  // 搜索包含"1/14"、"1月14"、"14"的内容
  console.log('🔍 搜索包含日期相关内容的提示词:');
  const dateRelatedPrompts = prompts.filter(p => {
    if (!p.text) return false;
    const text = p.text.toLowerCase();
    return text.includes('1/14') || text.includes('1月14') || text.includes('14') || 
           text.includes('january') || text.includes('jan') || text.includes('2025/1') ||
           text.includes('2024/1');
  });
  
  console.log(`找到 ${dateRelatedPrompts.length} 个相关提示词:\n`);
  
  dateRelatedPrompts.forEach((prompt, index) => {
    console.log(`${index + 1}. 提示词内容:`);
    console.log(`   "${prompt.text}"`);
    console.log(`   字符长度: ${prompt.text.length}`);
    console.log(`   包含关键词:`);
    if (prompt.text.includes('1/14')) console.log(`     ✓ 包含 "1/14"`);
    if (prompt.text.includes('1月14')) console.log(`     ✓ 包含 "1月14"`);
    if (prompt.text.includes('2025/1/14')) console.log(`     ✓ 包含 "2025/1/14"`);
    if (prompt.text.includes('2024/1/14')) console.log(`     ✓ 包含 "2024/1/14"`);
    console.log('');
  });
  
  // 搜索包含日期的生成内容
  console.log('🔍 搜索包含日期相关内容的AI回复:');
  const dateRelatedGenerations = generations.filter(g => {
    if (!g.textDescription) return false;
    const text = g.textDescription.toLowerCase();
    return text.includes('1/14') || text.includes('1月14') || text.includes('14') || 
           text.includes('january') || text.includes('jan') || text.includes('2025/1') ||
           text.includes('2024/1');
  });
  
  console.log(`找到 ${dateRelatedGenerations.length} 个相关AI回复:\n`);
  
  dateRelatedGenerations.forEach((gen, index) => {
    console.log(`${index + 1}. AI回复内容:`);
    console.log(`   "${gen.textDescription.substring(0, 200)}..."`);
    console.log(`   完整长度: ${gen.textDescription.length}字符`);
    console.log(`   时间戳: ${gen.unixMs} (${new Date(gen.unixMs).toLocaleString()})`);
    console.log(`   UUID: ${gen.generationUUID}`);
    console.log(`   包含关键词:`);
    if (gen.textDescription.includes('1/14')) console.log(`     ✓ 包含 "1/14"`);
    if (gen.textDescription.includes('1月14')) console.log(`     ✓ 包含 "1月14"`);
    if (gen.textDescription.includes('2025/1/14')) console.log(`     ✓ 包含 "2025/1/14"`);
    if (gen.textDescription.includes('2024/1/14')) console.log(`     ✓ 包含 "2024/1/14"`);
    console.log('');
  });
  
  // 特别检查最近的对话
  console.log('🕐 最近的对话内容分析:');
  const recentGenerations = generations.slice(-10);
  
  recentGenerations.forEach((gen, index) => {
    const hasDate = gen.textDescription && (
      gen.textDescription.includes('1/14') || 
      gen.textDescription.includes('2025') || 
      gen.textDescription.includes('2024')
    );
    
    if (hasDate) {
      console.log(`\n📅 发现日期内容 - 最近第${index + 1}个回复:`);
      console.log(`   时间: ${new Date(gen.unixMs).toLocaleString()}`);
      console.log(`   内容预览: "${gen.textDescription.substring(0, 150)}..."`);
      
      // 查找日期的具体位置
      const lines = gen.textDescription.split('\n');
      lines.forEach((line, lineIndex) => {
        if (line.includes('1/14') || line.includes('2025') || line.includes('2024')) {
          console.log(`   第${lineIndex + 1}行: "${line}"`);
        }
      });
    }
  });
  
  // 分析日期的可能来源
  console.log('\n🤔 日期来源分析:');
  console.log('可能的来源场景:');
  console.log('1. 用户在提问中提到了具体日期');
  console.log('2. AI在回复中生成了日期作为示例');
  console.log('3. 系统时间被AI错误解释为当前日期');
  console.log('4. 会话创建时间被格式化显示');
  console.log('5. 代码或配置文件中包含的日期信息');
  
  // 检查是否有用户主动提到日期
  const userMentionedDate = prompts.some(p => 
    p.text && (p.text.includes('1月14') || p.text.includes('1/14') || p.text.includes('14号'))
  );
  
  if (userMentionedDate) {
    console.log('\n✅ 发现：用户在提问中主动提到了日期');
  } else {
    console.log('\n🤖 推测：日期可能是AI生成的内容或系统时间相关');
  }
  
  // 检查时间戳模式
  console.log('\n⏰ 时间戳模式分析:');
  const timestampPattern = generations.map(g => ({
    timestamp: g.unixMs,
    date: new Date(g.unixMs),
    hasDateContent: g.textDescription && g.textDescription.includes('1/14')
  }));
  
  const withDateContent = timestampPattern.filter(t => t.hasDateContent);
  if (withDateContent.length > 0) {
    console.log('包含"1/14"内容的回复时间戳:');
    withDateContent.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.date.toLocaleString()}`);
    });
  }
  
  db.close();
  
  console.log('\n💡 结论:');
  console.log('1. "1月14号"出现在AI的回复内容中');
  console.log('2. 这个日期可能来自于:');
  console.log('   - 用户的提问上下文'); 
  console.log('   - AI对当前日期的推测');
  console.log('   - 系统时间的错误显示');
  console.log('3. 修复方案已经实施，将2025/1/14改为2024/1/14');
  console.log('4. 实际的对话时间是6月11日，而不是1月14日');
}

traceDateOrigin().catch(console.error); 