#!/usr/bin/env node

/**
 * 🚀 创建快速加载的精简聊天数据
 */

const fs = require('fs');

function createFastData() {
    try {
        // 读取原始数据
        const originalData = JSON.parse(fs.readFileSync('./web-chat-data.json', 'utf8'));
        console.log(`📊 原始数据: ${originalData.length} 条记录`);
        
        // 精简数据结构
        const fastData = originalData.map(item => {
            const maxTextLength = 300; // 限制文本长度
            
            return {
                id: item.id,
                type: item.type,
                text: item.text.length > maxTextLength ? 
                    item.text.substring(0, maxTextLength) + '...' : 
                    item.text,
                fullText: item.text.length > maxTextLength ? item.text : undefined, // 完整文本单独存储
                timestamp: item.timestamp,
                time: item.time,
                ...(item.uuid && { uuid: item.uuid }),
                ...(item.duration && { duration: item.duration })
            };
        });
        
        // 保存精简数据
        fs.writeFileSync('./web-chat-data-fast.json', JSON.stringify(fastData, null, 0), 'utf8'); // 不格式化，减少文件大小
        
        // 计算文件大小
        const originalSize = fs.statSync('./web-chat-data.json').size;
        const fastSize = fs.statSync('./web-chat-data-fast.json').size;
        const reduction = ((originalSize - fastSize) / originalSize * 100).toFixed(1);
        
        console.log(`✅ 精简数据创建完成:`);
        console.log(`📏 原始文件: ${(originalSize / 1024).toFixed(1)} KB`);
        console.log(`📏 精简文件: ${(fastSize / 1024).toFixed(1)} KB`);
        console.log(`🎯 减少大小: ${reduction}%`);
        console.log(`💾 文件位置: ./web-chat-data-fast.json`);
        
    } catch (error) {
        console.error('❌ 创建精简数据失败:', error.message);
    }
}

// 运行
createFastData(); 