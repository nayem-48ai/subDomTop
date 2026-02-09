name: Tnayem48 Preview Engine

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  preview-engine:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Extract Project
        run: |
          ZIP_FILE=$(ls *.zip 2>/dev/null | head -n 1) || true
          if [ -f "$ZIP_FILE" ]; then
            unzip -o "$ZIP_FILE" -d .
            rm "$ZIP_FILE"
          fi

      - name: Patch Vite Config
        run: |
          node -e "
          const fs = require('fs');
          const file = fs.readdirSync('.').find(f => f.startsWith('vite.config.'));
          if (file) {
            let content = fs.readFileSync(file, 'utf8');
            if (!content.includes('base:')) {
              content = content.replace(/return\s*\{/, \"return {\n      base: './',\");
            }
            const serverConfig = \"server: { host: '0.0.0.0', allowedHosts: true },\";
            if (content.includes('server:')) {
              content = content.replace(/server\s*:\s*\{[\s\S]*?\},/, serverConfig);
            } else {
              content = content.replace(/return\s*\{/, \"return {\n      \" + serverConfig);
            }
            fs.writeFileSync(file, content);
          }
          "

      - name: Sync Repository
        run: |
          git config --global user.name "github-actions[bot]"
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git add .
          git diff --quiet && git diff --staged --quiet || (git commit -m "fix: preview sync" && git push origin main)

      - name: Install Packages
        run: npm install

      - name: Live Dev Preview (@Tnayem48)
        run: |
          PORT=$(node -e "
            const fs = require('fs');
            try {
              const file = fs.readdirSync('.').find(f => f.startsWith('vite.config.'));
              const content = fs.readFileSync(file, 'utf8');
              const match = content.match(/port\s*:\s*(\d+)/);
              console.log(match ? match[1] : 3000);
            } catch (e) { console.log(3000); }
          ")

          curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
          sudo dpkg -i cloudflared.deb
          
          npm run dev -- --host 0.0.0.0 --port $PORT & 
          
          sleep 10
          
          echo "------------------------------------------------------------"
          echo "🔍 SEARCHING FOR PREVIEW LINK..."
          echo "⚠️  লিঙ্কটি চালু হতে ১০-১৫ সেকেন্ড সময় নিতে পারে।"
          
          timeout 10m cloudflared tunnel --url http://localhost:$PORT 2>&1 | tee /tmp/cf.log | grep -oE "https://[a-zA-Z0-9.-]+\.trycloudflare\.com" &
          
          sleep 12
          echo ""
          echo "🚀 YOUR PREVIEW LINK:"
          grep -oE "https://[a-zA-Z0-9.-]+\.trycloudflare\.com" /tmp/cf.log | head -n 1
          echo ""
          echo "Copyright © Tnayem48"
          echo "------------------------------------------------------------"
          
          sleep 10m || true
