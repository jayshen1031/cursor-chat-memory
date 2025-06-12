const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

function extractRealData() {
  console.log('🎯 提取Cursor真实聊天数据（保持原始时间）...\n');
  
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
    
    // 分析时间戳（不修改，保持原样）
    console.log('\n⏰ 分析原始时间戳...');
    
    // 处理提示词数据
    const processedPrompts = prompts.map(prompt => {
      const timestamp = prompt.unixMs || prompt.createdAt || prompt.timestamp;
      
      if (timestamp) {
        const date = new Date(timestamp);
        const chinaTime = date.toLocaleString('zh-CN', {
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
          timestamp: timestamp,
          chinaTime: chinaTime,
          category: prompt.category || 'general',
          tags: prompt.tags || ['提示词'],
          effectiveness: prompt.effectiveness || 0.8
        };
      }
      
      return {
        ...prompt,
        timestamp: Date.now(),
        chinaTime: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
        category: 'general',
        tags: ['提示词'],
        effectiveness: 0.8
      };
    });
    
    // 处理AI生成数据
    const processedGenerations = generations.map(gen => {
      const timestamp = gen.unixMs || gen.createdAt || gen.timestamp;
      
      if (timestamp) {
        const date = new Date(timestamp);
        const chinaTime = date.toLocaleString('zh-CN', {
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
          timestamp: timestamp,
          chinaTime: chinaTime
        };
      }
      
      return {
        ...gen,
        timestamp: Date.now(),
        chinaTime: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
      };
    });
    
    // 按时间排序
    processedPrompts.sort((a, b) => b.timestamp - a.timestamp);
    processedGenerations.sort((a, b) => b.timestamp - a.timestamp);
    
    // 显示最新的数据
    console.log('\n📝 最新提示词:');
    processedPrompts.slice(0, 5).forEach((prompt, index) => {
      console.log(`   ${index + 1}. ${prompt.chinaTime}`);
      console.log(`      内容: "${prompt.text ? prompt.text.substring(0, 80) : ''}..."`);
      console.log('');
    });
    
    console.log('\n🤖 最新AI回复:');
    processedGenerations.slice(0, 5).forEach((gen, index) => {
      console.log(`   ${index + 1}. ${gen.chinaTime}`);
      console.log(`      UUID: ${gen.generationUUID}`);
      console.log(`      内容: "${gen.text ? gen.text.substring(0, 80) : ''}..."`);
      console.log('');
    });
    
    // 筛选最近24小时的数据（而不是严格的"今日"）
    console.log('\n📅 筛选最近24小时数据...');
    
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    
    const recentPrompts = processedPrompts.filter(prompt => {
      return prompt.timestamp > last24Hours;
    });
    
    const recentGenerations = processedGenerations.filter(gen => {
      return gen.timestamp > last24Hours;
    });
    
    console.log(`📝 最近24小时提示词: ${recentPrompts.length} 个`);
    console.log(`🤖 最近24小时AI回复: ${recentGenerations.length} 个`);
    
    // 如果最近24小时没有数据，扩展到最近一周
    if (recentPrompts.length === 0 && recentGenerations.length === 0) {
      console.log('\n📅 扩展到最近一周数据...');
      const lastWeek = now - (7 * 24 * 60 * 60 * 1000);
      
      const weekPrompts = processedPrompts.filter(prompt => {
        return prompt.timestamp > lastWeek;
      });
      
      const weekGenerations = processedGenerations.filter(gen => {
        return gen.timestamp > lastWeek;
      });
      
      console.log(`📝 最近一周提示词: ${weekPrompts.length} 个`);
      console.log(`🤖 最近一周AI回复: ${weekGenerations.length} 个`);
      
      // 使用一周的数据
      recentPrompts.push(...weekPrompts);
      recentGenerations.push(...weekGenerations);
    }
    
    // 显示最近的提示词
    console.log('\n📋 最近提示词列表:');
    recentPrompts.slice(0, 10).forEach((prompt, index) => {
      console.log(`   ${index + 1}. ${prompt.chinaTime}`);
      console.log(`      内容: "${prompt.text ? prompt.text.substring(0, 80) : ''}..."`);
      console.log('');
    });
    
    // 生成Web数据
    console.log('\n🌐 生成Web页面数据...');
    
    const webData = {
      timestamp: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      recentPromptsCount: recentPrompts.length,
      totalPromptsCount: processedPrompts.length,
      recentGenerationsCount: recentGenerations.length,
      totalGenerationsCount: processedGenerations.length,
      recentPrompts: recentPrompts.slice(0, 20),
      recentGenerations: recentGenerations.slice(0, 20),
      allPrompts: processedPrompts.slice(0, 50), // 只显示前50个，避免页面过大
      allGenerations: processedGenerations.slice(0, 50)
    };
    
    // 保存数据
    const webDataPath = path.join(__dirname, 'web', 'data', 'cursor-real-data.json');
    const webDataDir = path.dirname(webDataPath);
    
    if (!fs.existsSync(webDataDir)) {
      fs.mkdirSync(webDataDir, { recursive: true });
    }
    
    fs.writeFileSync(webDataPath, JSON.stringify(webData, null, 2));
    console.log(`💾 真实数据已保存到: ${webDataPath}`);
    
    // 创建真实数据的HTML页面
    const realHtmlPage = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cursor Chat Memory - 真实数据 (中国时间)</title>
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
            background: #fafafa;
        }
        
        .chat-item:hover {
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            transform: translateY(-2px);
            background: white;
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
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .chat-type.generation {
            background: #28a745;
        }
        
        .chat-time {
            color: #666;
            font-size: 13px;
            font-weight: bold;
            background: #fff;
            padding: 6px 12px;
            border-radius: 20px;
            border: 1px solid #ddd;
        }
        
        .chat-content {
            margin: 12px 0;
            line-height: 1.7;
            color: #333;
            background: white;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #007acc;
            font-size: 14px;
        }
        
        .chat-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #999;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #eee;
        }
        
        .refresh-btn {
            background: linear-gradient(45deg, #007acc, #0056b3);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .refresh-btn:hover {
            background: linear-gradient(45deg, #0056b3, #004085);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        .success-indicator {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
            font-weight: bold;
        }

        .no-data {
            text-align: center;
            color: #666;
            font-style: italic;
            padding: 40px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 Cursor Chat Memory - 真实数据 (中国时间)</h1>
        <p>显示Cursor中的真实聊天数据，保持原始时间戳</p>
        
        <div class="success-indicator">
            ✅ <strong>数据提取成功！</strong> 已从Cursor数据库中提取到真实的聊天数据，保持原始时间格式
        </div>
        
        <div class="time-info">
            <strong>🕒 当前时间 (中国标准时间):</strong> <span id="currentTime"></span><br>
            <strong>📅 数据更新时间:</strong> ${webData.timestamp}<br>
            <strong>🔧 数据说明:</strong> 显示最近的聊天记录，保持Cursor原始时间戳
        </div>
        <button class="refresh-btn" onclick="location.reload()">🔄 刷新页面</button>
    </div>
    
    <div class="stats">
        <div class="stat-card">
            <div class="stat-number">${webData.recentPromptsCount}</div>
            <div class="stat-label">最近提示词</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${webData.totalPromptsCount}</div>
            <div class="stat-label">总提示词数</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${webData.recentGenerationsCount}</div>
            <div class="stat-label">最近AI回复</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${webData.totalGenerationsCount}</div>
            <div class="stat-label">总AI回复数</div>
        </div>
    </div>
    
    <div class="content-section">
        <h2 class="section-title">📝 最近提示词 (按时间倒序)</h2>
        <div id="promptsList">
            ${webData.recentPrompts.length > 0 ? webData.recentPrompts.map(prompt => `
                <div class="chat-item">
                    <div class="chat-header">
                        <span class="chat-type">提示词</span>
                        <span class="chat-time">🇨🇳 ${prompt.chinaTime}</span>
                    </div>
                    <div class="chat-content">${prompt.text ? prompt.text.substring(0, 500) : ''}${prompt.text && prompt.text.length > 500 ? '...' : ''}</div>
                    <div class="chat-meta">
                        <span>时间戳: ${prompt.timestamp}</span>
                        ${prompt.commandType ? `<span>类型: ${prompt.commandType}</span>` : ''}
                    </div>
                </div>
            `).join('') : '<div class="no-data">暂无最近提示词数据</div>'}
        </div>
    </div>
    
    <div class="content-section">
        <h2 class="section-title">🤖 最近AI回复 (按时间倒序)</h2>
        <div id="generationsList">
            ${webData.recentGenerations.length > 0 ? webData.recentGenerations.map(gen => `
                <div class="chat-item">
                    <div class="chat-header">
                        <span class="chat-type generation">AI回复</span>
                        <span class="chat-time">🇨🇳 ${gen.chinaTime}</span>
                    </div>
                    <div class="chat-content">${gen.text ? gen.text.substring(0, 500) : ''}${gen.text && gen.text.length > 500 ? '...' : ''}</div>
                    <div class="chat-meta">
                        <span>UUID: ${gen.generationUUID}</span>
                        <span>时间戳: ${gen.timestamp}</span>
                    </div>
                </div>
            `).join('') : '<div class="no-data">暂无最近AI回复数据</div>'}
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
        
        console.log('✅ Cursor真实数据页面已加载');
        console.log('最近提示词数量:', ${webData.recentPromptsCount});
        console.log('最近AI回复数量:', ${webData.recentGenerationsCount});
        console.log('总数据量:', ${webData.totalPromptsCount + webData.totalGenerationsCount});
    </script>
</body>
</html>
`;
    
    const realHtmlPath = path.join(__dirname, 'web', 'cursor-real.html');
    fs.writeFileSync(realHtmlPath, realHtmlPage);
    console.log(`🌐 真实数据页面已创建: ${realHtmlPath}`);
    
    console.log('\n🎉 Cursor真实数据提取完成！');
    console.log('\n📊 数据摘要:');
    console.log(`   总提示词: ${processedPrompts.length} 个`);
    console.log(`   最近提示词: ${recentPrompts.length} 个`);
    console.log(`   总AI回复: ${processedGenerations.length} 个`);
    console.log(`   最近AI回复: ${recentGenerations.length} 个`);
    console.log(`   时间格式: 原始时间戳 (中国标准时间显示)`);
    console.log(`   页面路径: ${realHtmlPath}`);
    
    return realHtmlPath;
    
  } catch (error) {
    console.error('❌ 提取失败:', error);
  } finally {
    db.close();
  }
}

extractRealData(); 