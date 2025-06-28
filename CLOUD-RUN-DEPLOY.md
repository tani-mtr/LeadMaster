# Cloud Runデプロイ手順

以下の手順でアプリケーションを再デプロイしてください。これらの修正でindex.htmlファイルが見つからない問題が解決するはずです。

## 1. ローカルでのビルド確認 (オプション)

Dockerがインストールされている場合、以下のコマンドでローカルビルドの確認ができます:

```bash
# ビルドと検証
./verify-build.sh

# または個別のコマンド
npm run build
npm run docker:build
npm run docker:run
```

## 2. Google Cloud にデプロイ

以下のコマンドを実行して、アプリケーションをCloud Runにデプロイします:

```bash
# デプロイスクリプトを実行
./cloud-run-deploy.sh
```

このスクリプトは以下の操作を行います:
- Dockerイメージのビルド
- Google Container Registryへのプッシュ
- Cloud Runへのデプロイ（asia-northeast1リージョン、leadmasterサービス名）

## 3. デプロイ後の確認

デプロイ後、以下のようなURLでアプリケーションにアクセスできます:
https://leadmaster-[PROJECT_ID_HASH].asia-northeast1.run.app/

## 主な修正点

今回の修正で対応した内容:

1. Dockerfileの改善:
   - ビルドステージで全ファイルをコピー（サブディレクトリ関連の問題対応）
   - ビルド成果物の検証を強化（index.htmlの存在確認を含む）
   - より詳細なログ出力

2. サーバー側の改善:
   - 複数のパス（相対パスと絶対パス）でのファイル探索
   - より詳細なエラーログとファイル検証
   - ファイル内容の確認ログ

3. ビルドプロセスの改善:
   - package.jsonのbuildスクリプトにビルド結果確認を追加

これらの修正により、index.htmlファイルが正しく生成され、サーバーから提供されるようになります。
