const Database = require('sqlite3').Database;
const path = require('path');
const os = require('os');

async function debugDataStructure() {
  console.log('🔍 深入分析数据结构...\n');
  
  const workspaceStoragePath = path.join(os.homedir(), 'Library/Application Support/Cursor/User/workspaceStorage');
  const workspaceId = 'e76c6a8343ed4d7d7b8f77651bad3214';
  const dbPath = path.join(workspaceStoragePath, workspaceId, 'state.vscdb');
  
  const db = new Database(dbPath);
  
  // 查询所有相关的键
  console.log('📊 查询所有aiService相关的键...');
  
  const allKeysQuery = new Promise((resolve) => {
    db.all("SELECT key FROM ItemTable WHERE key LIKE '%aiService%'", (err, rows) => {
      resolve(err ? [] : rows);
    });
  });
  
  const allKeys = await allKeysQuery;
  console.log('🔑 找到的键:');
  allKeys.forEach(row => {
    console.log(`   - ${row.key}`);
  });
  console.log('');
  
  // 详细分析每个键的数据
  for (const keyRow of allKeys) {
    const key = keyRow.key;
    console.log(`📄 分析键: ${key}`);
    
    const dataQuery = new Promise((resolve) => {
      db.get("SELECT value FROM ItemTable WHERE key = ?", [key], (err, row) => {
        resolve(err ? null : row);
      });
    });
    
    const result = await dataQuery;
    
    if (result?.value) {
      try {
        const data = JSON.parse(result.value);
        
        console.log(`   类型: ${Array.isArray(data) ? 'Array' : typeof data}`);
        if (Array.isArray(data)) {
          console.log(`   长度: ${data.length}`);
          
          if (data.length > 0) {
            console.log(`   第一个元素的结构:`);
            const firstItem = data[0];
            console.log(`     类型: ${typeof firstItem}`);
            
            if (typeof firstItem === 'object' && firstItem !== null) {
              const keys = Object.keys(firstItem);
              console.log(`     字段: ${keys.join(', ')}`);
              
              // 显示每个字段的值类型和示例
              keys.forEach(k => {
                const value = firstItem[k];
                const valueType = typeof value;
                let preview = '';
                
                if (valueType === 'string') {
                  preview = value.length > 50 ? value.substring(0, 50) + '...' : value;
                } else if (valueType === 'object' && value !== null) {
                  preview = Array.isArray(value) ? `Array(${value.length})` : 'Object';
                } else {
                  preview = String(value);
                }
                
                console.log(`       ${k}: ${valueType} = "${preview}"`);
              });
            }
            
            // 如果是generations，检查更多样本
            if (key.includes('generations') && data.length > 1) {
              console.log(`   更多样本检查:`);
              for (let i = 0; i < Math.min(3, data.length); i++) {
                const item = data[i];
                console.log(`     样本${i + 1}:`);
                if (item.text !== undefined) {
                  console.log(`       text: "${item.text?.substring(0, 50)}..."`);
                } else {
                  // 查找可能包含文本的字段
                  const textFields = Object.keys(item).filter(k => 
                    typeof item[k] === 'string' && item[k].length > 10
                  );
                  console.log(`       可能的文本字段: ${textFields.join(', ')}`);
                  textFields.forEach(field => {
                    console.log(`         ${field}: "${item[field]?.substring(0, 50)}..."`);
                  });
                }
              }
            }
          }
        } else {
          console.log(`   值: ${JSON.stringify(data).substring(0, 200)}...`);
        }
        
      } catch (e) {
        console.log(`   ❌ JSON解析失败: ${e.message}`);
      }
    } else {
      console.log(`   ❌ 无数据`);
    }
    
    console.log('');
  }
  
  db.close();
}

debugDataStructure().catch(console.error); 