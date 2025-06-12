#!/usr/bin/env node

/**
 * 🌐 简单的本地HTTP服务器
 * 用于展示Cursor聊天历史页面
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// MIME类型映射
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon'
};

// 创建服务器
const server = http.createServer((req, res) => {
    let pathname = url.parse(req.url).pathname;
    
    // 默认首页
    if (pathname === '/') {
        pathname = '/cursor-chat-viewer.html';
    }
    
    const filePath = path.join(__dirname, pathname);
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';
    
    console.log(`📝 请求: ${req.method} ${pathname}`);
    
    // 检查文件是否存在
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.log(`❌ 文件不存在: ${filePath}`);
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>404 - 文件未找到</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                        .error { color: #d63031; }
                    </style>
                </head>
                <body>
                    <h1 class="error">404 - 文件未找到</h1>
                    <p>请求的文件 <code>${pathname}</code> 不存在</p>
                    <p><a href="/">返回首页</a></p>
                </body>
                </html>
            `);
            return;
        }
        
        // 读取并返回文件
        fs.readFile(filePath, (error, content) => {
            if (error) {
                console.log(`❌ 读取文件失败: ${error.message}`);
                res.writeHead(500);
                res.end(`服务器错误: ${error.code}`);
            } else {
                res.writeHead(200, { 
                    'Content-Type': mimeType,
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
                    'Access-Control-Allow-Headers': 'Content-Type'
                });
                res.end(content, 'utf-8');
                console.log(`✅ 成功返回: ${pathname}`);
            }
        });
    });
});

// 启动服务器
server.listen(PORT, () => {
    console.log('🚀 Cursor聊天历史查看器已启动!');
    console.log('=' * 50);
    console.log(`🌐 访问地址: http://localhost:${PORT}`);
    console.log(`📁 服务目录: ${__dirname}`);
    console.log('=' * 50);
    console.log('📋 可用文件:');
    console.log('  • / - 聊天历史页面');
    console.log('  • /web-chat-data.json - 聊天数据');
    console.log('  • /chat-data.json - 完整数据');
    console.log('=' * 50);
    console.log('💡 提示: 按 Ctrl+C 停止服务器');
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n👋 正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n👋 收到终止信号，正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
}); 