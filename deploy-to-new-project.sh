#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 创建BI项目Memory Bank内容
create_bi_memory_bank() {
    local target_dir=$1
    
    # 创建项目上下文
    cat > "$target_dir/memory-bank/projectContext.md" << 'EOF'
# BI项目上下文

## 项目概述
**商业智能(BI)数据分析平台** - 海程邦达物流数据分析与报表系统

专注于物流行业的数据分析、报表生成和业务洞察，支持多维度数据分析和可视化展示。

## 核心业务领域

### 🚛 物流运输分析
- 陆运业务数据分析
- 运输成本优化
- 路线效率分析
- 运力资源配置

### 📊 运营报表系统
- 周报自动生成
- 客户业务分析报表
- 供应商绩效报表
- 产品运输分析报表

### 🌱 碳排放管理
- 运输碳排放计算
- 环保指标监控
- 碳足迹分析
- 绿色物流优化

## 技术架构

### 📊 数据仓库架构
- **ODS层**: 原始数据存储
- **DWD层**: 明细数据层
- **DWS层**: 汇总数据层
- **ADS层**: 应用数据层

### 🔧 技术栈
- **数据库**: MySQL, ClickHouse
- **ETL工具**: 自研SQL脚本
- **报表工具**: 自研报表系统
- **可视化**: 自定义Dashboard

## 当前项目状态
- 运营周报系统已上线
- 碳排放数据分析模块开发中
- 客户分析报表持续优化

---
*最后更新: $(date +%Y-%m-%d)*
EOF

    # 创建业务洞察
    cat > "$target_dir/memory-bank/businessInsights.md" << 'EOF'
# 业务洞察

## 物流行业分析洞察

### 📈 运营效率优化
- **路线优化**: 通过数据分析优化运输路线，降低成本15%
- **运力配置**: 基于历史数据预测运力需求，提高资源利用率
- **时效管理**: 分析运输时效数据，识别瓶颈环节

### 💰 成本控制分析
- **运输成本**: 多维度成本分析，识别成本控制点
- **燃油管理**: 燃油消耗分析和优化建议
- **人力成本**: 司机工时分析和效率提升

### 🎯 客户价值分析
- **客户分层**: 基于业务量和利润率进行客户分层
- **服务质量**: 客户满意度和服务质量关联分析
- **业务增长**: 客户业务增长趋势和潜力分析

## 数据驱动决策案例

### 案例1: 运输路线优化
- **问题**: 某条线路成本偏高
- **分析**: 通过数据分析发现绕行问题
- **解决**: 优化路线规划，成本降低12%

### 案例2: 客户业务分析
- **目标**: 识别高价值客户
- **方法**: 多维度客户价值评估模型
- **结果**: 重点客户贡献率提升20%

---
*记录时间: $(date +%Y-%m-%d)*
EOF

    # 创建数据模型
    cat > "$target_dir/memory-bank/dataModels.md" << 'EOF'
# 数据模型设计

## 核心数据模型

### 🚛 运输业务模型
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

### 📊 周报数据模型
```sql
-- 周报汇总表 (dwm_weekly_report)
CREATE TABLE dwm_weekly_report (
    week_id VARCHAR(20),
    sales_name VARCHAR(50),
    total_orders INT,
    total_weight DECIMAL(12,2),
    total_amount DECIMAL(12,2),
    profit_margin DECIMAL(5,2)
);
```

### 🌱 碳排放模型
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

## 数据分层架构

### ODS层 (原始数据层)
- 业务系统原始数据
- 第三方数据接入
- 数据质量检查

### DWD层 (明细数据层)
- 数据清洗和标准化
- 业务规则应用
- 历史数据保存

### DWS层 (汇总数据层)
- 按业务主题汇总
- 预计算常用指标
- 支持多维分析

### ADS层 (应用数据层)
- 面向应用的数据集市
- 报表专用数据表
- 实时数据更新

---
*设计时间: $(date +%Y-%m-%d)*
EOF

    # 创建报表模板
    cat > "$target_dir/memory-bank/reportTemplates.md" << 'EOF'
# 报表模板库

## 运营周报模板

### 📊 客户业务周报
```sql
-- 客户业务分析报表 (ads_weekly_customer_report_salesname)
SELECT 
    sales_name,
    customer_name,
    COUNT(*) as order_count,
    SUM(weight) as total_weight,
    SUM(freight_amount) as total_revenue,
    AVG(profit_margin) as avg_margin
FROM dwd_business_order_report 
WHERE week_id = '${week_id}'
GROUP BY sales_name, customer_name
ORDER BY total_revenue DESC;
```

### 🚚 产品运输周报
```sql
-- 产品运输分析报表 (ads_weekly_product_report_salesname)
SELECT 
    product_category,
    transport_mode,
    COUNT(*) as shipment_count,
    SUM(weight) as total_weight,
    AVG(transport_days) as avg_delivery_time
FROM dwd_business_order_report 
WHERE week_id = '${week_id}'
GROUP BY product_category, transport_mode;
```

### 🏢 供应商绩效周报
```sql
-- 供应商绩效报表 (ads_weekly_supplier_report_salesname)
SELECT 
    supplier_name,
    COUNT(*) as order_count,
    AVG(delivery_score) as avg_delivery_score,
    AVG(quality_score) as avg_quality_score,
    SUM(total_amount) as total_business
FROM dwm_weekly_report_supplier 
WHERE week_id = '${week_id}'
GROUP BY supplier_name
ORDER BY total_business DESC;
```

## 碳排放报表模板

### 🌱 运输碳排放分析
```sql
-- 陆运碳排放统计
SELECT 
    DATE_FORMAT(transport_date, '%Y-%m') as month,
    vehicle_type,
    SUM(distance_km) as total_distance,
    SUM(carbon_emission) as total_emission,
    AVG(emission_factor) as avg_emission_factor
FROM dws_land_transport_carbon 
WHERE transport_date >= '${start_date}'
GROUP BY month, vehicle_type
ORDER BY month DESC, total_emission DESC;
```

## 自定义列车报表

### 🚄 定制列车业务分析
```sql
-- 定制列车周报 (ads_weekly_custom_train_report_salesname)
SELECT 
    train_route,
    departure_station,
    arrival_station,
    COUNT(*) as train_count,
    SUM(cargo_weight) as total_cargo,
    AVG(utilization_rate) as avg_utilization
FROM custom_train_data 
WHERE week_id = '${week_id}'
GROUP BY train_route, departure_station, arrival_station;
```

---
*模板更新: $(date +%Y-%m-%d)*
EOF

    # 创建ETL流程
    cat > "$target_dir/memory-bank/etlProcesses.md" << 'EOF'
# ETL流程管理

## 数据处理流程

### 📥 数据抽取 (Extract)
- **业务系统数据**: 每日凌晨2点自动抽取
- **第三方数据**: API接口实时同步
- **文件数据**: FTP定时获取

### 🔄 数据转换 (Transform)
- **数据清洗**: 去重、格式标准化
- **业务规则**: 应用业务逻辑计算
- **数据验证**: 质量检查和异常处理

### 📤 数据加载 (Load)
- **增量更新**: 基于时间戳的增量处理
- **全量刷新**: 周末全量数据重建
- **实时同步**: 关键业务数据实时更新

## 核心ETL脚本

### 业务订单ETL
```sql
-- ETL-dwd_business_order_report.sql
INSERT INTO dwd_business_order_report
SELECT 
    order_id,
    customer_name,
    origin_city,
    dest_city,
    transport_date,
    CAST(weight AS DECIMAL(10,2)) as weight,
    CAST(volume AS DECIMAL(10,2)) as volume,
    CAST(freight_amount AS DECIMAL(10,2)) as freight_amount,
    CAST(cost_amount AS DECIMAL(10,2)) as cost_amount
FROM ods_business_order 
WHERE process_date = '${process_date}';
```

### 周报数据ETL
```sql
-- ETL-dwm_weekly_report.sql
INSERT INTO dwm_weekly_report
SELECT 
    CONCAT(YEAR(transport_date), 'W', WEEK(transport_date)) as week_id,
    sales_name,
    COUNT(*) as total_orders,
    SUM(weight) as total_weight,
    SUM(freight_amount) as total_amount,
    AVG((freight_amount - cost_amount) / freight_amount * 100) as profit_margin
FROM dwd_business_order_report 
WHERE transport_date BETWEEN '${start_date}' AND '${end_date}'
GROUP BY week_id, sales_name;
```

### 碳排放ETL
```sql
-- ETL-dws_land_transport_carbon.sql
INSERT INTO dws_land_transport_carbon
SELECT 
    transport_id,
    vehicle_type,
    distance_km,
    fuel_consumption,
    distance_km * fuel_consumption * emission_factor as carbon_emission,
    CASE vehicle_type 
        WHEN '货车' THEN 2.68
        WHEN '卡车' THEN 3.15
        ELSE 2.50 
    END as emission_factor
FROM dwd_transport_detail 
WHERE process_date = '${process_date}';
```

## 数据质量监控

### 质量检查规则
- **完整性检查**: 必填字段非空验证
- **准确性检查**: 数据格式和范围验证
- **一致性检查**: 跨表数据一致性验证
- **及时性检查**: 数据更新时效性监控

### 异常处理机制
- **数据异常**: 自动标记和人工审核
- **流程异常**: 邮件告警和重试机制
- **性能异常**: 资源监控和优化建议

---
*流程更新: $(date +%Y-%m-%d)*
EOF

    # 创建技术决策记录
    cat > "$target_dir/memory-bank/technicalDecisions.md" << 'EOF'
# BI项目技术决策记录

## 数据架构决策

### 决策1: 数据仓库分层架构
- **时间**: $(date +%Y-%m-%d)
- **背景**: 需要构建可扩展的数据分析平台
- **决策**: 采用ODS-DWD-DWS-ADS四层架构
- **理由**: 
  - 数据分层清晰，便于维护
  - 支持多业务场景复用
  - 便于数据质量管控
- **影响**: 提高了数据开发效率和数据质量

### 决策2: 碳排放计算方法
- **时间**: $(date +%Y-%m-%d)
- **背景**: 需要准确计算运输碳排放
- **决策**: 基于距离和车型的排放因子计算法
- **理由**:
  - 计算方法简单可靠
  - 数据获取相对容易
  - 符合行业标准
- **影响**: 为绿色物流提供数据支撑

### 决策3: 报表自动化策略
- **时间**: $(date +%Y-%m-%d)
- **背景**: 手工报表效率低，易出错
- **决策**: 基于SQL模板的自动化报表生成
- **理由**:
  - 减少人工操作错误
  - 提高报表生成效率
  - 便于报表标准化
- **影响**: 报表生成效率提升80%

## 技术选型决策

### 数据库选择
- **MySQL**: 主要业务数据存储
- **ClickHouse**: 大数据量分析查询
- **Redis**: 缓存和会话存储

### ETL工具选择
- **自研SQL脚本**: 灵活性高，维护成本低
- **定时任务**: 基于Cron的调度机制
- **数据监控**: 自研监控告警系统

---
*决策记录: $(date +%Y-%m-%d)*
EOF

    # 创建问题解决方案
    cat > "$target_dir/memory-bank/problemSolutions.md" << 'EOF'
# BI项目问题解决方案

## 数据质量问题

### 问题1: 订单数据重复
- **现象**: 同一订单在系统中出现多条记录
- **原因**: 业务系统重复提交数据
- **解决方案**:
  ```sql
  -- 数据去重处理
  DELETE t1 FROM dwd_business_order_report t1
  INNER JOIN dwd_business_order_report t2 
  WHERE t1.id > t2.id 
  AND t1.order_id = t2.order_id;
  ```
- **预防措施**: 在ETL过程中增加唯一性检查

### 问题2: 碳排放计算异常
- **现象**: 部分记录碳排放值为0或异常大
- **原因**: 距离数据缺失或排放因子错误
- **解决方案**:
  ```sql
  -- 修复异常碳排放数据
  UPDATE dws_land_transport_carbon 
  SET carbon_emission = distance_km * fuel_consumption * 2.68
  WHERE carbon_emission = 0 OR carbon_emission > 1000;
  ```
- **预防措施**: 增加数据验证规则

## 性能优化问题

### 问题3: 周报查询慢
- **现象**: 周报生成时间超过10分钟
- **原因**: 大表全表扫描，缺少索引
- **解决方案**:
  ```sql
  -- 添加复合索引
  CREATE INDEX idx_week_sales ON dwm_weekly_report(week_id, sales_name);
  CREATE INDEX idx_transport_date ON dwd_business_order_report(transport_date);
  ```
- **效果**: 查询时间缩短到30秒以内

### 问题4: ETL处理超时
- **现象**: 数据量大时ETL任务超时失败
- **原因**: 单次处理数据量过大
- **解决方案**: 分批处理策略
  ```sql
  -- 分批处理大数据量
  SET @batch_size = 10000;
  SET @offset = 0;
  
  WHILE @offset < (SELECT COUNT(*) FROM source_table) DO
    INSERT INTO target_table 
    SELECT * FROM source_table 
    LIMIT @offset, @batch_size;
    SET @offset = @offset + @batch_size;
  END WHILE;
  ```

## 业务逻辑问题

### 问题5: 利润率计算错误
- **现象**: 部分订单利润率显示为负数
- **原因**: 成本数据包含了不应计入的费用
- **解决方案**: 重新定义成本计算规则
  ```sql
  -- 修正利润率计算
  UPDATE dwm_weekly_report 
  SET profit_margin = (total_amount - direct_cost) / total_amount * 100
  WHERE profit_margin < 0;
  ```

### 问题6: 客户分类不准确
- **现象**: 重要客户被分类为普通客户
- **原因**: 分类规则过于简单
- **解决方案**: 多维度客户价值评估
  ```sql
  -- 客户价值重新评估
  UPDATE customer_analysis 
  SET customer_level = CASE 
    WHEN annual_revenue > 1000000 AND order_frequency > 50 THEN 'VIP'
    WHEN annual_revenue > 500000 OR order_frequency > 30 THEN 'Important'
    ELSE 'Normal'
  END;
  ```

---
*解决方案更新: $(date +%Y-%m-%d)*
EOF

    # 创建快速参考
    cat > "$target_dir/memory-bank/quickReference.md" << 'EOF'
# BI项目快速参考

## 常用SQL查询

### 📊 业务查询
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

### 🌱 碳排放查询
```sql
-- 查看本月碳排放统计
SELECT vehicle_type, SUM(carbon_emission) as total_emission
FROM dws_land_transport_carbon 
WHERE DATE_FORMAT(transport_date, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
GROUP BY vehicle_type;
```

## 报表生成命令

### 周报生成
```bash
# 生成客户业务周报
mysql -e "source ETL-ads_weekly_customer_report_salesname.sql"

# 生成供应商绩效周报  
mysql -e "source ETL-ads_weekly_supplier_report_salesname.sql"

# 生成产品运输周报
mysql -e "source ETL-ads_weekly_product_report_salesname.sql"
```

### 数据更新
```bash
# 更新业务订单数据
mysql -e "source ETL-dwd_business_order_report.sql"

# 更新碳排放数据
mysql -e "source ETL-dws_land_transport_carbon.sql"
```

## 常见问题快速解决

### 数据问题
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

## 监控指标

### 数据质量指标
- 数据完整性: >95%
- 数据准确性: >98%
- 数据及时性: <2小时延迟

### 系统性能指标
- 查询响应时间: <5秒
- ETL处理时间: <30分钟
- 系统可用性: >99.5%

---
*参考更新: $(date +%Y-%m-%d)*
EOF

    # 创建学习洞察
    cat > "$target_dir/memory-bank/learningInsights.md" << 'EOF'
# BI项目学习洞察

## 数据分析洞察

### 💡 洞察1: 数据驱动决策的重要性
- **背景**: 传统决策依赖经验和直觉
- **发现**: 数据分析能够揭示隐藏的业务模式
- **应用**: 通过数据分析优化运输路线，成本降低15%
- **启示**: 数据是现代企业的重要资产

### 💡 洞察2: 实时数据的价值
- **背景**: 历史数据分析存在滞后性
- **发现**: 实时数据能够及时发现问题和机会
- **应用**: 实时监控运输状态，提高客户满意度
- **启示**: 投资实时数据处理能力是必要的

### 💡 洞察3: 数据质量的关键性
- **背景**: 垃圾进，垃圾出(GIGO)原则
- **发现**: 数据质量直接影响分析结果的可信度
- **应用**: 建立完善的数据质量管控体系
- **启示**: 数据质量是BI项目成功的基础

## 技术架构洞察

### 🏗️ 洞察4: 分层架构的优势
- **经验**: 采用ODS-DWD-DWS-ADS四层架构
- **优势**: 
  - 职责清晰，便于维护
  - 数据复用性高
  - 支持敏捷开发
- **教训**: 过度设计会增加复杂性
- **建议**: 根据业务需求选择合适的架构复杂度

### 🏗️ 洞察5: ETL流程设计原则
- **原则**: 简单、可靠、可监控
- **实践**: 
  - 使用SQL脚本而非复杂ETL工具
  - 增加数据验证和异常处理
  - 建立完善的监控告警机制
- **效果**: ETL成功率提升到99.5%

## 业务理解洞察

### 📈 洞察6: 物流行业特点
- **特点**: 
  - 数据量大，实时性要求高
  - 业务流程复杂，涉及多方协作
  - 成本控制是核心竞争力
- **应对策略**: 
  - 构建高性能数据处理平台
  - 简化业务流程，提高效率
  - 精细化成本管控

### 📈 洞察7: 客户价值分析的重要性
- **发现**: 80%的利润来自20%的客户
- **应用**: 重点服务高价值客户，提高整体盈利能力
- **方法**: 多维度客户价值评估模型
- **结果**: 客户满意度和盈利能力双提升

## 项目管理洞察

### 🎯 洞察8: 敏捷开发在BI项目中的应用
- **挑战**: BI项目需求变化频繁
- **解决**: 采用敏捷开发方法
- **实践**: 
  - 短周期迭代开发
  - 持续用户反馈
  - 快速响应需求变化
- **效果**: 项目交付效率提升50%

### 🎯 洞察9: 用户培训的重要性
- **问题**: 用户不会使用BI系统
- **解决**: 制定完善的用户培训计划
- **内容**: 
  - 系统操作培训
  - 数据分析方法培训
  - 业务应用场景培训
- **效果**: 系统使用率提升80%

## 技术选型洞察

### 🔧 洞察10: 开源vs商业软件
- **考虑因素**: 成本、功能、维护难度
- **选择**: 
  - 数据库: MySQL(开源) + ClickHouse(开源)
  - ETL: 自研SQL脚本
  - 可视化: 自研Dashboard
- **结果**: 在满足需求的前提下大幅降低成本

### 🔧 洞察11: 云原生架构的优势
- **趋势**: 云计算成为主流
- **优势**: 
  - 弹性扩展
  - 降低运维成本
  - 提高系统可靠性
- **建议**: 逐步向云原生架构迁移

---
*洞察记录: $(date +%Y-%m-%d)*
EOF

    # 创建近期活动记录
    cat > "$target_dir/memory-bank/recentActivity.md" << 'EOF'
# BI项目近期活动记录

## $(date +%Y-%m-%d) - BI项目Memory Bank初始化

### 🚀 项目部署
- **项目类型**: 商业智能(BI)项目
- **部署位置**: $(basename "$target_dir")
- **Memory Bank**: 针对BI项目定制化内容

### 📊 核心模块初始化
- **业务洞察**: 物流行业分析洞察
- **数据模型**: 运输业务、周报、碳排放模型
- **报表模板**: 运营周报、碳排放分析模板
- **ETL流程**: 数据处理和质量管控流程
- **技术决策**: 数据架构和技术选型记录

### 🎯 当前重点工作
- 运营周报系统优化
- 碳排放数据分析模块开发
- 客户价值分析模型完善

### 📈 下一步计划
- 完善实时数据处理能力
- 扩展可视化Dashboard功能
- 建立更完善的数据质量监控体系

---
*活动记录: $(date +%Y-%m-%d)*
EOF

    echo "✅ BI项目Memory Bank内容已创建"
}

