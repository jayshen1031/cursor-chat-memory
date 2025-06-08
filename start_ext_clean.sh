#!/bin/bash
echo "🧠 Starting extension with clean state..."

# 清除 Cursor 的窗口状态
rm -rf ~/Library/Application\ Support/Cursor/User/workspaceStorage/*/workspace.json

# 编译并启动
npm run compile
/Applications/Cursor.app/Contents/MacOS/Cursor --extensionDevelopmentPath="$(pwd)" --verbose 