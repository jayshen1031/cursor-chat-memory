#!/usr/bin/env node

/**
 * 🔍 Cursor 聊天数据提取器
 * 
 * 从Cursor的SQLite数据库中提取聊天历史数据
 * 并将其转换为JSON格式用于网页展示
 */

import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import os from 'os';

// 配置
const CONFIG = {
    // Cursor数据库路径
    cursorDir: path.join(os.homedir(), 'Library/Application Support/Cursor'),
    outputFile: './output/data/chat-data.json',
    // 工作区数据库路径（从扫描结果获取）
    workspaceDbPath: '/Users/jay/Library/Application Support/Cursor/User/workspaceStorage/e76c6a8343ed4d7d7b8f77651bad3214/state.vscdb'
};

class CursorChatExtractor {
    constructor() {
        this.chatData = {
            prompts: [],
            generations: [],
            conversations: [],
            stats: {
                totalPrompts: 0,
                totalGenerations: 0,
                extractedAt: new Date().toISOString(),
                todayOnly: false
            }
        };
    }

    /**
     * 提取今天的聊天数据
     */
    async extractTodayChats() {
        console.log('🚀 开始提取今天的Cursor聊天数据...');
        console.log('📊 数据库路径:', CONFIG.workspaceDbPath);

        try {
            // 检查数据库文件是否存在
            if (!fs.existsSync(CONFIG.workspaceDbPath)) {
                throw new Error(`数据库文件不存在: ${CONFIG.workspaceDbPath}`);
            }

            // 提取数据
            await this.extractFromWorkspaceDb();
            
            // 过滤今天的数据
            this.filterTodayData();
            
            // 使用新的对话分析方法
            const conversations = this.analyzeConversations();
            this.chatData.conversations = conversations;
            
            // 保存到JSON文件
            this.saveToJson();
            
            console.log('✅ 数据提取完成!');
            this.printStats();

        } catch (error) {
            console.error('❌ 提取失败:', error.message);
            process.exit(1);
        }
    }

