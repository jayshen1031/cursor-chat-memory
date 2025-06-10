const { SQLiteChatReader } = require('./out/sqliteChatReader');
const { RealtimeMonitor } = require('./out/realtimeMonitor');

async function testEnhancedSQLiteReader() {
  console.log('🧪 测试增强版SQLite聊天读取器...\n');
  
  const reader = new SQLiteChatReader();
  
  try {
    // 扫描所有工作区
    console.log('📂 扫描所有工作区...');
    const allSessions = await reader.scanAllWorkspaces();
    
    console.log(`\n✅ 总共找到 ${allSessions.length} 个聊天会话\n`);
    
    // 显示会话详情（包括问答对）
    allSessions.forEach((session, index) => {
      console.log(`${index + 1}. ${session.title}`);
      console.log(`   ID: ${session.id}`);
      console.log(`   分类: ${session.category}`);
      console.log(`   重要性: ${(session.importance * 100).toFixed(0)}%`);
      console.log(`   消息数: ${session.messages.length}`);
      console.log(`   🆕 问答对数: ${session.qaPairs?.length || 0}`);
      console.log(`   摘要: ${session.summary.substring(0, 100)}...`);
      console.log(`   标签: ${session.tags.join(', ')}`);
      console.log(`   时间: ${new Date(session.lastActivity).toLocaleString()}`);
      
      // 显示问答对详情
      if (session.qaPairs && session.qaPairs.length > 0) {
        console.log('   🔗 问答对详情:');
        session.qaPairs.slice(0, 3).forEach((qa, qaIndex) => {
          console.log(`      ${qaIndex + 1}. Q: "${qa.question.substring(0, 60)}..."`);
          console.log(`         A: "${qa.answer.substring(0, 60)}..."`);
          console.log(`         置信度: ${(qa.confidence * 100).toFixed(0)}%`);
          console.log(`         UUID: ${qa.generationUUID}`);
        });
        if (session.qaPairs.length > 3) {
          console.log(`      ... 还有 ${session.qaPairs.length - 3} 个问答对`);
        }
      }
      console.log('');
    });
    
    // 🆕 测试问答对搜索
    console.log('🔍 测试问答对搜索...');
    const searchResults = await reader.searchQAPairs('项目', 0.5);
    console.log(`\n✅ 找到 ${searchResults.length} 个相关问答对\n`);
    
    searchResults.slice(0, 5).forEach((qa, index) => {
      console.log(`${index + 1}. Q: "${qa.question.substring(0, 80)}..."`);
      console.log(`   A: "${qa.answer.substring(0, 80)}..."`);
      console.log(`   置信度: ${(qa.confidence * 100).toFixed(0)}%\n`);
    });
    
    console.log('🎯 测试项目相关会话过滤...');
    const projectSessions = await reader.getProjectSessions('/Users/jay/Documents/baidu/projects/cursor-chat-memory');
    
    console.log(`\n✅ 找到 ${projectSessions.length} 个项目相关会话\n`);
    
    projectSessions.forEach((session, index) => {
      console.log(`${index + 1}. ${session.title}`);
      console.log(`   分类: ${session.category}`);
      console.log(`   重要性: ${(session.importance * 100).toFixed(0)}%`);
      console.log(`   问答对数: ${session.qaPairs?.length || 0}\n`);
    });
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

async function testRealtimeMonitor() {
  console.log('\n🔄 测试实时监控功能...\n');
  
  const monitor = new RealtimeMonitor();
  
  // 设置事件监听
  monitor.on('monitoring-started', () => {
    console.log('✅ 实时监控已启动');
  });
  
  monitor.on('database-changed', (data) => {
    console.log(`🔍 数据库变化: ${data.filePath}`);
  });
  
  monitor.on('qa-correlation-found', (data) => {
    console.log(`🎯 发现问答关联: 工作区 ${data.workspaceId}`);
    console.log(`   关联数量: ${data.correlations.length}`);
    console.log(`   平均置信度: ${(data.confidence * 100).toFixed(0)}%`);
    
    // 显示前3个关联
    data.correlations.slice(0, 3).forEach((corr, index) => {
      console.log(`   ${index + 1}. Q: "${corr.question.substring(0, 50)}..."`);
      console.log(`      A: "${corr.answer.substring(0, 50)}..."`);
      console.log(`      置信度: ${(corr.confidence * 100).toFixed(0)}%`);
    });
  });
  
  monitor.on('chat-json-found', (data) => {
    console.log(`📄 发现聊天JSON: ${data.filePath}`);
  });
  
  try {
    // 启动监控
    await monitor.startMonitoring();
    
    console.log('💡 现在可以在Cursor中进行聊天，观察实时数据变化...');
    console.log('⏰ 监控将运行30秒，然后自动停止\n');
    
    // 运行30秒后停止
    setTimeout(() => {
      monitor.stopMonitoring();
      console.log('\n📊 监控状态:', monitor.getMonitoringStatus());
      
      // 显示缓冲数据
      const bufferedData = monitor.getBufferedData();
      if (bufferedData instanceof Map && bufferedData.size > 0) {
        console.log(`\n📦 缓冲数据: ${bufferedData.size} 个工作区`);
        for (const [workspaceId, data] of bufferedData.entries()) {
          console.log(`   ${workspaceId}: ${data.prompts.length} 提示词, ${data.generations.length} 生成内容`);
        }
      }
      
      console.log('\n✅ 实时监控测试完成');
    }, 30000);
    
  } catch (error) {
    console.error('❌ 实时监控测试失败:', error);
    console.error('💡 提示: 请确保已安装 fswatch (brew install fswatch)');
  }
}

async function testIntegration() {
  console.log('\n🔧 测试集成功能...\n');
  
  const reader = new SQLiteChatReader();
  const monitor = new RealtimeMonitor();
  
  // 🔗 整合实时监控和会话读取
  monitor.on('qa-correlation-found', async (data) => {
    console.log(`🎯 实时发现新的问答关联，更新会话缓存...`);
    
    // 启用实时监控回调
    reader.enableRealTimeMonitoring((session) => {
      console.log(`📝 新会话创建: ${session.title}`);
      console.log(`   问答对数: ${session.qaPairs?.length || 0}`);
      
      if (session.qaPairs && session.qaPairs.length > 0) {
        const avgConfidence = session.qaPairs.reduce((sum, qa) => sum + qa.confidence, 0) / session.qaPairs.length;
        console.log(`   平均置信度: ${(avgConfidence * 100).toFixed(0)}%`);
      }
    });
  });
  
  try {
    console.log('🚀 启动集成测试...');
    
    // 同时启动监控和扫描
    await Promise.all([
      monitor.startMonitoring(),
      reader.scanAllWorkspaces()
    ]);
    
    console.log('✅ 集成系统已就绪');
    console.log('💡 系统将监控Cursor变化并实时更新会话数据\n');
    
    // 运行15秒
    setTimeout(() => {
      monitor.stopMonitoring();
      reader.disableRealTimeMonitoring();
      console.log('✅ 集成测试完成');
    }, 15000);
    
  } catch (error) {
    console.error('❌ 集成测试失败:', error);
  }
}

async function main() {
  console.log('🎯 Cursor聊天记忆系统 - 增强版测试\n');
  console.log('==========================================\n');
  
  // 1. 基础SQLite读取测试
  await testEnhancedSQLiteReader();
  
  // 等待2秒
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // 2. 实时监控测试（仅在有fswatch时运行）
  if (process.argv.includes('--monitor')) {
    await testRealtimeMonitor();
    
    // 等待32秒（让监控完成）
    await new Promise(resolve => setTimeout(resolve, 32000));
  }
  
  // 3. 集成测试（仅在有fswatch时运行）
  if (process.argv.includes('--integration')) {
    await testIntegration();
    
    // 等待17秒（让集成测试完成）
    await new Promise(resolve => setTimeout(resolve, 17000));
  }
  
  console.log('\n🎉 所有测试完成！');
  console.log('\n💡 使用说明:');
  console.log('   - 基础测试: node test-sqlite-reader.js');
  console.log('   - 监控测试: node test-sqlite-reader.js --monitor');
  console.log('   - 集成测试: node test-sqlite-reader.js --integration');
}

main().catch(console.error); 