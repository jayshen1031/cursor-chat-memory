#!/usr/bin/env python3
import sqlite3
import json
import csv
from datetime import datetime

# 使用已知的包含完整数据的数据库路径
db_path = '/Users/jay/Library/Application Support/Cursor/User/workspaceStorage/e76c6a8343ed4d7d7b8f77651bad3214/state.vscdb'

print("🔍 提取完整的聊天记录...")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 获取数据
cursor.execute('SELECT value FROM ItemTable WHERE key = "aiService.prompts"')
prompts_data = json.loads(cursor.fetchone()[0])

cursor.execute('SELECT value FROM ItemTable WHERE key = "aiService.generations"')
generations_data = json.loads(cursor.fetchone()[0])

print(f"📊 发现 {len(prompts_data)} 个问题，{len(generations_data)} 个回答")

# 生成记录
records = []
for i in range(len(prompts_data)):
    prompt = prompts_data[i]
    generation = generations_data[i] if i < len(generations_data) else {}
    
    # 处理时间戳
    timestamp = generation.get('unixMs')
    if timestamp:
        time_str = datetime.fromtimestamp(timestamp / 1000).strftime('%Y-%m-%d %H:%M:%S')
    else:
        time_str = '未知时间'
    
    # 提取问题和答案
    question = prompt.get('text', '').strip()
    answer = generation.get('textDescription') or generation.get('text') or '[无AI回答]'
    
    if question:
        records.append({
            '项目': 'cursor-chat-memory',
            '会话ID': f'session-{i+1:03d}',
            '时间': time_str,
            'Q': question,
            'A': answer
        })

# 保存到CSV
output_file = 'cursor_chat_records_complete.csv'
with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
    fieldnames = ['项目', '会话ID', '时间', 'Q', 'A']
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()
    for record in records:
        writer.writerow(record)

print(f"✅ 已保存 {len(records)} 条完整记录到 {output_file}")

# 显示统计信息
if records:
    with_answers = sum(1 for r in records if r['A'] != '[无AI回答]')
    print(f"📈 统计: {with_answers}/{len(records)} 条记录有AI回答")
    print(f"⏰ 时间范围: {records[0]['时间']} 到 {records[-1]['时间']}")

conn.close() 