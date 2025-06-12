#!/usr/bin/env node

/**
 * 📝 生成Cursor聊天历史摘要
 */

import fs from 'fs';

class SummaryGenerator {
    constructor() {
        this.chatData = [];
    }

    async generateSummary() {
        try {
            console.log('📝 开始生成聊天摘要...');
            
            this.loadAndFilterData();
            const summary = this.buildSummary();
            this.saveSummaryFile(summary);
            
            console.log('✅ 摘要生成完成!');
            
        } catch (error) {
            console.error('❌ 生成失败:', error.message);
        }
    }

    loadAndFilterData() {
        const chatData = JSON.parse(fs.readFileSync('./output/data/chat-data.json', 'utf8'));
        console.log(`📖 原始数据: ${chatData.conversations.length} 条记录`);
        
        // 过滤有意义的对话
        const validConversations = chatData.conversations.filter(conv => 
            this.isValidConversation(conv.prompt, conv.response)
        );
        
        this.chatData = validConversations.slice(-20); // 只取最新的20组对话
        console.log(`💬 精选对话: ${this.chatData.length} 组`);
    }

    isValidConversation(prompt, response) {
        // 过滤掉无意义的对话
        const meaninglessPatterns = [
            /^[a-zA-Z_\-\.]+\.(py|js|html|css|md|txt)$/,  // 纯文件名
            /^(test_|debug_)/,  // 测试文件
            /^[a-zA-Z_]+\.py$/,  // 简单Python文件名
            /^(继续|确定|好的|是的|不是)$/,  // 单字回复
        ];
        
        return !meaninglessPatterns.some(pattern => pattern.test(prompt.text.trim()));
    }

    buildSummary() {
        const now = new Date();
        const md = [];
        
        md.push('# 📊 今日Cursor对话摘要');
        md.push('');
        md.push(`**生成时间**: ${now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
        md.push(`**对话数量**: ${this.chatData.length} 组精选对话`);
        md.push('');
        
        // 快速统计
        const topics = this.extractTopics();
        if (topics.length > 0) {
            md.push('## 🏷️ 主要话题');
            md.push('');
            topics.forEach(topic => {
                md.push(`- ${topic}`);
            });
            md.push('');
        }
        
        // 精选对话
        md.push('## 💎 精选对话');
        md.push('');
        
        this.chatData.forEach((chat, index) => {
            md.push(`### ${index + 1}. ${this.extractTitle(chat.prompt.text)} `);
            md.push(`*${chat.time}*`);
            md.push('');
            
            // 用户问题
            md.push('**Q:** ' + this.summarizeText(chat.prompt.text, 200));
            md.push('');
            
            // AI回复摘要
            if (!chat.response.text.startsWith('AI处理了您的请求:')) {
                md.push('**A:** ' + this.summarizeText(chat.response.text, 150));
            } else {
                md.push('**A:** ' + this.extractKeyAction(chat.response.text));
            }
            md.push('');
            md.push('---');
            md.push('');
        });
        
        return md.join('\n');
    }

    extractTopics() {
        const topics = new Set();
        
        this.chatData.forEach(chat => {
            const text = chat.prompt.text;
            
            // 识别技术关键词
            const techPatterns = [
                { pattern: /部门|公司|组织架构/, topic: '🏢 组织管理' },
                { pattern: /筛选|过滤|搜索/, topic: '🔍 数据查询' },
                { pattern: /页面|界面|UI/, topic: '💻 界面开发' },
                { pattern: /数据库|SQL|表格/, topic: '🗄️ 数据管理' },
                { pattern: /测试|debug|调试/, topic: '🔧 调试测试' },
                { pattern: /文件|代码|脚本/, topic: '📁 文件操作' },
                { pattern: /功能|需求|实现/, topic: '⚙️ 功能开发' }
            ];
            
            techPatterns.forEach(({ pattern, topic }) => {
                if (pattern.test(text)) {
                    topics.add(topic);
                }
            });
        });
        
        return Array.from(topics).slice(0, 5); // 最多5个主题
    }

    extractTitle(text) {
        // 提取对话标题
        const firstLine = text.split('\n')[0].trim();
        
        if (firstLine.length > 50) {
            return firstLine.substring(0, 50) + '...';
        }
        
        return firstLine || '对话';
    }

    summarizeText(text, maxLength) {
        if (!text) return '(无内容)';
        
        const cleaned = text.trim().replace(/\n+/g, ' ');
        
        if (cleaned.length <= maxLength) {
            return cleaned;
        }
        
        return cleaned.substring(0, maxLength) + '...';
    }

    extractKeyAction(text) {
        // 从AI回复中提取关键动作
        if (text.startsWith('AI处理了您的请求:')) {
            const content = text.replace('AI处理了您的请求:', '').trim();
            return `处理请求: ${this.summarizeText(content, 100)}`;
        }
        
        return this.summarizeText(text, 100);
    }

    saveSummaryFile(content) {
        const filename = `./output/reports/chat-summary-${new Date().toISOString().slice(0, 10)}.md`;
        
        fs.writeFileSync(filename, content, 'utf8');
        
        const stats = fs.statSync(filename);
        console.log(`📄 摘要已保存: ${filename}`);
        console.log(`📏 文件大小: ${(stats.size / 1024).toFixed(1)} KB`);
    }
}

// 运行
new SummaryGenerator().generateSummary(); 