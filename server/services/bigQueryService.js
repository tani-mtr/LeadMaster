const { BigQuery } = require('@google-cloud/bigquery');

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
     * @returns {Promise<Array>} クエリ結果の配列
     */
    async executeQuery(query, params = {}) {
        try {
            // 必要な環境変数がない場合はエラーを投げる
            if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
                throw new Error('BigQuery設定が不完全です: GOOGLE_CLOUD_PROJECT_ID が設定されていません');
            }

            console.log('BigQuery カスタムクエリを実行中:', query);
            console.log('パラメータ:', params);

            const options = {
                query: query,
                params: params,
                location: process.env.BIGQUERY_LOCATION || 'US',
            };

            // クエリを実行
            const [job] = await this.bigquery.createQueryJob(options);
            console.log(`Job ${job.id} が開始されました。`);

            // 結果を待機
            const [rows] = await job.getQueryResults();

            console.log(`${rows.length} 件のレコードを取得しました。`);
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
