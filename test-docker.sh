#!/bin/bash
# Dockerビルドとローカルテスト用のスクリプト

# コンソールに色付きで表示する関数
print_green() {
  echo -e "\033[0;32m$1\033[0m"
}

print_yellow() {
  echo -e "\033[0;33m$1\033[0m"
}

print_red() {
  echo -e "\033[0;31m$1\033[0m"
}

# 古いコンテナを停止して削除
print_yellow "古いコンテナを停止しています..."
docker stop leadmaster-test 2>/dev/null || true
docker rm leadmaster-test 2>/dev/null || true

# イメージをビルド
print_yellow "Dockerイメージをビルド中..."
docker build -t leadmaster-test .

# 結果に応じてメッセージを表示
if [ $? -eq 0 ]; then
  print_green "イメージのビルドに成功しました！"
else
  print_red "イメージのビルドに失敗しました。"
  exit 1
fi

# コンテナを実行
print_yellow "コンテナを起動しています..."
docker run --name leadmaster-test -p 8080:8080 -e PORT=8080 -e NODE_ENV=production -d leadmaster-test

# コンテナが起動したかを確認
if [ $? -eq 0 ]; then
  print_green "コンテナが起動しました！"
  print_green "ブラウザで http://localhost:8080 にアクセスして動作を確認してください。"
  print_yellow "ログを表示するには以下のコマンドを実行してください:"
  echo "docker logs -f leadmaster-test"
  print_yellow "コンテナを停止するには以下のコマンドを実行してください:"
  echo "docker stop leadmaster-test"
else
  print_red "コンテナの起動に失敗しました。"
fi