    /**
     * 从工作区数据库提取数据
     */
    async extractFromWorkspaceDb() {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(CONFIG.workspaceDbPath, sqlite3.OPEN_READONLY, (err) => {
                if (err) {
                    reject(new Error(`无法打开数据库: ${err.message}`));
                    return;
                }
                console.log('📖 成功连接到工作区数据库');
            });

            // 查询prompts数据
            db.get("SELECT value FROM ItemTable WHERE key = 'aiService.prompts'", (err, row) => {
                if (err) {
                    console.error('❌ 查询prompts失败:', err);
                } else if (row) {
                    try {
                        this.chatData.prompts = JSON.parse(row.value);
                        console.log(`📝 成功提取 ${this.chatData.prompts.length} 条提示词`);
                    } catch (parseErr) {
                        console.error('❌ 解析prompts数据失败:', parseErr.message);
                    }
                }

                // 查询generations数据
                db.get("SELECT value FROM ItemTable WHERE key = 'aiService.generations'", (err, row) => {
                    if (err) {
                        console.error('❌ 查询generations失败:', err);
                    } else if (row) {
                        try {
                            this.chatData.generations = JSON.parse(row.value);
                            console.log(`🤖 成功提取 ${this.chatData.generations.length} 条AI回复`);
                        } catch (parseErr) {
                            console.error('❌ 解析generations数据失败:', parseErr.message);
                        }
                    }

                    // 查询composer数据
                    db.get("SELECT value FROM ItemTable WHERE key = 'composer.composerData'", (err, row) => {
                        if (err) {
                            console.error('❌ 查询composer数据失败:', err);
                        } else if (row) {
                            try {
                                const composerData = JSON.parse(row.value);
                                console.log('🎼 找到composer数据');
                                // 可以在这里处理composer数据
                            } catch (parseErr) {
                                console.error('❌ 解析composer数据失败:', parseErr.message);
                            }
                        }

                        db.close((err) => {
                            if (err) {
                                console.error('❌ 关闭数据库失败:', err.message);
                            }
                            resolve();
                        });
                    });
                });
            });
        });
    }

    /**
     * 过滤今天的数据
     */
    filterTodayData() {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        const todayEnd = todayStart + 24 * 60 * 60 * 1000;

        console.log('📅 过滤今天的数据...');
        console.log(`📆 今天时间范围: ${new Date(todayStart).toLocaleString()} - ${new Date(todayEnd).toLocaleString()}`);

        // 过滤今天的generations（AI回复）
        const todayGenerations = this.chatData.generations.filter(gen => {
            const timestamp = gen.unixMs || gen.timestamp;
            return timestamp >= todayStart && timestamp < todayEnd;
        });

        // 由于prompts没有时间戳，我们需要通过其他方式关联
        // 这里暂时保留所有prompts，后续在关联时再过滤
        
        this.chatData.generations = todayGenerations;
        this.chatData.stats.todayOnly = true;

        console.log(`🗓️ 今天的AI回复: ${todayGenerations.length} 条`);
    }

    /**
     * 关联提示词和AI回复
     */
    correlateChatPairs() {
        console.log('🔗 正在关联提示词和AI回复...');

        const conversations = [];
        
        // 按时间排序AI回复
        const sortedGenerations = this.chatData.generations.sort((a, b) => {
            const timestampA = a.unixMs || a.timestamp;
            const timestampB = b.unixMs || b.timestamp;
            return timestampA - timestampB;
        });

        // 为每个generation尝试找到对应的prompt
        sortedGenerations.forEach((generation, index) => {
            const conversation = {
                id: index + 1,
                timestamp: generation.unixMs || generation.timestamp,
                generationUUID: generation.generationUUID,
                prompt: null,
                response: generation,
                type: generation.type || 'composer'
            };

            // 尝试通过textDescription匹配prompt
            if (generation.textDescription) {
                const matchingPrompt = this.chatData.prompts.find(prompt => 
                    prompt.text === generation.textDescription
                );
                if (matchingPrompt) {
                    conversation.prompt = matchingPrompt;
                }
            }

            // 如果没有找到匹配的prompt，使用textDescription作为prompt
            if (!conversation.prompt && generation.textDescription) {
                conversation.prompt = {
                    text: generation.textDescription,
                    commandType: 4,
                    estimated: true
                };
            }

            conversations.push(conversation);
        });

        this.chatData.conversations = conversations;
        console.log(`🎯 成功关联 ${conversations.length} 个对话对`);
    }

    /**
     * 保存数据到JSON文件
     */
    saveToJson() {
        const outputData = {
            ...this.chatData,
            stats: {
                ...this.chatData.stats,
                totalPrompts: this.chatData.prompts.length,
                totalGenerations: this.chatData.generations.length,
                totalConversations: this.chatData.conversations.length
            }
        };

        try {
            fs.writeFileSync(CONFIG.outputFile, JSON.stringify(outputData, null, 2), 'utf8');
            console.log(`💾 数据已保存到: ${path.resolve(CONFIG.outputFile)}`);
        } catch (error) {
            console.error('❌ 保存文件失败:', error.message);
        }
    }



    /**
     * 打印统计信息
     */
    printStats() {
        console.log('\n📊 提取统计:');
        console.log('=' * 40);
        console.log(`📝 总提示词数: ${this.chatData.stats.totalPrompts}`);
        console.log(`🤖 总AI回复数: ${this.chatData.stats.totalGenerations}`);
        console.log(`💬 总对话数: ${this.chatData.stats.totalConversations}`);
        console.log(`⏰ 提取时间: ${this.chatData.stats.extractedAt}`);
        console.log(`📅 仅今天数据: ${this.chatData.stats.todayOnly ? '是' : '否'}`);
        
        if (this.chatData.conversations.length > 0) {
            const lastConversation = this.chatData.conversations[this.chatData.conversations.length - 1];
            const lastTime = new Date(lastConversation.timestamp);
            console.log(`🕐 最后活动: ${lastTime.toLocaleString()}`);
        }
    }



    /**
     * 🔍 分析和匹配对话对（基于generations中的textDescription）
     */
    analyzeConversations() {
        const conversations = [];
        
        console.log(`📊 开始分析 ${this.chatData.generations.length} 个AI回复...`);
        
        this.chatData.generations.forEach((generation, index) => {
            // 跳过无效的回复
            if (!generation.textDescription || 
                generation.textDescription.trim() === '' || 
                generation.textDescription.length < 2) {
                return;
            }
            
            // 使用unixMs作为时间戳
            const timestamp = generation.unixMs;
            const generationTime = new Date(timestamp);
            const promptTime = new Date(timestamp - 1000); // 提示词稍早一些
            
            conversations.push({
                id: conversations.length + 1,
                prompt: {
                    text: this.cleanText(generation.textDescription),
                    time: this.formatTime(promptTime),
                    timestamp: timestamp - 1000
                },
                response: {
                    text: this.cleanText(generation.text || generation.output || `AI处理了您的请求: "${generation.textDescription}"`),
                    time: this.formatTime(generationTime),
                    timestamp: timestamp
                },
                duration: 1, // 估算响应时间
                uuid: generation.generationUUID,
                type: generation.type
            });
        });
        
        // 按时间排序
        conversations.sort((a, b) => a.prompt.timestamp - b.prompt.timestamp);
        
        console.log(`✅ 成功匹配 ${conversations.length} 个有效对话对`);
        return conversations;
    }
    
    /**
     * 🧹 清理文本内容
     */
    cleanText(text) {
        if (!text) return '';
        
        return text
            .trim()
            .replace(/\n{3,}/g, '\n\n') // 减少多余换行
            .replace(/\s{2,}/g, ' ')    // 减少多余空格
            .substring(0, 5000);       // 限制长度
    }
    
    /**
     * ⏰ 格式化时间显示（北京时间）
     */
    formatTime(date) {
        return date.toLocaleString('zh-CN', {
            timeZone: 'Asia/Shanghai',  // 北京时间
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

// 主函数
async function main() {
    const extractor = new CursorChatExtractor();
    
    try {
        await extractor.extractTodayChats();
        
        console.log('\n🎉 所有操作完成！');
        console.log('\n💡 使用说明:');
        console.log('1. chat-data.json - 完整的原始数据，可用于 MCP Server');
        
    } catch (error) {
        console.error('❌ 程序执行失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export default CursorChatExtractor; 