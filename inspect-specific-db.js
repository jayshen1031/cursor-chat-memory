const Database = require('better-sqlite3');

function inspectDatabase() {
  console.log('🔍 检查指定数据库结构...\n');
  
  const dbPath = '/Users/jay/Library/Application Support/Cursor/User/workspaceStorage/e76c6a8343ed4d7d7b8f77651bad3214/state.vscdb';
  
  const db = Database(dbPath, { readonly: true });
  
  try {
    // 1. 获取所有表
    console.log('📊 数据库中的所有表:');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    tables.forEach(table => {
      console.log(`   - ${table.name}`);
    });
    
    // 2. 检查每个表的结构和内容
    for (const table of tables) {
      console.log(`\n🔍 分析表: ${table.name}`);
      
      // 获取表结构
      const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
      console.log('   字段结构:');
      columns.forEach(col => {
        console.log(`     - ${col.name} (${col.type})`);
      });
      
      // 获取记录数
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
      console.log(`   记录数: ${count.count}`);
      
      // 获取前几条记录
      if (count.count > 0) {
        console.log('   示例数据:');
        const samples = db.prepare(`SELECT * FROM ${table.name} LIMIT 3`).all();
        samples.forEach((row, index) => {
          console.log(`     ${index + 1}. ${JSON.stringify(row)}`);
        });
      }
    }
    
    // 3. 特别检查ItemTable（可能包含聊天数据）
    if (tables.some(t => t.name === 'ItemTable')) {
      console.log('\n🎯 深度分析ItemTable...');
      
      // 查看所有键值
      const allItems = db.prepare("SELECT * FROM ItemTable").all();
      
      console.log(`   总项目数: ${allItems.length}`);
      console.log('\n   所有键值:');
      
      allItems.forEach((item, index) => {
        console.log(`     ${index + 1}. 键: ${item.key}`);
        
        // 尝试解析value
        let parsedValue = item.value;
        try {
          if (typeof item.value === 'string') {
            parsedValue = JSON.parse(item.value);
          }
          
          if (typeof parsedValue === 'object') {
            console.log(`        类型: ${typeof parsedValue}`);
            console.log(`        内容预览: ${JSON.stringify(parsedValue).substring(0, 100)}...`);
            
            // 检查是否包含时间相关字段
            if (parsedValue.createdAt || parsedValue.timestamp || parsedValue.time) {
              console.log(`        ⏰ 时间字段: ${parsedValue.createdAt || parsedValue.timestamp || parsedValue.time}`);
            }
            
            // 检查是否包含聊天相关字段
            if (parsedValue.content || parsedValue.text || parsedValue.message) {
              console.log(`        💬 内容预览: "${(parsedValue.content || parsedValue.text || parsedValue.message).substring(0, 50)}..."`);
            }
          } else {
            console.log(`        值: ${item.value}`);
          }
        } catch (e) {
          console.log(`        值 (无法解析JSON): ${item.value.substring(0, 100)}...`);
        }
        console.log('');
      });
    }
    
    // 4. 检查cursorDiskKV表
    if (tables.some(t => t.name === 'cursorDiskKV')) {
      console.log('\n🎯 深度分析cursorDiskKV...');
      
      const kvItems = db.prepare("SELECT * FROM cursorDiskKV").all();
      console.log(`   总项目数: ${kvItems.length}`);
      
      kvItems.forEach((item, index) => {
        console.log(`     ${index + 1}. 键: ${item.key || item.name || '未知'}`);
        
        // 尝试解析value
        const value = item.value || item.data;
        if (value) {
          try {
            const parsedValue = JSON.parse(value);
            console.log(`        内容预览: ${JSON.stringify(parsedValue).substring(0, 100)}...`);
            
            // 检查时间字段
            if (parsedValue.createdAt || parsedValue.timestamp) {
              const timestamp = parsedValue.createdAt || parsedValue.timestamp;
              const date = new Date(timestamp);
              const chinaTime = date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
              console.log(`        ⏰ 时间: ${timestamp} (${chinaTime})`);
            }
          } catch (e) {
            console.log(`        值: ${value.substring(0, 100)}...`);
          }
        }
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    db.close();
  }
}

inspectDatabase(); 