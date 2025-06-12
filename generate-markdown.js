#!/usr/bin/env node

/**
 * 📝 生成Markdown格式的Cursor聊天历史
 */

import fs from 'fs';
import path from 'path';

class MarkdownGenerator {
    constructor() {
        this.chatData = [];
        this.stats = {};
    }

    /**
     * 🚀 主要生成函数
     */
    async generateMarkdown() {
        try {
            console.log('开始生成Markdown聊天历史...');
            
            // 1. 加载聊天数据
            this.loadChatData();
            
            // 2. 分析统计信息
            this.analyzeStats();
            
            // 3. 生成Markdown内容
            const markdownContent = this.buildMarkdown();
            
            // 4. 保存到文件
            this.saveMarkdownFile(markdownContent);
            
            console.log('Markdown文件生成完成!');
            
        } catch (error) {
            console.error('❌ 生成失败:', error.message);
            process.exit(1);
        }
    }

    /**
     * 📊 加载聊天数据
     */
    loadChatData() {
        try {
                    // 优先使用包含完整时间戳的chat-data.json
        if (fs.existsSync('./output/data/chat-data.json')) {
            const chatData = JSON.parse(fs.readFileSync('./output/data/chat-data.json', 'utf8'));
                
                if (chatData.conversations && Array.isArray(chatData.conversations)) {
                    console.log(`加载数据: ${chatData.conversations.length} 条记录`);
                    
                    // 直接使用conversations数据，保留完整的时间戳信息
                    this.chatData = chatData.conversations.map(conv => ({
                        id: conv.id,
                        prompt: {
                            text: conv.prompt.text,
                            timestamp: conv.prompt.timestamp
                        },
                        response: {
                            text: conv.response.meaningfulText || conv.response.text
                        },
                        timestamp: conv.prompt.timestamp || conv.response.timestamp,
                        time: conv.prompt.time || conv.response.time || 
                              (conv.prompt.timestamp ? new Date(conv.prompt.timestamp).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '时间未知')
                    })).reverse(); // 最新的在前面
                    
                    console.log(`配对对话: ${this.chatData.length} 组对话`);
                    return;
                }
            }
            
            // 回退到web-chat-data.json
            if (fs.existsSync('./output/data/web-chat-data.json')) {
                const data = JSON.parse(fs.readFileSync('./output/data/web-chat-data.json', 'utf8'));
                
                // 检查数据格式
                let conversations = [];
                if (data.conversations && Array.isArray(data.conversations)) {
                    // 新格式：{conversations: [...]}
                    conversations = data.conversations;
                } else if (Array.isArray(data)) {
                    // 旧格式：[...]
                    conversations = data;
                }
                
                console.log(`加载数据: ${conversations.length} 条记录`);
                
                // 转换为内部格式
                this.chatData = conversations.map((conv, index) => ({
                    id: conv.id || index + 1,
                    prompt: {
                        text: conv.question || conv.prompt?.text || '',
                        timestamp: conv.timestamp
                    },
                    response: {
                        text: conv.answer || conv.response?.text || ''
                    },
                    time: conv.time || (conv.timestamp ? new Date(conv.timestamp).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '时间未知')
                })).reverse(); // 最新的在前面
                
                console.log(`配对对话: ${this.chatData.length} 组对话`);
            } else {
                throw new Error('未找到聊天数据文件');
            }
        } catch (error) {
            console.error('❌ 加载数据失败:', error.message);
            throw error;
        }
    }

    /**
     * 🔗 配对对话
     */
    pairConversations(rawData) {
        const conversations = [];
        
        for (let i = 0; i < rawData.length; i += 2) {
            const prompt = rawData[i];
            const response = rawData[i + 1];
            
            if (prompt && response && prompt.type === 'prompt' && response.type === 'generation') {
                conversations.push({
                    id: Math.floor(i / 2) + 1,
                    prompt: prompt,
                    response: response,
                    time: prompt.time || new Date(prompt.timestamp).toLocaleString('zh-CN', {
                        timeZone: 'Asia/Shanghai'
                    })
                });
            }
        }
        
        return conversations.reverse(); // 最新的在前面
    }

    /**
     * 📈 分析统计信息
     */
    analyzeStats() {
        const now = new Date();
        
        this.stats = {
            totalConversations: this.chatData.length,
            totalPrompts: this.chatData.length,
            totalResponses: this.chatData.length,
            generatedAt: now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
            dateRange: this.getDateRange(),
            avgWordsPerPrompt: this.getAverageWords('prompt'),
            avgWordsPerResponse: this.getAverageWords('response'),
            longestPrompt: this.getLongestText('prompt'),
            longestResponse: this.getLongestText('response'),
            timeAnalysis: this.getTimeAnalysis(),
            hourlyDistribution: this.getHourlyDistribution()
        };
    }

