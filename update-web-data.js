const { PromptCenter } = require('./out/promptCenter');
const fs = require('fs');
const path = require('path');

async function updateWebData() {
  console.log('🔄 更新Web页面数据...\n');
  
  const promptCenter = new PromptCenter();
  
  try {
    // 1. 提取最新的提示词数据
    console.log('📂 提取提示词数据...');
    const projectPath = '/Users/jay/Documents/baidu/projects/cursor-chat-memory';
    const extracts = await promptCenter.extractFromConversations(projectPath);
    
    console.log(`✅ 成功提取 ${extracts.length} 个会话的数据`);
    
    // 2. 更新提示词数据库
    promptCenter.updatePromptsFromExtracts(extracts);
    
    // 3. 获取今日提示词（修复后的）
    const todayPrompts = promptCenter.getTodayPrompts();
    console.log(`📅 今日提示词数量: ${todayPrompts.length}`);
    
    // 4. 获取统计数据
    const stats = promptCenter.getStatistics();
    console.log(`📊 总提示词数量: ${stats.total}`);
    
    // 5. 生成Web页面数据
    const webData = {
      timestamp: new Date().toISOString(),
      todayPromptsCount: todayPrompts.length,
      totalPromptsCount: stats.total,
      categoryStats: stats.byCategory,
      topTags: stats.topTags,
      recentPrompts: todayPrompts.slice(0, 10).map(prompt => ({
        id: prompt.id,
        content: prompt.content.substring(0, 200),
        category: prompt.category,
        tags: prompt.tags,
        createdAt: prompt.createdAt,
        effectiveness: prompt.effectiveness,
        displayTime: new Date(prompt.createdAt).toLocaleString()
      })),
      templates: promptCenter.getTemplates(),
      insights: extracts.map(extract => extract.insights).flat(),
      patterns: extracts.map(extract => extract.patterns).flat()
    };
    
    // 6. 保存到web目录
    const webDataPath = path.join(__dirname, 'web', 'data', 'prompts.json');
    const webDataDir = path.dirname(webDataPath);
    
    // 确保目录存在
    if (!fs.existsSync(webDataDir)) {
      fs.mkdirSync(webDataDir, { recursive: true });
    }
    
    fs.writeFileSync(webDataPath, JSON.stringify(webData, null, 2));
    console.log(`💾 数据已保存到: ${webDataPath}`);
    
    // 7. 生成简单的HTML更新
    const htmlUpdate = `
<script>
// 更新提示词数据
window.promptData = ${JSON.stringify(webData, null, 2)};

// 更新页面显示
if (document.getElementById('todayCount')) {
  document.getElementById('todayCount').textContent = '${todayPrompts.length}';
}

if (document.getElementById('totalCount')) {
  document.getElementById('totalCount').textContent = '${stats.total}';
}

// 更新提示词列表
if (document.getElementById('promptsList')) {
  const promptsList = document.getElementById('promptsList');
  promptsList.innerHTML = '';
  
  window.promptData.recentPrompts.forEach((prompt, index) => {
    const promptCard = document.createElement('div');
    promptCard.className = 'prompt-card';
    promptCard.innerHTML = \`
      <div class="prompt-header">
        <span class="prompt-category">\${prompt.category}</span>
        <span class="prompt-time">\${prompt.displayTime}</span>
      </div>
      <div class="prompt-content">\${prompt.content}...</div>
      <div class="prompt-footer">
        <div class="prompt-tags">
          \${prompt.tags.map(tag => \`<span class="tag">\${tag}</span>\`).join('')}
        </div>
        <div class="prompt-effectiveness">效果: \${Math.round(prompt.effectiveness * 100)}%</div>
      </div>
    \`;
    promptsList.appendChild(promptCard);
  });
}

console.log('✅ Web页面数据已更新', window.promptData);
</script>

<style>
.prompt-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background: white;
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.prompt-category {
  background: #007acc;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.prompt-time {
  color: #666;
  font-size: 12px;
}

.prompt-content {
  margin: 12px 0;
  line-height: 1.5;
}

.prompt-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tag {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  margin-right: 4px;
}

.prompt-effectiveness {
  font-weight: bold;
  color: #28a745;
}
</style>
`;
    
    // 8. 保存HTML更新脚本
    const htmlUpdatePath = path.join(__dirname, 'web', 'update.html');
    fs.writeFileSync(htmlUpdatePath, htmlUpdate);
    console.log(`🌐 HTML更新脚本已保存到: ${htmlUpdatePath}`);
    
    // 9. 创建实时显示页面
    const realtimePage = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cursor Chat Memory - 提示词中心</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        
        .header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
            font-size: 2em;
            font-weight: bold;
            color: #007acc;
        }
        
        .stat-label {
            color: #666;
            margin-top: 8px;
        }
        
        .prompts-container {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .section-title {
            font-size: 1.5em;
            margin-bottom: 20px;
            color: #333;
        }
        
        .prompt-card {
            border: 1px solid #eee;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
            transition: box-shadow 0.2s;
        }
        
        .prompt-card:hover {
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .prompt-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        
        .prompt-category {
            background: #007acc;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
        }
        
        .prompt-time {
            color: #666;
            font-size: 12px;
        }
        
        .prompt-content {
            margin: 12px 0;
            line-height: 1.5;
            color: #333;
        }
        
        .prompt-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .tag {
            background: #f0f0f0;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
            margin-right: 4px;
        }
        
        .prompt-effectiveness {
            font-weight: bold;
            color: #28a745;
        }
        
        .refresh-btn {
            background: #007acc;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-left: 10px;
        }
        
        .refresh-btn:hover {
            background: #005a9e;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 Cursor Chat Memory - 提示词中心</h1>
        <p>智能提示词管理和分析平台</p>
        <button class="refresh-btn" onclick="refreshData()">🔄 刷新数据</button>
        <span id="lastUpdate" style="color: #666; margin-left: 10px;"></span>
    </div>
    
    <div class="stats">
        <div class="stat-card">
            <div class="stat-number" id="todayCount">${todayPrompts.length}</div>
            <div class="stat-label">今日提示词</div>
        </div>
        <div class="stat-card">
            <div class="stat-number" id="totalCount">${stats.total}</div>
            <div class="stat-label">总提示词数</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${Math.round(stats.avgEffectiveness * 100)}%</div>
            <div class="stat-label">平均效果</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${Object.keys(stats.byCategory).length}</div>
            <div class="stat-label">分类数量</div>
        </div>
    </div>
    
    <div class="prompts-container">
        <h2 class="section-title">📝 最新提示词</h2>
        <div id="promptsList">
            <!-- 提示词列表将在这里动态加载 -->
        </div>
    </div>

    <script>
        // 初始化数据
        window.promptData = ${JSON.stringify(webData, null, 2)};
        
        function renderPrompts() {
            const promptsList = document.getElementById('promptsList');
            promptsList.innerHTML = '';
            
            window.promptData.recentPrompts.forEach((prompt, index) => {
                const promptCard = document.createElement('div');
                promptCard.className = 'prompt-card';
                promptCard.innerHTML = \`
                    <div class="prompt-header">
                        <span class="prompt-category">\${prompt.category}</span>
                        <span class="prompt-time">\${prompt.displayTime}</span>
                    </div>
                    <div class="prompt-content">\${prompt.content}\${prompt.content.length === 200 ? '...' : ''}</div>
                    <div class="prompt-footer">
                        <div class="prompt-tags">
                            \${prompt.tags.map(tag => \`<span class="tag">\${tag}</span>\`).join('')}
                        </div>
                        <div class="prompt-effectiveness">效果: \${Math.round(prompt.effectiveness * 100)}%</div>
                    </div>
                \`;
                promptsList.appendChild(promptCard);
            });
        }
        
        function refreshData() {
            // 这里可以实现Ajax刷新数据的逻辑
            console.log('刷新数据...');
            document.getElementById('lastUpdate').textContent = '最后更新: ' + new Date().toLocaleString();
        }
        
        // 初始化页面
        renderPrompts();
        document.getElementById('lastUpdate').textContent = '最后更新: ' + new Date().toLocaleString();
        
        console.log('✅ 提示词中心页面已加载', window.promptData);
    </script>
</body>
</html>
`;
    
    const realtimePagePath = path.join(__dirname, 'web', 'prompt-center.html');
    fs.writeFileSync(realtimePagePath, realtimePage);
    console.log(`🌐 实时提示词页面已创建: ${realtimePagePath}`);
    
    console.log('\n🎉 Web数据更新完成！');
    console.log('\n📊 更新摘要:');
    console.log(`   今日提示词: ${todayPrompts.length} 个`);
    console.log(`   总提示词: ${stats.total} 个`);
    console.log(`   分类分布: ${Object.entries(stats.byCategory).map(([k,v]) => `${k}(${v})`).join(', ')}`);
    console.log(`   热门标签: ${stats.topTags.slice(0, 5).map(t => `${t.tag}(${t.count})`).join(', ')}`);
    console.log('\n💡 访问方式:');
    console.log(`   1. 直接打开: file://${realtimePagePath}`);
    console.log(`   2. 或启动Web服务器查看`);
    
  } catch (error) {
    console.error('❌ 更新失败:', error);
  }
}

updateWebData().catch(console.error); 