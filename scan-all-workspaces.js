const fs = require('fs');
const path = require('path');
const os = require('os');
const Database = require('sqlite3').Database;

async function scanAllWorkspaces() {
  console.log('🔍 扫描所有Cursor工作区，寻找今日真实对话\n');
  
  const workspaceStoragePath = path.join(os.homedir(), 'Library/Application Support/Cursor/User/workspaceStorage');
  
  if (!fs.existsSync(workspaceStoragePath)) {
    console.error('❌ 工作区存储路径不存在:', workspaceStoragePath);
    return;
  }
  
  console.log(`📂 扫描路径: ${workspaceStoragePath}\n`);
  
  // 获取所有工作区目录
  const workspaceDirs = fs.readdirSync(workspaceStoragePath).filter(dir => {
    const fullPath = path.join(workspaceStoragePath, dir);
    return fs.statSync(fullPath).isDirectory() && dir.length > 10; // 过滤掉明显不是工作区ID的目录
  });
  
  console.log(`🎯 发现 ${workspaceDirs.length} 个工作区目录:\n`);
  
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  
  const workspaceResults = [];
  
  for (const workspaceId of workspaceDirs) {
    console.log(`📁 检查工作区: ${workspaceId.substring(0, 20)}...`);
    
    const dbPath = path.join(workspaceStoragePath, workspaceId, 'state.vscdb');
    
    if (!fs.existsSync(dbPath)) {
      console.log(`   ⚠️  数据库文件不存在: state.vscdb`);
      continue;
    }
    
    // 检查文件修改时间
    const dbStats = fs.statSync(dbPath);
    const lastModified = dbStats.mtime;
    const isToday = lastModified.getTime() > todayStart;
    
    console.log(`   📄 数据库修改时间: ${lastModified.toLocaleString()}`);
    console.log(`   📅 是否为今日修改: ${isToday ? '✅ 是' : '❌ 否'}`);
    
    try {
      const result = await analyzeWorkspaceDatabase(dbPath, workspaceId, isToday);
      workspaceResults.push({
        workspaceId,
        dbPath,
        lastModified,
        isToday,
        ...result
      });
    } catch (error) {
      console.log(`   ❌ 分析失败: ${error.message}`);
    }
    
    console.log('');
  }
  
  // 总结结果
  console.log('📊 扫描结果总结:\n');
  
  const todayWorkspaces = workspaceResults.filter(w => w.isToday);
  const hasRecentData = workspaceResults.filter(w => w.hasRecentPrompts || w.hasRecentGenerations);
  
  console.log(`✅ 今日修改的工作区: ${todayWorkspaces.length} 个`);
  console.log(`🔄 有最新数据的工作区: ${hasRecentData.length} 个\n`);
  
  if (todayWorkspaces.length > 0) {
    console.log('🎯 今日活跃工作区详情:');
    todayWorkspaces.forEach((workspace, index) => {
      console.log(`${index + 1}. 工作区ID: ${workspace.workspaceId.substring(0, 20)}...`);
      console.log(`   最后修改: ${workspace.lastModified.toLocaleString()}`);
      console.log(`   提示词数量: ${workspace.promptCount}`);
      console.log(`   生成内容数量: ${workspace.generationCount}`);
      console.log(`   最新提示词: ${workspace.hasRecentPrompts ? '✅' : '❌'}`);
      console.log(`   最新生成: ${workspace.hasRecentGenerations ? '✅' : '❌'}`);
      if (workspace.latestPrompt) {
        console.log(`   最新提示词内容: "${workspace.latestPrompt.substring(0, 100)}..."`);
      }
      if (workspace.latestGeneration) {
        console.log(`   最新回复内容: "${workspace.latestGeneration.substring(0, 100)}..."`);
      }
      console.log('');
    });
  }
  
  if (hasRecentData.length > 0 && todayWorkspaces.length === 0) {
    console.log('🔄 有最新数据但非今日修改的工作区:');
    hasRecentData.forEach((workspace, index) => {
      console.log(`${index + 1}. 工作区ID: ${workspace.workspaceId.substring(0, 20)}...`);
      console.log(`   最后修改: ${workspace.lastModified.toLocaleString()}`);
      console.log(`   提示词数量: ${workspace.promptCount}`);
      console.log(`   生成内容数量: ${workspace.generationCount}`);
      console.log('');
    });
  }
  
  return workspaceResults;
}

async function analyzeWorkspaceDatabase(dbPath, workspaceId, isToday) {
  return new Promise((resolve, reject) => {
    const db = new Database(dbPath);
    
    const queries = [
      new Promise((res) => {
        db.get("SELECT value FROM ItemTable WHERE key = 'aiService.prompts'", (err, row) => {
          res({ type: 'prompts', data: err ? null : row });
        });
      }),
      new Promise((res) => {
        db.get("SELECT value FROM ItemTable WHERE key = 'aiService.generations'", (err, row) => {
          res({ type: 'generations', data: err ? null : row });
        });
      })
    ];
    
    Promise.all(queries).then(results => {
      let prompts = [];
      let generations = [];
      
      for (const result of results) {
        if (result.type === 'prompts' && result.data?.value) {
          try {
            prompts = JSON.parse(result.data.value);
          } catch (e) {
            console.log(`   ⚠️  解析prompts失败: ${e.message}`);
          }
        } else if (result.type === 'generations' && result.data?.value) {
          try {
            generations = JSON.parse(result.data.value);
          } catch (e) {
            console.log(`   ⚠️  解析generations失败: ${e.message}`);
          }
        }
      }
      
      // 分析数据
      const now = Date.now();
      const oneHourAgo = now - (60 * 60 * 1000);
      const sixHoursAgo = now - (6 * 60 * 60 * 1000);
      
      // 检查最近的提示词
      const recentPrompts = prompts.filter(p => p.unixMs && p.unixMs > sixHoursAgo);
      const veryRecentPrompts = prompts.filter(p => p.unixMs && p.unixMs > oneHourAgo);
      
      // 检查最近的生成内容
      const recentGenerations = generations.filter(g => g.unixMs && g.unixMs > sixHoursAgo);
      const veryRecentGenerations = generations.filter(g => g.unixMs && g.unixMs > oneHourAgo);
      
      const latestPrompt = prompts.length > 0 ? prompts[prompts.length - 1]?.text : null;
      const latestGeneration = generations.length > 0 ? generations[generations.length - 1]?.textDescription : null;
      
      console.log(`   📝 总提示词: ${prompts.length} (最近6小时: ${recentPrompts.length}, 最近1小时: ${veryRecentPrompts.length})`);
      console.log(`   🤖 总生成内容: ${generations.length} (最近6小时: ${recentGenerations.length}, 最近1小时: ${veryRecentGenerations.length})`);
      
      if (latestPrompt) {
        console.log(`   📄 最新提示词: "${latestPrompt.substring(0, 60)}..."`);
      }
      if (latestGeneration) {
        console.log(`   📄 最新回复: "${latestGeneration.substring(0, 60)}..."`);
      }
      
      db.close();
      
      resolve({
        promptCount: prompts.length,
        generationCount: generations.length,
        hasRecentPrompts: veryRecentPrompts.length > 0,
        hasRecentGenerations: veryRecentGenerations.length > 0,
        latestPrompt,
        latestGeneration,
        recentPromptsCount: recentPrompts.length,
        recentGenerationsCount: recentGenerations.length
      });
    }).catch(error => {
      db.close();
      reject(error);
    });
  });
}

scanAllWorkspaces().catch(console.error); 