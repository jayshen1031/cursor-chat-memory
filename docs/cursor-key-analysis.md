# 🔑 Cursor 聊天数据库键值结构分析

## 📊 键值分类与含义

### 🤖 AI服务相关（最重要 - 聊天内容）
```
aiService.generations    # AI生成的回复内容 - 包含所有AI的回答
aiService.prompts       # 用户提示词内容 - 包含所有用户的问题和指令
```
**⭐ 这两个是最重要的聊天内容存储！**

### 💬 聊天会话面板
```
workbench.panel.composerChatViewPane.{UUID}
├── a079be78-466e-4b3f-98f2-faf7aad71266  # 聊天会话1
└── f41bf6be-620a-47b0-8d83-0878ed2da9df  # 聊天会话2
```
**规则**: `workbench.panel.composerChatViewPane.` + UUID
**作用**: 每个UUID代表一个独立的聊天会话

### 🏗️ 编辑器组合器
```
composer.composerData                      # 编辑器组合器的主要数据
workbench.backgroundComposer.workspacePersistentData  # 背景组合器工作区数据
```

### 📁 工作区状态管理
```
memento/workbench.parts.editor            # 编辑器部分状态
memento/workbench.editors.files.textFileEditor  # 文本文件编辑器状态  
memento/workbench.panel.markers           # 面板标记状态
```
**规则**: `memento/workbench.{component}.{subcomponent}`

### 📂 文件浏览器状态
```
workbench.explorer.treeViewState          # 文件树视图状态
workbench.explorer.views.state            # 浏览器视图状态
```

### 🔍 搜索与检索
```
anysphere.cursor-retrieval                # Cursor检索功能数据
```

### 📜 历史记录
```
history.entries                          # 历史条目 - 可能包含操作历史
```

### 🖥️ 终端相关
```
terminal.integrated.environmentVariableCollectionsV2  # 终端环境变量
terminal.integrated.layoutInfo                       # 终端布局信息
```

### 🎯 其他功能
```
codelens/cache2                          # 代码透镜缓存
workbench.view.extensions.state          # 扩展视图状态
workbench.view.debug.state              # 调试视图状态
workbench.scm.views.state               # 源代码管理视图状态
scm:view:visibleRepositories            # 可见仓库列表
workbench.zenMode.exitInfo              # 禅模式退出信息
```

## 🎯 查找项目、会话、内容的关键键值

### 1. 最重要的内容键值
```sql
-- 获取所有聊天内容
SELECT key, length(value) as size FROM ItemTable 
WHERE key IN ('aiService.generations', 'aiService.prompts');
```

### 2. 会话相关键值
```sql
-- 获取所有聊天会话
SELECT key, length(value) as size FROM ItemTable 
WHERE key LIKE 'workbench.panel.composerChatViewPane.%';
```

### 3. 项目相关键值
```sql
-- 查找项目相关数据
SELECT key, length(value) as size FROM ItemTable 
WHERE key LIKE '%workspace%' 
   OR key LIKE '%project%'
   OR key = 'composer.composerData'
   OR key = 'anysphere.cursor-retrieval';
```

## 🔍 键值构成规则总结

### 规则模式
1. **服务类**: `{service}.{feature}` 
   - 例如: `aiService.prompts`, `aiService.generations`

2. **工作台组件**: `workbench.{area}.{component}.{detail}`
   - 例如: `workbench.panel.composerChatViewPane.{UUID}`

3. **状态存储**: `memento/{component}.{subcomponent}`
   - 例如: `memento/workbench.parts.editor`

4. **会话UUID**: 聊天会话使用标准UUID格式
   - 格式: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### 优先级排序（按重要性）
1. 🥇 `aiService.generations` - AI回复内容
2. 🥈 `aiService.prompts` - 用户提示词
3. 🥉 `workbench.panel.composerChatViewPane.*` - 会话数据
4. 🏆 `composer.composerData` - 编辑器数据
5. 📋 `history.entries` - 历史记录

## 💡 实用查询建议

### 查看聊天内容大小
```sql
SELECT 
    key,
    ROUND(length(value) / 1024.0, 2) as size_kb,
    CASE 
        WHEN key = 'aiService.prompts' THEN '📝 用户输入'
        WHEN key = 'aiService.generations' THEN '🤖 AI回复'
        WHEN key LIKE 'workbench.panel.composerChatViewPane.%' THEN '💬 会话数据'
        ELSE '📄 其他'
    END as type
FROM ItemTable 
WHERE key IN ('aiService.prompts', 'aiService.generations')
    OR key LIKE 'workbench.panel.composerChatViewPane.%'
ORDER BY length(value) DESC;
```

### 统计会话数量
```sql
SELECT 
    COUNT(*) as session_count,
    SUM(length(value)) as total_size_bytes,
    ROUND(AVG(length(value)), 2) as avg_size_bytes
FROM ItemTable 
WHERE key LIKE 'workbench.panel.composerChatViewPane.%';
``` 