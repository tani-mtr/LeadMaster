# ビルドステージ: Reactアプリをビルド
FROM node:20-alpine as build

WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm ci

# アプリケーションのソースコードをコピー
COPY . .

# Reactアプリをビルド
RUN npm run build
RUN ls -la build/ && \
    cat build/index.html | head -n 10 && \
    echo "Build completed successfully"

# 実行ステージ: Expressサーバーでビルドされたアプリを配信
FROM node:20-alpine

WORKDIR /app

# サーバーの依存関係をインストール
COPY server/package*.json ./
RUN npm ci --production

# サーバーのソースコードをコピー
COPY server/ ./

# ビルドステージからReactのビルド成果物をコピー
COPY --from=build /app/build ./build

# ビルド成果物の確認と問題のある場合の失敗
RUN ls -la ./ && \
    ls -la ./build && \
    if [ ! -f ./build/index.html ]; then \
        echo "Error: index.html not found in build directory" && \
        exit 1; \
    else \
        echo "Build files successfully copied" && \
        cat ./build/index.html | head -n 5; \
    fi

# 環境変数の設定
ENV NODE_ENV=production
ENV PORT=8080

# ヘルスチェックのためのEXPOSE
EXPOSE 8080

# サーバーの健全性確認のために起動時に追加のログを出力
CMD ["sh", "-c", "echo 'Starting server...' && node index.js"]
