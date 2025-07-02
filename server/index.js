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

// HTTPヘッダーサイズ制限を増加
app.use((req, res, next) => {
    req.setTimeout(30000); // 30秒のタイムアウト（短縮）
    next();
});

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
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

// 部屋タイプリストを取得（物件IDごと）
apiRouter.get('/property/:id/room-types', async (req, res) => {
    const id = req.params.id;

    // モック部屋タイプデータ
    const mockRoomTypeData = [
        { room_type_id: 'RT001', room_type_name: '1K' },
        { room_type_id: 'RT002', room_type_name: '1DK' },
        { room_type_id: 'RT003', room_type_name: '1LDK' },
        { room_type_id: 'RT004', room_type_name: '2DK' }
    ];

    try {
        // BigQueryの設定がある場合はBigQueryから取得を試行、そうでなければモックデータを返す
        if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
            console.log(`BigQueryから物件ID ${id} の部屋タイプデータを取得中...`);
            const roomTypeData = await bigQueryService.getRoomTypeList(id);

            if (roomTypeData && roomTypeData.length > 0) {
                return res.json(roomTypeData); // BigQueryからデータが取得できた場合
            } else {
                console.log('BigQueryで部屋タイプデータが見つからないため、モックデータを返します');
                return res.json(mockRoomTypeData);
            }
        } else {
            console.log('BigQuery設定がないため、モックデータを返します');
            return res.json(mockRoomTypeData);
        }
    } catch (error) {
        console.error('部屋タイプデータ取得エラー:', error);
        // エラーが発生した場合はモックデータにフォールバック
        console.log('エラーのためモックデータにフォールバック');
        return res.json(mockRoomTypeData);
    }
});

// 部屋データの取得
apiRouter.get('/room/:id', async (req, res) => {
    try {
        const roomId = req.params.id;
        console.log(`部屋データ取得リクエスト: ${roomId}`);

        if (bigQueryService.isConfigured()) {
            // BigQueryから部屋データを取得
            const query = `
                SELECT *
                FROM \`your-project.your-dataset.rooms\`
                WHERE id = @roomId
            `;

            const options = {
                query: query,
                params: { roomId: roomId }
            };

            const [rows] = await bigQueryService.executeQuery(options);

            if (rows.length === 0) {
                return res.status(404).json({ error: '部屋が見つかりません' });
            }

            console.log('BigQueryから部屋データを取得しました');
            return res.json(rows);
        } else {
            // モックデータ
            const mockRoomData = [{
                id: roomId,
                lead_property_id: 1,
                lead_property_name: 'サンプル物件',
                name: `サンプル部屋 ${roomId}`,
                room_number: roomId,
                status: 'A',
                lead_room_type_id: 1,
                lead_room_type_name: 'ワンルーム',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }];

            console.log('BigQuery設定がないため、モックデータを返します');
            return res.json(mockRoomData);
        }
    } catch (error) {
        console.error('部屋データ取得エラー:', error);
        return res.status(500).json({ error: '部屋データの取得に失敗しました' });
    }
});

// 部屋スキーマの取得
apiRouter.get('/room/schema', async (req, res) => {
    try {
        console.log('部屋スキーマ取得リクエスト');

        // モックスキーマデータ
        const mockSchema = {
            id: { type: 'string', japaneseName: 'ID', order: 1, editable: false, isRequired: false },
            lead_property_id: { type: 'numeric', japaneseName: '物件ID', order: 2, editable: false, isRequired: false },
            lead_property_name: { type: 'string', japaneseName: '物件名', order: 3, editable: false, isRequired: false },
            name: { type: 'string', japaneseName: '部屋名', order: 4, editable: true, isRequired: true },
            room_number: { type: 'string', japaneseName: '部屋番号', order: 5, editable: true, isRequired: true },
            status: { type: 'string', japaneseName: 'ステータス', order: 6, editable: true, isRequired: true },
            lead_room_type_name: { type: 'string', japaneseName: '部屋タイプ', order: 7, editable: true, isRequired: false },
            created_at: { type: 'date', japaneseName: '作成日', order: 8, editable: false, isRequired: false },
            updated_at: { type: 'date', japaneseName: '更新日', order: 9, editable: false, isRequired: false }
        };

        console.log('部屋スキーマを返します');
        return res.json(mockSchema);
    } catch (error) {
        console.error('部屋スキーマ取得エラー:', error);
        return res.status(500).json({ error: '部屋スキーマの取得に失敗しました' });
    }
});

// ドロップダウンオプションの取得
apiRouter.get('/dropdown-options/:propertyId', async (req, res) => {
    try {
        const propertyId = req.params.propertyId;
        console.log(`ドロップダウンオプション取得リクエスト: ${propertyId}`);

        // モックドロップダウンオプション
        const mockDropdownOptions = {
            status: ['A', 'B', 'C', 'D', 'E', 'クローズ'],
            lead_room_type_name: [
                '1|ワンルーム',
                '2|1K',
                '3|1DK',
                '4|1LDK',
                '5|2K',
                '6|2DK',
                '7|2LDK'
            ]
        };

        console.log('ドロップダウンオプションを返します');
        return res.json(mockDropdownOptions);
    } catch (error) {
        console.error('ドロップダウンオプション取得エラー:', error);
        return res.status(500).json({ error: 'ドロップダウンオプションの取得に失敗しました' });
    }
});