    /**
     * 📅 获取日期范围
     */
    getDateRange() {
        if (this.chatData.length === 0) return '无数据';
        
        // 尝试从不同位置获取时间戳
        const validTimestamps = this.chatData
            .map(chat => {
                // 尝试多个可能的时间戳位置
                return chat.timestamp || 
                       chat.prompt?.timestamp || 
                       chat.response?.timestamp ||
                       chat.prompt?.unixMs ||
                       null;
            })
            .filter(timestamp => timestamp && !isNaN(new Date(timestamp)));
        
        // 如果没有有效时间戳，返回今天日期
        if (validTimestamps.length === 0) {
            const today = new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
            return `${today} (时间戳缺失)`;
        }
        
        const earliest = new Date(Math.min(...validTimestamps));
        const latest = new Date(Math.max(...validTimestamps));
        
        const formatDate = (date) => date.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
        
        if (earliest.toDateString() === latest.toDateString()) {
            return formatDate(earliest);
        } else {
            return `${formatDate(earliest)} ~ ${formatDate(latest)}`;
        }
    }

    /**
     * 📊 计算平均字数
     */
    getAverageWords(type) {
        if (this.chatData.length === 0) return 0;
        
        const totalWords = this.chatData.reduce((sum, chat) => {
            const text = type === 'prompt' ? chat.prompt.text : chat.response.text;
            return sum + (text ? text.length : 0);
        }, 0);
        
        return Math.round(totalWords / this.chatData.length);
    }

    /**
     * 获取最长文本信息
     */
    getLongestText(type) {
        if (this.chatData.length === 0) return { length: 0, preview: '', time: '时间未知' };
        
        let longest = { length: 0, text: '', time: '时间未知' };
        
        this.chatData.forEach(chat => {
            const text = type === 'prompt' ? chat.prompt.text : chat.response.text;
            if (text && text.length > longest.length) {
                // 尝试获取时间，如果没有则使用默认值
                const time = chat.time || chat.timestamp || '时间未知';
                longest = {
                    length: text.length,
                    text: text,
                    time: time
                };
            }
        });
        
        return {
            length: longest.length,
            preview: longest.text.substring(0, 100) + (longest.length > 100 ? '...' : ''),
            time: longest.time
        };
    }

    /**
     * ⏰ 时间活跃度分析
     */
    getTimeAnalysis() {
        if (this.chatData.length === 0) return null;
        
        const validChats = this.chatData.filter(chat => chat.timestamp);
        if (validChats.length === 0) return null;
        
        const timestamps = validChats.map(chat => chat.timestamp);
        const earliest = new Date(Math.min(...timestamps));
        const latest = new Date(Math.max(...timestamps));
        
        const duration = (latest - earliest) / (1000 * 60 * 60); // 小时
        const avgInterval = duration / validChats.length; // 平均间隔（小时）
        
        return {
            startTime: earliest.toLocaleTimeString('zh-CN', { timeZone: 'Asia/Shanghai' }),
            endTime: latest.toLocaleTimeString('zh-CN', { timeZone: 'Asia/Shanghai' }),
            totalDuration: duration.toFixed(1),
            avgInterval: avgInterval.toFixed(1),
            intensity: duration > 0 ? (validChats.length / duration).toFixed(1) : '0'
        };
    }

    /**
     * 📊 每小时对话分布
     */
    getHourlyDistribution() {
        if (this.chatData.length === 0) return null;
        
        const validChats = this.chatData.filter(chat => chat.timestamp);
        if (validChats.length === 0) return null;
        
        const hourlyCount = {};
        validChats.forEach(chat => {
            const hour = new Date(chat.timestamp).getHours();
            hourlyCount[hour] = (hourlyCount[hour] || 0) + 1;
        });
        
        // 找出最活跃的时间段
        const maxCount = Math.max(...Object.values(hourlyCount));
        const peakHours = Object.keys(hourlyCount).filter(hour => hourlyCount[hour] === maxCount);
        
        return {
            peakHours: peakHours.map(h => `${h}:00`).join(', '),
            peakCount: maxCount,
            totalActiveHours: Object.keys(hourlyCount).length,
            distribution: hourlyCount
        };
    }

