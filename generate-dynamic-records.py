#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
🚀 Cursor 聊天记录动态提取器
自动检测记录数量，生成完整的项目、会话ID、时间、Q、A记录
"""

import sqlite3
import json
import csv
import sys
import os
from datetime import datetime
from pathlib import Path

def find_cursor_db():
    """查找包含聊天数据的Cursor数据库"""
    cursor_dir = Path.home() / "Library/Application Support/Cursor/User/workspaceStorage"
    
    if not cursor_dir.exists():
        print("❌ Cursor目录不存在")
        return None
    
    # 查找所有workspace数据库
    for workspace_dir in cursor_dir.iterdir():
        if workspace_dir.is_dir():
            db_path = workspace_dir / "state.vscdb"
            if db_path.exists():
                try:
                    conn = sqlite3.connect(str(db_path))
                    cursor = conn.cursor()
                    # 检查是否包含AI服务数据
                    cursor.execute("SELECT COUNT(*) FROM ItemTable WHERE key = 'aiService.prompts'")
                    count = cursor.fetchone()[0]
                    conn.close()
                    
                    if count > 0:
                        print(f"✅ 找到聊天数据库: {db_path}")
                        return str(db_path)
                except:
                    continue
    
    print("❌ 未找到包含聊天数据的数据库")
    return None

def extract_chat_records(db_path):
    """提取聊天记录"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 获取提示词数据
        cursor.execute("SELECT value FROM ItemTable WHERE key = 'aiService.prompts'")
        prompts_row = cursor.fetchone()
        if not prompts_row:
            print("❌ 未找到提示词数据")
            return []
        
        prompts_data = json.loads(prompts_row[0])
        
        # 获取生成数据
        cursor.execute("SELECT value FROM ItemTable WHERE key = 'aiService.generations'")
        generations_row = cursor.fetchone()
        if not generations_row:
            print("❌ 未找到生成数据")
            return []
        
        generations_data = json.loads(generations_row[0])
        
        print(f"📊 发现 {len(prompts_data)} 个问题，{len(generations_data)} 个回答")
        
        # 生成记录
        records = []
        max_records = min(len(prompts_data), len(generations_data))
        
        for i in range(max_records):
            prompt = prompts_data[i]
            generation = generations_data[i] if i < len(generations_data) else {}
            
            # 提取时间
            timestamp = generation.get('unixMs')
            if timestamp:
                time_str = datetime.fromtimestamp(timestamp / 1000).strftime('%Y-%m-%d %H:%M:%S')
            else:
                time_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            # 提取问题
            question = prompt.get('text', '').strip()
            if not question:
                continue
            
            # 提取答案
            answer = generation.get('textDescription') or generation.get('text') or '[无AI回答]'
            
            # 生成记录
            record = {
                '项目': 'cursor-chat-memory',
                '会话ID': f"session-{i+1:03d}",
                '时间': time_str,
                'Q': question,
                'A': answer
            }
            records.append(record)
        
        # 处理剩余的问题（如果问题数多于回答数）
        if len(prompts_data) > len(generations_data):
            for i in range(len(generations_data), len(prompts_data)):
                prompt = prompts_data[i]
                question = prompt.get('text', '').strip()
                if question:
                    record = {
                        '项目': 'cursor-chat-memory',
                        '会话ID': f"session-{i+1:03d}",
                        '时间': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                        'Q': question,
                        'A': '[待AI回答]'
                    }
                    records.append(record)
        
        return records
        
    finally:
        conn.close()

def save_to_csv(records, output_file):
    """保存到CSV文件"""
    if not records:
        print("❌ 没有记录可保存")
        return
    
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['项目', '会话ID', '时间', 'Q', 'A']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        writer.writeheader()
        for record in records:
            writer.writerow(record)
    
    print(f"✅ 已保存 {len(records)} 条记录到 {output_file}")

def main():
    print("🔍 Cursor 聊天记录动态提取器")
    print("=" * 50)
    
    # 查找数据库
    db_path = find_cursor_db()
    if not db_path:
        sys.exit(1)
    
    # 提取记录
    records = extract_chat_records(db_path)
    
    # 保存到CSV
    output_file = "cursor_chat_records_dynamic.csv"
    save_to_csv(records, output_file)
    
    # 显示统计信息
    print("\n📈 统计信息:")
    print(f"   总记录数: {len(records)}")
    if records:
        print(f"   时间范围: {records[0]['时间']} 到 {records[-1]['时间']}")
        print(f"   最新问题: {records[-1]['Q'][:50]}...")
    
    print(f"\n💡 使用建议:")
    print(f"   1. 用Excel或Numbers打开: {output_file}")
    print(f"   2. 可以导入到数据库进行进一步分析")
    print(f"   3. 支持按时间、项目等字段排序和筛选")

if __name__ == "__main__":
    main() 