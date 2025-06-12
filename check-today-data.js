#!/usr/bin/env node

/**
 * 🔍 检查今天最新的Cursor数据
 * 确定为什么看不到今天的会话内容
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

console.log('🔍 检查今天最新的数据...\n');

function checkTodayData() {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    console.log('📅 检查时间范围:');
    console.log(`   开始: ${todayStart.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
    console.log(`   结束: ${todayEnd.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n`);
    
    // 检查主数据库
    const dbPath = path.join(require('os').homedir(), 
        'Library/Application Support/Cursor/User/workspaceStorage/e76c6a8343ed4d7d7b8f77651bad3214/state.vscdb');
    
    if (!fs.existsSync(dbPath)) {
        console.log('❌ 数据库文件不存在:', dbPath);
        return;
    }
    
    console.log('✅ 找到数据库:', dbPath);
    console.log(`📊 文件大小: ${(fs.statSync(dbPath).size / 1024).toFixed(2)} KB`);
    console.log(`🕐 最后修改: ${fs.statSync(dbPath).mtime.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n`);
    
    try {
        const db = Database(dbPath, { readonly: true });
        
        // 获取所有键值
        const allKeys = db.prepare("SELECT key FROM ItemTable").all();
        console.log('🔑 数据库中的所有键:');
        allKeys.forEach(row => {
            console.log(`   - ${row.key}`);
        });
        console.log();
        
        // 检查提示词数据
        const promptsRow = db.prepare("SELECT value FROM ItemTable WHERE key = 'aiService.prompts'").get();
        const generationsRow = db.prepare("SELECT value FROM ItemTable WHERE key = 'aiService.generations'").get();
        
        if (promptsRow) {
            const prompts = JSON.parse(promptsRow.value);
            console.log(`📝 提示词总数: ${prompts.length}`);
            
            // 分析时间戳
            const promptTimestamps = prompts.map(p => p.unixMs || p.createdAt || p.timestamp).filter(Boolean);
            console.log(`📊 有效时间戳的提示词: ${promptTimestamps.length}`);
            
            if (promptTimestamps.length > 0) {
                const latest = Math.max(...promptTimestamps);
                const earliest = Math.min(...promptTimestamps);
                console.log(`   最早: ${new Date(earliest).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
                console.log(`   最晚: ${new Date(latest).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
                
                // 检查今天的提示词
                const todayPrompts = promptTimestamps.filter(ts => ts >= todayStart.getTime() && ts < todayEnd.getTime());
                console.log(`📅 今天的提示词: ${todayPrompts.length} 个\n`);
            }
        } else {
            console.log('❌ 没有找到提示词数据\n');
        }
        
        if (generationsRow) {
            const generations = JSON.parse(generationsRow.value);
            console.log(`🤖 AI回复总数: ${generations.length}`);
            
            // 分析时间戳
            const genTimestamps = generations.map(g => g.unixMs || g.createdAt || g.timestamp).filter(Boolean);
            console.log(`📊 有效时间戳的AI回复: ${genTimestamps.length}`);
            
            if (genTimestamps.length > 0) {
                const latest = Math.max(...genTimestamps);
                const earliest = Math.min(...genTimestamps);
                console.log(`   最早: ${new Date(earliest).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
                console.log(`   最晚: ${new Date(latest).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
                
                // 检查今天的AI回复
                const todayGenerations = genTimestamps.filter(ts => ts >= todayStart.getTime() && ts < todayEnd.getTime());
                console.log(`📅 今天的AI回复: ${todayGenerations.length} 个`);
                
                if (todayGenerations.length > 0) {
                    console.log('🔍 今天的AI回复时间戳:');
                    todayGenerations.slice(0, 5).forEach((ts, idx) => {
                        console.log(`   ${idx + 1}. ${new Date(ts).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
                    });
                }
                console.log();
            }
        } else {
            console.log('❌ 没有找到AI回复数据\n');
        }
        
        db.close();
        
    } catch (error) {
        console.error('❌ 检查数据失败:', error.message);
    }
}

function checkChatFiles() {
    console.log('🔍 检查项目目录下的聊天文件...\n');
    
    // 检查当前项目目录
    const projectPath = process.cwd();
    console.log(`📂 项目路径: ${projectPath}`);
    
    // 检查.cursor-chat目录
    const chatDir = path.join(projectPath, '.cursor-chat');
    if (fs.existsSync(chatDir)) {
        console.log('✅ 找到.cursor-chat目录');
        const files = fs.readdirSync(chatDir);
        console.log(`📄 聊天文件数量: ${files.length}`);
        
        files.slice(0, 5).forEach(file => {
            const filePath = path.join(chatDir, file);
            const stat = fs.statSync(filePath);
            console.log(`   - ${file} (${(stat.size / 1024).toFixed(2)} KB, ${stat.mtime.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })})`);
        });
    } else {
        console.log('❌ 没有找到.cursor-chat目录');
    }
    
    console.log();
}

// 执行检查
checkTodayData();
checkChatFiles();

console.log('💡 建议:');
console.log('   1. 如果没有今天的数据，可能需要等待Cursor保存当前对话');
console.log('   2. 当前正在进行的对话通常不会立即保存到数据库');
console.log('   3. 可以尝试关闭并重新打开Cursor来触发数据保存'); 