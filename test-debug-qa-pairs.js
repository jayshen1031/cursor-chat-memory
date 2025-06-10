const { SQLiteChatReader } = require('./out/sqliteChatReader');
const Database = require('sqlite3').Database;
const path = require('path');
const os = require('os');

async function debugQAPairs() {
  console.log('🔍 调试问答关联逻辑...\n');
  
  const workspaceStoragePath = path.join(os.homedir(), 'Library/Application Support/Cursor/User/workspaceStorage');
  
  // 检查最大的工作区（最可能有完整数据）
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
  
  // 显示前几个提示词
  console.log('📝 提示词样本:');
  prompts.slice(0, 3).forEach((prompt, index) => {
    console.log(`   ${index + 1}. "${prompt.text?.substring(0, 80)}..."`);
    console.log(`      时间戳: ${prompt.unixMs || prompt.timestamp || '无'}`);
    console.log(`      其他字段: ${Object.keys(prompt).filter(k => k !== 'text').join(', ')}\n`);
  });
  
  // 显示前几个生成内容
  console.log('🤖 生成内容样本:');
  generations.slice(0, 3).forEach((gen, index) => {
    console.log(`   ${index + 1}. "${gen.text?.substring(0, 80)}..."`);
    console.log(`      UUID: ${gen.generationUUID || '无'}`);
    console.log(`      时间戳: ${gen.unixMs || '无'}`);
    console.log(`      其他字段: ${Object.keys(gen).filter(k => !['text', 'generationUUID', 'unixMs'].includes(k)).join(', ')}\n`);
  });
  
  // 测试关联算法
  console.log('🔗 测试问答关联:');
  const reader = new SQLiteChatReader();
  
  for (let i = 0; i < Math.min(5, prompts.length); i++) {
    const prompt = prompts[i];
    if (!prompt.text?.trim()) continue;
    
    console.log(`\n${i + 1}. 问题: "${prompt.text.substring(0, 60)}..."`);
    
    // 测试匹配算法
    const match = reader.findMatchingGeneration(prompt, generations, i);
    
         if (match) {
       console.log(`   ✅ 找到匹配: "${match.textDescription.substring(0, 60)}..."`);
       console.log(`   匹配策略: 索引${i < generations.length ? '直接' : '时间戳'}`);
       console.log(`   置信度: ${(reader.calculateAssociationConfidence(prompt, match, i) * 100).toFixed(0)}%`);
     } else {
      console.log(`   ❌ 未找到匹配`);
      
      // 调试为什么没找到
      console.log(`   调试信息:`);
      console.log(`     - 索引${i}是否有直接匹配: ${i < generations.length ? '是' : '否'}`);
      if (i < generations.length) {
        const directCandidate = generations[i];
        console.log(`     - 直接候选者有效性: ${reader.isValidGeneration(directCandidate) ? '有效' : '无效'}`);
                 if (!reader.isValidGeneration(directCandidate)) {
           console.log(`       - textDescription: ${!!directCandidate.textDescription}`);
           console.log(`       - UUID: ${!!directCandidate.generationUUID}`);
           console.log(`       - unixMs: ${!!directCandidate.unixMs}`);
         }
      }
      
      if (prompt.unixMs) {
        const timeMatches = generations.filter(gen => 
          gen.unixMs && Math.abs(gen.unixMs - prompt.unixMs) < 300000
        );
        console.log(`     - 时间戳匹配候选者: ${timeMatches.length}个`);
      }
    }
  }
  
  db.close();
}

debugQAPairs().catch(console.error); 