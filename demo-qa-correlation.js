const { SQLiteChatReader } = require('./out/sqliteChatReader');

async function demoQACorrelation() {
  console.log('🎯 Cursor聊天关联关系破解 - 功能演示\n');
  console.log('==========================================\n');
  
  const reader = new SQLiteChatReader();
  
  // 临时禁用项目过滤，展示所有会话
  const originalFilter = reader.isRelevantToCurrentProject;
  reader.isRelevantToCurrentProject = () => true;
  
  try {
    console.log('📂 正在扫描Cursor工作区...');
    const allSessions = await reader.scanAllWorkspaces();
    
    console.log(`\n✅ 发现 ${allSessions.length} 个聊天会话\n`);
    
    if (allSessions.length === 0) {
      console.log('💡 提示: 没有找到聊天会话，可能需要：');
      console.log('   1. 在Cursor中进行一些聊天');
      console.log('   2. 确保聊天数据已保存');
      console.log('   3. 检查工作区路径是否正确\n');
      return;
    }
    
    // 展示问答关联统计
    const totalQAPairs = allSessions.reduce((sum, session) => sum + (session.qaPairs?.length || 0), 0);
    console.log(`🔗 问答关联统计:`);
    console.log(`   总问答对数: ${totalQAPairs}`);
    console.log(`   平均每会话: ${(totalQAPairs / allSessions.length).toFixed(1)} 个问答对\n`);
    
    // 展示最佳会话示例
    const bestSessions = allSessions
      .filter(s => s.qaPairs && s.qaPairs.length > 0)
      .sort((a, b) => (b.qaPairs?.length || 0) - (a.qaPairs?.length || 0))
      .slice(0, 3);
    
    if (bestSessions.length > 0) {
      console.log('🏆 最佳问答关联示例:\n');
      
      bestSessions.forEach((session, index) => {
        console.log(`${index + 1}. 📝 ${session.title}`);
        console.log(`   问答对数: ${session.qaPairs?.length || 0}`);
        console.log(`   重要性: ${(session.importance * 100).toFixed(0)}%`);
        console.log(`   分类: ${session.category}`);
        
        if (session.qaPairs && session.qaPairs.length > 0) {
          console.log('   🔗 问答示例:');
          session.qaPairs.slice(0, 2).forEach((qa, qaIndex) => {
            console.log(`      Q${qaIndex + 1}: "${qa.question.substring(0, 60)}..."`);
            console.log(`      A${qaIndex + 1}: "${qa.answer.substring(0, 60)}..."`);
            console.log(`      置信度: ${(qa.confidence * 100).toFixed(0)}%`);
            if (qa.generationUUID) {
              console.log(`      UUID: ${qa.generationUUID.substring(0, 8)}...`);
            }
            console.log('');
          });
        }
        console.log('');
      });
    }
    
    // 展示置信度分布
    const allQAPairs = allSessions.flatMap(s => s.qaPairs || []);
    if (allQAPairs.length > 0) {
      const confidenceDistribution = {
        high: allQAPairs.filter(qa => qa.confidence >= 0.8).length,
        medium: allQAPairs.filter(qa => qa.confidence >= 0.6 && qa.confidence < 0.8).length,
        low: allQAPairs.filter(qa => qa.confidence < 0.6).length
      };
      
      console.log('📊 置信度分布:');
      console.log(`   高置信度 (≥80%): ${confidenceDistribution.high} 个 (${(confidenceDistribution.high / allQAPairs.length * 100).toFixed(1)}%)`);
      console.log(`   中置信度 (60-79%): ${confidenceDistribution.medium} 个 (${(confidenceDistribution.medium / allQAPairs.length * 100).toFixed(1)}%)`);
      console.log(`   低置信度 (<60%): ${confidenceDistribution.low} 个 (${(confidenceDistribution.low / allQAPairs.length * 100).toFixed(1)}%)\n`);
    }
    
    // 测试搜索功能
    console.log('🔍 测试问答对搜索功能...');
    const searchTerms = ['代码', '项目', '功能', 'cursor', 'chat'];
    
    for (const term of searchTerms) {
      const results = await reader.searchQAPairs(term, 0.5);
      if (results.length > 0) {
        console.log(`   "${term}": 找到 ${results.length} 个相关问答对`);
        if (results.length > 0) {
          const bestResult = results[0];
          console.log(`     最佳匹配: "${bestResult.question.substring(0, 40)}..." (置信度: ${(bestResult.confidence * 100).toFixed(0)}%)`);
        }
      }
    }
    
    console.log('\n🎉 演示完成！');
    console.log('\n💡 核心技术特点:');
    console.log('   ✅ 多重匹配策略: 索引、时间戳、内容相关性');
    console.log('   ✅ 智能置信度计算: 基于多个维度的综合评估');
    console.log('   ✅ 实时数据提取: 直接从Cursor SQLite数据库读取');
    console.log('   ✅ 高效搜索功能: 支持关键词搜索和置信度过滤');
    
  } catch (error) {
    console.error('❌ 演示失败:', error);
    console.log('\n💡 可能的解决方案:');
    console.log('   1. 确保Cursor已安装并使用过');
    console.log('   2. 检查数据库文件权限');
    console.log('   3. 尝试重新编译: npm run build');
  }
}

// 运行演示
demoQACorrelation().catch(console.error); 