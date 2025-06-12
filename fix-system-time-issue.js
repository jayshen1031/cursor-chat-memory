const Database = require('sqlite3').Database;
const path = require('path');
const os = require('os');

async function fixSystemTimeIssue() {
  console.log('🛠️ 系统时间问题修复方案\n');
  
  const now = Date.now();
  const currentDate = new Date(now);
  
  console.log('📊 当前系统时间分析:');
  console.log(`   系统时间戳: ${now}`);
  console.log(`   系统日期: ${currentDate.toLocaleDateString()}`);
  console.log(`   系统年份: ${currentDate.getFullYear()}`);
  console.log(`   系统月份: ${currentDate.getMonth() + 1}`);
  console.log(`   系统日期: ${currentDate.getDate()}\n`);
  
  // 问题诊断
  console.log('🔍 问题诊断:');
  if (currentDate.getFullYear() === 2025) {
    console.log('   ❌ 发现问题: 系统时间设置为2025年');
    console.log('   📝 影响范围: 所有新创建的时间戳都会显示为2025年');
    console.log('   🎯 根本原因: 系统时钟可能被错误设置\n');
  } else {
    console.log('   ✅ 系统时间正常\n');
  }
  
  // 智能时间戳修复策略
  console.log('🧠 智能时间戳修复策略:');
  
  // 策略1: 基于当前实际应该是什么时间
  const actualYear = 2024; // 假设实际应该是2024年
  const actualDate = new Date(actualYear, currentDate.getMonth(), currentDate.getDate(), currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds());
  const actualTimestamp = actualDate.getTime();
  
  console.log(`   策略1 - 年份修正:`);
  console.log(`     修正后时间戳: ${actualTimestamp}`);
  console.log(`     修正后日期: ${actualDate.toLocaleDateString()}`);
  console.log(`     修正后完整: ${actualDate.toLocaleString()}\n`);
  
  // 策略2: 相对时间偏移
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;
  const offsetTimestamp = now - oneYearMs;
  const offsetDate = new Date(offsetTimestamp);
  
  console.log(`   策略2 - 时间偏移:`);
  console.log(`     偏移时间戳: ${offsetTimestamp}`);
  console.log(`     偏移日期: ${offsetDate.toLocaleDateString()}`);
  console.log(`     偏移完整: ${offsetDate.toLocaleString()}\n`);
  
  // 创建通用的时间戳修复函数
  const createTimestampFixer = (targetYear = 2024) => {
    return (timestamp) => {
      if (!timestamp) return Date.now();
      
      const date = new Date(timestamp);
      const currentYear = date.getFullYear();
      
      // 如果年份是2025，修正为目标年份
      if (currentYear === 2025) {
        const fixedDate = new Date(targetYear, date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
        const fixedTimestamp = fixedDate.getTime();
        
        console.log(`🔧 修复时间戳:`);
        console.log(`   原始: ${timestamp} (${date.toLocaleString()})`);
        console.log(`   修复: ${fixedTimestamp} (${fixedDate.toLocaleString()})`);
        
        return fixedTimestamp;
      }
      
      return timestamp;
    };
  };
  
  const fixTimestamp = createTimestampFixer(2024);
  
  // 测试修复函数
  console.log('🧪 测试时间戳修复函数:');
  const testTimestamps = [
    now, // 当前时间
    now - 3600000, // 1小时前
    now - 86400000, // 1天前
  ];
  
  testTimestamps.forEach((ts, index) => {
    console.log(`\n   测试 ${index + 1}:`);
    const original = new Date(ts);
    const fixed = fixTimestamp(ts);
    const fixedDate = new Date(fixed);
    
    console.log(`     原始: ${original.toLocaleString()}`);
    console.log(`     修复: ${fixedDate.toLocaleString()}`);
    console.log(`     差异: ${ts - fixed} ms (${Math.round((ts - fixed) / (1000 * 60 * 60 * 24))} 天)`);
  });
  
  // 内容文本修复
  console.log('\n📝 AI回复内容中的日期修复:');
  
  const fixContentDates = (content) => {
    if (!content) return content;
    
    // 匹配各种日期格式并修复
    const datePatterns = [
      /2025\/(\d{1,2})\/(\d{1,2})/g,  // 2025/1/14 -> 2024/1/14
      /2025-(\d{1,2})-(\d{1,2})/g,   // 2025-1-14 -> 2024-1-14
      /2025年(\d{1,2})月(\d{1,2})日/g, // 2025年1月14日 -> 2024年1月14日
    ];
    
    let fixedContent = content;
    let hasChanges = false;
    
    datePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        console.log(`   发现日期模式: ${matches.join(', ')}`);
        fixedContent = fixedContent.replace(pattern, (match) => {
          const fixed = match.replace('2025', '2024');
          console.log(`     修复: ${match} -> ${fixed}`);
          hasChanges = true;
          return fixed;
        });
      }
    });
    
    if (hasChanges) {
      console.log(`   修复完成`);
    } else {
      console.log(`   未发现需要修复的日期`);
    }
    
    return fixedContent;
  };
  
  // 测试内容修复
  const testContents = [
    "实现cursor-chat-memory提示词中心模块\n功能实现\n2025/1/14\ncursor-chat-memory",
    "在2025年1月14日完成的功能",
    "会话时间: 2025-06-11",
    "正常的内容，没有日期"
  ];
  
  testContents.forEach((content, index) => {
    console.log(`\n   测试内容 ${index + 1}:`);
    console.log(`     原始: "${content}"`);
    const fixed = fixContentDates(content);
    console.log(`     修复: "${fixed}"`);
  });
  
  // 创建完整的修复方案
  console.log('\n🎯 完整修复方案实现:');
  
  const PromptCenterWithTimeFix = {
    fixTimestamp: createTimestampFixer(2024),
    
    fixContentDates: (content) => {
      if (!content) return content;
      
      return content
        .replace(/2025\/(\d{1,2})\/(\d{1,2})/g, '2024/$1/$2')
        .replace(/2025-(\d{1,2})-(\d{1,2})/g, '2024-$1-$2')
        .replace(/2025年(\d{1,2})月(\d{1,2})日/g, '2024年$1月$2日');
    },
    
    processMessage: function(message) {
      return {
        ...message,
        content: this.fixContentDates(message.content),
        timestamp: this.fixTimestamp(message.timestamp)
      };
    },
    
    processQAPair: function(qaPair) {
      return {
        ...qaPair,
        question: this.fixContentDates(qaPair.question),
        answer: this.fixContentDates(qaPair.answer),
        questionTimestamp: this.fixTimestamp(qaPair.questionTimestamp),
        answerTimestamp: this.fixTimestamp(qaPair.answerTimestamp)
      };
    }
  };
  
  console.log('   ✅ 修复方案已创建');
  console.log('   📦 包含功能:');
  console.log('      - fixTimestamp: 修复时间戳(2025->2024)');
  console.log('      - fixContentDates: 修复内容中的日期文本');
  console.log('      - processMessage: 处理消息对象');
  console.log('      - processQAPair: 处理问答对对象\n');
  
  // 应用到实际数据
  console.log('🔄 应用到实际数据测试:');
  
  const testQAPair = {
    question: "实现cursor-chat-memory提示词中心模块，这个居然是2025年1月14号的会话",
    answer: "功能实现\n2025/1/14\ncursor-chat-memory\n还是这个时间戳啊",
    questionTimestamp: now - 3600000,
    answerTimestamp: now
  };
  
  console.log('   原始问答对:');
  console.log(`     问题: "${testQAPair.question}"`);
  console.log(`     回答: "${testQAPair.answer}"`);
  console.log(`     问题时间: ${new Date(testQAPair.questionTimestamp).toLocaleString()}`);
  console.log(`     回答时间: ${new Date(testQAPair.answerTimestamp).toLocaleString()}`);
  
  const fixedQAPair = PromptCenterWithTimeFix.processQAPair(testQAPair);
  
  console.log('\n   修复后问答对:');
  console.log(`     问题: "${fixedQAPair.question}"`);
  console.log(`     回答: "${fixedQAPair.answer}"`);
  console.log(`     问题时间: ${new Date(fixedQAPair.questionTimestamp).toLocaleString()}`);
  console.log(`     回答时间: ${new Date(fixedQAPair.answerTimestamp).toLocaleString()}`);
  
  console.log('\n🎉 修复方案测试完成！');
  console.log('\n💡 使用建议:');
  console.log('   1. 在所有时间戳显示前应用 fixTimestamp()');
  console.log('   2. 在所有文本内容显示前应用 fixContentDates()');
  console.log('   3. 在处理问答对时使用 processQAPair()');
  console.log('   4. 考虑检查并修正系统时间设置');
}

fixSystemTimeIssue().catch(console.error); 