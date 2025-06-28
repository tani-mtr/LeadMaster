# GitHub連携手順

## 1. リポジトリURLの確認

下記のコマンドで、既存のリモートリポジトリURLを指定してください：

```bash
git remote add origin https://github.com/tani-mtr/LeadMaster
```

例：
```bash
git remote add origin https://github.com/yourusername/lead-master-webapp.git
```

または、SSHを使用する場合：
```bash
git remote add origin git@github.com:yourusername/lead-master-webapp.git
```

## 2. 変更をコミットする

```bash
git add .
git commit -m "初期コミット: GASからReactアプリへの変換"
```

## 3. リモートリポジトリにプッシュする

```bash
git push -u origin main
```

## 4. 認証情報の入力

GitHubのユーザー名とパスワード（またはアクセストークン）を入力してください。
※Gitの設定によっては、これらの認証情報を保存できます。

## その他の便利なコマンド

### ステータス確認
```bash
git status
```

### コミット履歴の確認
```bash
git log
```

### ブランチの作成と切り替え
```bash
git checkout -b feature/new-feature
```

### 変更の差分確認
```bash
git diff
```
