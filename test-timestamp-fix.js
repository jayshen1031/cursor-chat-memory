const Database = require('sqlite3').Database;
const path = require('path');
const os = require('os');

async function testTimestampFix() {
  console.log('🕐 测试时间戳修复功能...\n');
  
  const workspaceStoragePath = path.join(os.homedir(), 'Library/Application Support/Cursor/User/workspaceStorage');
  const workspaceId = 'e76c6a8343ed4d7d7b8f77651bad3214';
  const dbPath = path.join(workspaceStoragePath, workspaceId, 'state.vscdb');
  
  console.log(`📂 检查工作区: ${workspaceId}`);
  console.log(`📄 数据库路径: ${dbPath}\n`);
  
  const db = new Database(dbPath);
  
  // 时间戳修复函数
  const fixTimestamp = (timestamp) => {
    const now = Date.now();
    if (timestamp > now) {
      console.log(`🔧 修复时间戳: ${timestamp} (${new Date(timestamp).toLocaleString()}) -> ${timestamp - (365 * 24 * 60 * 60 * 1000)} (${new Date(timestamp - (365 * 24 * 60 * 60 * 1000)).toLocaleString()})`);
      return timestamp - (365 * 24 * 60 * 60 * 1000);
    }
    return timestamp;
  };
  
  // 查询原始数据
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
    if (result.data?.value) {
      try {
        const parsed = JSON.parse(result.data.value);
        if (result.type === 'prompts') {
          prompts = parsed;
        } else {
          generations = parsed;
        }
      } catch (e) {
        console.error(`❌ 解析${result.type}失败:`, e);
      }
    }
  }
  
  console.log(`📊 数据统计:`);
  console.log(`   提示词数量: ${prompts.length}`);
  console.log(`   生成内容数量: ${generations.length}\n`);
  
  // 统计和修复时间戳
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000;
  
  console.log(`📅 今天的时间范围: ${new Date(todayStart).toLocaleString()} - ${new Date(todayEnd).toLocaleString()}\n`);
  
  console.log('🔧 检查和修复生成内容时间戳:');
  let fixedCount = 0;
  let todayCount = 0;
  
  generations.forEach((gen, index) => {
    if (gen.unixMs) {
      const originalTimestamp = gen.unixMs;
      const fixedTimestamp = fixTimestamp(gen.unixMs);
      
      if (fixedTimestamp !== originalTimestamp) {
        fixedCount++;
      }
      
      // 检查修复后是否是今天
      if (fixedTimestamp >= todayStart && fixedTimestamp < todayEnd) {
        todayCount++;
        console.log(`   ✅ 今天的内容 [${index}]: "${gen.textDescription?.substring(0, 60)}..."`);
        console.log(`      时间: ${new Date(fixedTimestamp).toLocaleString()}`);
      }
    }
  });
  
  console.log(`\n📈 修复统计:`);
  console.log(`   修复的时间戳数量: ${fixedCount} 个`);
  console.log(`   今天的生成内容: ${todayCount} 个`);
  
  // 分析今天的提示词（可能没有时间戳）
  console.log('\n📝 今天的提示词分析:');
  const recentPrompts = prompts.slice(-10); // 最近10个提示词
  console.log(`   检查最近 ${recentPrompts.length} 个提示词:`);
  
  recentPrompts.forEach((prompt, index) => {
    if (prompt.text) {
      console.log(`   ${index + 1}. "${prompt.text.substring(0, 80)}..."`);
      if (prompt.unixMs) {
        const fixedTime = fixTimestamp(prompt.unixMs);
        console.log(`      时间: ${new Date(fixedTime).toLocaleString()}`);
      } else {
        console.log(`      时间: 无时间戳`);
      }
    }
  });
  
  // 模拟问答对创建
  console.log('\n🔗 模拟问答对创建:');
  let qaPairCount = 0;
  const qaPairs = [];
  
  for (let i = 0; i < Math.min(prompts.length, generations.length); i++) {
    const prompt = prompts[i];
    const generation = generations[i];
    
    if (prompt.text && generation.textDescription) {
      const questionTime = prompt.unixMs ? fixTimestamp(prompt.unixMs) : (Date.now() - (prompts.length - i) * 60000);
      const answerTime = fixTimestamp(generation.unixMs);
      
      const qaPair = {
        question: prompt.text,
        answer: generation.textDescription,
        questionTimestamp: questionTime,
        answerTimestamp: answerTime,
        generationUUID: generation.generationUUID
      };
      
      // 检查是否是今天的对话
      if (answerTime >= todayStart && answerTime < todayEnd) {
        qaPairs.push(qaPair);
        qaPairCount++;
        
        if (qaPairCount <= 3) { // 只显示前3个
          console.log(`   ${qaPairCount}. Q: "${prompt.text.substring(0, 50)}..."`);
          console.log(`      A: "${generation.textDescription.substring(0, 50)}..."`);
          console.log(`      问题时间: ${new Date(questionTime).toLocaleString()}`);
          console.log(`      回答时间: ${new Date(answerTime).toLocaleString()}`);
          console.log(`      UUID: ${generation.generationUUID}`);
          console.log('');
        }
      }
    }
  }
  
  console.log(`✅ 今天共创建 ${qaPairCount} 个问答对`);
  
  // 验证时间戳修复是否成功
  console.log('\n🎯 时间戳修复验证:');
  const now = Date.now();
  const futureTimestamps = generations.filter(g => g.unixMs && g.unixMs > now);
  const fixedFutureTimestamps = generations.filter(g => g.unixMs && fixTimestamp(g.unixMs) > now);
  
  console.log(`   原始未来时间戳: ${futureTimestamps.length} 个`);
  console.log(`   修复后未来时间戳: ${fixedFutureTimestamps.length} 个`);
  console.log(`   修复状态: ${fixedFutureTimestamps.length === 0 ? '✅ 成功' : '❌ 仍有问题'}`);
  
  db.close();
}

testTimestampFix().catch(console.error); 