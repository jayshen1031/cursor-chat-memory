const http = require('http');

async function testWebInterface() {
    console.log('🧪 测试Web界面数据更新...\n');
    
    try {
        // 测试API接口
        console.log('1. 测试 /api/cursor-data 接口...');
        const cursorDataResponse = await fetch('http://localhost:3001/api/cursor-data');
        
        if (cursorDataResponse.ok) {
            const cursorData = await cursorDataResponse.json();
            console.log(`   ✅ API响应正常`);
            console.log(`   📊 提示词数量: ${cursorData.data?.improvedPromptsCount || 0}`);
            console.log(`   🤖 AI回复数量: ${cursorData.data?.totalGenerationsCount || 0}`);
            console.log(`   ⏰ 最新更新: ${cursorData.timestamp}`);
        } else {
            console.log(`   ❌ API响应失败: ${cursorDataResponse.status}`);
        }
        
        // 测试Web页面
        console.log('\n2. 测试Web页面加载...');
        const webResponse = await fetch('http://localhost:3001/');
        
        if (webResponse.ok) {
            const html = await webResponse.text();
            console.log(`   ✅ Web页面加载正常`);
            console.log(`   📄 页面大小: ${Math.round(html.length / 1024)}KB`);
            
            // 检查关键内容
            const hasTitle = html.includes('修复后的Cursor数据');
            const hasLoadDataFunction = html.includes('loadData()');
            const hasStatsSection = html.includes('stats');
            
            console.log(`   🎯 包含标题: ${hasTitle ? '✅' : '❌'}`);
            console.log(`   🔄 包含加载功能: ${hasLoadDataFunction ? '✅' : '❌'}`);
            console.log(`   📊 包含统计区域: ${hasStatsSection ? '✅' : '❌'}`);
        } else {
            console.log(`   ❌ Web页面加载失败: ${webResponse.status}`);
        }
        
        // 检查是否有最新的对话数据
        console.log('\n3. 检查最新对话数据...');
        const cursorData = await fetch('http://localhost:3001/api/cursor-data').then(r => r.json());
        
        if (cursorData.success && cursorData.data) {
            const recentGenerations = cursorData.data.recentGenerations || [];
            const hasCurrentConversation = recentGenerations.some(gen => 
                (gen.textDescription || gen.content || '').includes('归档当前对话')
            );
            
            console.log(`   📝 最新AI回复数量: ${recentGenerations.length}`);
            console.log(`   🎯 包含当前对话: ${hasCurrentConversation ? '✅' : '❌'}`);
            
            if (recentGenerations.length > 0) {
                const latest = recentGenerations[0];
                console.log(`   ⏰ 最新回复时间: ${latest.chinaTime}`);
                console.log(`   💬 最新回复内容: ${(latest.textDescription || latest.content || '').substring(0, 50)}...`);
            }
        }
        
        console.log('\n✅ Web界面测试完成！');
        console.log('\n🌐 您可以访问以下地址查看更新后的数据:');
        console.log('   • 修复后数据: http://localhost:3001');
        console.log('   • API接口: http://localhost:3001/api/cursor-data');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    }
}

// 执行测试
testWebInterface(); 