const { SQLiteChatReader } = require('./out/sqliteChatReader');

async function testSQLiteReader() {
  console.log('🧪 测试SQLite聊天读取器...\n');
  
  const reader = new SQLiteChatReader();
  
  try {
    // 扫描所有工作区
    console.log('📂 扫描所有工作区...');
    const allSessions = await reader.scanAllWorkspaces();
    
    console.log(`\n✅ 总共找到 ${allSessions.length} 个聊天会话\n`);
    
    // 显示会话详情
    allSessions.forEach((session, index) => {
      console.log(`${index + 1}. ${session.title}`);
      console.log(`   ID: ${session.id}`);
      console.log(`   分类: ${session.category}`);
      console.log(`   重要性: ${(session.importance * 100).toFixed(0)}%`);
      console.log(`   消息数: ${session.messages.length}`);
      console.log(`   摘要: ${session.summary.substring(0, 100)}...`);
      console.log(`   时间: ${new Date(session.lastActivity).toLocaleString()}\n`);
    });
    
    // 测试项目相关会话
    console.log('🎯 测试项目相关会话过滤...');
    const projectSessions = await reader.getProjectSessions('/Users/jay/Documents/baidu/projects/cursor-chat-memory');
    
    console.log(`\n✅ 找到 ${projectSessions.length} 个项目相关会话\n`);
    
    projectSessions.forEach((session, index) => {
      console.log(`${index + 1}. ${session.title}`);
      console.log(`   分类: ${session.category}`);
      console.log(`   重要性: ${(session.importance * 100).toFixed(0)}%\n`);
    });
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testSQLiteReader(); 