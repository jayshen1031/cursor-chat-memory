const { SQLiteChatReader } = require('./out/sqliteChatReader');

async function debugSessions() {
  console.log('🔍 调试会话过滤逻辑...\n');
  
  const reader = new SQLiteChatReader();
  
  // 临时修改过滤逻辑 - 总是返回true
  const originalFilter = reader.isRelevantToCurrentProject;
  reader.isRelevantToCurrentProject = function(title, summary, projectPath) {
    console.log(`🔎 检查会话相关性:`);
    console.log(`   标题: "${title}"`);
    console.log(`   摘要: "${summary.substring(0, 200)}..."`);
    console.log(`   项目路径: "${projectPath}"`);
    
    const isRelevant = originalFilter.call(this, title, summary, projectPath);
    console.log(`   结果: ${isRelevant ? '✅ 相关' : '❌ 不相关'}\n`);
    
    // 临时总是返回true以查看所有会话
    return true;
  };
  
  try {
    const allSessions = await reader.scanAllWorkspaces('/Users/jay/Documents/baidu/projects/cursor-chat-memory');
    
    console.log(`\n📊 扫描结果: ${allSessions.length} 个会话\n`);
    
    allSessions.forEach((session, index) => {
      console.log(`${index + 1}. 📝 ${session.title}`);
      console.log(`   ID: ${session.id}`);
      console.log(`   消息数: ${session.messages.length}`);
      console.log(`   问答对数: ${session.qaPairs?.length || 0}`);
      console.log(`   分类: ${session.category}`);
      console.log(`   重要性: ${(session.importance * 100).toFixed(0)}%`);
      console.log(`   摘要: ${session.summary}`);
      console.log(`   标签: ${session.tags.map(t => t.name).join(', ')}`);
      
      // 显示消息内容
      console.log('   消息内容:');
      session.messages.slice(0, 4).forEach((msg, msgIndex) => {
        const preview = msg.content.substring(0, 80);
        console.log(`      ${msg.role}: "${preview}${msg.content.length > 80 ? '...' : ''}"`);
      });
      
      // 显示问答对
      if (session.qaPairs && session.qaPairs.length > 0) {
        console.log('   🔗 问答对:');
        session.qaPairs.slice(0, 2).forEach((qa, qaIndex) => {
          console.log(`      Q: "${qa.question.substring(0, 60)}..."`);
          console.log(`      A: "${qa.answer.substring(0, 60)}..."`);
          console.log(`      置信度: ${(qa.confidence * 100).toFixed(0)}%`);
        });
      }
      
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ 调试失败:', error);
  }
}

debugSessions().catch(console.error); 