    /**
     * 🏗️ 构建Markdown内容
     */
    buildMarkdown() {
        const md = [];
        
        // 标题和简介
        md.push('# Cursor 聊天历史');
        md.push('');
        md.push('> 本文档由 cursor-chat-memory 工具自动生成');
        md.push(`> 生成时间: ${this.stats.generatedAt}`);
        md.push('');
        
        // 统计信息
        md.push('## 统计信息');
        md.push('');
        md.push('| 项目 | 数值 |');
        md.push('|------|------|');
        md.push(`| 总对话数 | ${this.stats.totalConversations} |`);
        md.push(`| 用户提问 | ${this.stats.totalPrompts} |`);
        md.push(`| AI回复 | ${this.stats.totalResponses} |`);
        md.push(`| 时间范围 | ${this.stats.dateRange} |`);
        md.push(`| 平均提问长度 | ${this.stats.avgWordsPerPrompt} 字符 |`);
        md.push(`| 平均回复长度 | ${this.stats.avgWordsPerResponse} 字符 |`);
        md.push('');
        
        // 时间活跃度分析
        if (this.stats.timeAnalysis) {
            md.push('### 时间活跃度分析');
            md.push('');
            md.push('| 指标 | 数值 |');
            md.push('|------|------|');
            md.push(`| 开始时间 | ${this.stats.timeAnalysis.startTime} |`);
            md.push(`| 结束时间 | ${this.stats.timeAnalysis.endTime} |`);
            md.push(`| 持续时长 | ${this.stats.timeAnalysis.totalDuration} 小时 |`);
            md.push(`| 平均间隔 | ${this.stats.timeAnalysis.avgInterval} 小时/次 |`);
            md.push(`| 对话密度 | ${this.stats.timeAnalysis.intensity} 次/小时 |`);
            md.push('');
        }
        
        // 每小时分布
        if (this.stats.hourlyDistribution) {
            md.push('### 每小时对话分布');
            md.push('');
            md.push(`**最活跃时段**: ${this.stats.hourlyDistribution.peakHours} (${this.stats.hourlyDistribution.peakCount} 次对话)`);
            md.push('');
            md.push(`**活跃时长**: ${this.stats.hourlyDistribution.totalActiveHours} 小时`);
            md.push('');
        }
        
        // 最长文本信息（保留但简化）
        md.push('### 文本长度统计');
        md.push('');
        md.push(`**最长提问**: ${this.stats.longestPrompt.length} 字符 - "${this.stats.longestPrompt.preview}"`);
        md.push('');
        md.push(`**最长回复**: ${this.stats.longestResponse.length} 字符 - "${this.stats.longestResponse.preview}"`);
        md.push('');
        
        // 对话历史
        md.push('## 对话历史');
        md.push('');
        md.push('*按时间顺序排列（最早的在前面）*');
        md.push('');
        
        // 创建一个反向排序的数组（从最早到最新）并去重
        const sortedChatData = [...this.chatData].reverse();
        
        // 去重：基于用户提问内容去重
        const deduplicatedData = [];
        const seenPrompts = new Set();
        
        for (const chat of sortedChatData) {
            const promptText = chat.prompt.text.trim();
            if (!seenPrompts.has(promptText)) {
                seenPrompts.add(promptText);
                deduplicatedData.push(chat);
            }
        }
        
        deduplicatedData.forEach((chat, index) => {
            // 用户提问
            md.push('#### 用户提问');
            md.push('');
            md.push('```');
            md.push(this.formatText(chat.prompt.text));
            md.push('```');
            md.push('');
            
            // AI回复
            md.push('#### AI回复');
            md.push('');
            md.push(this.formatResponse(chat.response.text));
            md.push('');
            
            // 分隔线（除了最后一个）
            if (index < deduplicatedData.length - 1) {
                md.push('---');
                md.push('');
            }
        });
        
        // 页脚
        md.push('---');
        md.push('');
        md.push('*本文档由 [cursor-chat-memory](https://github.com/cursor-chat-memory) 工具生成*');
        md.push('');
        
        return md.join('\n');
    }

    /**
     * 🔧 格式化文本
     */
    formatText(text) {
        if (!text) return '(无内容)';
        
        // 清理和格式化文本
        return text
            .trim()
            .replace(/\n{3,}/g, '\n\n') // 减少多余换行
            .replace(/\t/g, '    '); // 制表符转换为空格
    }

    /**
     * 🤖 格式化AI回复
     */
    formatResponse(text) {
        if (!text) return '*(无回复)*';
        
        // 处理模板化的AI回复格式
        if (text.startsWith('AI处理了您的请求:')) {
            return `> ${text}`;
        }
        
        // 检查是否包含代码块
        if (text.includes('```')) {
            return this.formatText(text);
        }
        
        // 普通文本格式化
        const formatted = this.formatText(text);
        
        // 如果文本很短，可能只是文件名或简单回复
        if (formatted.length < 50 && !formatted.includes('\n')) {
            return `> ${formatted}`;
        }
        
        return formatted;
    }

    /**
     * 💾 保存Markdown文件
     */
    saveMarkdownFile(content) {
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 10); // YYYY-MM-DD
        const filename = `./output/reports/cursor-chat-history-${timestamp}.md`;
        
        try {
            fs.writeFileSync(filename, content, 'utf8');
            
            const stats = fs.statSync(filename);
            const fileSize = (stats.size / 1024).toFixed(1);
            
            console.log(`文件已保存: ${filename}`);
            console.log(`文件大小: ${fileSize} KB`);
            console.log(`包含对话: ${this.chatData.length} 组（去重后实际显示）`);
            console.log(`生成时间: ${now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
            
        } catch (error) {
            console.error('❌ 保存文件失败:', error.message);
            throw error;
        }
    }
}

// 主函数
async function main() {
    const generator = new MarkdownGenerator();
    
    try {
        await generator.generateMarkdown();
        
        console.log('\n任务完成！');
        console.log('\n使用建议:');
        console.log('1. 可以用任何Markdown编辑器打开查看');
        console.log('2. 支持导出为PDF或HTML格式');
        console.log('3. 便于搜索和归档管理');
        
    } catch (error) {
        console.error('❌ 程序执行失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export default MarkdownGenerator; 