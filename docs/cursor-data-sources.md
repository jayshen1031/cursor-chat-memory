# 🕵️ Cursor 数据源分析 - 落库前数据截获

## 💡 核心思路
在数据存储到SQLite之前，聊天数据肯定以完整的结构存在于某个地方，可能包含完整的问答对应关系。

## 🎯 可能的数据来源

### 1. 🌐 网络层面
**抓包分析API调用**
```bash
# 使用mitmproxy抓包
mitmproxy --port 8080

# 或使用Charles/Wireshark
# 查看Cursor与AI服务的API通信
```

**可能的API端点：**
- `api.cursor.com`
- OpenAI API调用
- Anthropic API调用
- 其他AI服务端点

### 2. 📁 文件系统层面
**可能的数据文件位置：**

#### macOS路径
```bash
# Cursor应用数据目录
~/Library/Application Support/Cursor/

# 可能的子目录
~/Library/Application Support/Cursor/User/
~/Library/Application Support/Cursor/logs/
~/Library/Application Support/Cursor/CachedData/
~/Library/Application Support/Cursor/tmp/
~/Library/Application Support/Cursor/storage/

# 系统临时目录
/tmp/cursor-*
/var/folders/*/cursor-*
```

#### 查找命令
```bash
# 查找所有Cursor相关文件
find ~/Library -name "*cursor*" -type f 2>/dev/null

# 查找最近修改的文件
find ~/Library/Application\ Support/Cursor -type f -mtime -1

# 查找包含特定内容的文件
grep -r "cursor-chat-memory" ~/Library/Application\ Support/Cursor/ 2>/dev/null
```

### 3. 📝 日志文件
**可能的日志位置：**
```bash
# Cursor主日志
~/Library/Application Support/Cursor/logs/main.log

# 渲染进程日志
~/Library/Application Support/Cursor/logs/renderer*.log

# GPU进程日志  
~/Library/Application Support/Cursor/logs/gpu*.log

# 扩展日志
~/Library/Application Support/Cursor/logs/extension*.log
```

### 4. 🔄 实时监控
**监控文件变化：**
```bash
# 监控Cursor目录的文件变化
fswatch ~/Library/Application\ Support/Cursor/ | while read file; do
    echo "$(date): $file changed"
done

# 使用lsof查看Cursor打开的文件
lsof -p $(pgrep -f Cursor)
```

## 🔍 具体分析步骤

### 步骤1: 目录结构探索
```bash
# 查看Cursor完整目录结构
ls -la ~/Library/Application\ Support/Cursor/
tree ~/Library/Application\ Support/Cursor/ -L 3
```

### 步骤2: 查找SQLite数据库
```bash
# 查找所有SQLite文件
find ~/Library/Application\ Support/Cursor -name "*.db*" -o -name "*.sqlite*"

# 查看数据库文件的修改时间
ls -lt ~/Library/Application\ Support/Cursor/**/*.db*
```

### 步骤3: 查找JSON配置文件
```bash
# 查找JSON文件
find ~/Library/Application\ Support/Cursor -name "*.json" | head -10

# 查看可能包含聊天数据的JSON文件
grep -l "prompt\|generation\|chat" ~/Library/Application\ Support/Cursor/**/*.json 2>/dev/null
```

### 步骤4: 内存转储分析
```bash
# 获取Cursor进程ID
ps aux | grep -i cursor

# 查看进程内存映射
vmmap <cursor_pid>

# 转储进程内存（需要权限）
gdb -p <cursor_pid> -batch -ex "generate-core-file cursor.core"
```

## 🎪 实际操作建议

### 方案A: 文件系统监控
```bash
#!/bin/bash
# monitor-cursor-files.sh

echo "🔍 开始监控Cursor文件变化..."

# 监控SQLite数据库变化
fswatch ~/Library/Application\ Support/Cursor/User/workspaceStorage/ | while read file; do
    if [[ $file == *.db ]]; then
        echo "📊 数据库更新: $file"
        echo "时间: $(date)"
        # 可以在这里添加数据库查询
    fi
done &

# 监控JSON文件变化
fswatch ~/Library/Application\ Support/Cursor/User/ | while read file; do
    if [[ $file == *.json ]]; then
        echo "📄 JSON文件更新: $file" 
        echo "时间: $(date)"
        # 可以查看文件内容
    fi
done &

wait
```

### 方案B: 抓包分析
```bash
# 启动mitmproxy
mitmproxy --port 8080 --web-port 8081

# 配置Cursor使用代理（如果可能）
# 或使用系统级代理设置
```

### 方案C: 进程内存分析
```bash
# 实时查看Cursor进程的文件操作
sudo dtruss -p $(pgrep -f Cursor) 2>&1 | grep -E "(read|write|open)"
```

## 🏆 最有希望的方向

### 1. 查找原始JSON配置
Cursor可能在某个配置文件中保存完整的对话历史，包含问答配对关系。

### 2. 监控API调用
通过抓包可能看到完整的请求-响应对，包含ID关联。

### 3. 临时文件/缓存
Cursor可能在处理过程中创建临时文件，包含更完整的数据结构。

## 🔧 实用工具脚本

### 快速扫描脚本
```bash
#!/bin/bash
# quick-scan.sh

echo "🔍 快速扫描Cursor数据..."

echo "📂 SQLite数据库:"
find ~/Library/Application\ Support/Cursor -name "*.db*" -exec ls -lh {} \;

echo -e "\n📄 最近修改的JSON文件:"
find ~/Library/Application\ Support/Cursor -name "*.json" -mtime -1 -exec ls -lht {} \;

echo -e "\n📝 日志文件:"
ls -lht ~/Library/Application\ Support/Cursor/logs/ 2>/dev/null | head -5

echo -e "\n🔄 当前Cursor进程:"
ps aux | grep -i cursor | grep -v grep
```

## 🎯 下一步建议

1. **运行快速扫描** - 了解文件结构
2. **监控文件变化** - 实时观察数据更新
3. **分析网络流量** - 查看API通信
4. **检查配置文件** - 寻找完整数据结构

通过这些方法，很可能能在数据存储到SQLite之前就找到包含完整关联关系的原始数据！ 