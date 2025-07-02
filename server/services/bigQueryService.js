const { BigQuery } = require('@google-cloud/bigquery');

// シンプルなメモリキャッシュ
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5分

// キャッシュヘルパー関数
const getCacheKey = (query, params = {}) => {
    return `${query}_${JSON.stringify(params)}`;
};

const isValidCache = (cacheEntry) => {
    return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
};

const setCache = (key, data) => {
    cache.set(key, {
        data,
        timestamp: Date.now()
    });
};

const getCache = (key) => {
    const cacheEntry = cache.get(key);
    if (isValidCache(cacheEntry)) {
        return cacheEntry.data;
    }
    cache.delete(key);
    return null;
};

class BigQueryService {
    constructor() {
        // BigQueryクライアントを初期化
        // Cloud Runではサービスアカウント認証が自動で適用されます
        // ローカル開発では GOOGLE_APPLICATION_CREDENTIALS 環境変数でサービスアカウントキーを指定可能
        const config = {
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        };

        // ローカル開発環境でのみサービスアカウントキーファイルを使用
        if (process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.NODE_ENV !== 'production') {
            config.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        }

        this.bigquery = new BigQuery(config);
    }

    /**
     * カスタムSQLクエリを実行
     * @param {string} query - 実行するSQLクエリ
     * @param {Object} params - クエリパラメータ（オプション）
     * @param {boolean} useCache - キャッシュを使用するかどうか（デフォルト: true）
     * @returns {Promise<Array>} クエリ結果の配列
     */
    async executeQuery(query, params = {}, useCache = true) {
        try {
            // 必要な環境変数がない場合はエラーを投げる
            if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
                throw new Error('BigQuery設定が不完全です: GOOGLE_CLOUD_PROJECT_ID が設定されていません');
            }

            // キャッシュチェック
            if (useCache) {
                const cacheKey = getCacheKey(query, params);
                const cachedResult = getCache(cacheKey);
                if (cachedResult) {
                    console.log('BigQuery キャッシュからデータを取得:', cacheKey.substring(0, 50) + '...');
                    return cachedResult;
                }
            }

            console.log('BigQuery カスタムクエリを実行中:', query.substring(0, 100) + '...');
            console.log('パラメータ:', params);

            const options = {
                query: query,
                params: params,
                location: process.env.BIGQUERY_LOCATION || 'US',
                timeoutMs: 30000, // 30秒のタイムアウト
                maxResults: 1000, // 結果の上限設定
            };

            // クエリを実行
            const [job] = await this.bigquery.createQueryJob(options);
            console.log(`Job ${job.id} が開始されました。`);

            // 結果を待機
            const [rows] = await job.getQueryResults();

            console.log(`${rows.length} 件のレコードを取得しました。`);

            // キャッシュに保存
            if (useCache) {
                const cacheKey = getCacheKey(query, params);
                setCache(cacheKey, rows);
            }

            return rows;

        } catch (error) {
            console.error('BigQuery カスタムクエリエラー:', error);
            throw new Error(`BigQueryクエリの実行に失敗しました: ${error.message}`);
        }
    }

    /**
     * 建物データをBigQueryから取得
     * @returns {Promise<Array>} 建物データの配列
     */
    async getBuildings() {
        try {
            // 環境変数からカスタムクエリを取得、なければ提供されたSQLクエリを使用
            const customQuery = process.env.BIGQUERY_BUILDINGS_QUERY;

            let query;
            if (customQuery) {
                query = customQuery;
            } else {
                // 提供されたデフォルトSQLクエリ（プロジェクトIDを環境変数から取得）
                const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'm2m-core';
                query = `
                    WITH AddressCheck AS (
                         SELECT
                              ROOMTYPE.lead_property_id,
                              COUNT(
                                   DISTINCT CONCAT (
                                        IFNULL (prefectures, ''),
                                        IFNULL (city, ''),
                                        IFNULL (town, '')
                                   )
                              ) AS unique_addresses
                         FROM
                              \`${projectId}.zzz_taniguchi.lead_room_type\` ROOMTYPE
                         GROUP BY
                              lead_property_id
                    ),
                    AreaZonedForUseCheck AS (
                         SELECT
                              ROOMTYPE.lead_property_id,
                              COUNT(DISTINCT IFNULL (area_zoned_for_use, '')) AS unique_area_zoned_for_use
                         FROM
                              \`${projectId}.zzz_taniguchi.lead_room_type\` ROOMTYPE
                         GROUP BY
                              lead_property_id
                    ),
                    routeOneCheck AS (
                         SELECT
                              ROOMTYPE.lead_property_id,
                              COUNT(DISTINCT IFNULL (route_1, '')) AS unique_route_1
                         FROM
                              \`${projectId}.zzz_taniguchi.lead_room_type\` ROOMTYPE
                         GROUP BY
                              lead_property_id
                    ),
                    stationOneCheck AS (
                         SELECT
                              ROOMTYPE.lead_property_id,
                              COUNT(DISTINCT IFNULL (station_1, '')) AS unique_station_1
                         FROM
                              \`${projectId}.zzz_taniguchi.lead_room_type\` ROOMTYPE
                         GROUP BY
                              lead_property_id
                    ),
                    walkMinOneCheck AS (
                         SELECT
                              ROOMTYPE.lead_property_id,
                              COUNT(
                                   DISTINCT IFNULL (CAST (walk_min_1 AS STRING), '')
                              ) AS unique_walk_min_1
                         FROM
                              \`${projectId}.zzz_taniguchi.lead_room_type\` ROOMTYPE
                    ),
                    oldest_records AS (
                         SELECT
                              PROPERTY.id,
                              PROPERTY.name,
                              PROPERTY.tag,
                              PROPERTY.mt_representative,
                              PROPERTY.create_date,
                              CASE
                                   WHEN AddressCheck.unique_addresses = 1 THEN CASE
                                        WHEN ROOMTYPE.prefectures IS NULL
                                        AND ROOMTYPE.city IS NULL
                                        AND ROOMTYPE.town IS NULL THEN NULL
                                        ELSE CONCAT (
                                             IFNULL (ROOMTYPE.prefectures, ''),
                                             IFNULL (ROOMTYPE.city, ''),
                                             IFNULL (ROOMTYPE.town, '')
                                        )
                                   END
                                   WHEN AddressCheck.unique_addresses IS NULL THEN NULL
                                   ELSE '部屋タイプ別' -- 1でもnullでもない場合
                              END AS adress,
                              CASE
                                   WHEN AreaZonedForUseCheck.unique_area_zoned_for_use = 1 THEN ROOMTYPE.area_zoned_for_use
                                   WHEN AreaZonedForUseCheck.unique_area_zoned_for_use IS NULL THEN NULL
                                   ELSE '部屋タイプ別' -- 1でもnullでもない場合
                              END AS area_zoned_for_use,
                              CASE
                                   WHEN routeOneCheck.unique_route_1 = 1 THEN ROOMTYPE.route_1
                                   WHEN routeOneCheck.unique_route_1 IS NULL THEN NULL
                                   ELSE '部屋タイプ別' -- 1でもnullでもない場合
                              END AS route_1,
                              CASE
                                   WHEN stationOneCheck.unique_station_1 = 1 THEN ROOMTYPE.station_1
                                   WHEN stationOneCheck.unique_station_1 IS NULL THEN NULL
                                   ELSE '部屋タイプ別' -- 1でもnullでもない場合
                              END AS station_1,
                              CASE
                                   WHEN walkMinOneCheck.unique_walk_min_1 = 1 THEN CAST(ROOMTYPE.walk_min_1 AS STRING)
                                   WHEN walkMinOneCheck.unique_walk_min_1 IS NULL THEN CAST(NULL AS STRING)
                                   ELSE '部屋タイプ別' -- 1でもnullでもない場合
                              END AS walk_min_1,
                              ROW_NUMBER() OVER (
                                   PARTITION BY PROPERTY.name
                                   ORDER BY
                                        PROPERTY.create_date ASC
                              ) AS rn
                         FROM
                              \`${projectId}.zzz_taniguchi.lead_property\` PROPERTY
                              LEFT JOIN \`${projectId}.zzz_taniguchi.lead_room_type\` ROOMTYPE ON PROPERTY.id = ROOMTYPE.lead_property_id
                              LEFT JOIN AddressCheck ON PROPERTY.id = AddressCheck.lead_property_id
                              LEFT JOIN AreaZonedForUseCheck ON PROPERTY.id = AreaZonedForUseCheck.lead_property_id
                              LEFT JOIN routeOneCheck ON PROPERTY.id = routeOneCheck.lead_property_id
                              LEFT JOIN stationOneCheck ON PROPERTY.id = stationOneCheck.lead_property_id
                              LEFT JOIN walkMinOneCheck ON PROPERTY.id = walkMinOneCheck.lead_property_id
                         WHERE
                              PROPERTY.name IS NOT NULL
                    )
                    SELECT
                         id,
                         name,
                         tag,
                         mt_representative,
                         create_date,
                         adress,
                         area_zoned_for_use,
                         route_1,
                         station_1,
                         walk_min_1
                    FROM
                         oldest_records
                    WHERE
                         rn = 1
                    ORDER BY
                         create_date DESC;
                `;
            }

            const rows = await this.executeQuery(query);

            // データを整形して返す
            return rows.map(row => ({
                id: row.id,
                name: row.name,
                tag: row.tag || '',
                mt_representative: row.mt_representative || '',
                create_date: this.formatDate(row.create_date),
                adress: row.adress || '',
                area_zoned_for_use: row.area_zoned_for_use || '',
                route_1: row.route_1 || '',
                station_1: row.station_1 || '',
                walk_min_1: row.walk_min_1 || ''
            }));

        } catch (error) {
            console.error('建物データ取得エラー:', error);
            throw error;
        }
    }

    /**
     * 指定されたIDの建物データを取得
     * @param {number|string} id 建物ID
     * @returns {Promise<Object|null>} 建物データまたはnull
     */
    async getBuildingById(id) {
        try {
            // 環境変数からカスタムクエリを取得、なければデフォルトクエリを使用
            const customQuery = process.env.BIGQUERY_BUILDING_DETAIL_QUERY;

            let query;
            let params = { id: id };

            if (customQuery) {
                query = customQuery;
            } else {
                // デフォルトクエリ
                query = `
                    SELECT 
                        id,
                        name,
                        address AS 住所,
                        EXTRACT(YEAR FROM CURRENT_DATE()) - build_year AS 築年数,
                        updated_at AS updatedAt,
                        description,
                        build_year
                    FROM \`${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE}\`
                    WHERE id = @id AND deleted_at IS NULL
                    LIMIT 1
                `;
            }

            const rows = await this.executeQuery(query, params);

            if (rows.length === 0) {
                return null;
            }

            const row = rows[0];
            return {
                id: row.id,
                name: row.name,
                住所: row.住所 || row.address,
                築年数: row.築年数 || (row.build_year ? new Date().getFullYear() - row.build_year : null),
                updatedAt: row.updatedAt ? (row.updatedAt.toISOString ? row.updatedAt.toISOString().split('T')[0] : row.updatedAt) : null,
                description: row.description,
                buildYear: row.build_year
            };

        } catch (error) {
            console.error('建物詳細取得エラー:', error);
            throw error;
        }
    }

    /**
     * 指定されたIDの物件データを取得（GASのgetPropertyData関数と同様）
     * @param {string} id 物件ID
     * @returns {Promise<Array>} 物件データの配列
     */
    async getPropertyData(id) {
        try {
            const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'm2m-core';

            // 全カラムを取得するクエリ
            const query = `
                SELECT
                    PROPERTY.id AS \`id\`,
                    PROPERTY.name AS \`name\`,
                    PROPERTY.tag AS \`tag\`,
                    PROPERTY.is_trade AS \`is_trade\`,
                    PROPERTY.is_lease AS \`is_lease\`,
                    PROPERTY.lead_from AS \`lead_from\`,
                    PROPERTY.is_fund AS \`is_fund\`,
                    PROPERTY.lead_channel AS \`lead_channel\`,
                    PROPERTY.trade_form AS \`trade_form\`,
                    PROPERTY.lead_from_representative AS \`lead_from_representative\`,
                    PROPERTY.lead_from_representative_phone AS \`lead_from_representative_phone\`,
                    PROPERTY.lead_from_representative_email AS \`lead_from_representative_email\`,
                    PROPERTY.folder AS \`folder\`,
                    PROPERTY.serial_number AS \`serial_number\`,
                    PROPERTY.note AS \`note\`,
                    PROPERTY.mt_representative AS \`mt_representative\`,
                    FORMAT_TIMESTAMP('%Y-%m-%d %H:%M:%S', PROPERTY.create_date) AS \`create_date\`,
                    FORMAT_DATE('%Y-%m-%d', PROPERTY.information_acquisition_date) AS \`information_acquisition_date\`,
                    FORMAT_DATE('%Y-%m-%d', PROPERTY.latest_inventory_confirmation_date) AS \`latest_inventory_confirmation_date\`,
                    PROPERTY.num_of_occupied_rooms AS \`num_of_occupied_rooms\`,
                    PROPERTY.num_of_vacant_rooms AS \`num_of_vacant_rooms\`,
                    PROPERTY.num_of_rooms_without_furniture AS \`num_of_rooms_without_furniture\`,
                    PROPERTY.minpaku_feasibility AS \`minpaku_feasibility\`,
                    PROPERTY.sp_feasibility AS \`sp_feasibility\`,
                    PROPERTY.done_property_viewing AS \`done_property_viewing\`,
                    PROPERTY.torikago AS \`torikago\`,
                    FORMAT_DATE('%Y-%m-%d', PROPERTY.key_handling_date) AS \`key_handling_date\`,
                    PROPERTY.done_antisocial_check AS \`done_antisocial_check\`,
                    CASE
                        WHEN EXISTS(
                            SELECT 1
                            FROM \`${projectId}.zzz_taniguchi.lead_room\` AS lead_room
                            WHERE lead_room.lead_property_id = PROPERTY.id
                        ) OR EXISTS(
                            SELECT 1
                            FROM \`${projectId}.zzz_taniguchi.lead_room_type\` AS lead_room_type
                            WHERE lead_room_type.lead_property_id = PROPERTY.id
                        ) THEN TRUE
                        ELSE FALSE
                    END AS \`has_related_rooms\`
                FROM
                    \`${projectId}.zzz_taniguchi.lead_property\` AS PROPERTY
                WHERE
                    PROPERTY.id = @id
            `;

            const params = { id: id };
            const rows = await this.executeQuery(query, params);

            // データが見つからない場合は空配列を返す
            if (!rows || rows.length === 0) {
                console.log(`物件ID ${id} のデータが見つかりませんでした`);
                return [];
            }

            return rows.map(row => ({
                id: row.id,
                name: row.name || '',
                tag: row.tag || '',
                is_trade: row.is_trade || '',
                is_lease: row.is_lease || '',
                lead_from: row.lead_from || '',
                is_fund: row.is_fund || '',
                lead_channel: row.lead_channel || '',
                trade_form: row.trade_form || '',
                lead_from_representative: row.lead_from_representative || '',
                lead_from_representative_phone: row.lead_from_representative_phone || '',
                lead_from_representative_email: row.lead_from_representative_email || '',
                folder: row.folder || '',
                serial_number: row.serial_number || '',
                note: row.note || '',
                mt_representative: row.mt_representative || '',
                create_date: row.create_date || '',
                information_acquisition_date: row.information_acquisition_date || '',
                latest_inventory_confirmation_date: row.latest_inventory_confirmation_date || '',
                num_of_occupied_rooms: row.num_of_occupied_rooms || 0,
                num_of_vacant_rooms: row.num_of_vacant_rooms || 0,
                num_of_rooms_without_furniture: row.num_of_rooms_without_furniture || 0,
                minpaku_feasibility: row.minpaku_feasibility || '',
                sp_feasibility: row.sp_feasibility || '',
                done_property_viewing: row.done_property_viewing || '',
                torikago: row.torikago || '',
                key_handling_date: row.key_handling_date || '',
                done_antisocial_check: row.done_antisocial_check || '',
                has_related_rooms: row.has_related_rooms || false
            }));

        } catch (error) {
            console.error('物件データ取得エラー:', error);
            // エラーが発生した場合は空配列を返す（上位でモックデータにフォールバックするため）
            return [];
        }
    }

    /**
     * 指定された物件IDの部屋一覧を取得（GASのgetRoomList関数と同様）
     * @param {string} id 物件ID
     * @returns {Promise<Array>} 部屋データの配列（ヘッダー行含む）
     */
    async getRoomList(id) {
        try {
            const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'm2m-core';

            const query = `
                WITH lead_room_type_id_counts AS (
                    SELECT
                        lead_room_type_id,
                        count(DISTINCT id) AS num_rooms
                    FROM
                        \`${projectId}.zzz_taniguchi.lead_room\` AS lead_room
                    GROUP BY
                        1
                ),
                lead_room_with_shared_type_id AS (
                    SELECT
                        lead_room.id,
                        CASE
                            WHEN lead_room_type_id_counts.num_rooms = 1 THEN TRUE
                            ELSE FALSE
                        END AS is_shared_type_id
                    FROM
                        \`${projectId}.zzz_taniguchi.lead_room\` AS lead_room
                        LEFT OUTER JOIN lead_room_type_id_counts ON lead_room.lead_room_type_id = lead_room_type_id_counts.lead_room_type_id
                )
                SELECT
                    ROOM.status AS \`進捗\`,
                    ROOM.id AS \`部屋ID\`,
                    ROOM.name AS \`部屋名\`,
                    ROOMTYPE.name AS \`部屋タイプ\`,
                    lead_room_with_shared_type_id.is_shared_type_id AS \`操作\`
                FROM
                    \`${projectId}.zzz_taniguchi.lead_room\` AS ROOM
                    LEFT JOIN lead_room_with_shared_type_id ON ROOM.id = lead_room_with_shared_type_id.id
                    LEFT JOIN \`${projectId}.zzz_taniguchi.lead_room_type\` AS ROOMTYPE ON ROOM.lead_room_type_id = ROOMTYPE.id
                WHERE
                    ROOM.lead_property_id = @id
                ORDER BY
                    ROOM.name
            `;

            const params = { id: id };
            const rows = await this.executeQuery(query, params);

            console.log(`物件ID ${id} の部屋データを ${rows.length} 件取得しました`);

            // データが見つからない場合はヘッダーのみの配列を返す
            const headers = ['進捗', '部屋ID', '部屋名', '部屋タイプ', '操作'];

            if (!rows || rows.length === 0) {
                console.log(`物件ID ${id} の部屋データが見つかりませんでした`);
                return [headers];
            }

            // データを2次元配列に変換（GASの形式に合わせる）
            const dataRows = rows.map(row => [
                row.進捗 || '',
                row.部屋ID || '',
                row.部屋名 || '',
                row.部屋タイプ || '',
                row.操作 ? 'true' : 'false'
            ]);

            // ヘッダー行を最初に挿入
            return [headers, ...dataRows];

        } catch (error) {
            console.error(`物件ID ${id} の部屋データ取得エラー:`, error);
            // エラーが発生した場合はヘッダーのみの配列を返す
            const headers = ['進捗', '部屋ID', '部屋名', '部屋タイプ', '操作'];
            return [headers];
        }
    }

    /**
     * 部屋データを取得（GASのgetRoomData関数と同様）
     * @param {string} id 部屋ID
     * @returns {Promise<Array>} 部屋データの配列
     */
    async getRoomData(id) {
        try {
            const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'm2m-core';

            // 部屋スキーマを取得（GASのgetRoomSchema相当）
            const schema = await this.getRoomSchema();

            // スキーマからカラムを生成
            let columns = Object.keys(schema).map((name) => {
                const type = schema[name].type;
                let column = `ROOM.${name}`;

                if (type === "TIMESTAMP") {
                    column = `FORMAT_TIMESTAMP('%Y-%m-%d %H:%M:%S', ${column}) AS \`${name}\``;
                } else if (type === "DATE") {
                    column = `FORMAT_DATE('%Y-%m-%d', ${column}) AS \`${name}\``;
                } else {
                    column = `${column} AS \`${name}\``;
                }
                return column;
            });

            // 追加カラムを追加（既存のlead_property_idと重複しないように調整）
            columns.push("ROOMTYPE.name AS `lead_room_type_name`");
            columns.push("PROPERTY.name AS `lead_property_name`");

            const query = `
                SELECT
                    ${columns.join(",\n                    ")}
                FROM
                    \`${projectId}.zzz_taniguchi.lead_room\` AS ROOM
                    LEFT JOIN \`${projectId}.zzz_taniguchi.lead_room_type\` AS ROOMTYPE ON ROOM.lead_room_type_id = ROOMTYPE.id
                    LEFT JOIN \`${projectId}.zzz_taniguchi.lead_property\` AS PROPERTY ON ROOM.lead_property_id = PROPERTY.id
                WHERE
                    ROOM.id = @roomId
            `;

            console.log(`BigQueryから部屋データを取得中: ID=${id}`);
            const rows = await this.executeQuery(query, { roomId: id });

            return rows;

        } catch (error) {
            console.error('部屋データ取得エラー:', error);
            throw error;
        }
    }

    /**
     * 部屋スキーマを取得
     * @returns {Promise<Object>} 部屋スキーマ
     */
    async getRoomSchema() {
        try {
            // 新しいカラムリストに対応したスキーマ
            const schema = {
                id: { type: 'STRING', japaneseName: '部屋ID', order: 1, editable: false, isRequired: false },
                status: { type: 'STRING', japaneseName: '進捗', order: 2, editable: true, isRequired: false },
                name: { type: 'STRING', japaneseName: '部屋名', order: 3, editable: true, isRequired: true },
                room_number: { type: 'STRING', japaneseName: '部屋番号', order: 4, editable: true, isRequired: false },
                lead_property_id: { type: 'STRING', japaneseName: '建物ID', order: 5, editable: true, isRequired: false },
                lead_room_type_id: { type: 'STRING', japaneseName: '部屋タイプID', order: 6, editable: true, isRequired: false },
                create_date: { type: 'TIMESTAMP', japaneseName: '部屋登録日', order: 7, editable: false, isRequired: false },
                key_handover_scheduled_date: { type: 'DATE', japaneseName: '鍵引き渡し予定日', order: 8, editable: true, isRequired: false },
                possible_key_handover_scheduled_date_1: { type: 'DATE', japaneseName: '鍵引き渡し予定日①', order: 9, editable: true, isRequired: false },
                possible_key_handover_scheduled_date_2: { type: 'DATE', japaneseName: '鍵引き渡し予定日②', order: 10, editable: true, isRequired: false },
                possible_key_handover_scheduled_date_3: { type: 'DATE', japaneseName: '鍵引き渡し予定日③', order: 11, editable: true, isRequired: false },
                vacate_setup: { type: 'STRING', japaneseName: '退去SU', order: 12, editable: true, isRequired: false },
                contract_collection_date: { type: 'DATE', japaneseName: '契約書回収予定日', order: 13, editable: true, isRequired: false },
                application_intended_date: { type: 'DATE', japaneseName: '申請予定日', order: 14, editable: true, isRequired: false }
            };

            return schema;

        } catch (error) {
            console.error('部屋スキーマ取得エラー:', error);
            // エラーの場合はモックスキーマを返す
            return {
                id: { type: 'STRING', japaneseName: 'ID', order: 1, editable: false, isRequired: false },
                name: { type: 'STRING', japaneseName: '名前', order: 2, editable: true, isRequired: true }
            };
        }
    }

    /**
     * 日付をフォーマット
     * @param {*} dateValue - 日付値
     * @returns {string|null} フォーマットされた日付文字列またはnull
     */
    formatDate(dateValue) {
        if (!dateValue) return null;

        try {
            let date;
            if (dateValue.value) {
                // BigQueryのDatetimeオブジェクトの場合
                date = new Date(dateValue.value);
            } else if (dateValue.toISOString) {
                // Dateオブジェクトの場合
                date = dateValue;
            } else if (typeof dateValue === 'string') {
                // 文字列の場合
                date = new Date(dateValue);
            } else {
                return null;
            }

            if (isNaN(date.getTime())) {
                return null;
            }

            return date.toISOString().split('T')[0];
        } catch (error) {
            console.error('日付フォーマットエラー:', error);
            return null;
        }
    }

    /**
     * BigQuery接続のテスト
     * @returns {Promise<boolean>} 接続成功の場合true
     */
    async testConnection() {
        try {
            // 必要な環境変数がない場合は false を返す
            if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
                console.log('BigQuery設定なし: GOOGLE_CLOUD_PROJECT_ID が設定されていません');
                return false;
            }

            const query = 'SELECT 1 as test';
            const rows = await this.executeQuery(query);
            return rows.length > 0 && rows[0].test === 1;
        } catch (error) {
            console.error('BigQuery 接続テストエラー:', error);
            return false;
        }
    }
}

module.exports = BigQueryService;
