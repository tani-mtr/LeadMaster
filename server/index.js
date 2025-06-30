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

// 物件データを取得（GASのgetPropertyData関数と同様）
apiRouter.get('/property/:id', async (req, res) => {
    const id = req.params.id;

    // モック物件データ（全カラムを含む）
    const mockPropertyData = {
        id: id,
        name: `物件${id}`,
        tag: `タグ${id}`,
        is_trade: '売買',
        is_lease: '借上',
        lead_from: 'サンプルlead元',
        is_fund: 'ファンド物件',
        lead_channel: 'レインズ',
        trade_form: '専任',
        lead_from_representative: '田中太郎',
        lead_from_representative_phone: '03-1234-5678',
        lead_from_representative_email: 'tanaka@example.com',
        folder: `https://drive.google.com/drive/folders/sample_folder_${id}`,
        serial_number: `SN${id}`,
        note: `物件${id}の備考です`,
        mt_representative: 'MT担当者',
        create_date: '2025-06-30 10:00:00',
        information_acquisition_date: '2025-06-30',
        latest_inventory_confirmation_date: '2025-06-30',
        num_of_occupied_rooms: 5,
        num_of_vacant_rooms: 3,
        num_of_rooms_without_furniture: 2,
        minpaku_feasibility: '可',
        sp_feasibility: '可',
        done_property_viewing: '済',
        torikago: '無',
        key_handling_date: '2025-07-01',
        done_antisocial_check: '済',
        has_related_rooms: true
    };

    try {
        // BigQueryの設定がある場合はBigQueryから取得を試行、そうでなければモックデータを返す
        if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
            console.log(`BigQueryから物件ID ${id} のデータを取得中...`);
            const propertyData = await bigQueryService.getPropertyData(id);

            if (propertyData && propertyData.length > 0) {
                return res.json(propertyData[0]); // BigQueryからデータが取得できた場合
            } else {
                console.log('BigQueryで物件が見つからないため、モックデータを返します');
                return res.json(mockPropertyData);
            }
        } else {
            console.log('BigQuery設定がないため、モックデータを返します');
            return res.json(mockPropertyData);
        }
    } catch (error) {
        console.error('物件データ取得エラー:', error);
        // エラーが発生した場合はモックデータにフォールバック
        console.log('エラーのためモックデータにフォールバック');
        return res.json(mockPropertyData);
    }
});

// 部屋一覧を取得（物件IDごと）
apiRouter.get('/property/:id/rooms', async (req, res) => {
    const id = req.params.id;

    // モック部屋データ（2次元配列形式）
    const mockRoomData = [
        ['進捗', '部屋ID', '部屋名', '部屋タイプ', '操作'],
        ['空室', 'R001', '101号室', '1K', 'false'],
        ['入居中', 'R002', '102号室', '1DK', 'true'],
        ['空室', 'R003', '103号室', '1K', 'false'],
        ['リフォーム中', 'R004', '201号室', '1DK', 'true'],
        ['空室', 'R005', '202号室', '1K', 'false']
    ];

    try {
        // BigQueryの設定がある場合はBigQueryから取得を試行、そうでなければモックデータを返す
        if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
            console.log(`BigQueryから物件ID ${id} の部屋データを取得中...`);
            const roomData = await bigQueryService.getRoomList(id);

            if (roomData && roomData.length > 0) {
                return res.json(roomData); // BigQueryからデータが取得できた場合
            } else {
                console.log('BigQueryで部屋データが見つからないため、モックデータを返します');
                return res.json(mockRoomData);
            }
        } else {
            console.log('BigQuery設定がないため、モックデータを返します');
            return res.json(mockRoomData);
        }
    } catch (error) {
        console.error('部屋データ取得エラー:', error);
        // エラーが発生した場合はモックデータにフォールバック
        console.log('エラーのためモックデータにフォールバック');
        return res.json(mockRoomData);
    }
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
