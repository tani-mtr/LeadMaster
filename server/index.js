const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const BigQueryService = require('./services/bigQueryService');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// モックデータ（実際の環境では削除してください）
const mockBuildings = [
    {
        id: 1,
        name: 'サンプルビル1',
        address: '東京都新宿区新宿1-1-1',
        buildYear: 2010,
        description: 'サンプルビルの説明文です。',
        updatedAt: '2025-06-25'
    },
    {
        id: 2,
        name: 'サンプルビル2',
        address: '東京都渋谷区渋谷2-2-2',
        buildYear: 2015,
        description: 'サンプルビル2の説明文です。',
        updatedAt: '2025-06-26'
    },
    {
        id: 3,
        name: 'サンプルビル3',
        address: '東京都池袋区池袋3-3-3',
        buildYear: 2020,
        description: 'サンプルビル3の説明文です。',
        updatedAt: '2025-06-24'
    }
];

// BigQueryサービスのインスタンスを作成
const bigQueryService = new BigQueryService();

// アプリケーションの初期化
const app = express();
const PORT = process.env.PORT || 8080;

// 起動情報のログ出力
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`現在の作業ディレクトリ: ${process.cwd()}`);
console.log(`ビルドディレクトリパス: ${path.join(__dirname, '../build')}`);

// ミドルウェアの設定
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
        }
    }
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// API ルート
const apiRouter = express.Router();

// 建物一覧を取得
apiRouter.get('/buildings', async (req, res) => {
    try {
        // BigQueryの設定がある場合はBigQueryから、そうでなければモックデータを返す
        if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
            console.log('BigQueryからデータを取得中...');
            const buildings = await bigQueryService.getBuildings();
            res.json(buildings);
        } else {
            console.log('BigQuery設定がないため、モックデータを返します');
            res.json(mockBuildings);
        }
    } catch (error) {
        console.error('建物一覧取得エラー:', error);
        // エラーが発生した場合はモックデータにフォールバック
        console.log('エラーのためモックデータにフォールバック');
        res.json(mockBuildings);
    }
});

// 建物詳細を取得
apiRouter.get('/buildings/:id', async (req, res) => {
    const id = parseInt(req.params.id);

    try {
        // BigQueryの設定がある場合はBigQueryから、そうでなければモックデータを返す
        if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
            console.log(`BigQueryから建物ID ${id} のデータを取得中...`);
            const building = await bigQueryService.getBuildingById(id);

            if (!building) {
                return res.status(404).json({ error: '建物が見つかりません' });
            }

            res.json(building);
        } else {
            console.log('BigQuery設定がないため、モックデータを返します');
            const building = mockBuildings.find(b => b.id === id);

            if (!building) {
                return res.status(404).json({ error: '建物が見つかりません' });
            }

            res.json(building);
        }
    } catch (error) {
        console.error('建物詳細取得エラー:', error);
        // エラーが発生した場合はモックデータにフォールバック
        console.log('エラーのためモックデータにフォールバック');
        const building = mockBuildings.find(b => b.id === id);

        if (!building) {
            return res.status(404).json({ error: '建物が見つかりません' });
        }

        res.json(building);
    }
});

// 建物情報を更新
apiRouter.put('/buildings/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const buildingIndex = mockBuildings.findIndex(b => b.id === id);

    if (buildingIndex === -1) {
        return res.status(404).json({ error: '建物が見つかりません' });
    }

    // 更新データをマージ
    mockBuildings[buildingIndex] = {
        ...mockBuildings[buildingIndex],
        ...req.body,
        updatedAt: new Date().toISOString().split('T')[0]
    };

    res.json(mockBuildings[buildingIndex]);
});

