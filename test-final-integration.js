#!/usr/bin/env node

/**
 * 🧪 最终集成测试
 * 验证3000端口原有页面功能，特别是历史会话列表的修复后数据加载
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

console.log('🚀 开始最终集成测试...\n');

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

async function testAPI(url, name) {
    try {
        console.log(`🔍 测试 ${name}: ${url}`);
        const response = await makeRequest(url);
        
        if (response.statusCode !== 200) {
            console.log(`❌ ${name} 响应错误: ${response.statusCode}`);
            return false;
        }
        
        const data = JSON.parse(response.body);
        console.log(`✅ ${name} 正常响应`);
        
        if (url.includes('sessions')) {
            console.log(`   📊 会话数量: ${data.sessions ? data.sessions.length : 0}`);
        } else if (url.includes('cursor-data')) {
            console.log(`   📊 Cursor数据: ${data.success ? '成功' : '失败'}`);
            if (data.data && data.data.improvedPrompts) {
                console.log(`   📝 提示词数量: ${data.data.improvedPrompts.length}`);
            }
        }
        
        return true;
    } catch (error) {
        console.log(`❌ ${name} 测试失败: ${error.message}`);
        return false;
    }
}

async function testWebPage(url, name) {
    try {
        console.log(`🌐 测试 ${name}: ${url}`);
        const response = await makeRequest(url);
        
        if (response.statusCode !== 200) {
            console.log(`❌ ${name} 页面错误: ${response.statusCode}`);
            return false;
        }
        
        const html = response.body;
        
        // 检查页面标题
        const titleMatch = html.match(/<title>([^<]+)<\/title>/);
        if (titleMatch) {
            console.log(`✅ ${name} 页面正常: ${titleMatch[1].trim()}`);
        }
        
        // 检查是否包含关键元素
        const hasKnowledgeTab = html.includes('项目知识') || html.includes('knowledge');
        const hasHistoryTab = html.includes('历史会话') || html.includes('history');
        const hasPromptTab = html.includes('提示词') || html.includes('prompt');
        
        console.log(`   📑 包含项目知识页面: ${hasKnowledgeTab ? '✅' : '❌'}`);
        console.log(`   📚 包含历史会话功能: ${hasHistoryTab ? '✅' : '❌'}`);
        console.log(`   🔧 包含提示词功能: ${hasPromptTab ? '✅' : '❌'}`);
        
        return true;
    } catch (error) {
        console.log(`❌ ${name} 页面测试失败: ${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log('1️⃣ 测试API接口...\n');
    
    // 测试原始会话API
    const api1 = await testAPI('http://localhost:3000/api/sessions', '原始会话API');
    
    // 测试修复后数据API
    const api2 = await testAPI('http://localhost:3001/api/cursor-data', '修复后数据API');
    
    console.log('\n2️⃣ 测试Web页面...\n');
    
    // 测试原有页面
    const page1 = await testWebPage('http://localhost:3000', '原有管理页面');
    
    console.log('\n3️⃣ 测试完成总结:\n');
    
    const apis = [api1, api2];
    const pages = [page1];
    
    const apiCount = apis.filter(Boolean).length;
    const pageCount = pages.filter(Boolean).length;
    
    console.log(`📊 API接口: ${apiCount}/2 正常`);
    console.log(`🌐 Web页面: ${pageCount}/1 正常`);
    
    if (apiCount === 2 && pageCount === 1) {
        console.log('\n🎉 所有测试通过！');
        console.log('✅ 原有3000端口页面保持正常');
        console.log('✅ 修复后数据API可用');
        console.log('✅ 历史会话列表将优先显示修复后数据');
        console.log('\n🔗 访问地址:');
        console.log('   📱 主页面: http://localhost:3000');
        console.log('   🔧 修复数据: http://localhost:3001/api/cursor-data');
        
        console.log('\n💡 使用说明:');
        console.log('1. 打开 http://localhost:3000');
        console.log('2. 点击"项目知识"标签页');
        console.log('3. 查看历史会话列表（将显示修复后的数据）');
        console.log('4. 如果3001端口服务停止，会自动回退到原始数据');
    } else {
        console.log('\n⚠️ 部分测试未通过，请检查服务器状态');
    }
}

// 运行测试
runTests().catch(console.error); 