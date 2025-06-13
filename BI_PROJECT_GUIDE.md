# BI项目Memory Bank使用指南

## 📊 项目概述

本指南专门针对商业智能(BI)项目的Memory Bank部署和使用，特别适用于物流行业的数据分析和报表系统。

## 🚀 快速部署

### 1. 部署BI项目Memory Bank
```bash
# 部署到BI项目目录
./deploy-to-new-project.sh /path/to/bi-project --type bi

# 示例：部署到海程邦达BI项目
./deploy-to-new-project.sh /Users/jay/Documents/baidu/projects/BI --type bi
```

### 2. 验证部署结果
```bash
cd /path/to/bi-project

# 检查Memory Bank文件
ls -la memory-bank/
# 应该看到10个BI专用.md文件

# 验证配置
npm run validate-config

# 启动服务
npm run mcp
```

## 📁 BI项目Memory Bank结构

### 核心文件说明

| 文件名 | 大小 | 用途 | 主要内容 |
|--------|------|------|----------|
| `projectContext.md` | 1.1KB | 项目上下文 | BI项目概述、业务领域、技术架构 |
| `businessInsights.md` | 1.1KB | 业务洞察 | 物流行业分析、成本优化、客户价值分析 |
| `dataModels.md` | 1.5KB | 数据模型 | 运输业务、周报、碳排放数据模型设计 |
| `reportTemplates.md` | 2.2KB | 报表模板 | 运营周报、客户分析、供应商绩效SQL模板 |
| `etlProcesses.md` | 2.5KB | ETL流程 | 数据抽取、转换、加载流程和质量监控 |
| `problemSolutions.md` | 2.6KB | 问题解决 | BI项目常见问题和解决方案 |
| `technicalDecisions.md` | 1.4KB | 技术决策 | 数据架构、技术选型决策记录 |
| `learningInsights.md` | 3.1KB | 学习洞察 | 数据分析、BI项目管理经验和洞察 |
| `quickReference.md` | 2.0KB | 快速参考 | 常用SQL查询、命令、监控指标 |
| `recentActivity.md` | 0.8KB | 近期活动 | BI项目活动记录和计划 |

**总计**: 10个文件，约40KB

## 🏗️ 数据架构特色

### 数据仓库分层架构
```
ODS层 (原始数据层)
├── 业务系统原始数据
├── 第三方数据接入
└── 数据质量检查

DWD层 (明细数据层)
├── 数据清洗和标准化
├── 业务规则应用
└── 历史数据保存

DWS层 (汇总数据层)
├── 按业务主题汇总
├── 预计算常用指标
└── 支持多维分析

ADS层 (应用数据层)
├── 面向应用的数据集市
├── 报表专用数据表
└── 实时数据更新
```

### 核心业务模型

#### 运输业务模型
```sql
-- 业务订单表 (dwd_business_order_report)
CREATE TABLE dwd_business_order_report (
    order_id VARCHAR(50) PRIMARY KEY,
    customer_name VARCHAR(100),
    origin_city VARCHAR(50),
    dest_city VARCHAR(50),
    transport_date DATE,
    weight DECIMAL(10,2),
    volume DECIMAL(10,2),
    freight_amount DECIMAL(10,2),
    cost_amount DECIMAL(10,2)
);
```

#### 碳排放模型
```sql
-- 陆运碳排放表 (dws_land_transport_carbon)
CREATE TABLE dws_land_transport_carbon (
    transport_id VARCHAR(50),
    vehicle_type VARCHAR(30),
    distance_km DECIMAL(8,2),
    fuel_consumption DECIMAL(8,2),
    carbon_emission DECIMAL(10,4),
    emission_factor DECIMAL(6,4)
);
```

## 📊 报表模板使用

### 运营周报生成
```bash
# 生成客户业务周报
mysql -e "source ETL-ads_weekly_customer_report_salesname.sql"

# 生成供应商绩效周报  
mysql -e "source ETL-ads_weekly_supplier_report_salesname.sql"

# 生成产品运输周报
mysql -e "source ETL-ads_weekly_product_report_salesname.sql"
```

### 常用业务查询
```sql
-- 查看今日订单统计
SELECT COUNT(*) as order_count, SUM(freight_amount) as total_amount
FROM dwd_business_order_report 
WHERE transport_date = CURDATE();

-- 查看本周业绩排行
SELECT sales_name, SUM(freight_amount) as weekly_revenue
FROM dwd_business_order_report 
WHERE YEARWEEK(transport_date) = YEARWEEK(NOW())
GROUP BY sales_name 
ORDER BY weekly_revenue DESC;
```

## 🌱 碳排放分析

### 碳排放计算
```sql
-- 查看本月碳排放统计
SELECT vehicle_type, SUM(carbon_emission) as total_emission
FROM dws_land_transport_carbon 
WHERE DATE_FORMAT(transport_date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
GROUP BY vehicle_type;
```

### 排放因子配置
- **货车**: 2.68 kg CO2/L
- **卡车**: 3.15 kg CO2/L
- **默认**: 2.50 kg CO2/L

## 🔧 ETL流程管理

### 数据处理流程
1. **数据抽取 (Extract)**
   - 业务系统数据: 每日凌晨2点自动抽取
   - 第三方数据: API接口实时同步
   - 文件数据: FTP定时获取

2. **数据转换 (Transform)**
   - 数据清洗: 去重、格式标准化
   - 业务规则: 应用业务逻辑计算
   - 数据验证: 质量检查和异常处理

3. **数据加载 (Load)**
   - 增量更新: 基于时间戳的增量处理
   - 全量刷新: 周末全量数据重建
   - 实时同步: 关键业务数据实时更新

## 🛠️ 常见问题解决

### 数据质量问题
- **订单重复**: 运行去重SQL脚本
- **金额异常**: 检查汇率和单位设置
- **日期错误**: 验证时区和日期格式

### 性能问题
- **查询慢**: 检查索引和执行计划
- **ETL超时**: 分批处理大数据量
- **内存不足**: 优化SQL和增加内存

### 报表问题
- **数据不准**: 检查ETL流程和业务规则
- **格式错误**: 验证报表模板和参数
- **更新延迟**: 检查定时任务状态

## 📈 监控指标

### 数据质量指标
- 数据完整性: >95%
- 数据准确性: >98%
- 数据及时性: <2小时延迟

### 系统性能指标
- 查询响应时间: <5秒
- ETL处理时间: <30分钟
- 系统可用性: >99.5%

## 🎯 最佳实践

### 1. 数据建模
- 遵循数据仓库分层架构
- 建立完善的数据字典
- 定期评估和优化模型

### 2. ETL开发
- 使用SQL脚本而非复杂ETL工具
- 增加数据验证和异常处理
- 建立完善的监控告警机制

### 3. 报表开发
- 标准化报表模板
- 自动化报表生成流程
- 提供用户友好的操作界面

### 4. 性能优化
- 合理设计索引策略
- 分批处理大数据量
- 使用缓存提高查询效率

## 📞 技术支持

如果在使用过程中遇到问题，可以：

1. 查看 `problemSolutions.md` 中的解决方案
2. 参考 `quickReference.md` 中的常用命令
3. 检查 `learningInsights.md` 中的经验总结
4. 联系技术团队获取支持

---

*最后更新: 2025-06-13*
*适用版本: Cursor Memory Bank v2.3.0+* 