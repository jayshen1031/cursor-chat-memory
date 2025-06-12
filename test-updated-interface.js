// 测试Web界面功能 - 不需要puppeteer

async function testUpdatedInterface() {
    console.log('🧪 测试更新后的Web界面功能...\n');
    
    try {
        // 测试HTML页面是否包含新功能
        console.log('1. 📄 检查HTML页面结构...');
        const fs = require('fs');
        const html = fs.readFileSync('web/index.html', 'utf8');
        
        const hasDataSourceToolbar = html.includes('data-source-toolbar');
        const hasFixedDataButton = html.includes('修复后数据');
        const hasOriginalDataButton = html.includes('原始数据');
        const hasRefreshButton = html.includes('btn-refresh');
        
        console.log(`   🎯 数据源工具栏: ${hasDataSourceToolbar ? '✅' : '❌'}`);
        console.log(`   🔧 修复后数据按钮: ${hasFixedDataButton ? '✅' : '❌'}`);
        console.log(`   📄 原始数据按钮: ${hasOriginalDataButton ? '✅' : '❌'}`);
        console.log(`   🔄 刷新按钮: ${hasRefreshButton ? '✅' : '❌'}`);
        
        // 检查CSS样式
        console.log('\n2. 🎨 检查CSS样式...');
        const css = fs.readFileSync('web/style.css', 'utf8');
        
        const hasToolbarStyles = css.includes('.data-source-toolbar');
        const hasButtonStyles = css.includes('.btn-data-source');
        const hasActiveStyles = css.includes('.btn-data-source.active');
        
        console.log(`   🎨 工具栏样式: ${hasToolbarStyles ? '✅' : '❌'}`);
        console.log(`   🔘 按钮样式: ${hasButtonStyles ? '✅' : '❌'}`);
        console.log(`   ⭐ 激活状态样式: ${hasActiveStyles ? '✅' : '❌'}`);
        
        // 检查JavaScript功能
        console.log('\n3. 📜 检查JavaScript功能...');
        const js = fs.readFileSync('web/script.js', 'utf8');
        
        const hasPageManager = js.includes('class PageManager');
        const hasDataSourceSwitch = js.includes('switchDataSource');
        const hasDataSourcePreference = js.includes('getDataSourcePreference');
        const hasStatusUpdate = js.includes('updateDataSourceStatus');
        
        console.log(`   🏗️ PageManager类: ${hasPageManager ? '✅' : '❌'}`);
        console.log(`   🔄 数据源切换: ${hasDataSourceSwitch ? '✅' : '❌'}`);
        console.log(`   ⚙️ 数据源偏好: ${hasDataSourcePreference ? '✅' : '❌'}`);
        console.log(`   📊 状态更新: ${hasStatusUpdate ? '✅' : '❌'}`);
        
        // 测试API接口
        console.log('\n4. 🌐 测试API接口...');
        
        try {
            const response = await fetch('http://localhost:3001/api/cursor-data');
            if (response.ok) {
                const data = await response.json();
                console.log(`   ✅ 修复后数据API正常 - ${data.data?.improvedPromptsCount || 0} 个提示词`);
            } else {
                console.log(`   ❌ 修复后数据API失败: ${response.status}`);
            }
        } catch (error) {
            console.log(`   ❌ 修复后数据API错误: ${error.message}`);
        }
        
        // 检查Web页面是否可访问
        console.log('\n5. 🌍 测试Web页面访问...');
        
        try {
            const pageResponse = await fetch('http://localhost:3001');
            if (pageResponse.ok) {
                const pageHtml = await pageResponse.text();
                
                const pageHasToolbar = pageHtml.includes('data-source-toolbar');
                const pageHasPageManager = pageHtml.includes('PageManager');
                const pageHasLoadingOverlay = pageHtml.includes('loadingOverlay');
                
                console.log(`   📄 页面加载正常: ✅`);
                console.log(`   🛠️ 包含数据源工具栏: ${pageHasToolbar ? '✅' : '❌'}`);
                console.log(`   🏗️ 包含PageManager: ${pageHasPageManager ? '✅' : '❌'}`);
                console.log(`   ⏳ 包含加载界面: ${pageHasLoadingOverlay ? '✅' : '❌'}`);
            } else {
                console.log(`   ❌ 页面访问失败: ${pageResponse.status}`);
            }
        } catch (error) {
            console.log(`   ❌ 页面访问错误: ${error.message}`);
        }
        
        console.log('\n✅ Web界面功能测试完成！');
        console.log('\n🌐 请访问以下地址测试功能:');
        console.log('   • 主页面: http://localhost:3001');
        console.log('   • 项目知识页面: http://localhost:3001 (点击项目知识标签)');
        console.log('\n🎯 主要功能:');
        console.log('   • 数据源切换 (原始数据 ↔ 修复后数据)');
        console.log('   • 历史会话列表自动更新');
        console.log('   • 实时数据刷新');
        console.log('   • 中文时间显示');
        
    } catch (error) {
        console.error('❌ 测试失败:', error);
    }
}

// 执行测试
testUpdatedInterface(); 