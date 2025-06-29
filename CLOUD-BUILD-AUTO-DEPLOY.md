# Cloud Build 自動デプロイ設定ガイド

## 現在の状態

以下のファイルが GitHub push 時の自動デプロイに対応済みです：

- `cloudbuild.yaml`: Cloud Build 設定ファイル
- `.env.production`: 本番環境用環境変数
- `server/services/bigQueryService.js`: 動的プロジェクトID対応
- `Dockerfile`: 本番用Docker設定

## 必要な権限設定

### 1. Cloud Build サービスアカウントの権限確認

```bash
# プロジェクトIDを取得
PROJECT_ID=$(gcloud config get-value project)

# Cloud Build サービスアカウントにBigQuery権限を付与
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Cloud Build でデプロイされる Cloud Run に BigQuery アクセス権限を付与
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$PROJECT_ID-compute@developer.gserviceaccount.com" \
  --role="roles/bigquery.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$PROJECT_ID-compute@developer.gserviceaccount.com" \
  --role="roles/bigquery.dataViewer"
```

注意: `$PROJECT_NUMBER` は実際のプロジェクト番号に置き換えてください。

### 2. Cloud Build トリガーの設定確認

Cloud Console で以下を確認：

1. GitHub リポジトリが接続されていること
2. トリガーが正しいブランチ（mainまたはmaster）を監視していること
3. `cloudbuild.yaml` の場所が正しく設定されていること

## 期待される動作

### GitHub push 後：

1. Cloud Build が自動的にトリガーされる
2. Docker イメージがビルドされる
3. Cloud Run にデプロイされる
4. 環境変数が正しく設定される：
   - `GOOGLE_CLOUD_PROJECT_ID=$PROJECT_ID`（動的設定）
   - `BIGQUERY_DATASET=zzz_taniguchi`
   - BigQuery クエリ文字列

### 確認方法：

デプロイ後、以下のURLにアクセスして確認：

- Top ページ: `https://leadmaster-xxxxx.asia-northeast1.run.app/`
- BigQuery 接続テスト: `https://leadmaster-xxxxx.asia-northeast1.run.app/api/bigquery/test`

正常な場合、TOP ページのステータスバッジに「BigQuery接続成功」と表示されます。

## トラブルシューティング

### 問題1: モックデータが表示される

原因: 環境変数 `GOOGLE_CLOUD_PROJECT_ID` が設定されていない

解決策: Cloud Build ログを確認し、環境変数が正しく設定されているかチェック

### 問題2: BigQuery 接続エラー

原因: Cloud Run サービスアカウントにBigQuery権限がない

解決策: 上記の権限設定コマンドを実行

### 問題3: Cloud Build が失敗する

原因: Cloud Build サービスアカウントに必要な権限がない

解決策: Cloud Build サービスアカウントに `roles/run.admin` と `roles/iam.serviceAccountUser` を付与

## 次回のpush時の動作

現在の設定で GitHub に push すれば：

1. ✅ Cloud Build が自動実行される
2. ✅ BigQuery の環境変数が正しく設定される  
3. ✅ 実際の BigQuery データが表示される

モックデータではなく、実際のBigQueryデータが表示されるはずです。
