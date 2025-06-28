#!/bin/bash

# 色の設定
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${GREEN}LeadMaster WebApp ローカル開発環境起動${NC}"
echo -e "${BLUE}=====================================${NC}"

# 依存関係のインストール (初回のみ必要)
echo -e "${YELLOW}フロントエンドの依存関係をインストールしています...${NC}"
npm install

echo -e "${YELLOW}バックエンドの依存関係をインストールしています...${NC}"
cd server
npm install
cd ..

# バックエンドサーバーを起動（バックグラウンド）
echo -e "${YELLOW}バックエンドサーバーを起動しています...${NC}"
cd server
npx nodemon index.js &
SERVER_PID=$!
cd ..

# 3秒待機してサーバーの起動を確認
sleep 3

echo -e "${GREEN}バックエンドサーバーが起動しました！${NC}"
echo -e "${GREEN}サーバー URL: http://localhost:8080/api${NC}"

# フロントエンドの開発サーバーを起動
echo -e "${YELLOW}フロントエンドの開発サーバーを起動しています...${NC}"
npm start

# Ctrl+C 時の処理（バックグラウンドのバックエンドプロセスを終了）
trap "kill $SERVER_PID" EXIT

exit 0
