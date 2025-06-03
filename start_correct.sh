#!/bin/bash
echo "🧠 Starting extension correctly..."
npm run compile
/Applications/Cursor.app/Contents/MacOS/Cursor --extensionDevelopmentPath="$(pwd)" --new-window
