#!/usr/bin/env node

import { WebServer } from './webServer';
import * as path from 'path';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const isDev = process.argv.includes('--dev');

// 获取当前工作目录作为项目路径
const projectPath = process.cwd();

console.log('🧠 启动 Cursor Chat Memory Web 服务器...');
console.log(`📁 项目路径: ${projectPath}`);
console.log(`🌐 端口: ${PORT}`);
console.log(`🔧 开发模式: ${isDev ? '是' : '否'}`);

const webServer = new WebServer(PORT, projectPath);

webServer.start().then(() => {
  console.log('\n✅ Web 服务器已启动!');
  console.log(`🔗 访问地址: http://localhost:${PORT}`);
  console.log('📋 可用功能:');
  console.log('   - 📋 历史会话管理');
  console.log('   - 🧠 提示词中心');
  console.log('   - ⚡ 智能引用生成');
  console.log('   - 📊 统计分析');
  console.log('\n💡 提示: 按 Ctrl+C 停止服务器');
}).catch((error) => {
  console.error('❌ 启动失败:', error);
  process.exit(1);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭服务器...');
  webServer.stop();
  console.log('👋 服务器已关闭');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 收到终止信号，正在关闭服务器...');
  webServer.stop();
  process.exit(0);
}); 