const Database = require('sqlite3').Database;
const path = require('path');
const os = require('os');

async function debugTimeStamps() {
  console.log('🕐 调试时间戳问题...\n');
  
  const workspaceStoragePath = path.join(os.homedir(), 'Library/Application Support/Cursor/User/workspaceStorage');
  
  // 检查最新的工作区数据
  const workspaceId = 'e76c6a8343ed4d7d7b8f77651bad3214';
  const dbPath = path.join(workspaceStoragePath, workspaceId, 'state.vscdb');
  
  console.log(`📂 检查工作区: ${workspaceId}`);
  console.log(`📄 数据库路径: ${dbPath}\n`);
  
  const db = new Database(dbPath);
  
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
  
  // 分析时间戳
  console.log('🕐 时间戳分析:');
  console.log('\n📝 最新的5个提示词时间戳:');
  prompts.slice(-5).forEach((prompt, index) => {
    console.log(`   ${index + 1}. "${prompt.text?.substring(0, 50)}..."`);
    if (prompt.unixMs) {
      const date = new Date(prompt.unixMs);
      console.log(`      unixMs: ${prompt.unixMs} -> ${date.toLocaleString()}`);
    } else if (prompt.timestamp) {
      const date = new Date(prompt.timestamp);
      console.log(`      timestamp: ${prompt.timestamp} -> ${date.toLocaleString()}`);
    } else {
      console.log(`      无时间戳`);
    }
    console.log('');
  });
  
  console.log('🤖 最新的5个生成内容时间戳:');
  generations.slice(-5).forEach((gen, index) => {
    console.log(`   ${index + 1}. "${gen.textDescription?.substring(0, 50)}..."`);
    if (gen.unixMs) {
      const date = new Date(gen.unixMs);
      console.log(`      unixMs: ${gen.unixMs} -> ${date.toLocaleString()}`);
      
      // 检查是否是今天
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      console.log(`      是否今天: ${isToday ? '✅ 是' : '❌ 否'}`);
    } else {
      console.log(`      无时间戳`);
    }
    console.log('');
  });
  
  // 统计今天的数据
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000;
  
  const todayPrompts = prompts.filter(p => p.unixMs && p.unixMs >= todayStart && p.unixMs < todayEnd);
  const todayGenerations = generations.filter(g => g.unixMs && g.unixMs >= todayStart && g.unixMs < todayEnd);
  
  console.log(`📅 今天(${today.toDateString()})的数据:`);
  console.log(`   今天的提示词: ${todayPrompts.length} 个`);
  console.log(`   今天的生成内容: ${todayGenerations.length} 个`);
  
  if (todayPrompts.length > 0) {
    console.log('\n📝 今天的提示词内容:');
    todayPrompts.forEach((prompt, index) => {
      console.log(`   ${index + 1}. "${prompt.text?.substring(0, 80)}..."`);
      console.log(`      时间: ${new Date(prompt.unixMs).toLocaleString()}`);
    });
  }
  
  if (todayGenerations.length > 0) {
    console.log('\n🤖 今天的生成内容:');
    todayGenerations.forEach((gen, index) => {
      console.log(`   ${index + 1}. "${gen.textDescription?.substring(0, 80)}..."`);
      console.log(`      时间: ${new Date(gen.unixMs).toLocaleString()}`);
    });
  }
  
  // 检查其他工作区
  console.log('\n🔍 检查其他工作区的最新数据...');
  const fs = require('fs');
  
  try {
    const workspaceDirs = fs.readdirSync(workspaceStoragePath)
      .filter(dir => dir !== workspaceId && !dir.startsWith('.'));
    
    console.log(`发现 ${workspaceDirs.length} 个其他工作区`);
    
    for (const wsDir of workspaceDirs.slice(0, 3)) { // 检查前3个
      const wsDbPath = path.join(workspaceStoragePath, wsDir, 'state.vscdb');
      if (fs.existsSync(wsDbPath)) {
        console.log(`\n📂 检查工作区: ${wsDir}`);
        
        const wsDb = new Database(wsDbPath);
        
        const wsQueries = [
          new Promise((resolve) => {
            wsDb.get("SELECT value FROM ItemTable WHERE key = 'aiService.prompts'", (err, row) => {
              resolve({ type: 'prompts', data: err ? null : row });
            });
          }),
          new Promise((resolve) => {
            wsDb.get("SELECT value FROM ItemTable WHERE key = 'aiService.generations'", (err, row) => {
              resolve({ type: 'generations', data: err ? null : row });
            });
          })
        ];
        
        const wsResults = await Promise.all(wsQueries);
        
        let wsPrompts = [];
        let wsGenerations = [];
        
        for (const result of wsResults) {
          if (result.data?.value) {
            try {
              const parsed = JSON.parse(result.data.value);
              if (result.type === 'prompts') {
                wsPrompts = parsed;
              } else {
                wsGenerations = parsed;
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
        
        const wsTodayPrompts = wsPrompts.filter(p => p.unixMs && p.unixMs >= todayStart && p.unixMs < todayEnd);
        const wsTodayGenerations = wsGenerations.filter(g => g.unixMs && g.unixMs >= todayStart && g.unixMs < todayEnd);
        
        console.log(`   总数据: ${wsPrompts.length} 提示词, ${wsGenerations.length} 生成内容`);
        console.log(`   今天数据: ${wsTodayPrompts.length} 提示词, ${wsTodayGenerations.length} 生成内容`);
        
        if (wsTodayPrompts.length > 0) {
          console.log('   📝 今天的提示词:');
          wsTodayPrompts.slice(0, 3).forEach((prompt, index) => {
            console.log(`      ${index + 1}. "${prompt.text?.substring(0, 60)}..."`);
          });
        }
        
        wsDb.close();
      }
    }
  } catch (e) {
    console.error('扫描其他工作区失败:', e);
  }
  
  db.close();
}

debugTimeStamps().catch(console.error); 