#!/bin/bash
echo "🧠 Starting extension..."
npm run compile
/Applications/Cursor.app/Contents/MacOS/Cursor --extensionDevelopmentPath="$(pwd)" --new-window "$(pwd)" --verbose
