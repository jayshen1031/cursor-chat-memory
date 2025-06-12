#!/usr/bin/env node

/**
 * 🧪 测试会话内容完整性
 * 验证项目知识页面的历史会话是否显示完整内容
 */

const http = require('http');
const { URL } = require('url');

console.log('🚀 测试会话内容完整性...\n');

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

async function testSessionContent() {
    try {
        console.log('🔍 检查会话API数据...');
        const response = await makeRequest('http://localhost:3000/api/sessions');
        
        if (response.statusCode !== 200) {
            console.log(`❌ API请求失败: ${response.statusCode}`);
            return;
        }
        
        const data = JSON.parse(response.body);
        const sessions = data.sessions || [];
        
        console.log(`✅ 成功获取 ${sessions.length} 个会话\n`);
        
        // 检查前3个会话的内容完整性
        for (let i = 0; i < Math.min(3, sessions.length); i++) {
            const session = sessions[i];
            console.log(`📋 会话 ${i + 1}: "${session.title}"`);
            console.log(`   🆔 ID: ${session.id}`);
            console.log(`   📝 消息数量: ${session.messages ? session.messages.length : 0}`);
            console.log(`   📅 时间戳: ${session.timestamp || '未知'}`);
            console.log(`   🏷️  分类: ${session.category || '未分类'}`);
            
            if (session.messages && session.messages.length > 0) {
                const firstMsg = session.messages[0];
                const lastMsg = session.messages[session.messages.length - 1];
                
                console.log(`   🔤 首条消息: ${firstMsg.content.substring(0, 80)}...`);
                console.log(`   🔤 末条消息: ${lastMsg.content.substring(0, 80)}...`);
                
                // 统计用户和助手消息
                const userMsgs = session.messages.filter(m => m.role === 'user').length;
                const assistantMsgs = session.messages.filter(m => m.role === 'assistant').length;
                console.log(`   👤 用户消息: ${userMsgs} 条`);
                console.log(`   🤖 助手消息: ${assistantMsgs} 条`);
                
                // 检查消息是否包含完整对话
                if (session.messages.length > 10) {
                    console.log(`   ✅ 包含完整对话内容 (${session.messages.length} 条消息)`);
                } else {
                    console.log(`   ⚠️  消息数量较少，可能不完整`);
                }
            } else {
                console.log(`   ❌ 没有消息内容`);
            }
            
            console.log('');
        }
        
        // 检查是否有今天的会话
        const today = new Date().toDateString();
        const todaySessions = sessions.filter(s => {
            const sessionDate = new Date(s.timestamp).toDateString();
            return sessionDate === today;
        });
        
        console.log(`📅 今天的会话: ${todaySessions.length} 个`);
        
        if (todaySessions.length > 0) {
            console.log('✅ 包含今天的会话数据');
            todaySessions.forEach((session, i) => {
                console.log(`   ${i + 1}. ${session.title}`);
            });
        } else {
            console.log('⚠️  没有找到今天的会话数据');
        }
        
        console.log('\n🎯 总结:');
        console.log(`📊 总会话数: ${sessions.length}`);
        console.log(`📝 消息总数: ${sessions.reduce((sum, s) => sum + (s.messages ? s.messages.length : 0), 0)}`);
        console.log(`🕐 时间范围: ${sessions.length > 0 ? new Date(sessions[sessions.length-1].timestamp).toLocaleDateString() : '无'} - ${sessions.length > 0 ? new Date(sessions[0].timestamp).toLocaleDateString() : '无'}`);
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    }
}

// 运行测试
testSessionContent(); 