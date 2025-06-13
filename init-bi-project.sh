#!/bin/bash

# 设置项目名称
PROJECT_NAME="bi-project"
CONFIG_FILE="cursor-mcp-config.json"

# 检查配置文件是否存在
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: $CONFIG_FILE not found"
    exit 1
fi

# 获取项目路径
PROJECT_PATH=$(jq -r ".projects.\"$PROJECT_NAME\".path" "$CONFIG_FILE")

# 创建项目目录结构
echo "Creating BI project directory structure..."

# 创建主目录
mkdir -p "$PROJECT_PATH"

# 创建子目录
mkdir -p "$PROJECT_PATH/businessInsights"
mkdir -p "$PROJECT_PATH/dataModels"
mkdir -p "$PROJECT_PATH/reportTemplates"
mkdir -p "$PROJECT_PATH/dashboardDesigns"
mkdir -p "$PROJECT_PATH/etlProcesses"

# 创建README文件
cat > "$PROJECT_PATH/README.md" << EOF
# BI项目记忆库

## 目录结构

- \`businessInsights/\`: 业务洞察和关键发现
- \`dataModels/\`: 数据模型和维度设计
- \`reportTemplates/\`: 报表模板和设计规范
- \`dashboardDesigns/\`: 仪表盘设计和交互模式
- \`etlProcesses/\`: ETL流程和数据转换规则

## 使用指南

1. 业务洞察
   - 记录关键业务指标
   - 保存分析方法和结论
   - 存储业务决策依据

2. 数据模型
   - 维度模型设计
   - 事实表结构
   - 数据关系图

3. 报表模板
   - 标准报表格式
   - 计算规则
   - 展示规范

4. 仪表盘设计
   - 布局模板
   - 交互模式
   - 可视化规范

5. ETL流程
   - 数据转换规则
   - 调度配置
   - 数据质量检查

## 维护说明

- 定期更新业务洞察
- 及时记录数据模型变更
- 保持模板和规范的更新
- 记录ETL流程的优化

最后更新: $(date +%Y-%m-%d)
EOF

# 创建示例文件
cat > "$PROJECT_PATH/businessInsights/README.md" << EOF
# 业务洞察

## 目录结构

- \`kpi/\`: 关键业务指标
- \`analysis/\`: 分析报告
- \`decisions/\`: 业务决策

## 使用说明

1. 每个洞察应包含：
   - 背景说明
   - 分析方法
   - 关键发现
   - 行动建议

2. 文件命名规范：
   - 日期_主题_类型.md
   - 例如：20240315_销售趋势_分析.md

3. 标签使用：
   - #kpi
   - #analysis
   - #decision
   - #insight
EOF

echo "BI project structure initialized successfully!"
echo "Project path: $PROJECT_PATH"
echo "Please review the README files for usage guidelines." 