#!/bin/bash
# ビルドとファイル構造の検証スクリプト

# カラー出力用の関数
print_green() {
  echo -e "\033[0;32m$1\033[0m"
}

print_yellow() {
  echo -e "\033[0;33m$1\033[0m"
}

print_red() {
  echo -e "\033[0;31m$1\033[0m"
}

print_yellow "ローカルビルドを開始します..."
npm run build

if [ $? -ne 0 ]; then
  print_red "ビルドに失敗しました。"
  exit 1
fi

print_green "ビルドに成功しました！"

# buildディレクトリ内のファイルを確認
print_yellow "ビルドディレクトリの内容を確認します..."
if [ -d "./build" ]; then
  ls -la ./build
  
  if [ -f "./build/index.html" ]; then
    print_green "index.htmlファイルが存在します。"
    print_yellow "index.htmlファイルの内容（先頭10行）:"
    head -n 10 ./build/index.html
  else
    print_red "index.htmlファイルが見つかりません。"
    exit 1
  fi
else
  print_red "buildディレクトリが見つかりません。"
  exit 1
fi

# Docker内のファイル構造をテスト
print_yellow "Dockerビルドでファイル構造をテストします..."
docker build -t leadmaster-test-file-structure .

if [ $? -ne 0 ]; then
  print_red "Dockerビルドに失敗しました。"
  exit 1
fi

print_green "Dockerビルドに成功しました！"
print_yellow "コンテナ内で直接ファイル構造を確認します..."

docker run --rm leadmaster-test-file-structure sh -c "ls -la / && ls -la /app && ls -la /app/build && cat /app/build/index.html | head -n 10"

if [ $? -eq 0 ]; then
  print_green "検証が完了しました。ファイル構造は正常です。"
else
  print_red "Docker内のファイル構造に問題があります。"
fi
