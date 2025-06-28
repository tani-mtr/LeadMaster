# LeadMaster

GASで作成されたウェブアプリをReactとCloud Runに移行したアプリケーションです。

## 機能

- 建物リストの表示と編集
- 建物詳細情報の閲覧と編集
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
```

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
>>>>>>> 0008655 (初期コミット: GASからReactアプリへの変換)