// BigQuery接続テスト用エンドポイント
apiRouter.get('/bigquery/test', async (req, res) => {
    try {
        // BigQueryの設定がある場合は実際のテストを実行
        if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
            const isConnected = await bigQueryService.testConnection();
            res.json({
                connected: isConnected,
                message: isConnected ? 'BigQuery接続成功' : 'BigQuery接続失敗'
            });
        } else {
            // BigQuery設定がない場合はモックモードとして接続成功を返す
            res.json({
                connected: true,
                message: 'モックモード'
            });
        }
    } catch (error) {
        console.error('BigQuery接続テストエラー:', error);
        res.status(500).json({
            connected: false,
            message: 'BigQuery接続テスト中にエラーが発生しました',
            error: error.message
        });
    }
});

// ボタンクリックのログを記録
apiRouter.post('/log-button-click', (req, res) => {
    console.log('Button click log:', req.body);

    // 実際の実装では、データベースやロギングサービスにログを保存します
    res.json({ success: true });
});

// APIルートを/apiプレフィックスで設定
app.use('/api', apiRouter);

// 本番環境では、Reactのビルドファイルを提供
if (process.env.NODE_ENV === 'production') {
    // 作業ディレクトリとその内容を確認
    const currentDir = process.cwd();
    console.log(`現在の作業ディレクトリ: ${currentDir}`);
    try {
        const dirContents = require('fs').readdirSync(currentDir);
        console.log(`作業ディレクトリの内容: ${dirContents.join(', ')}`);
    } catch (err) {
        console.error(`作業ディレクトリの読み込みエラー: ${err.message}`);
    }

    // ビルドパスを相対パスと絶対パスの両方で試行
    const relativeBuildPath = './build';
    const absoluteBuildPath = path.join(__dirname, '../build');

    // まず相対パスを試す
    let buildPath = relativeBuildPath;
    let buildExists = false;

    try {
        buildExists = require('fs').existsSync(buildPath);
        console.log(`相対パス ${buildPath} の存在: ${buildExists}`);

        if (!buildExists) {
            // 次に絶対パスを試す
            buildPath = absoluteBuildPath;
            buildExists = require('fs').existsSync(buildPath);
            console.log(`絶対パス ${buildPath} の存在: ${buildExists}`);
        }

        if (buildExists) {
            const files = require('fs').readdirSync(buildPath);
            console.log(`ビルドディレクトリ ${buildPath} の内容: ${files.join(', ')}`);
        }
    } catch (err) {
        console.error(`ビルドディレクトリの確認エラー: ${err.message}`);
    }

    // ビルドディレクトリが存在する場合のみ静的ファイルを提供
    if (buildExists) {
        console.log(`静的ファイル配信パスを設定: ${buildPath}`);
        app.use(express.static(buildPath));
    } else {
        console.error('ビルドディレクトリが見つかりません');
    }

    // すべてのルートで index.html を返すように設定
    app.get('*', (req, res) => {
        console.log(`リクエスト受信: ${req.path}`);

        // まず相対パスでindexを探す
        let indexPath = path.join(relativeBuildPath, 'index.html');
        let indexExists = false;

        try {
            indexExists = require('fs').existsSync(indexPath);
            console.log(`相対パスindex ${indexPath} の存在: ${indexExists}`);

            if (!indexExists) {
                // 次に絶対パスを試す
                indexPath = path.join(absoluteBuildPath, 'index.html');
                indexExists = require('fs').existsSync(indexPath);
                console.log(`絶対パスindex ${indexPath} の存在: ${indexExists}`);
            }

            if (indexExists) {
                const indexContent = require('fs').readFileSync(indexPath, 'utf8').substring(0, 100);
                console.log(`index.htmlの内容（先頭100文字）: ${indexContent}`);
                res.sendFile(path.resolve(indexPath));
            } else {
                throw new Error('index.htmlファイルが見つかりません');
            }
        } catch (err) {
            console.error(`index.html読み込みエラー: ${err.message}`);
            res.status(404).send(`index.htmlファイルが見つかりません。ビルド設定を確認してください。エラー: ${err.message}`);
        }
    });
}

// サーバーの起動
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
