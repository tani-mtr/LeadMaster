-- 統合変更履歴テーブル作成SQL
-- 物件、部屋、部屋タイプの変更履歴を統合的に管理

CREATE TABLE IF NOT EXISTS `m2m-core.zzz_taniguchi.lead_change_history` (
    -- 基本情報
    id STRING NOT NULL,                           -- 変更履歴ID (UUID)
    entity_type STRING NOT NULL,                  -- エンティティタイプ ('property', 'room', 'room_type')
    entity_id STRING NOT NULL,                    -- エンティティID
    
    -- 変更情報
    changed_at TIMESTAMP NOT NULL,                -- 変更日時 (UTC)
    changed_by STRING,                            -- 変更者 (メールアドレスまたはユーザーID)
    operation_type STRING NOT NULL,               -- 操作タイプ ('INSERT', 'UPDATE', 'DELETE')
    
    -- 変更詳細 (JSON形式)
    field_changes JSON,                           -- 変更されたフィールドの詳細
    
    -- 追加情報（オプション）
    user_agent STRING,                            -- ユーザーエージェント情報
    ip_address STRING,                            -- IPアドレス
    session_id STRING,                            -- セッションID
    comment STRING,                               -- 変更コメント
    
    -- システム情報
    created_at TIMESTAMP NOT NULL                 -- レコード作成日時
)
PARTITION BY DATE(changed_at)
CLUSTER BY entity_type, entity_id, changed_at;

-- インデックス最適化のための追加設定
-- PARTITION BY: 日付でパーティション分割（履歴データの効率的な管理）
-- CLUSTER BY: エンティティタイプ、ID、変更日時でクラスタリング（クエリ性能向上）

-- 使用例クエリ:
-- 特定の部屋の変更履歴を取得
/*
SELECT 
    id,
    entity_id,
    changed_at,
    changed_by,
    operation_type,
    field_changes
FROM `m2m-core.zzz_taniguchi.lead_change_history`
WHERE entity_type = 'room' 
  AND entity_id = 'room_123'
ORDER BY changed_at DESC
LIMIT 20;
*/

-- 特定期間の変更履歴を取得
/*
SELECT 
    entity_type,
    entity_id,
    changed_at,
    changed_by,
    JSON_EXTRACT_SCALAR(field_changes, '$.status.new_value') as new_status
FROM `m2m-core.zzz_taniguchi.lead_change_history`
WHERE changed_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
  AND entity_type = 'room'
ORDER BY changed_at DESC;
*/
