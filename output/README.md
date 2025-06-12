# Output Directory

这个目录用于存放项目生成的所有输出文件和中间产物。

## 📁 目录结构

```
output/
├── data/           # 数据文件
│   ├── chat-data.json
│   └── web-chat-data.json
└── reports/        # 报告文件
    ├── chat-summary-YYYY-MM-DD.md
    └── cursor-chat-history-YYYY-MM-DD.md
```

## 📄 文件说明

### 📊 data/ - 数据文件
- **chat-data.json** - 从Cursor提取的完整聊天数据，包含时间戳
- **web-chat-data.json** - 格式化后的Web展示数据

### 📋 reports/ - 报告文件
- **chat-summary-YYYY-MM-DD.md** - 每日聊天摘要
- **cursor-chat-history-YYYY-MM-DD.md** - 格式化的聊天历史记录

## 🔄 自动生成

这些文件都是通过以下命令自动生成的：

```bash
npm run extract    # 生成 data/ 中的数据文件
npm run summary    # 生成摘要报告
npm run markdown   # 生成历史记录
npm run export     # 执行完整导出流程
```

## ⚠️ 注意事项

- 所有文件都被 `.gitignore` 忽略，不会提交到版本控制
- 删除这些文件不会影响项目功能，可以随时重新生成
- 文件名包含日期戳，每次运行可能会生成新文件 