# 创建数据分析项目Memory Bank内容
create_analysis_memory_bank() {
    local target_dir=$1
    
    # 创建基础的分析项目Memory Bank内容
    cat > "$target_dir/memory-bank/projectContext.md" << 'EOF'
# 数据分析项目上下文

## 项目概述
**数据分析平台** - 专注于数据挖掘、统计分析和机器学习的综合性分析平台

## 核心功能
- 数据探索性分析(EDA)
- 统计建模和假设检验
- 机器学习模型开发
- 数据可视化和报告生成

---
*最后更新: $(date +%Y-%m-%d)*
EOF

    # 创建其他必要的分析项目文件...
    echo "✅ 数据分析项目Memory Bank内容已创建"
}

# 显示使用说明
show_usage() {
    echo "Usage: $0 <target_directory> [options]"
    echo "Options:"
    echo "  --clean        Clean target directory before deployment"
    echo "  --type TYPE    Project type (development|analysis|bi)"
    echo "  --help         Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 /path/to/project --type bi --clean"
}

# 检查参数
if [ $# -lt 1 ] || [ "$1" == "--help" ]; then
    show_usage
    exit 1
fi

TARGET_DIR=$1
shift

# 默认项目类型
PROJECT_TYPE="development"

# 解析其他参数
CLEAN=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --clean)
            CLEAN=true
            shift
            ;;
        --type)
            PROJECT_TYPE="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# 验证项目类型
