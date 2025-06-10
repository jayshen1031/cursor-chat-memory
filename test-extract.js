// 简单的数据提取测试脚本
const http = require('http');

function testAPI(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                try {
                    const result = JSON.parse(responseData);
                    resolve(result);
                } catch (error) {
                    resolve({ success: false, error: 'Parse error', raw: responseData });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runTests() {
    console.log('🧪 测试数据提取功能...\n');

    // 测试概览API
    console.log('1️⃣ 测试数据概览...');
    try {
        const overview = await testAPI('/api/extract/overview');
        console.log('✅ 概览API响应:', JSON.stringify(overview, null, 2));
    } catch (error) {
        console.log('❌ 概览API失败:', error.message);
    }

    console.log('\n2️⃣ 测试快速提取...');
    try {
        const quickExtract = await testAPI('/api/extract/quick', 'POST', { records: 5 });
        console.log('✅ 快速提取响应:', JSON.stringify(quickExtract, null, 2));
    } catch (error) {
        console.log('❌ 快速提取失败:', error.message);
    }

    console.log('\n3️⃣ 模拟前端更新...');
    try {
        const mockData = {
            dbCount: 8,
            totalQuestions: '预计100+',
            totalAnswers: '预计100+',
            matchRate: '约75%'
        };
        console.log('✅ 前端应该显示的数据:', JSON.stringify(mockData, null, 2));
    } catch (error) {
        console.log('❌ 模拟失败:', error.message);
    }
}

runTests().catch(console.error); 