#!/bin/bash
# Cloud Runにデプロイするためのスクリプト（環境変数ファイル使用）

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

# プロジェクトIDの設定
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
  print_red "プロジェクトIDが設定されていません。"
  print_yellow "gcloud config set project YOUR_PROJECT_ID を実行してプロジェクトを設定してください。"
  exit 1
fi

# サービス名の設定
SERVICE_NAME="leadmaster"
REGION="asia-northeast1"

# イメージ名の設定
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME:latest"

# .env.productionファイルから環境変数を読み込み
if [ ! -f ".env.production" ]; then
  print_red ".env.productionファイルが見つかりません。"
  exit 1
fi

# 環境変数を配列に変換
ENV_VARS=""
while IFS='=' read -r key value || [ -n "$key" ]; do
  # コメント行や空行をスキップ
  if [[ $key =~ ^[[:space:]]*# ]] || [[ -z "$key" ]]; then
    continue
  fi
  
  # 空白文字を削除
  key=$(echo "$key" | xargs)
  value=$(echo "$value" | xargs)
  
  if [ -n "$key" ] && [ -n "$value" ]; then
    if [ -z "$ENV_VARS" ]; then
      ENV_VARS="$key=$value"
    else
      ENV_VARS="$ENV_VARS,$key=$value"
    fi
  fi
done < .env.production

print_yellow "設定される環境変数:"
echo "$ENV_VARS" | tr ',' '\n'

# イメージビルド
print_yellow "Dockerイメージをビルド中..."
docker build -t $IMAGE_NAME .

# Google Container Registryにプッシュ
print_yellow "イメージをGoogle Container Registryにプッシュ中..."
docker push $IMAGE_NAME

# Cloud Runにデプロイ
print_yellow "Cloud Runにデプロイ中..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port=8080 \
  --cpu=1 \
  --memory=512Mi \
  --min-instances=0 \
  --max-instances=10 \
  --concurrency=80 \
  --set-env-vars="$ENV_VARS"

if [ $? -eq 0 ]; then
  print_green "デプロイが完了しました！"
  SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format="value(status.url)")
  print_green "アプリケーションURL: $SERVICE_URL"
  print_yellow "BigQuery接続テスト: $SERVICE_URL/api/bigquery/test"
else
  print_red "デプロイに失敗しました。"
fi
