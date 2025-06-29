# BigQuery認証設定ガイド

## 方法1: デフォルトのCompute Engine サービスアカウントを使用

Cloud RunのデフォルトサービスアカウントにBigQuery権限を付与する方法：

```bash
# プロジェクトIDを設定
PROJECT_ID=$(gcloud config get-value project)

# デフォルトのCompute Engineサービスアカウントに権限を付与
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$PROJECT_ID-compute@developer.gserviceaccount.com" \
  --role="roles/bigquery.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$PROJECT_ID-compute@developer.gserviceaccount.com" \
  --role="roles/bigquery.dataViewer"
```

## 方法2: 専用のサービスアカウントを作成・使用

新しいサービスアカウントを作成してCloud Runで使用する方法：

```bash
# プロジェクトIDを設定
PROJECT_ID=$(gcloud config get-value project)

# サービスアカウントを作成
gcloud iam service-accounts create leadmaster-bigquery \
  --display-name="LeadMaster BigQuery Service Account"

# BigQuery権限を付与
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:leadmaster-bigquery@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/bigquery.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:leadmaster-bigquery@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/bigquery.dataViewer"

# Cloud Runサービスでこのサービスアカウントを使用
gcloud run services update leadmaster \
  --region=asia-northeast1 \
  --service-account=leadmaster-bigquery@$PROJECT_ID.iam.gserviceaccount.com
```

## 確認方法

デプロイ後、以下のURLでBigQuery接続をテストできます：
https://your-service-url/api/bigquery/test

正常に接続されている場合、以下のようなレスポンスが返されます：
```json
{
  "connected": true,
  "message": "BigQuery接続成功"
}
```
