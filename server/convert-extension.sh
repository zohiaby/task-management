#!/bin/bash

# Navigate to the server directory (optional, remove if running inside server/)
cd "$(dirname "$0")"

# Find all .js files excluding node_modules and rename them to .mjs
find . -type f -name "*.cjs" ! -path "./node_modules/*" | while read file; do
    mv "$file" "${file%.cjs}.js"
    echo "Renamed: $file -> ${file%.cjs}.js"
done

echo "All .js files (excluding node_modules) have been converted to .mjs."
