#!/bin/bash

# 色の設定
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${GREEN}LeadMaster WebApp ローカル開発環境起動${NC}"
echo -e "${BLUE}=====================================${NC}"

# 既存のプロセスをクリーンアップ
echo -e "${YELLOW}既存のプロセスをクリーンアップしています...${NC}"
pkill -f "nodemon.*index.js" 2>/dev/null || true
pkill -f "craco start" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true

# 依存関係のインストール
echo -e "${YELLOW}フロントエンドの依存関係を確認しています...${NC}"
npm install

echo -e "${YELLOW}バックエンドの依存関係を確認しています...${NC}"
cd server
npm install
cd ..

# キャッシュのクリア
echo -e "${YELLOW}キャッシュをクリアしています...${NC}"
rm -rf node_modules/.cache 2>/dev/null || true

# バックエンドサーバーを起動（バックグラウンド）
echo -e "${YELLOW}バックエンドサーバーを起動しています...${NC}"
cd server
PORT=8080 NODE_ENV=development npx nodemon index.js &
SERVER_PID=$!
cd ..

# サーバーの起動を待機
echo -e "${YELLOW}バックエンドサーバーの起動を待機しています...${NC}"
sleep 5

echo -e "${GREEN}バックエンドサーバーが起動しました！${NC}"
echo -e "${GREEN}サーバー URL: http://localhost:8080/api${NC}"

# フロントエンドの開発サーバーを起動
echo -e "${YELLOW}フロントエンドの開発サーバーを起動しています...${NC}"
echo -e "${BLUE}注意: エラーが発生した場合は、以下のコマンドを別々に実行してください:${NC}"
echo -e "${GREEN}1. バックエンド: cd server && PORT=8080 npx nodemon index.js${NC}"
echo -e "${GREEN}2. フロントエンド: PORT=3000 BROWSER=none npm start${NC}"
echo ""

PORT=3000 BROWSER=none npm start

# Ctrl+C 時の処理（バックグラウンドのバックエンドプロセスを終了）
trap "echo -e '${RED}プロセスを終了しています...${NC}'; kill $SERVER_PID 2>/dev/null || true" EXIT

exit 0
