# 代码模式

> 识别的代码模式和最佳实践

## MCP工具模式

- 使用统一的错误处理机制
- 标准化的响应格式
- 清晰的工具描述和参数定义

## 数据处理模式

- 统一的文本清理和截断
- 时间戳标准化处理
- 分类算法的关键词匹配

*此文件由MCP Server自动维护*

## 📊 数据库访问模式

### SQLite数据提取模式
```javascript
// 异步Promise包装SQLite查询
return new Promise(async (resolve, reject) => {
    const db = new sqlite3.Database(this.workspaceDbPath, sqlite3.OPEN_READONLY);
    
    // 分步查询避免数据丢失
    db.get("SELECT value FROM ItemTable WHERE key = 'aiService.prompts'", callback);
    db.get("SELECT value FROM ItemTable WHERE key = 'aiService.generations'", callback);
    
    db.close(); // 确保资源释放
});
```

### 数组索引关联模式
```sql
-- 基于数组索引的问答配对策略
WITH indices AS (SELECT 0 as i UNION SELECT 1 UNION SELECT 2...)
SELECT 
    json_extract(prompts.value, '$[' || i || '].text') as question,
    json_extract(generations.value, '$[' || i || '].textDescription') as answer
FROM indices CROSS JOIN ItemTable prompts, ItemTable generations
```

## 🧠 AI分析模式

### 关键词匹配分类
```javascript
const techKeywords = ['实现', '代码', '函数', 'API', '数据库', '架构', '设计', '配置'];
const problemKeywords = ['错误', '问题', '失败', '修复', '解决', '调试'];
const learningKeywords = ['学习', '理解', '原理', '概念', '为什么', '如何'];

// 内容分类逻辑
const techConversations = conversations.filter(conv =>
    techKeywords.some(keyword => 
        conv.prompt.text.includes(keyword) || conv.response.text.includes(keyword)
    )
);
```

### 文本处理模式
```javascript
// 统一的文本清理函数
cleanText(text) {
    if (!text) return '';
    return text.trim().replace(/\s+/g, ' ').substring(0, 1000);
}

// 智能截断保持语义完整性
const summary = conversation.text.substring(0, 800) + 
    (conversation.text.length > 800 ? '...' : '');
```

## 🌐 Web界面开发模式

### 响应式API设计
```javascript
// RESTful API端点模式
const endpoints = {
    '/api/extraction/quick': performQuickExtraction,
    '/api/extraction/scan': scanDatabases,
    '/api/extraction/advanced': advancedExtraction,
    '/api/extraction/export': exportData
};

// 统一的错误处理
try {
    const result = await processData();
    return { success: true, data: result };
} catch (error) {
    return { success: false, error: error.message, suggestions: [] };
}
```

### 前端状态管理模式
```javascript
// 模块化状态管理
class DataExtractionManager {
    constructor() {
        this.extractionState = {
            isProcessing: false,
            results: null,
            error: null
        };
    }
    
    async performAction() {
        this.updateState({ isProcessing: true });
        try {
            const result = await this.apiCall();
            this.updateState({ results: result, isProcessing: false });
        } catch (error) {
            this.updateState({ error: error, isProcessing: false });
        }
    }
}
```

## 🔧 工具集成模式

### 命令行工具Web化
```javascript
// 将Python脚本集成到Web界面
const executeScript = (scriptPath, args) => {
    return new Promise((resolve, reject) => {
        const process = spawn('python3', [scriptPath, ...args]);
        
        let output = '';
        process.stdout.on('data', (data) => output += data);
        process.on('close', (code) => {
            code === 0 ? resolve(output) : reject(new Error(output));
        });
    });
};
```

### 智能路径检测模式
```javascript
// 动态工作区路径检测
findWorkspaceDb() {
    const possiblePaths = [
        path.join(process.cwd(), '~/.cursor/chat/'),  // 开发模式
        path.join(os.homedir(), 'Library/Application Support/Cursor/...'), // 全局
    ];
    
    return possiblePaths.find(p => fs.existsSync(p)) || defaultPath;
}
```

## 📁 文件管理模式

### Markdown文件自动维护
```javascript
// 追加式更新避免数据丢失
async appendToMemoryFile(filename, content) {
    const filePath = path.join(this.memoryBankPath, filename);
    try {
        const existing = await fs.readFile(filePath, 'utf-8');
        await fs.writeFile(filePath, existing + '\n' + content + '\n');
    } catch (error) {
        console.error(`更新${filename}失败:`, error.message);
    }
}
```

### 时间戳模式
```javascript
// 标准化时间处理
const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式
const activity = {
    timestamp: generation.unixMs || Date.now(),
    content: this.cleanText(generation.textDescription)
};
```

## 🎯 性能优化模式

### 分页和懒加载
```javascript
// 大数据集分页处理
filterByTimeRange(timeRange) {
    const now = Date.now();
    let startTime = 0;
    
    switch (timeRange) {
        case 'today': startTime = todayStart; break;
        case 'week': startTime = now - 7 * 24 * 60 * 60 * 1000; break;
        case 'month': startTime = now - 30 * 24 * 60 * 60 * 1000; break;
    }
    
    return this.data.filter(item => item.timestamp >= startTime);
}
```

### 缓存机制
```javascript
// 内存缓存避免重复计算
this.chatData = {
    prompts: [],
    generations: [],
    conversations: [],
    lastSync: null  // 缓存时间戳
};
```

## 🔄 实时监控模式

### 文件系统监控
```bash
# 使用fswatch监控数据变化
fswatch -o ~/.cursor/chat/ | while read f; do
    echo "检测到chat数据变化，触发同步..."
    node sync-chat-data.js
done
```

### 自动同步策略
```javascript
// 启动时自动同步
constructor() {
    this.setupMemoryBank();
    this.syncChatData(); // 自动同步
}

// 定时同步机制
setInterval(() => {
    this.syncChatData('today');
}, 30 * 60 * 1000); // 每30分钟同步一次
```
