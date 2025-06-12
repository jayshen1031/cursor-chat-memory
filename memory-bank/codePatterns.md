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

## 🆕 2025-06-12 新增代码模式

### 项目重构模式

#### 功能移除的系统化方法
```bash
# 1. 识别相关文件
find . -name "*.js" -exec grep -l "web\|serve\|html" {} \;

# 2. 分析依赖关系
grep -r "serve.js\|web-chat-data" --include="*.js" --include="*.json" .

# 3. 逐步移除
rm serve.js cursor-chat-viewer.html web-chat-data.json
rm -rf web/

# 4. 清理配置
# 更新package.json scripts
# 清理代码中的相关逻辑
```

#### 配置文件清理模式
```javascript
// package.json 脚本清理
const cleanupScripts = (packageJson) => {
    const webRelatedScripts = ['serve', 'web', 'dev', 'open'];
    webRelatedScripts.forEach(script => {
        delete packageJson.scripts[script];
    });
    return packageJson;
};
```

### MCP配置管理模式

#### 多重配置策略
```javascript
// 配置加载优先级
const loadMCPConfig = () => {
    const configSources = [
        () => loadFromFile('.cursor/mcp.json'),      // 项目级配置
        () => loadFromEnv('MCP_CONFIG'),             // 环境变量
        () => loadFromGlobal('~/.cursor/mcp.json'), // 全局配置
        () => getDefaultConfig()                     // 默认配置
    ];
    
    for (const source of configSources) {
        try {
            const config = source();
            if (config) return config;
        } catch (error) {
            console.warn(`配置源失败: ${error.message}`);
        }
    }
    
    throw new Error('无法加载MCP配置');
};
```

#### 配置验证模式
```javascript
const validateMCPConfig = (config) => {
    const required = ['command', 'args'];
    const optional = ['cwd', 'env', 'timeout'];
    
    // 必需字段检查
    for (const field of required) {
        if (!config[field]) {
            throw new Error(`缺少必需配置: ${field}`);
        }
    }
    
    // 路径存在性检查
    if (config.cwd && !fs.existsSync(config.cwd)) {
        throw new Error(`工作目录不存在: ${config.cwd}`);
    }
    
    // 命令可执行性检查
    try {
        execSync(`which ${config.command}`, { stdio: 'ignore' });
    } catch (error) {
        throw new Error(`命令不可用: ${config.command}`);
    }
    
    return true;
};
```

### 数据质量控制模式

#### 导出质量评估
```javascript
const assessExportQuality = (exportData) => {
    const metrics = {
        conversationCount: exportData.conversations.length,
        avgPromptLength: calculateAverage(exportData.conversations.map(c => c.prompt.length)),
        avgResponseLength: calculateAverage(exportData.conversations.map(c => c.response.length)),
        templateResponseRatio: calculateTemplateRatio(exportData.conversations),
        technicalContentRatio: calculateTechnicalRatio(exportData.conversations)
    };
    
    // 质量评分
    const qualityScore = calculateQualityScore(metrics);
    
    return {
        metrics,
        qualityScore,
        recommendations: generateRecommendations(metrics)
    };
};
```

#### 智能回复生成增强
```javascript
const enhanceAIResponse = (prompt, context = {}) => {
    // 分析提问类型
    const questionType = classifyQuestion(prompt);
    
    // 提取技术关键词
    const techKeywords = extractTechnicalTerms(prompt);
    
    // 基于上下文生成回复
    const responseTemplate = selectTemplate(questionType, techKeywords);
    
    // 个性化内容填充
    return fillTemplate(responseTemplate, {
        prompt,
        context,
        techKeywords,
        questionType
    });
};

const classifyQuestion = (prompt) => {
    const patterns = {
        implementation: /实现|代码|函数|方法|如何做/,
        debugging: /错误|问题|失败|不工作|报错/,
        configuration: /配置|设置|安装|部署/,
        explanation: /为什么|原理|机制|如何工作/,
        optimization: /优化|性能|改进|提升/
    };
    
    for (const [type, pattern] of Object.entries(patterns)) {
        if (pattern.test(prompt)) return type;
    }
    
    return 'general';
};
```

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