if [[ ! "$PROJECT_TYPE" =~ ^(development|analysis|bi)$ ]]; then
    echo "Error: Invalid project type. Must be one of: development, analysis, bi"
    exit 1
fi

# 检查目标目录
if [ ! -d "$TARGET_DIR" ]; then
    echo "Creating target directory: $TARGET_DIR"
    mkdir -p "$TARGET_DIR"
fi

# 清理目标目录（如果指定）
if [ "$CLEAN" = true ]; then
    echo "[跳过] 不再清理目标目录，保留所有原有文件。"
    # 保留 .git 目录
    # if [ -d "$TARGET_DIR/.git" ]; then
    #     mv "$TARGET_DIR/.git" "$TARGET_DIR/.git.bak"
    # fi
    # rm -rf "$TARGET_DIR"/*
    # if [ -d "$TARGET_DIR/.git.bak" ]; then
    #     mv "$TARGET_DIR/.git.bak" "$TARGET_DIR/.git"
    # fi
fi

# 创建项目结构
echo "Creating project structure for type: $PROJECT_TYPE"

# 创建基本目录结构
mkdir -p "$TARGET_DIR/memory-bank"
mkdir -p "$TARGET_DIR/output"
mkdir -p "$TARGET_DIR/logs"
mkdir -p "$TARGET_DIR/src"

