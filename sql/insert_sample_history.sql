-- サンプル変更履歴データ挿入用SQL
-- テスト用のデータを挿入してアプリケーションでの表示を確認

-- 部屋の変更履歴サンプル
INSERT INTO `m2m-core.zzz_taniguchi.lead_change_history`
(id, entity_type, entity_id, changed_at, changed_by, operation_type, field_changes, comment, created_at)
VALUES 
-- 部屋作成履歴
('test-history-001', 'room', 'R000000001', TIMESTAMP('2024-07-01 10:00:00'), 'system@example.com', 'INSERT', 
JSON'{"status": {"old_value": null, "new_value": "A"}, "room_number": {"old_value": null, "new_value": "101"}}', 
'部屋初期作成', CURRENT_TIMESTAMP()),

-- 部屋ステータス変更履歴
('test-history-002', 'room', 'R000000001', TIMESTAMP('2024-07-05 14:30:00'), 'user@example.com', 'UPDATE', 
JSON'{"status": {"old_value": "A", "new_value": "B"}, "key_handover_scheduled_date": {"old_value": null, "new_value": "2024-08-01"}}', 
'ステータス更新と鍵引き渡し日設定', CURRENT_TIMESTAMP()),

-- 部屋詳細変更履歴
('test-history-003', 'room', 'R000000001', TIMESTAMP('2024-07-08 09:15:00'), 'admin@example.com', 'UPDATE', 
JSON'{"vacate_setup": {"old_value": "一般賃貸中", "new_value": "退去SU"}, "contract_collection_date": {"old_value": null, "new_value": "2024-07-20"}}', 
'退去SU設定と契約書回収日追加', CURRENT_TIMESTAMP()),

-- 物件の変更履歴サンプル
('test-history-004', 'property', 'P000000001', TIMESTAMP('2024-06-15 11:20:00'), 'admin@example.com', 'INSERT', 
JSON'{"property_name": {"old_value": null, "new_value": "サンプル物件A"}, "address": {"old_value": null, "new_value": "東京都新宿区1-1-1"}}', 
'物件初期登録', CURRENT_TIMESTAMP()),

('test-history-005', 'property', 'P000000001', TIMESTAMP('2024-06-20 16:45:00'), 'user@example.com', 'UPDATE', 
JSON'{"property_name": {"old_value": "サンプル物件A", "new_value": "サンプル物件A（更新版）"}, "total_rooms": {"old_value": "50", "new_value": "52"}}', 
'物件名更新と部屋数変更', CURRENT_TIMESTAMP()),

-- 部屋タイプの変更履歴サンプル
('test-history-006', 'room_type', 'RT000000001', TIMESTAMP('2024-06-25 13:10:00'), 'system@example.com', 'INSERT', 
JSON'{"room_type_name": {"old_value": null, "new_value": "1K"}, "floor_plan": {"old_value": null, "new_value": "25㎡"}}', 
'部屋タイプ初期登録', CURRENT_TIMESTAMP()),

('test-history-007', 'room_type', 'RT000000001', TIMESTAMP('2024-07-02 10:30:00'), 'user@example.com', 'UPDATE', 
JSON'{"rent_amount": {"old_value": "80000", "new_value": "82000"}, "room_size": {"old_value": "25", "new_value": "26"}}', 
'賃料と面積の更新', CURRENT_TIMESTAMP());

-- データ確認用クエリ
-- SELECT * FROM `m2m-core.zzz_taniguchi.lead_change_history` ORDER BY changed_at DESC;