// 部屋データの更新
apiRouter.put('/room/:id', async (req, res) => {
    try {
        const roomId = req.params.id;
        const updateData = req.body;
        console.log(`部屋データ更新リクエスト: ${roomId}`, updateData);

        if (bigQueryService.isConfigured()) {
            // BigQueryでの更新処理（実装が必要）
            console.log('BigQueryでの部屋データ更新は未実装');
            return res.status(501).json({ error: '部屋データ更新機能は未実装です' });
        } else {
            // モック更新（実際は何もしない）
            console.log('モック環境での部屋データ更新（実際の更新なし）');
            return res.json({ success: true, message: '部屋データが更新されました' });
        }
    } catch (error) {
        console.error('部屋データ更新エラー:', error);
        return res.status(500).json({ error: '部屋データの更新に失敗しました' });
    }
});

// 重複チェック
apiRouter.post('/check-duplication', async (req, res) => {
    try {
        const { type, value } = req.body;
        console.log(`重複チェックリクエスト: ${type} - ${value}`);

        if (bigQueryService.isConfigured()) {
            // BigQueryでの重複チェック（実装が必要）
            console.log('BigQueryでの重複チェックは未実装');
            return res.json([true, []]); // 重複なしとして扱う
        } else {
            // モック重複チェック（常に重複なしとして扱う）
            console.log('モック環境での重複チェック（常に重複なし）');
            return res.json([true, []]);
        }
    } catch (error) {
        console.error('重複チェックエラー:', error);
        return res.status(500).json({ error: '重複チェックに失敗しました' });
    }
});

// デバッグ用エンドポイント
apiRouter.get('/debug/info', (req, res) => {
    const fs = require('fs');
    const buildPath = path.join(__dirname, 'build');

    res.json({
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        workingDirectory: process.cwd(),
        dirname: __dirname,
        buildPath: buildPath,
        buildExists: fs.existsSync(buildPath),
        buildContents: fs.existsSync(buildPath) ? fs.readdirSync(buildPath) : [],
        currentDirContents: fs.readdirSync(__dirname)
    });
});

// BigQuery接続テスト用エンドポイント
apiRouter.get('/test-bigquery', async (req, res) => {
    try {
        const isConnected = await bigQueryService.testConnection();
        res.json({
            success: isConnected,
            message: isConnected ? 'BigQuery接続成功' : 'BigQuery接続失敗',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('BigQuery接続テストエラー:', error);
        res.status(500).json({
            success: false,
            message: 'BigQuery接続テスト中にエラーが発生しました',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// SQLクエリ実行エンドポイント
apiRouter.post('/execute-query', async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'クエリが指定されていません'
            });
        }

        console.log('受信したクエリ:', query);

        const results = await bigQueryService.executeQuery(query);

        res.json({
            success: true,
            data: results,
            message: `${results.length}件のレコードを取得しました`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('クエリ実行エラー:', error);

        res.status(500).json({
            success: false,
            message: 'クエリの実行中にエラーが発生しました',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// APIルーターをマウント
app.use('/api', apiRouter);

// 静的ファイルの配信
if (process.env.NODE_ENV === 'production') {
    // Dockerコンテナ内では build ディレクトリは同階層にある
    const buildPath = path.join(__dirname, 'build');
    console.log(`静的ファイル配信パス: ${buildPath}`);
    console.log(`buildディレクトリの存在確認: ${require('fs').existsSync(buildPath)}`);

    app.use(express.static(buildPath));

    // React アプリケーションのルートを処理
    app.get('*', (req, res) => {
        const indexPath = path.join(buildPath, 'index.html');
        console.log(`index.htmlパス: ${indexPath}`);
        console.log(`index.htmlの存在確認: ${require('fs').existsSync(indexPath)}`);
        res.sendFile(indexPath);
    });
} else {
    // 開発環境では簡単な応答
    app.get('/', (req, res) => {
        res.send('Development server is running! API available at /api/*');
    });
}

// サーバー起動（HTTPヘッダーサイズ制限を設定）
const http = require('http');
const server = http.createServer(app);

// サーバー設定でHTTPヘッダーサイズ制限を増加
server.maxHeadersCount = 0; // ヘッダー数制限を無効化
server.headersTimeout = 300000; // 5分のタイムアウト

server.listen(PORT, () => {
    console.log(`サーバーがポート ${PORT} で起動しました`);
    console.log(`環境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`作業ディレクトリ: ${process.cwd()}`);
    console.log(`__dirname: ${__dirname}`);

    // ディレクトリ構造の確認
    const fs = require('fs');
    console.log('ディレクトリ構造:');
    try {
        console.log('Current directory contents:', fs.readdirSync(__dirname));
        const buildPath = path.join(__dirname, 'build');
        if (fs.existsSync(buildPath)) {
            console.log('Build directory contents:', fs.readdirSync(buildPath));
        } else {
            console.log('Build directory does not exist at:', buildPath);
        }
    } catch (err) {
        console.error('Directory listing error:', err);
    }

    if (process.env.NODE_ENV === 'production') {
        console.log('Production モード: 静的ファイルを配信します');
    } else {
        console.log('Development モード: API のみを提供します');
        console.log('フロントエンドは別途起動してください (npm start)');
    }
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        process.exit(0);
    });
});
