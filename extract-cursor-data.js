const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

function extractCursorData() {
  console.log('🎯 提取Cursor聊天数据并修复中国时间...\n');
  
  const dbPath = '/Users/jay/Library/Application Support/Cursor/User/workspaceStorage/e76c6a8343ed4d7d7b8f77651bad3214/state.vscdb';
  
  const db = Database(dbPath, { readonly: true });
  
  try {
    // 提取提示词数据
    console.log('📝 提取提示词数据...');
    const promptsRow = db.prepare("SELECT value FROM ItemTable WHERE key = 'aiService.prompts'").get();
    
    let prompts = [];
    if (promptsRow && promptsRow.value) {
      try {
        prompts = JSON.parse(promptsRow.value);
        console.log(`   找到 ${prompts.length} 个提示词`);
      } catch (e) {
        console.log('   提示词数据解析失败:', e.message);
      }
    }
    
    // 提取生成数据
    console.log('\n🤖 提取AI生成数据...');
    const generationsRow = db.prepare("SELECT value FROM ItemTable WHERE key = 'aiService.generations'").get();
    
    let generations = [];
    if (generationsRow && generationsRow.value) {
      try {
        generations = JSON.parse(generationsRow.value);
        console.log(`   找到 ${generations.length} 个AI生成回复`);
      } catch (e) {
        console.log('   AI生成数据解析失败:', e.message);
      }
    }
    
    // 分析时间戳问题
    console.log('\n⏰ 分析时间戳...');
    
    // 分析提示词时间戳
    console.log('\n📝 提示词时间戳分析:');
    prompts.slice(0, 5).forEach((prompt, index) => {
      // 查找时间戳字段
      const timestamp = prompt.unixMs || prompt.createdAt || prompt.timestamp;
      
      if (timestamp) {
        const originalDate = new Date(timestamp);
        
        // 修复时间戳 - 如果是未来时间，减去1年
        let fixedTimestamp = timestamp;
        if (originalDate.getFullYear() > 2024) {
          fixedTimestamp = timestamp - (365 * 24 * 60 * 60 * 1000); // 减去1年
        }
        
        const fixedDate = new Date(fixedTimestamp);
        const chinaTime = fixedDate.toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        
        console.log(`   ${index + 1}. 原始时间戳: ${timestamp} (${originalDate.toISOString()})`);
        console.log(`      修复后时间戳: ${fixedTimestamp}`);
        console.log(`      中国时间: ${chinaTime}`);
        console.log(`      内容: "${prompt.text ? prompt.text.substring(0, 50) : ''}..."`);
        console.log('');
      }
    });
    
    // 分析AI生成时间戳
    console.log('\n🤖 AI生成时间戳分析:');
    generations.slice(0, 5).forEach((gen, index) => {
      const timestamp = gen.unixMs || gen.createdAt || gen.timestamp;
      
      if (timestamp) {
        const originalDate = new Date(timestamp);
        
        // 修复时间戳
        let fixedTimestamp = timestamp;
        if (originalDate.getFullYear() > 2024) {
          fixedTimestamp = timestamp - (365 * 24 * 60 * 60 * 1000);
        }
        
        const fixedDate = new Date(fixedTimestamp);
        const chinaTime = fixedDate.toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        
        console.log(`   ${index + 1}. 原始时间戳: ${timestamp} (${originalDate.toISOString()})`);
        console.log(`      修复后时间戳: ${fixedTimestamp}`);
        console.log(`      中国时间: ${chinaTime}`);
        console.log(`      UUID: ${gen.generationUUID}`);
        console.log(`      内容: "${gen.text ? gen.text.substring(0, 50) : ''}..."`);
        console.log('');
      }
    });
    
    // 修复所有数据
    console.log('\n🔧 修复所有数据的时间戳...');
    
    const fixedPrompts = prompts.map(prompt => {
      const timestamp = prompt.unixMs || prompt.createdAt || prompt.timestamp;
      
      if (timestamp) {
        const originalDate = new Date(timestamp);
        let fixedTimestamp = timestamp;
        
        // 如果是未来时间，修复为过去时间
        if (originalDate.getFullYear() > 2024) {
          fixedTimestamp = timestamp - (365 * 24 * 60 * 60 * 1000);
        }
        
        const fixedDate = new Date(fixedTimestamp);
        const chinaTime = fixedDate.toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        
        return {
          ...prompt,
          originalTimestamp: timestamp,
          fixedTimestamp: fixedTimestamp,
          chinaTime: chinaTime,
          category: prompt.category || 'general',
          tags: prompt.tags || ['提示词'],
          effectiveness: prompt.effectiveness || 0.8
        };
      }
      
      return prompt;
    });
    
    const fixedGenerations = generations.map(gen => {
      const timestamp = gen.unixMs || gen.createdAt || gen.timestamp;
      
      if (timestamp) {
        const originalDate = new Date(timestamp);
        let fixedTimestamp = timestamp;
        
        if (originalDate.getFullYear() > 2024) {
          fixedTimestamp = timestamp - (365 * 24 * 60 * 60 * 1000);
        }
        
        const fixedDate = new Date(fixedTimestamp);
        const chinaTime = fixedDate.toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
        
        return {
          ...gen,
          originalTimestamp: timestamp,
          fixedTimestamp: fixedTimestamp,
          chinaTime: chinaTime
        };
      }
      
      return gen;
    });
    
    // 筛选今日数据（修复后的时间）
    console.log('\n📅 筛选今日数据（中国时间）...');
    
    const now = new Date();
    const chinaDate = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Shanghai"}));
    const todayStart = new Date(chinaDate.getFullYear(), chinaDate.getMonth(), chinaDate.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    console.log(`今日范围 (中国时间): ${todayStart.toLocaleString('zh-CN')} - ${todayEnd.toLocaleString('zh-CN')}`);
    
    const todayPrompts = fixedPrompts.filter(prompt => {
      const promptDate = new Date(prompt.fixedTimestamp);
      return promptDate >= todayStart && promptDate < todayEnd;
    });
    
    const todayGenerations = fixedGenerations.filter(gen => {
      const genDate = new Date(gen.fixedTimestamp);
      return genDate >= todayStart && genDate < todayEnd;
    });
    
    console.log(`📝 今日提示词: ${todayPrompts.length} 个`);
    console.log(`🤖 今日AI回复: ${todayGenerations.length} 个`);
    
    // 显示今日提示词
    console.log('\n📋 今日提示词列表:');
    todayPrompts.forEach((prompt, index) => {
      console.log(`   ${index + 1}. ${prompt.chinaTime}`);
      console.log(`      内容: "${prompt.text ? prompt.text.substring(0, 80) : ''}..."`);
      console.log('');
    });
    
    // 生成Web数据
    console.log('\n🌐 生成Web页面数据...');
    
    const webData = {
      timestamp: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      todayPromptsCount: todayPrompts.length,
      totalPromptsCount: fixedPrompts.length,
      todayGenerationsCount: todayGenerations.length,
      totalGenerationsCount: fixedGenerations.length,
      recentPrompts: todayPrompts.slice(0, 20),
      recentGenerations: todayGenerations.slice(0, 20),
      allPrompts: fixedPrompts,
      allGenerations: fixedGenerations
    };
    
    // 保存数据
    const webDataPath = path.join(__dirname, 'web', 'data', 'cursor-data-fixed.json');
    const webDataDir = path.dirname(webDataPath);
    
    if (!fs.existsSync(webDataDir)) {
      fs.mkdirSync(webDataDir, { recursive: true });
    }
    
    fs.writeFileSync(webDataPath, JSON.stringify(webData, null, 2));
    console.log(`💾 修复后数据已保存到: ${webDataPath}`);
    
    // 创建修复后的HTML页面
    const fixedHtmlPage = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cursor Chat Memory - 修复版 (中国时间)</title>
    <style>
        body {
            font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
            line-height: 1.6;
        }
        
        .header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .time-info {
            background: #e8f4fd;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid #007acc;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            color: #007acc;
        }
        
        .stat-label {
            color: #666;
            margin-top: 8px;
            font-size: 14px;
        }
        
        .content-section {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .section-title {
            font-size: 1.5em;
            margin-bottom: 20px;
            color: #333;
            border-bottom: 2px solid #007acc;
            padding-bottom: 10px;
        }
        
        .chat-item {
            border: 1px solid #eee;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
            transition: all 0.2s;
        }
        
        .chat-item:hover {
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            transform: translateY(-2px);
        }
        
        .chat-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }
        
        .chat-type {
            background: #007acc;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .chat-type.generation {
            background: #28a745;
        }
        
        .chat-time {
            color: #666;
            font-size: 12px;
            font-weight: bold;
            background: #f8f9fa;
            padding: 4px 8px;
            border-radius: 4px;
        }
        
        .chat-content {
            margin: 12px 0;
            line-height: 1.6;
            color: #333;
            background: #f8f9fa;
            padding: 10px;
            border-radius: 5px;
        }
        
        .chat-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            color: #666;
            margin-top: 10px;
        }
        
        .refresh-btn {
            background: #007acc;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            transition: background 0.2s;
        }
        
        .refresh-btn:hover {
            background: #005a9e;
        }
        
        .success-indicator {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 Cursor Chat Memory - 修复版 (中国时间)</h1>
        <p>成功提取并修复Cursor聊天数据的时间戳显示</p>
        
        <div class="success-indicator">
            ✅ <strong>时间戳修复成功！</strong> 已将未来时间 (2025年) 修复为正确的时间 (2024年)
        </div>
        
        <div class="time-info">
            <strong>🕒 当前时间 (中国标准时间):</strong> <span id="currentTime"></span><br>
            <strong>📅 数据更新时间:</strong> ${webData.timestamp}<br>
            <strong>🔧 修复说明:</strong> 已将所有2025年的时间戳修复为2024年对应时间
        </div>
        <button class="refresh-btn" onclick="location.reload()">🔄 刷新页面</button>
    </div>
    
    <div class="stats">
        <div class="stat-card">
            <div class="stat-number">${webData.todayPromptsCount}</div>
            <div class="stat-label">今日提示词</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${webData.totalPromptsCount}</div>
            <div class="stat-label">总提示词数</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${webData.todayGenerationsCount}</div>
            <div class="stat-label">今日AI回复</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${webData.totalGenerationsCount}</div>
            <div class="stat-label">总AI回复数</div>
        </div>
    </div>
    
    <div class="content-section">
        <h2 class="section-title">📝 今日提示词 (中国时间)</h2>
        <div id="promptsList">
            ${webData.recentPrompts.map(prompt => `
                <div class="chat-item">
                    <div class="chat-header">
                        <span class="chat-type">提示词</span>
                        <span class="chat-time">🇨🇳 ${prompt.chinaTime}</span>
                    </div>
                    <div class="chat-content">${prompt.text ? prompt.text.substring(0, 300) : ''}${prompt.text && prompt.text.length > 300 ? '...' : ''}</div>
                    <div class="chat-meta">
                        <span>原始时间戳: ${prompt.originalTimestamp}</span>
                        <span>修复后时间戳: ${prompt.fixedTimestamp}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    
    <div class="content-section">
        <h2 class="section-title">🤖 今日AI回复 (中国时间)</h2>
        <div id="generationsList">
            ${webData.recentGenerations.map(gen => `
                <div class="chat-item">
                    <div class="chat-header">
                        <span class="chat-type generation">AI回复</span>
                        <span class="chat-time">🇨🇳 ${gen.chinaTime}</span>
                    </div>
                    <div class="chat-content">${gen.text ? gen.text.substring(0, 300) : ''}${gen.text && gen.text.length > 300 ? '...' : ''}</div>
                    <div class="chat-meta">
                        <span>UUID: ${gen.generationUUID}</span>
                        <span>修复后时间戳: ${gen.fixedTimestamp}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>

    <script>
        // 实时更新中国时间
        function updateCurrentTime() {
            const now = new Date();
            const chinaTime = now.toLocaleString('zh-CN', {
                timeZone: 'Asia/Shanghai',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            document.getElementById('currentTime').textContent = chinaTime;
        }
        
        // 每秒更新时间
        updateCurrentTime();
        setInterval(updateCurrentTime, 1000);
        
        console.log('✅ Cursor聊天数据修复版已加载');
        console.log('今日提示词数量:', ${webData.todayPromptsCount});
        console.log('今日AI回复数量:', ${webData.todayGenerationsCount});
        console.log('总数据量:', ${webData.totalPromptsCount + webData.totalGenerationsCount});
    </script>
</body>
</html>
`;
    
    const fixedHtmlPath = path.join(__dirname, 'web', 'cursor-fixed.html');
    fs.writeFileSync(fixedHtmlPath, fixedHtmlPage);
    console.log(`🌐 修复版页面已创建: ${fixedHtmlPath}`);
    
    console.log('\n🎉 Cursor数据提取和修复完成！');
    console.log('\n📊 修复摘要:');
    console.log(`   总提示词: ${fixedPrompts.length} 个`);
    console.log(`   今日提示词: ${todayPrompts.length} 个`);
    console.log(`   总AI回复: ${fixedGenerations.length} 个`);
    console.log(`   今日AI回复: ${todayGenerations.length} 个`);
    console.log(`   时间修复: 2025年 → 2024年`);
    console.log(`   时间格式: 中国标准时间 (UTC+8)`);
    console.log(`   页面路径: ${fixedHtmlPath}`);
    
    // 打开页面
    console.log('\n🚀 正在打开页面...');
    return fixedHtmlPath;
    
  } catch (error) {
    console.error('❌ 提取失败:', error);
  } finally {
    db.close();
  }
}

const htmlPath = extractCursorData();
console.log(`\n💡 请在浏览器中打开: ${htmlPath}`); 