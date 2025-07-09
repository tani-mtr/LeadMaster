-- 部屋データ変更履歴テーブル作成SQL
-- BigQuery用のテーブル作成スクリプト

CREATE TABLE IF NOT EXISTS `m2m-core.zzz_taniguchi.room_change_history` (
  id STRING NOT NULL,                    -- 履歴レコードのユニークID
  room_id STRING NOT NULL,               -- 対象の部屋ID
  changed_at TIMESTAMP NOT NULL,         -- 変更日時
  changed_by STRING,                     -- 変更者（ユーザーID、メールアドレスなど）
  change_type STRING,                    -- 変更タイプ（INSERT, UPDATE, DELETE）
  field_name STRING NOT NULL,            -- 変更されたフィールド名
  old_value STRING,                      -- 変更前の値
  new_value STRING,                      -- 変更後の値
  additional_info JSON                   -- 追加情報（IPアドレス、ユーザーエージェントなど）
)
PARTITION BY DATE(changed_at)            -- 日付でパーティション分割（パフォーマンス向上）
CLUSTER BY room_id, changed_at           -- 部屋IDと変更日時でクラスタリング
OPTIONS (
  description = "部屋データの変更履歴を記録するテーブル",
  labels = [("environment", "production"), ("purpose", "audit")]
);

-- インデックス作成（検索パフォーマンス向上）
-- BigQueryでは自動的にクラスタリングキーでインデックスが作成されます

-- サンプルデータの挿入（テスト用）
INSERT INTO `m2m-core.zzz_taniguchi.room_change_history` 
(id, room_id, changed_at, changed_by, change_type, field_name, old_value, new_value, additional_info)
VALUES
  (
    GENERATE_UUID(),
    'test_room_001',
    CURRENT_TIMESTAMP(),
    'user@example.com',
    'UPDATE',
    'status',
    'A',
    'B',
    JSON '{"ip_address": "192.168.1.1", "user_agent": "Mozilla/5.0"}'
  ),
  (
    GENERATE_UUID(),
    'test_room_001',
    CURRENT_TIMESTAMP(),
    'user@example.com',
    'UPDATE',
    'room_number',
    '101',
    '102',
    JSON '{"ip_address": "192.168.1.1", "user_agent": "Mozilla/5.0"}'
  );

-- 変更履歴を参照するビューの作成（便利なクエリ用）
CREATE OR REPLACE VIEW `m2m-core.zzz_taniguchi.room_change_history_view` AS
SELECT 
  room_id,
  changed_at,
  changed_by,
  change_type,
  COUNT(*) as field_count,
  ARRAY_AGG(
    STRUCT(
      field_name,
      old_value,
      new_value
    )
  ) as changes
FROM `m2m-core.zzz_taniguchi.room_change_history`
GROUP BY room_id, changed_at, changed_by, change_type
ORDER BY changed_at DESC;
