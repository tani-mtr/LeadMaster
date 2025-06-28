# ローカルテストの手順

## 1. 必要な環境

- Node.js (v14以上)
- npm (v6以上)

## 2. インストールと起動

### 自動起動スクリプトを使う場合（推奨）

```bash
# プロジェクトのルートディレクトリに移動
cd /Users/taniharu/MT/react-app

# 起動スクリプトを実行
./start-dev.sh
```

### 手動で起動する場合

#### フロントエンドの起動

```bash
# プロジェクトのルートディレクトリに移動
cd /Users/taniharu/MT/react-app

# 依存関係のインストール（初回のみ）
npm install

# 開発サーバーの起動
npm start
```

#### バックエンドの起動（別のターミナルで）

```bash
# バックエンドディレクトリに移動
cd /Users/taniharu/MT/react-app/server

# 依存関係のインストール（初回のみ）
npm install

# 開発サーバーの起動
npm run dev
```

## 3. アクセス方法

- フロントエンド: [http://localhost:3000](http://localhost:3000)
- バックエンドAPI: [http://localhost:8080/api](http://localhost:8080/api)

## 4. 主要なエンドポイント

- `GET /api/buildings` - 建物一覧の取得
- `GET /api/buildings/:id` - 建物詳細の取得
- `PUT /api/buildings/:id` - 建物情報の更新
- `POST /api/log-button-click` - ボタンクリックのログ記録

## 5. トラブルシューティング

### APIにアクセスできない場合

1. バックエンドサーバーが起動しているか確認
2. プロキシ設定（package.jsonの"proxy"）が正しく設定されているか確認
3. .envファイルにREACT_APP_API_URLが正しく設定されているか確認

### モジュールが見つからないエラー

```bash
# プロジェクトのルートで実行
npm install

# サーバーディレクトリで実行
cd server
npm install
```

### ポートが使用中の場合

バックエンドサーバーのポート（8080）が使用中の場合は、`.env`ファイルでPORT値を変更し、package.jsonのproxyも変更してください。
