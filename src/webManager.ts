#!/usr/bin/env node

import { WebServer } from './webServer';
import * as path from 'path';

async function startWebManager() {
    console.log('🚀 启动 Cursor Chat Memory Web 管理界面...');
    
    const projectPath = process.cwd();
    const port = parseInt(process.env.PORT || '3000');
    
    console.log(`📁 项目路径: ${projectPath}`);
    console.log(`🌐 启动端口: ${port}`);
    
    const server = new WebServer(port, projectPath);
    
    try {
        await server.start();
        console.log(`✅ Web管理界面已启动:`);
        console.log(`   🔗 本地访问: http://localhost:${port}`);
        console.log(`   📖 管理功能:`);
        console.log(`      - 📋 历史会话管理`);
        console.log(`      - 🧠 提示词中心管理`); 
        console.log(`      - ⚡ 智能引用生成`);
        console.log(`      - 📊 统计分析`);
        console.log('');
        console.log('按 Ctrl+C 停止服务器');
        
        // 优雅关闭
        process.on('SIGINT', () => {
            console.log('\n⏹️  正在关闭服务器...');
            server.stop();
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            console.log('\n⏹️  正在关闭服务器...');
            server.stop();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ 启动失败:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    startWebManager();
}

export { startWebManager }; 