# 根据项目类型创建Memory Bank内容
echo "Creating Memory Bank content for $PROJECT_TYPE project..."

case $PROJECT_TYPE in
    "development")
        # 开发项目 - 复制现有的Memory Bank内容
        if [ -d "memory-bank" ]; then
            cp -r memory-bank/* "$TARGET_DIR/memory-bank/"
            echo "✅ 开发项目Memory Bank内容已复制"
        fi
        ;;
    "analysis")
        # 数据分析项目
        create_analysis_memory_bank "$TARGET_DIR"
        ;;
    "bi")
        # BI项目
        create_bi_memory_bank "$TARGET_DIR"
        ;;
esac

# 创建配置文件
cat > "$TARGET_DIR/cursor-mcp-config.json" << EOF
{
    "port": 3000,
    "host": "localhost",
    "logLevel": "info",
    "memoryBankPath": "./memory-bank",
    "outputPath": "./output",
    "logPath": "./logs",
    "projects": {
        "$(basename "$TARGET_DIR")": {
            "name": "$(basename "$TARGET_DIR")",
            "path": "./memory-bank",
            "type": "$PROJECT_TYPE"
        }
    }
}
EOF

# 创建项目说明文件
cat > "$TARGET_DIR/README.md" << EOF
# Cursor Memory Project

## 项目类型
$PROJECT_TYPE

## 目录结构
- \`memory-bank/\`: 记忆库目录
- \`output/\`: 输出文件目录
- \`logs/\`: 日志文件目录
- \`src/\`: 源代码目录

## 使用说明
1. 安装依赖：
   \`\`\`bash
   npm install
   \`\`\`

2. 启动服务：
   \`\`\`bash
   npm run mcp
   \`\`\`

3. 配置 Cursor：
   - 打开 Cursor 设置
   - 添加 MCP 服务器配置
   - 重启 Cursor

## 维护说明
- 定期备份记忆库
- 检查日志文件
- 更新配置文件

最后更新: $(date +%Y-%m-%d)
EOF

# 复制必要的文件
echo "Copying project files..."
cp package.json "$TARGET_DIR/"
cp .gitignore "$TARGET_DIR/"

# 确保src目录存在并复制所有源文件
if [ -d "src" ]; then
    cp -r src/* "$TARGET_DIR/src/"
    echo "✅ 源代码文件已复制"
else
    echo "⚠️  警告: src目录不存在"
fi

# 复制其他必要文件
if [ -f "start-mcp-server.sh" ]; then
    cp start-mcp-server.sh "$TARGET_DIR/"
fi

# 验证关键文件是否存在
echo "验证部署文件..."
if [ -f "$TARGET_DIR/src/config-validator.js" ]; then
    echo "✅ 配置验证器已部署"
else
    echo "❌ 配置验证器缺失"
fi

if [ -f "$TARGET_DIR/src/mcp-server.js" ]; then
    echo "✅ MCP服务器已部署"
else
    echo "❌ MCP服务器缺失"
fi

# 检查package.json中的脚本
if grep -q "validate-config" "$TARGET_DIR/package.json"; then
    echo "✅ 配置验证脚本已添加"
else
    echo "❌ 配置验证脚本缺失"
fi

echo ""
echo "🎉 Project initialized successfully in $TARGET_DIR"
echo "📋 Project type: $PROJECT_TYPE"
echo "📖 Please review the README.md file for usage instructions."
echo ""
echo "🔧 Next steps:"
echo "   cd $TARGET_DIR"
echo "   npm install"
echo "   npm run validate-config"
echo "   npm run mcp" 