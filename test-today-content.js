#!/usr/bin/env node

/**
 * 🧪 测试今天的会话内容是否完整
 */

const http = require('http');
const { URL } = require('url');

console.log('🧪 测试今天的会话内容...\n');

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            timeout: 10000
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
        req.on('timeout', () => reject(new Error('Request timeout')));
        req.end();
    });
}

async function testTodayContent() {
    try {
        // 测试修复后数据API
        console.log('1. 测试修复后数据API...');
        const cursorResponse = await makeRequest('http://localhost:3001/api/cursor-data');
        
        if (cursorResponse.statusCode === 200) {
            const cursorData = JSON.parse(cursorResponse.body);
            console.log('   ✅ 修复后数据API正常');
            console.log(`   📊 今天提示词: ${cursorData.data.todayPromptsCount}`);
            console.log(`   📊 今天AI回复: ${cursorData.data.todayGenerationsCount}`);
            
            // 检查最新的几个提示词
            const latestPrompts = cursorData.data.todayPrompts.slice(0, 3);
            console.log('   🔍 最新的3个提示词:');
            latestPrompts.forEach((prompt, idx) => {
                const text = prompt.text.substring(0, 50) + (prompt.text.length > 50 ? '...' : '');
                console.log(`      ${idx + 1}. ${text} (${prompt.chinaTime})`);
            });
        } else {
            console.log('   ❌ 修复后数据API不可用');
        }
        
        console.log('\n2. 测试Web界面API...');
        const webResponse = await makeRequest('http://localhost:3000/api/sessions');
        
        if (webResponse.statusCode === 200) {
            const webData = JSON.parse(webResponse.body);
            console.log('   ✅ Web界面API正常');
            console.log(`   📊 总会话数: ${webData.sessions.length}`);
            
            // 检查最新的几个会话
            const latestSessions = webData.sessions.slice(0, 3);
            console.log('   🔍 最新的3个会话:');
            latestSessions.forEach((session, idx) => {
                console.log(`      ${idx + 1}. ${session.title} (${session.messages.length}条消息)`);
                
                // 检查是否包含当前对话内容
                const hasCurrentContent = session.messages.some(msg => 
                    msg.content.includes('会话内容不全') || 
                    msg.content.includes('会话内容不是今天最新的')
                );
                
                if (hasCurrentContent) {
                    console.log(`         🎯 包含当前对话内容！`);
                }
            });
        } else {
            console.log('   ❌ Web界面API不可用');
        }
        
        console.log('\n✅ 测试完成！');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    }
}

testTodayContent(); 