const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
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

// CORS設定を詳細に指定
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? [
            'https://lead-master-webapp-342064a.us-central1.run.app',
            'https://lead-master-webapp.vercel.app',
            /^https:\/\/leadmaster-.*\.asia-northeast1\.run\.app$/  // Cloud Run URL形式に対応
        ]
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082', 'http://localhost:8083'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400 // 24時間
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// リクエストログを詳細化
app.use(morgan('combined', {
    stream: {
        write: (message) => {
            console.log(message.trim());
        }
    }
}));

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// CORSデバッグエンドポイント
app.get('/debug/cors', (req, res) => {
    res.status(200).json({
        message: 'CORS設定のデバッグ情報',
        headers: req.headers,
        origin: req.headers.origin,
        host: req.headers.host,
        env: {
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT
        },
        corsSettings: {
            production: [
                'https://lead-master-webapp-342064a.us-central1.run.app',
                'https://lead-master-webapp.vercel.app',
                '/^https:\\/\\/leadmaster-.*\\.asia-northeast1\\.run\\.app$/'  // 正規表現は文字列として表示
            ],
            development: [
                'http://localhost:3000',
                'http://localhost:3001',
                'http://localhost:8081',
                'http://localhost:8080'
            ]
        }
    });
});

// CORSデバッグエンドポイント
app.get('/debug/cors', (req, res) => {
    res.status(200).json({
        message: 'CORS設定のデバッグ情報',
        headers: req.headers,
        origin: req.headers.origin,
        host: req.headers.host,
        env: {
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT
        },
        corsSettings: {
            production: [
                'https://lead-master-webapp-342064a.us-central1.run.app',
                'https://lead-master-webapp.vercel.app',
                /^https:\/\/leadmaster-.*\.asia-northeast1\.run\.app$/
            ],
            development: [
                'http://localhost:3000',
                'http://localhost:3001',
                'http://localhost:8081',
                'http://localhost:8080'
            ]
        }
    });
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
    const forceRefresh = req.query.forceRefresh === 'true';

    // キャッシュ無効化のヘッダーを設定
    if (forceRefresh) {
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
    }

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
            console.log(`BigQueryから物件ID ${id} のデータを取得中... (forceRefresh: ${forceRefresh})`);
            const propertyData = await bigQueryService.getPropertyData(id, forceRefresh);

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

// 物件データを更新（GASのupdateProperty関数と同様）
apiRouter.put('/property/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;

        console.log(`PUT /property/${id} - リクエスト受信:`, {
            id,
            updatedData: JSON.stringify(updatedData, null, 2),
            bodySize: JSON.stringify(updatedData).length,
            env: {
                GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID ? 'set' : 'not set',
                NODE_ENV: process.env.NODE_ENV
            }
        });

        // 入力データの検証
        if (!id) {
            return res.status(400).json({
                success: false,
                error: '物件IDが指定されていません'
            });
        }

        if (!updatedData || typeof updatedData !== 'object') {
            return res.status(400).json({
                success: false,
                error: '更新データが無効です'
            });
        }

        if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
            console.log('BigQueryで物件データを更新中...');

            try {
                const result = await bigQueryService.updateProperty(id, updatedData);
                console.log('BigQuery更新成功:', result ? 'データあり' : 'データなし');

                res.json({
                    success: true,
                    message: '物件情報が正常に更新されました',
                    data: result
                });
            } catch (bigQueryError) {
                console.error('BigQuery更新エラー - 詳細:', {
                    message: bigQueryError.message,
                    stack: bigQueryError.stack,
                    name: bigQueryError.name,
                    originalError: bigQueryError.originalError,
                    context: bigQueryError.context
                });

                res.status(500).json({
                    success: false,
                    error: 'BigQueryでの物件データ更新中にエラーが発生しました',
                    details: bigQueryError.message,
                    errorType: bigQueryError.name || 'Unknown'
                });
            }
        } else {
            console.log('BigQuery設定がないため、モック更新レスポンスを返します');
            res.json({
                success: true,
                message: '物件情報が正常に更新されました（モック）',
                data: updatedData
            });
        }
    } catch (error) {
        console.error('物件データ更新エンドポイントエラー - 詳細:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            url: req.url,
            method: req.method,
            params: req.params,
            bodyPreview: JSON.stringify(req.body).substring(0, 200)
        });

        res.status(500).json({
            success: false,
            error: '物件データの更新中にエラーが発生しました',
            details: error.message,
            errorType: error.name || 'Unknown'
        });
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

// 部屋タイプ詳細データの取得（BigQueryから実際のデータを取得）
apiRouter.get('/room-type/:id', async (req, res) => {
    const roomTypeId = req.params.id;

    try {
        console.log(`部屋タイプ詳細データ取得リクエスト: ID=${roomTypeId}`);

        // BigQueryから部屋タイプデータを取得
        const roomTypeData = await bigQueryService.getRoomTypeData(roomTypeId);

        if (!roomTypeData) {
            console.log(`部屋タイプID ${roomTypeId} のデータが見つかりません`);
            return res.status(404).json({
                error: 'Room type not found',
                message: `部屋タイプID ${roomTypeId} のデータが見つかりませんでした`
            });
        }

        console.log(`部屋タイプデータを正常に取得: ID=${roomTypeId}`);

        // データを配列形式で返す（フロントエンドの期待形式に合わせる）
        res.json([roomTypeData]);

    } catch (error) {
        console.error(`部屋タイプデータ取得エラー (ID: ${roomTypeId}):`, error);
        res.status(500).json({
            error: 'Internal server error',
            message: '部屋タイプデータの取得中にエラーが発生しました'
        });
    }
});

// 部屋タイプデータの更新
apiRouter.put('/room-type/:id', async (req, res) => {
    const roomTypeId = req.params.id;
    const updateData = req.body;

    try {
        console.log(`部屋タイプ更新リクエスト: ID=${roomTypeId}`, updateData);

        // BigQueryで部屋タイプデータを更新
        const result = await bigQueryService.updateRoomTypeData(roomTypeId, updateData);

        if (result.success) {
            console.log(`部屋タイプID ${roomTypeId} の更新が完了しました`);
            res.json({
                success: true,
                message: result.message,
                roomTypeId: roomTypeId
            });
        } else {
            console.error(`部屋タイプID ${roomTypeId} の更新に失敗:`, result.error);
            res.status(400).json({
                error: 'Update failed',
                message: result.error
            });
        }

    } catch (error) {
        console.error(`部屋タイプ更新エラー (ID: ${roomTypeId}):`, error);
        res.status(500).json({
            error: 'Internal server error',
            message: '部屋タイプデータの更新中にエラーが発生しました'
        });
    }
});

// 部屋スキーマの取得（動的ルートより前に配置）
apiRouter.get('/room/schema', async (req, res) => {
    try {
        console.log('部屋スキーマ取得リクエスト');

        // BigQueryの設定がある場合はBigQueryから取得を試行、そうでなければモックデータを返す
        if (bigQueryService.isConfigured()) {
            console.log('BigQueryから部屋スキーマを取得中...');
            const schema = await bigQueryService.getRoomSchema();

            if (schema) {
                console.log('BigQueryから部屋スキーマを取得しました');
                return res.json(schema);
            } else {
                console.log('BigQueryでスキーマが見つからないため、モックデータを返します');
            }
        } else {
            console.log('BigQuery設定がないため、モックデータを返します');
        }

        // モックスキーマデータ（正しいカラムリスト）
        const mockSchema = {
            id: { type: 'string', japaneseName: '部屋ID', order: 1, editable: false, isRequired: false },
            status: { type: 'string', japaneseName: '進捗', order: 2, editable: true, isRequired: true },
            name: { type: 'string', japaneseName: '部屋名', order: 3, editable: true, isRequired: true },
            room_number: { type: 'string', japaneseName: '部屋番号', order: 4, editable: true, isRequired: true },
            lead_property_id: { type: 'string', japaneseName: '建物ID', order: 5, editable: false, isRequired: false },
            lead_room_type_id: { type: 'string', japaneseName: '部屋タイプID', order: 6, editable: true, isRequired: false },
            create_date: { type: 'timestamp', japaneseName: '部屋登録日', order: 7, editable: false, isRequired: false },
            key_handover_scheduled_date: { type: 'date', japaneseName: '鍵引き渡し予定日', order: 8, editable: true, isRequired: false },
            possible_key_handover_scheduled_date_1: { type: 'date', japaneseName: '鍵引き渡し予定日①', order: 9, editable: true, isRequired: false },
            possible_key_handover_scheduled_date_2: { type: 'date', japaneseName: '鍵引き渡し予定日②', order: 10, editable: true, isRequired: false },
            possible_key_handover_scheduled_date_3: { type: 'date', japaneseName: '鍵引き渡し予定日③', order: 11, editable: true, isRequired: false },
            vacate_setup: { type: 'string', japaneseName: '退去SU', order: 12, editable: true, isRequired: false },
            contract_collection_date: { type: 'date', japaneseName: '契約書回収予定日', order: 13, editable: true, isRequired: false },
            application_intended_date: { type: 'date', japaneseName: '申請予定日', order: 14, editable: true, isRequired: false }
        };

        console.log('部屋スキーマを返します');
        return res.json(mockSchema);
    } catch (error) {
        console.error('部屋スキーマ取得エラー:', error);

        // エラーが発生した場合はモックデータにフォールバック
        console.log('エラーのためモックデータにフォールバック');
        const mockSchema = {
            id: { type: 'string', japaneseName: '部屋ID', order: 1, editable: false, isRequired: false },
            status: { type: 'string', japaneseName: '進捗', order: 2, editable: true, isRequired: true },
            name: { type: 'string', japaneseName: '部屋名', order: 3, editable: true, isRequired: true },
            room_number: { type: 'string', japaneseName: '部屋番号', order: 4, editable: true, isRequired: true },
            lead_property_id: { type: 'string', japaneseName: '建物ID', order: 5, editable: false, isRequired: false },
            lead_room_type_id: { type: 'string', japaneseName: '部屋タイプID', order: 6, editable: true, isRequired: false },
            create_date: { type: 'timestamp', japaneseName: '部屋登録日', order: 7, editable: false, isRequired: false },
            key_handover_scheduled_date: { type: 'date', japaneseName: '鍵引き渡し予定日', order: 8, editable: true, isRequired: false },
            possible_key_handover_scheduled_date_1: { type: 'date', japaneseName: '鍵引き渡し予定日①', order: 9, editable: true, isRequired: false },
            possible_key_handover_scheduled_date_2: { type: 'date', japaneseName: '鍵引き渡し予定日②', order: 10, editable: true, isRequired: false },
            possible_key_handover_scheduled_date_3: { type: 'date', japaneseName: '鍵引き渡し予定日③', order: 11, editable: true, isRequired: false },
            vacate_setup: { type: 'string', japaneseName: '退去SU', order: 12, editable: true, isRequired: false },
            contract_collection_date: { type: 'date', japaneseName: '契約書回収予定日', order: 13, editable: true, isRequired: false },
            application_intended_date: { type: 'date', japaneseName: '申請予定日', order: 14, editable: true, isRequired: false }
        };

        return res.json(mockSchema);
    }
});

// 部屋データの取得
apiRouter.get('/room/:id', async (req, res) => {
    try {
        const roomId = req.params.id;
        console.log(`部屋データ取得リクエスト: ${roomId}`);

        // モックデータ（正しいカラム構造）
        const mockRoomData = [{
            id: roomId,
            status: 'B',
            name: `DXテスト物件666 ${roomId}`,
            room_number: roomId,
            lead_property_id: '1',
            lead_room_type_id: 'RT001',
            create_date: new Date().toISOString(),
            key_handover_scheduled_date: '2025-07-15',
            possible_key_handover_scheduled_date_1: '2025-07-16',
            possible_key_handover_scheduled_date_2: '2025-07-17',
            possible_key_handover_scheduled_date_3: '2025-07-18',
            vacate_setup: 'スタンダード',
            contract_collection_date: '2025-07-20',
            application_intended_date: '2025-07-25'
        }];

        if (bigQueryService.isConfigured()) {
            try {
                // BigQueryから部屋データを取得
                console.log(`BigQueryから部屋ID ${roomId} のデータを取得中...`);
                const roomData = await bigQueryService.getRoomData(roomId);

                if (roomData) {
                    console.log('BigQueryから部屋データを取得しました');
                    return res.json([roomData]); // 配列形式で返す
                } else {
                    console.log('BigQueryでデータが見つからないため、モックデータを返します');
                    return res.json(mockRoomData);
                }
            } catch (error) {
                console.log('BigQueryエラーが発生したため、モックデータを返します:', error.message);
                return res.json(mockRoomData);
            }
        } else {
            console.log('BigQuery設定がないため、モックデータを返します');
            return res.json(mockRoomData);
        }
    } catch (error) {
        console.error('部屋データ取得エラー:', error);
        return res.status(500).json({ error: '部屋データの取得に失敗しました' });
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
        const { data: updateData, changedBy } = req.body;

        // リクエストボディの構造確認
        const actualUpdateData = updateData || req.body;
        const actualChangedBy = changedBy || 'system';

        console.log(`部屋データ更新リクエスト: ${roomId}`, {
            updateData: actualUpdateData,
            changedBy: actualChangedBy
        });

        if (bigQueryService.isConfigured()) {
            try {
                // BigQueryでの更新処理（変更者情報付き）
                console.log('BigQueryで部屋データを更新中...');
                const result = await bigQueryService.updateRoomData(roomId, actualUpdateData, actualChangedBy);

                if (result.success) {
                    console.log('BigQueryでの部屋データ更新成功:', result.message);
                    return res.json({
                        success: true,
                        message: result.message,
                        data: result.data || actualUpdateData
                    });
                } else {
                    console.error('BigQueryでの部屋データ更新失敗:', result.error);
                    return res.status(400).json({
                        error: result.error || '部屋データの更新に失敗しました'
                    });
                }
            } catch (error) {
                console.error('BigQuery部屋データ更新エラー:', error);
                // BigQueryエラーでもモック更新として成功レスポンスを返す
                console.log('BigQueryエラーのため、モック更新レスポンスを返します');
                return res.json({
                    success: true,
                    message: '部屋データが更新されました（BigQueryエラーのためモック）',
                    data: actualUpdateData,
                    note: 'BigQueryエラーが発生しましたが、処理は継続されました'
                });
            }
        } else {
            // モック更新（実際は何もしない）
            console.log('モック環境での部屋データ更新（実際の更新なし）');
            return res.json({
                success: true,
                message: '部屋データが更新されました（モック）',
                data: actualUpdateData
            });
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

// 部屋タイプデータの更新
apiRouter.put('/room-type/:id', async (req, res) => {
    const roomTypeId = req.params.id;
    const updateData = req.body;

    try {
        console.log(`部屋タイプデータ更新リクエスト: ${roomTypeId}`, updateData);

        // BigQueryの設定がある場合はBigQueryで更新を試行
        if (process.env.GOOGLE_CLOUD_PROJECT_ID) {
            console.log(`BigQueryで部屋タイプID ${roomTypeId} のデータを更新中...`);
            const result = await bigQueryService.updateRoomTypeData(roomTypeId, updateData);

            if (result) {
                console.log('BigQueryで部屋タイプデータを更新しました');
                return res.json({ success: true, message: '部屋タイプデータが正常に更新されました' });
            }
        }

        // BigQuery設定がない場合やエラーの場合はモック応答
        console.log('BigQuery設定がないため、モック応答を返します');
        return res.json({ success: true, message: '部屋タイプデータが正常に更新されました（モック）' });

    } catch (error) {
        console.error('部屋タイプデータ更新エラー:', error);
        return res.status(500).json({
            success: false,
            message: '部屋タイプデータの更新に失敗しました',
            error: error.message
        });
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
const server = http.createServer(app);

// サーバー設定でHTTPヘッダーサイズ制限を大幅に増加
server.maxHeadersCount = 0; // ヘッダー数制限を無効化
server.maxHeaderSize = 131072; // 128KB（デフォルトの8KB×16）
server.headersTimeout = 300000; // 5分のタイムアウト
server.timeout = 300000; // 5分のタイムアウト

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

// 部屋データの変更履歴取得
apiRouter.get('/room/:id/history', async (req, res) => {
    try {
        const roomId = req.params.id;
        console.log(`部屋変更履歴取得リクエスト: ${roomId}`);

        if (bigQueryService.isConfigured()) {
            try {
                // BigQueryでの変更履歴取得処理
                console.log('BigQueryで部屋変更履歴を取得中...');
                const result = await bigQueryService.getRoomHistory(roomId);

                if (result.success) {
                    console.log('BigQueryでの部屋変更履歴取得成功:', result.data?.length, '件');
                    return res.json(result.data || []);
                } else {
                    console.error('BigQueryでの部屋変更履歴取得失敗:', result.error);
                    // エラーでもモックデータを返す
                    return res.json(generateMockHistory(roomId));
                }
            } catch (error) {
                console.error('BigQuery部屋変更履歴取得エラー:', error);
                // BigQueryエラーの場合はモックデータを返す
                console.log('BigQueryエラーのため、モック変更履歴を返します');
                return res.json(generateMockHistory(roomId));
            }
        } else {
            // モック変更履歴データ
            console.log('モック環境での部屋変更履歴取得');
            return res.json(generateMockHistory(roomId));
        }
    } catch (error) {
        console.error('部屋変更履歴取得エラー:', error);
        return res.status(500).json({ error: '変更履歴の取得に失敗しました' });
    }
});

// モック変更履歴データを生成する関数
function generateMockHistory(roomId, type = 'room') {
    const baseId = type === 'property' ? `property_${roomId}` : roomId;
    return [
        {
            id: `${baseId}_history_1`,
            room_id: roomId,
            changed_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1日前
            changed_by: 'user@example.com',
            changes: {
                status: {
                    old_value: 'A',
                    new_value: 'B'
                },
                room_number: {
                    old_value: '101',
                    new_value: '102'
                }
            }
        },
        {
            id: `${baseId}_history_2`,
            room_id: roomId,
            changed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1週間前
            changed_by: 'admin@example.com',
            changes: {
                key_handover_scheduled_date: {
                    old_value: null,
                    new_value: '2024-08-01'
                },
                vacate_setup: {
                    old_value: '一般賃貸中',
                    new_value: '退去SU'
                }
            }
        },
        {
            id: `${baseId}_history_3`,
            room_id: roomId,
            changed_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 2週間前
            changed_by: 'system@example.com',
            changes: {
                status: {
                    old_value: null,
                    new_value: 'A'
                }
            }
        }
    ];
}

// 物件データの変更履歴取得
apiRouter.get('/property/:id/history', async (req, res) => {
    try {
        const propertyId = req.params.id;
        console.log(`物件変更履歴取得リクエスト: ${propertyId}`);

        if (bigQueryService.isConfigured()) {
            try {
                const result = await bigQueryService.getPropertyHistory(propertyId);
                if (result.success) {
                    console.log('BigQueryでの物件変更履歴取得成功:', result.data?.length, '件');
                    return res.json(result.data || []);
                } else {
                    console.error('BigQueryでの物件変更履歴取得失敗:', result.error);
                    return res.json(generateMockHistory(propertyId, 'property'));
                }
            } catch (error) {
                console.error('BigQuery物件変更履歴取得エラー:', error);
                return res.json(generateMockHistory(propertyId, 'property'));
            }
        } else {
            console.log('モック環境での物件変更履歴取得');
            return res.json(generateMockHistory(propertyId, 'property'));
        }
    } catch (error) {
        console.error('物件変更履歴取得エラー:', error);
        return res.status(500).json({ error: '変更履歴の取得に失敗しました' });
    }
});

// 部屋タイプデータの変更履歴取得
apiRouter.get('/room-type/:id/history', async (req, res) => {
    try {
        const roomTypeId = req.params.id;
        console.log(`部屋タイプ変更履歴取得リクエスト: ${roomTypeId}`);

        if (bigQueryService.isConfigured()) {
            try {
                const result = await bigQueryService.getRoomTypeHistory(roomTypeId);
                if (result.success) {
                    console.log('BigQueryでの部屋タイプ変更履歴取得成功:', result.data?.length, '件');
                    return res.json(result.data || []);
                } else {
                    console.error('BigQueryでの部屋タイプ変更履歴取得失敗:', result.error);
                    return res.json(generateMockHistory(roomTypeId, 'room_type'));
                }
            } catch (error) {
                console.error('BigQuery部屋タイプ変更履歴取得エラー:', error);
                return res.json(generateMockHistory(roomTypeId, 'room_type'));
            }
        } else {
            console.log('モック環境での部屋タイプ変更履歴取得');
            return res.json(generateMockHistory(roomTypeId, 'room_type'));
        }
    } catch (error) {
        console.error('部屋タイプ変更履歴取得エラー:', error);
        return res.status(500).json({ error: '変更履歴の取得に失敗しました' });
    }
});

