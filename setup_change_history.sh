#!/bin/bash

# BigQuery変更履歴テーブル作成スクリプト
# 使用方法: ./setup_change_history.sh [PROJECT_ID]

set -e

# プロジェクトIDの設定
PROJECT_ID=${1:-${GOOGLE_CLOUD_PROJECT_ID:-"m2m-core"}}
DATASET_ID="zzz_taniguchi"
TABLE_NAME="change_history"

echo "=== BigQuery変更履歴テーブル作成 ==="
echo "プロジェクトID: $PROJECT_ID"
echo "データセットID: $DATASET_ID"
echo "テーブル名: $TABLE_NAME"
echo

# プロジェクト設定
echo "1. プロジェクト設定..."
gcloud config set project $PROJECT_ID

# データセットの存在確認
echo "2. データセット存在確認..."
if ! gcloud bigquery datasets describe $DATASET_ID --project=$PROJECT_ID &>/dev/null; then
    echo "データセット $DATASET_ID が存在しません。作成しています..."
    gcloud bigquery datasets create $DATASET_ID --project=$PROJECT_ID
    echo "データセット作成完了"
else
    echo "データセット $DATASET_ID は既に存在します"
fi

# テーブル作成SQLを実行
echo "3. 変更履歴テーブル作成..."
SQL_FILE="sql/create_change_history_table.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "エラー: SQLファイル $SQL_FILE が見つかりません"
    exit 1
fi

# プレースホルダーを実際のプロジェクトIDに置換
sed "s/{project_id}/$PROJECT_ID/g" "$SQL_FILE" > /tmp/create_change_history_table_temp.sql

echo "SQLファイル実行中..."
bq query --use_legacy_sql=false --project_id=$PROJECT_ID < /tmp/create_change_history_table_temp.sql

# 一時ファイル削除
rm /tmp/create_change_history_table_temp.sql

echo "4. テーブル確認..."
bq show $PROJECT_ID:$DATASET_ID.$TABLE_NAME

echo
echo "=== セットアップ完了 ==="
echo "変更履歴テーブルが正常に作成されました"
echo "テーブル: $PROJECT_ID.$DATASET_ID.$TABLE_NAME"
echo
echo "使用例:"
echo "- 部屋の変更履歴を取得: GET /api/room/{room_id}/history"
echo "- 物件の変更履歴を取得: GET /api/property/{property_id}/history"
echo "- 部屋タイプの変更履歴を取得: GET /api/room-type/{room_type_id}/history"
