const Database = require('sqlite3').Database;
const path = require('path');
const os = require('os');

async function comprehensiveTimestampTest() {
  console.log('🔍 全面时间戳问题调试...\n');
  
  const workspaceStoragePath = path.join(os.homedir(), 'Library/Application Support/Cursor/User/workspaceStorage');
  const workspaceId = 'e76c6a8343ed4d7d7b8f77651bad3214';
  const dbPath = path.join(workspaceStoragePath, workspaceId, 'state.vscdb');
  
  console.log(`📂 检查工作区: ${workspaceId}`);
  console.log(`📄 数据库路径: ${dbPath}\n`);
  
  const db = new Database(dbPath);
  
  // 修复函数 - 多种策略
  const fixTimestamp = (timestamp) => {
    if (!timestamp) return Date.now();
    
    const now = Date.now();
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    
    console.log(`🔧 原始时间戳: ${timestamp}`);
    console.log(`   转换日期: ${new Date(timestamp).toLocaleString()}`);
    console.log(`   当前时间: ${new Date(now).toLocaleString()}`);
    
    // 策略1: 如果是未来时间，减去一年
    if (timestamp > now) {
      const fixed1 = timestamp - oneYearMs;
      console.log(`   修复策略1 (减1年): ${fixed1} -> ${new Date(fixed1).toLocaleString()}`);
      return fixed1;
    }
    
    // 策略2: 如果是2025年，强制改为2024年
    const date = new Date(timestamp);
    if (date.getFullYear() === 2025) {
      const fixed2 = new Date(2024, date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()).getTime();
      console.log(`   修复策略2 (2025->2024): ${fixed2} -> ${new Date(fixed2).toLocaleString()}`);
      return fixed2;
    }
    
    console.log(`   无需修复`);
    return timestamp;
  };
  
  // 查询所有相关数据
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
    }),
    // 检查其他可能的时间戳字段
    new Promise((resolve) => {
      db.all("SELECT key, value FROM ItemTable WHERE key LIKE '%time%' OR key LIKE '%date%' OR key LIKE '%session%'", (err, rows) => {
        resolve({ type: 'timeRelated', data: err ? [] : rows });
      });
    }),
    new Promise((resolve) => {
      db.all("SELECT key FROM ItemTable", (err, rows) => {
        resolve({ type: 'allKeys', data: err ? [] : rows });
      });
    })
  ];
  
  const results = await Promise.all(queries);
  
  let prompts = [];
  let generations = [];
  let timeRelatedData = [];
  let allKeys = [];
  
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
    } else if (result.type === 'timeRelated') {
      timeRelatedData = result.data || [];
    } else if (result.type === 'allKeys') {
      allKeys = result.data || [];
    }
  }
  
  console.log(`📊 数据统计:`);
  console.log(`   提示词数量: ${prompts.length}`);
  console.log(`   生成内容数量: ${generations.length}`);
  console.log(`   时间相关字段: ${timeRelatedData.length}`);
  console.log(`   所有键值: ${allKeys.length}\n`);
  
  // 检查所有键值，寻找可能的时间戳字段
  console.log('🔍 数据库中的所有键值:');
  allKeys.forEach((row, index) => {
    if (index < 20) { // 只显示前20个
      console.log(`   ${index + 1}. ${row.key}`);
    }
  });
  if (allKeys.length > 20) {
    console.log(`   ... 还有 ${allKeys.length - 20} 个键值`);
  }
  
  // 检查时间相关的字段
  console.log('\n⏰ 时间相关字段分析:');
  timeRelatedData.forEach((row, index) => {
    console.log(`\n${index + 1}. 键: ${row.key}`);
    try {
      const data = JSON.parse(row.value);
      console.log(`   数据类型: ${typeof data}`);
      if (Array.isArray(data)) {
        console.log(`   数组长度: ${data.length}`);
        if (data.length > 0) {
          console.log(`   第一个元素: ${JSON.stringify(data[0]).substring(0, 100)}...`);
        }
      } else if (typeof data === 'object') {
        const keys = Object.keys(data);
        console.log(`   对象键: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`);
      } else {
        console.log(`   值: ${data}`);
      }
    } catch (e) {
      console.log(`   原始值: ${row.value.substring(0, 100)}...`);
    }
  });
  
  // 详细检查最新的几个生成内容的时间戳
  console.log('\n🕐 最新生成内容的详细时间戳分析:');
  const recent = generations.slice(-5);
  recent.forEach((gen, index) => {
    console.log(`\n${index + 1}. 生成内容: "${gen.textDescription?.substring(0, 50)}..."`);
    console.log(`   原始 unixMs: ${gen.unixMs}`);
    console.log(`   原始日期: ${new Date(gen.unixMs).toLocaleDateString()}`);
    console.log(`   原始时间: ${new Date(gen.unixMs).toLocaleTimeString()}`);
    console.log(`   原始完整: ${new Date(gen.unixMs).toLocaleString()}`);
    
    const fixed = fixTimestamp(gen.unixMs);
    console.log(`   修复后日期: ${new Date(fixed).toLocaleDateString()}`);
    console.log(`   修复后时间: ${new Date(fixed).toLocaleTimeString()}`);
    console.log(`   修复后完整: ${new Date(fixed).toLocaleString()}`);
    
    // 检查不同的日期格式
    const fixedDate = new Date(fixed);
    console.log(`   ISO格式: ${fixedDate.toISOString()}`);
    console.log(`   年份: ${fixedDate.getFullYear()}`);
    console.log(`   月份: ${fixedDate.getMonth() + 1}`);
    console.log(`   日期: ${fixedDate.getDate()}`);
    
    // 检查是否还有其他时间戳字段
    Object.keys(gen).forEach(key => {
      if (key !== 'unixMs' && key !== 'textDescription' && key !== 'generationUUID' && key !== 'type') {
        console.log(`   其他字段 ${key}: ${gen[key]}`);
      }
    });
  });
  
  // 检查提示词的时间戳
  console.log('\n📝 最新提示词的时间戳分析:');
  const recentPrompts = prompts.slice(-5);
  recentPrompts.forEach((prompt, index) => {
    console.log(`\n${index + 1}. 提示词: "${prompt.text?.substring(0, 50)}..."`);
    console.log(`   是否有 unixMs: ${prompt.unixMs ? '是' : '否'}`);
    console.log(`   是否有 timestamp: ${prompt.timestamp ? '是' : '否'}`);
    
    if (prompt.unixMs) {
      console.log(`   unixMs: ${prompt.unixMs} -> ${new Date(prompt.unixMs).toLocaleString()}`);
      const fixed = fixTimestamp(prompt.unixMs);
      console.log(`   修复后: ${fixed} -> ${new Date(fixed).toLocaleString()}`);
    }
    
    if (prompt.timestamp) {
      console.log(`   timestamp: ${prompt.timestamp} -> ${new Date(prompt.timestamp).toLocaleString()}`);
      const fixed = fixTimestamp(prompt.timestamp);
      console.log(`   修复后: ${fixed} -> ${new Date(fixed).toLocaleString()}`);
    }
    
    // 检查其他可能的时间字段
    Object.keys(prompt).forEach(key => {
      if (key !== 'text' && key !== 'unixMs' && key !== 'timestamp') {
        console.log(`   其他字段 ${key}: ${prompt[key]}`);
      }
    });
  });
  
  // 生成今天的正确时间戳
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  console.log(`\n📅 当前正确时间信息:`);
  console.log(`   当前时间戳: ${Date.now()}`);
  console.log(`   当前日期: ${now.toLocaleDateString()}`);
  console.log(`   当前时间: ${now.toLocaleTimeString()}`);
  console.log(`   今天开始: ${today.getTime()} -> ${today.toLocaleString()}`);
  console.log(`   年份: ${now.getFullYear()}`);
  console.log(`   月份: ${now.getMonth() + 1}`);
  console.log(`   日期: ${now.getDate()}`);
  
  db.close();
}

comprehensiveTimestampTest().catch(console.error); 