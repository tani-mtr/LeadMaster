# LeadMaster

GASで作成されたウェブアプリをReactとCloud Runに移行したアプリケーションです。

## 機能

- 建物リストの表示と編集
- 建物詳細情報の閲覧と編集
- 物件管理（部屋情報の一覧・編集）
- 部屋詳細情報の閲覧と編集
- Slackを通じた問い合わせ機能
- モダンなUIとユーザー体験

## 技術スタック

- フロントエンド
  - React 18
  - React Router
  - Styled Components
  - Handsontable
  - Font Awesome
  - SweetAlert2
  - axios

- バックエンド
  - Node.js
  - Express
  - Cloud Run (Google Cloud Platform)

## 開発環境のセットアップ

### 前提条件

- Node.js 14.x以上
- npm 6.x以上
- Git

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/your-username/lead-master-webapp.git
cd lead-master-webapp

# 依存関係のインストール
npm install

# サーバー側の依存関係をインストール
cd server
npm install
cd ..

# 環境変数ファイルの作成
cp .env.example .env

# 必要に応じて.envファイルを編集
# BigQueryを使用する場合は、以下の変数を設定してください:
# GOOGLE_CLOUD_PROJECT_ID, BIGQUERY_DATASET, BIGQUERY_TABLE
```

## BigQueryとの連携

このアプリケーションはBigQueryからのデータ取得をサポートしています。

### BigQuery設定

1. `.env`ファイルに以下の環境変数を設定：

```bash
GOOGLE_CLOUD_PROJECT_ID=your-project-id
BIGQUERY_DATASET=your_dataset_name
BIGQUERY_TABLE=your_table_name
BIGQUERY_LOCATION=US
```

2. カスタムSQLクエリの設定（オプション）：

```bash
# 建物一覧取得用のカスタムクエリ
BIGQUERY_BUILDINGS_QUERY=SELECT id, name, address, build_year, description, updated_at FROM `project.dataset.table` WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT 1000

# 建物詳細取得用のカスタムクエリ
BIGQUERY_BUILDING_DETAIL_QUERY=SELECT id, name, address, build_year, description, updated_at FROM `project.dataset.table` WHERE id = @id AND deleted_at IS NULL LIMIT 1
```

3. Google Cloud認証の設定：

**Cloud Run環境:**
- Cloud Runサービスにサービスアカウントが設定されている場合、自動的に認証されます
- 追加の環境変数設定は不要です

**ローカル開発環境:**
```bash
# 方法1: サービスアカウントキーを使用する場合
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# 方法2: gcloud CLIでログインしている場合は自動で認証されます
gcloud auth application-default login
```

4. BigQueryテーブルの想定スキーマ：

```sql
CREATE TABLE `your_project.your_dataset.your_table` (
  id INT64,
  name STRING,
  address STRING,
  build_year INT64,
  description STRING,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP
);
```

### BigQuery接続のテスト

アプリケーションの建物リストページで、右上にBigQuery接続状態が表示されます。
また、`/api/bigquery/test`エンドポイントで接続テストが可能です。

注意：BigQuery設定がない場合、自動的にモックデータが使用されます。

## API仕様

### 建物関連
- `GET /api/buildings` - 建物一覧の取得
- `GET /api/buildings/:id` - 建物詳細の取得
- `PUT /api/buildings/:id` - 建物情報の更新

### 物件関連
- `GET /api/property/:id` - 物件詳細の取得
- `GET /api/property/:id/rooms` - 物件の部屋一覧の取得
- `GET /api/property/:id/room-types` - 物件の部屋タイプ一覧の取得

### 部屋関連
- `GET /api/room/:id` - 部屋詳細の取得
- `GET /api/room/schema` - 部屋スキーマの取得
- `PUT /api/room/:id` - 部屋情報の更新
- `GET /api/dropdown-options/:propertyId` - ドロップダウンオプションの取得
- `POST /api/check-duplication` - 重複チェック

### 開発サーバーの起動

```bash
# フロントエンドの開発サーバーを起動
npm start

# 別のターミナルでバックエンドサーバーを起動
cd server
npm run dev
```

## ビルドと実行

```bash
# フロントエンドのビルド
npm run build

# Docker イメージのビルドと実行
npm run docker:build
npm run docker:run
```

## Cloud Runへのデプロイ

```bash
# デプロイスクリプトを使用する場合（推奨）
./cloud-run-deploy.sh

# または手動でデプロイする場合
# イメージをビルド
docker build -t gcr.io/[PROJECT_ID]/leadmaster .

# Google Container Registryにプッシュ
docker push gcr.io/[PROJECT_ID]/leadmaster

# Cloud Runにデプロイ
gcloud run deploy leadmaster \
  --image gcr.io/[PROJECT_ID]/leadmaster \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --port=8080 \
  --cpu=1 \
  --memory=512Mi
```

## ディレクトリ構造

```
lead-master-webapp/
├── public/            # 静的ファイル
├── src/
│   ├── components/    # 再利用可能なコンポーネント
│   ├── pages/         # ページコンポーネント
│   ├── hooks/         # カスタムフック
│   ├── services/      # APIサービス
│   ├── styles/        # グローバルスタイル
│   ├── utils/         # ユーティリティ関数
│   ├── App.js         # アプリケーションのルート
│   └── index.js       # エントリーポイント
├── server/            # バックエンドサーバー
└── Dockerfile         # Dockerファイル
```

## ライセンス

© 2025 Your Company. All Rights Reserved.
