# GitHub連携の最終ステップ

以下のコマンドを実行して、リモートリポジトリと連携してください：

```bash
# リモートリポジトリを追加
git remote add origin https://github.com/tani-mtr/LeadMaster.git

# 変更をリモートリポジトリにプッシュ
git push -u origin main
```

## Gitユーザー設定（オプション）

Gitのコミットに表示される名前とメールアドレスを設定するには、以下のコマンドを実行してください：

```bash
git config --global user.name "あなたの名前"
git config --global user.email "あなたのメールアドレス"
```

## 認証について

GitHubへのプッシュ時に認証を求められた場合は、GitHubのユーザー名とパスワード（または個人アクセストークン）を入力してください。

2021年8月以降、GitHubではパスワード認証が廃止され、個人アクセストークンが必要になりました。
アクセストークンの取得は以下の手順で行えます：

1. GitHubにログイン
2. 右上のプロフィールアイコンをクリック → Settings
3. 左サイドバーの最下部付近にある「Developer settings」をクリック
4. 「Personal access tokens」→「Tokens (classic)」をクリック
5. 「Generate new token」→「Generate new token (classic)」をクリック
6. トークン名を入力し、必要な権限（少なくとも「repo」）を選択
7. 「Generate token」をクリック
8. 表示されたトークンをコピー（このページを離れると二度と表示されません）

このトークンをパスワードの代わりに使用してください。
