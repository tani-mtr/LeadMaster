import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { apiService } from '../services/apiService';

import RoomDrawer from '../components/RoomDrawer';
import RoomTypeDrawer from '../components/RoomTypeDrawer';
import RoomInfoEditableTable from '../components/RoomInfoEditableTable';

import { validatePropertyName } from '../utils/validationUtils';

// 物件情報カラムのみのcolumns生成関数
function getPropertyInfoColumnsForEditableTable() {
    // PROPERTY_FIELD_CONFIGのキー一覧
    const propertyKeys = Object.keys(PROPERTY_FIELD_CONFIG);
    // ROOM_TABLE_FIELD_ORDERの順で並べる
    const orderedKeys = ROOM_TABLE_FIELD_ORDER.filter((key) => propertyKeys.includes(key));
    // columns配列生成
    return orderedKeys.map((field) => {
        const conf = PROPERTY_FIELD_CONFIG[field];
        let col = {
            field,
            headerName: conf.label,
            editable: !!conf.editable,
            minWidth: 120,
            flex: 1,
        };
        // 型付与
        if (conf.type === 'date') col.type = 'date';
        if (conf.type === 'number') col.type = 'number';
        if (conf.type === 'select') {
            col.type = 'singleSelect';
            col.valueOptions = conf.options || [];
        }
        return col;
    });
}

// 選択肢の定数定義
const SELECT_OPTIONS = {
    is_trade: ['', '売買'],
    is_lease: ['', '借上', '1', '通常借上'],
    contract_type: ['', '普通借家', '定期借家'],
    existing_or_new: ['', '既存', '新規'],
    lead_channel: ['', 'ダイレクト', 'レインズ'],
    minpaku_feasibility: ['', '可', '不可', '確認中', '可能', '旅館業', '確認中'],
    sp_feasibility: ['', 'SP不要', 'SP必要', '確認中'],
    done_property_viewing: ['', '未内見', '竣工待ち', '内見済み', '内見可能', '内見済', '済', '竣工前'],
    done_antisocial_check: ['', '有', '無', '済'],
    // 部屋データ用の選択肢
    status: ['', 'A', 'B', 'C', 'D', 'E', 'F', 'クローズ', '運営判断中', '試算入力待ち', '試算入力済み', '試算依頼済み', '他決', '見送り'],
    vacate_setup: ['', '一般賃貸中', '退去SU']
};

// 部屋フィールドの設定
// 部屋情報用フィールド
const ROOM_INFO_FIELD_CONFIG = {
    id: { label: '部屋ID', type: 'text', editable: false },
    core_id: { label: 'core部屋ID', type: 'text', editable: false },
    name: { label: '部屋名', type: 'text', editable: false },
    status: { label: '進捗', type: 'select', editable: true, options: SELECT_OPTIONS.status },
    lead_property_id: { label: '物件ID', type: 'text', editable: false },
    lead_room_type_id: { label: '部屋タイプID', type: 'text', editable: false },
    create_date: { label: '部屋登録日', type: 'date', editable: false },
    key_handover_scheduled_date: { label: '鍵引き渡し予定日', type: 'date', editable: true },
    possible_key_handover_scheduled_date_1: { label: '鍵引き渡し予定日①', type: 'date', editable: true },
    possible_key_handover_scheduled_date_2: { label: '鍵引き渡し予定日②', type: 'date', editable: true },
    possible_key_handover_scheduled_date_3: { label: '鍵引き渡し予定日③', type: 'date', editable: true },
    leaflet_distribution_date: { label: 'チラシ配布日', type: 'date', editable: true },
    notification_complete_date: { label: '通知完了日', type: 'date', editable: true },
    contract_collection_date: { label: '契約書回収予定日', type: 'date', editable: true },
    application_intended_date: { label: '申請予定日', type: 'date', editable: true },
    user_email: { label: 'ユーザーEmail', type: 'text', editable: false },
    vacate_setup: { label: '退去SU', type: 'select', editable: true, options: SELECT_OPTIONS.vacate_setup },
    room_number: { label: '部屋番号', type: 'text', editable: false },
};

// 物件情報用フィールド
const PROPERTY_FIELD_CONFIG = {
    property_id: { label: '物件ID', type: 'text', editable: false, fromProperty: 'id' },
    property_name: { label: '物件名', type: 'text', editable: true, fromProperty: 'name' },
    property_tag: { label: 'タグ', type: 'text', editable: true, fromProperty: 'tag' },
    property_is_trade: { label: '売買', type: 'select', editable: true, fromProperty: 'is_trade', options: SELECT_OPTIONS.is_trade },
    property_is_lease: { label: '借上', type: 'select', editable: true, fromProperty: 'is_lease', options: SELECT_OPTIONS.is_lease },
    property_contract_type: { label: '契約種別', type: 'select', editable: true, fromProperty: 'contract_type', options: SELECT_OPTIONS.contract_type },
    property_existing_or_new: { label: '既存/新規', type: 'select', editable: true, fromProperty: 'existing_or_new', options: SELECT_OPTIONS.existing_or_new },
    property_lead_from: { label: 'lead元', type: 'text', editable: true, fromProperty: 'lead_from' },
    property_is_fund: { label: 'ファンド物件', type: 'text', editable: true, fromProperty: 'is_fund' },
    property_lead_channel: { label: 'Leadチャネル', type: 'select', editable: true, fromProperty: 'lead_channel', options: SELECT_OPTIONS.lead_channel },
    property_trade_form: { label: '取引形態', type: 'text', editable: true, fromProperty: 'trade_form' },
    property_lead_from_representative: { label: '先方担当', type: 'text', editable: true, fromProperty: 'lead_from_representative' },
    property_lead_from_representative_phone: { label: '担当者tel', type: 'text', editable: true, fromProperty: 'lead_from_representative_phone' },
    property_lead_from_representative_email: { label: '担当者mail', type: 'text', editable: true, fromProperty: 'lead_from_representative_email' },
    property_folder: { label: '建物フォルダ', type: 'text', editable: true, fromProperty: 'folder' },
    property_serial_number: { label: 'シリアルナンバー', type: 'text', editable: false, fromProperty: 'serial_number' },
    property_note: { label: '備考', type: 'text', editable: true, fromProperty: 'note' },
    property_mt_representative: { label: 'MT担当', type: 'text', editable: true, fromProperty: 'mt_representative' },
    property_create_date: { label: '建物登録日', type: 'text', editable: false, fromProperty: 'create_date' },
    property_information_acquisition_date: { label: '情報取得日', type: 'date', editable: true, fromProperty: 'information_acquisition_date' },
    property_latest_inventory_confirmation_date: { label: '最終在庫確認日', type: 'date', editable: true, fromProperty: 'latest_inventory_confirmation_date' },
    property_num_of_occupied_rooms: { label: '入居中室数', type: 'number', editable: true, fromProperty: 'num_of_occupied_rooms' },
    property_num_of_vacant_rooms: { label: '空室数', type: 'number', editable: true, fromProperty: 'num_of_vacant_rooms' },
    property_num_of_rooms_without_furniture: { label: '家具なし部屋数', type: 'number', editable: true, fromProperty: 'num_of_rooms_without_furniture' },
    property_minpaku_feasibility: { label: '民泊可否', type: 'select', editable: true, fromProperty: 'minpaku_feasibility', options: SELECT_OPTIONS.minpaku_feasibility },
    property_sp_feasibility: { label: 'SP可否', type: 'select', editable: true, fromProperty: 'sp_feasibility', options: SELECT_OPTIONS.sp_feasibility },
    property_done_property_viewing: { label: '内見', type: 'select', editable: true, fromProperty: 'done_property_viewing', options: SELECT_OPTIONS.done_property_viewing },
    property_torikago: { label: '鳥籠', type: 'text', editable: true, fromProperty: 'torikago' },
    property_key_handling_date: { label: '鍵引き渡し日', type: 'date', editable: true, fromProperty: 'key_handling_date' },
    property_done_antisocial_check: { label: '反社チェック有無', type: 'select', editable: true, fromProperty: 'done_antisocial_check', options: SELECT_OPTIONS.done_antisocial_check },
};

// 部屋タイプ情報用フィールド
const ROOM_TYPE_FIELD_CONFIG = {
    roomType_name: { label: '部屋タイプ名', type: 'text', editable: false, fromRoomType: 'name' },
    roomType_minpaku_price: { label: '民泊単価', type: 'number', editable: true, fromRoomType: 'minpaku_price' },
    roomType_monthly_price: { label: 'マンスリー単価', type: 'number', editable: true, fromRoomType: 'monthly_price' },
    roomType_pax: { label: '収容人数', type: 'number', editable: true, fromRoomType: 'pax' },
    roomType_owner_type: { label: '所有者属性', type: 'select', editable: true, fromRoomType: 'owner_type', options: ['', '自社', 'ファンド'] },
    roomType_register_type: { label: '運営形態', type: 'select', editable: true, fromRoomType: 'register_type', options: ['', '住宅宿泊事業', '旅館業', '特区民泊'] },
    roomType_payment_rent: { label: '賃料', type: 'number', editable: true, fromRoomType: 'payment_rent' },
    roomType_management_expenses: { label: '管理費', type: 'number', editable: true, fromRoomType: 'management_expenses' },
    roomType_brokerage_commission: { label: '仲介手数料', type: 'number', editable: true, fromRoomType: 'brokerage_commission' },
    roomType_deposit: { label: '敷金', type: 'number', editable: true, fromRoomType: 'deposit' },
    roomType_key_money: { label: '礼金', type: 'number', editable: true, fromRoomType: 'key_money' },
    roomType_key_exchange_money: { label: '鍵交換費用', type: 'number', editable: true, fromRoomType: 'key_exchange_money' },
    roomType_renovation_cost: { label: 'リフォーム費用', type: 'number', editable: true, fromRoomType: 'renovation_cost' },
    roomType_property_introduction_fee: { label: '物件紹介手数料', type: 'number', editable: true, fromRoomType: 'property_introduction_fee' },
    roomType_other_initial_cost_name: { label: '初期その他項目', type: 'text', editable: true, fromRoomType: 'other_initial_cost_name' },
    roomType_other_initial_cost: { label: '初期その他金額', type: 'number', editable: true, fromRoomType: 'other_initial_cost' },
    roomType_contract_type: { label: '契約種類', type: 'select', editable: true, fromRoomType: 'contract_type', options: ['', '普通借家', '定期借家'] },
    roomType_contract_period: { label: '契約期間 年間', type: 'text', editable: true, fromRoomType: 'contract_period' },
    roomType_renewal_fee: { label: '更新料', type: 'number', editable: true, fromRoomType: 'renewal_fee' },
    roomType_date_moving_in: { label: '入居日', type: 'date', editable: true, fromRoomType: 'date_moving_in' },
    roomType_rent_accrual_date: { label: '賃発日', type: 'date', editable: true, fromRoomType: 'rent_accrual_date' },
    roomType_operation_start_date: { label: '運営開始日', type: 'date', editable: true, fromRoomType: 'operation_start_date' },
    roomType_use_guarantee_company: { label: '保証会社利用', type: 'select', editable: true, fromRoomType: 'use_guarantee_company', options: ['', '有', '無', '済'] },
    roomType_Initial_guarantee_rate: { label: '初回保証料割合 %', type: 'number', editable: true, fromRoomType: 'Initial_guarantee_rate' },
    roomType_monthly_guarantee_fee_rate: { label: '月額保証料割合 %', type: 'number', editable: true, fromRoomType: 'monthly_guarantee_fee_rate' },
    roomType_maa_insurance: { label: '共済会 保険', type: 'select', editable: true, fromRoomType: 'maa_insurance', options: ['', '保険', '共済会'] },
    roomType_prefectures: { label: '都道府県', type: 'text', editable: true, fromRoomType: 'prefectures' },
    roomType_city: { label: '市区', type: 'text', editable: true, fromRoomType: 'city' },
    roomType_town: { label: '以後住所', type: 'text', editable: true, fromRoomType: 'town' },
    roomType_area_zoned_for_use: { label: '用途地域', type: 'select', editable: true, fromRoomType: 'area_zoned_for_use', options: ['', '商業', '近隣商業', '工業', '準工業', '工業専用', '第一種低層住居専用', '第二種低層住居専用', '第一種中高層住居専用', '第二種中高層住居専用', '第一種住居地域', '第二種住居', '準住居', '田園住居'] },
    roomType_request_checking_area_zoned_for_use: { label: '用途地域確認依頼', type: 'select', editable: true, fromRoomType: 'request_checking_area_zoned_for_use', options: ['', '◯'] },
    roomType_done_checking_area_zoned_for_use: { label: '用途地域確認済', type: 'select', editable: true, fromRoomType: 'done_checking_area_zoned_for_use', options: ['', '◯'] },
    roomType_special_use_areas: { label: '特別用途地区', type: 'text', editable: true, fromRoomType: 'special_use_areas' },
    roomType_route_1: { label: '路線1', type: 'text', editable: true, fromRoomType: 'route_1' },
    roomType_station_1: { label: '駅1', type: 'text', editable: true, fromRoomType: 'station_1' },
    roomType_walk_min_1: { label: '徒歩分数1', type: 'number', editable: true, fromRoomType: 'walk_min_1' },
    roomType_route_2: { label: '路線2', type: 'text', editable: true, fromRoomType: 'route_2' },
    roomType_station_2: { label: '駅2', type: 'text', editable: true, fromRoomType: 'station_2' },
    roomType_walk_min_2: { label: '徒歩分数2', type: 'number', editable: true, fromRoomType: 'walk_min_2' },
    roomType_floor_plan: { label: '間取り', type: 'select', editable: true, fromRoomType: 'floor_plan', options: ['', '1R', '1K', '1DK', '1LDK', '2K', '2DK', '2LDK', '3DK', '3LDK', '5LDK'] },
    roomType_ev: { label: 'EVの有無', type: 'select', editable: true, fromRoomType: 'ev', options: ['', '有', '無', '済'] },
    roomType_sqm: { label: '広さ', type: 'number', editable: true, fromRoomType: 'sqm' },
    roomType_room_type: { label: '部屋種別', type: 'select', editable: true, fromRoomType: 'room_type', options: ['', 'マンション・アパート', '戸建', 'メゾネット', 'ロフト付き', '長屋'] },
    roomType_building_structure: { label: '建物構造', type: 'select', editable: true, fromRoomType: 'building_structure', options: ['', 'RC', 'S', 'SRC', '木造', '鉄骨鉄造', 'WRC', 'W'] },
    roomType_completion_year: { label: '竣工年', type: 'number', editable: true, fromRoomType: 'completion_year' },
    roomType_minpaku_plan: { label: '民泊利用 自社運営予定 予定数', type: 'number', editable: true, fromRoomType: 'minpaku_plan' },
    roomType_room_floor: { label: '部屋所在階', type: 'text', editable: true, fromRoomType: 'room_floor' },
    roomType_building_floor: { label: '建物階数', type: 'text', editable: true, fromRoomType: 'building_floor' },
    roomType_num_of_room_per_building: { label: '建物全体部屋数', type: 'number', editable: true, fromRoomType: 'num_of_room_per_building' },
    roomType_staircase_location: { label: '階段位置', type: 'text', editable: true, fromRoomType: 'staircase_location' },
    roomType_total_sqm: { label: '建物延床面積', type: 'number', editable: true, fromRoomType: 'total_sqm' },
    roomType_availability_of_floor_plan: { label: '平面図の有無', type: 'select', editable: true, fromRoomType: 'availability_of_floor_plan', options: ['', '有', '無', '済'] },
    roomType_applications_for_other_floors: { label: '他フロアの用途', type: 'text', editable: true, fromRoomType: 'applications_for_other_floors' },
    roomType_firefighting_equipment: { label: '現況消防設備', type: 'text', editable: true, fromRoomType: 'firefighting_equipment' },
    roomType_firefighting_equipment_cost: { label: '消防設備費用 自動', type: 'number', editable: true, fromRoomType: 'firefighting_equipment_cost' },
    roomType_firefighting_equipment_cost_manual: { label: '消防設備費用 手動', type: 'number', editable: true, fromRoomType: 'firefighting_equipment_cost_manual' },
    roomType_furniture_transfer_availability: { label: '家具譲渡の有無', type: 'select', editable: true, fromRoomType: 'furniture_transfer_availability', options: ['', '有', '無', '済'] },
    roomType_checkin_cost: { label: 'check-in原価', type: 'number', editable: true, fromRoomType: 'checkin_cost' },
    roomType_other_cost_name: { label: '月額その他項目', type: 'text', editable: true, fromRoomType: 'other_cost_name' },
    roomType_other_cost: { label: '月額その他費用', type: 'number', editable: true, fromRoomType: 'other_cost' },
};

// 閲覧用は部屋情報、物件情報、部屋タイプ情報を結合
const ROOM_FIELD_CONFIG = { ...ROOM_INFO_FIELD_CONFIG, ...PROPERTY_FIELD_CONFIG, ...ROOM_TYPE_FIELD_CONFIG };

// ユーザー指定のカラム順に対応するフィールド名リスト
const ROOM_TABLE_FIELD_ORDER = [
    'status', // 進捗
    'property_id', // 建物ID
    'property_name', // 建物名
    'lead_room_type_id', // "部屋タイプID"
    'roomType_name', // 部屋タイプ名
    'id', // 部屋ID
    'core_id', // core部屋ID
    'name', // 部屋名
    'property_tag', // タグ
    'property_is_trade', // 売買
    'property_is_lease', // 借上
    'property_lead_from', // lead元
    'property_is_fund', // ファンド物件
    'property_lead_channel', // Leadチャネル
    'property_trade_form', // 取引形態
    'property_lead_from_representative', // 先方担当
    'property_lead_from_representative_phone', // 担当者tel
    'property_lead_from_representative_email', // 担当者メールアドレス
    'property_folder', // 建物フォルダ
    'property_note', // 備考
    'property_mt_representative', // "MT担当"
    'property_create_date', // 建物登録日
    'property_information_acquisition_date', // 情報取得日
    'property_latest_inventory_confirmation_date', // 最終在庫確認日
    'property_num_of_occupied_rooms', // 入居中室数
    'property_num_of_vacant_rooms', // 空室数
    'property_num_of_rooms_without_furniture', // 家具なし部屋数
    'property_minpaku_feasibility', // 民泊可否
    'property_sp_feasibility', // SP可否
    'property_done_property_viewing', // 内見
    'property_torikago', // 鳥籠
    'property_key_handling_date', // 鍵引き渡し日
    'property_done_antisocial_check', // 反社チェック有無
    'create_date', // 部屋登録日
    'key_handover_scheduled_date', // 鍵引き渡し予定日
    'possible_key_handover_scheduled_date_1', // 鍵引き渡し予定日①
    'possible_key_handover_scheduled_date_2', // 鍵引き渡し予定日②
    'possible_key_handover_scheduled_date_3', // 鍵引き渡し予定日③
    'vacate_setup', // 退去SU
    // ※未使用
    'contract_collection_date', // 契約書回収予定日
    'application_intended_date', // 申請予定日
    'roomType_create_date', // 部屋タイプ作成日（仮: 実際のフィールド名は要確認）
    'roomType_minpaku_price', // 民泊単価
    'roomType_monthly_price', // マンスリー単価
    'roomType_pax', // 収容人数
    'roomType_owner_type', // 所有者属性
    'roomType_register_type', // 運営形態
    'roomType_payment_rent', // 賃料
    'roomType_management_expenses', // 管理費
    'roomType_brokerage_commission', // 仲介手数料
    'roomType_deposit', // 敷金
    'roomType_key_money', // 礼金
    'roomType_key_exchange_money', // 鍵交換費用
    'roomType_renovation_cost', // リフォーム費用
    'roomType_property_introduction_fee', // 物件紹介手数料
    'roomType_other_initial_cost_name', // 初期その他項目
    'roomType_other_initial_cost', // 初期その他金額
    'roomType_contract_type', // 契約種類
    'roomType_contract_period', // 契約期間(年間)
    'roomType_renewal_fee', // 更新料
    'roomType_date_moving_in', // 入居日
    'roomType_rent_accrual_date', // 賃発日
    'roomType_operation_start_date', // 運営開始日
    'roomType_use_guarantee_company', // 保証会社利用
    'roomType_Initial_guarantee_rate', // 初回保証料割合(%)
    'roomType_monthly_guarantee_fee_rate', // 月額保証料割合(%)
    'roomType_maa_insurance', // 共済会・保険
    'roomType_prefectures', // 都道府県
    'roomType_city', // 市区
    'roomType_town', // 以後住所
    'roomType_area_zoned_for_use', // 用途地域
    'roomType_request_checking_area_zoned_for_use', // 用途地域確認依頼
    'roomType_done_checking_area_zoned_for_use', // 用途地域確認済
    'roomType_special_use_areas', // 特別用途地区
    'roomType_route_1', // 路線1
    'roomType_station_1', // 駅1
    'roomType_walk_min_1', // 徒歩分数1
    'roomType_route_2', // 路線2
    'roomType_station_2', // 駅2
    'roomType_walk_min_2', // 徒歩2
    'roomType_floor_plan', // 間取り
    'roomType_ev', // EVの有無
    'roomType_sqm', // 広さ(㎡)
    'roomType_room_type', // 部屋種別
    'roomType_building_structure', // 建物構造
    'roomType_completion_year', // 竣工年
    'roomType_minpaku_plan', // 民泊利用（自社運営予定）予定数
    'roomType_room_floor', // 部屋所在階
    'roomType_building_floor', // 建物階数
    'roomType_num_of_room_per_building', // 建物全体部屋数
    'roomType_staircase_location', // 階段位置
    'roomType_total_sqm', // 建物延床面積
    'roomType_availability_of_floor_plan', // 平面図の有無
    'roomType_applications_for_other_floors', // 他フロアの用途
    'roomType_firefighting_equipment', // 現況消防設備
    'roomType_firefighting_equipment_cost', // 消防設備費用(自動)
    'roomType_firefighting_equipment_cost_manual', // 消防設備費用(手動)
    'roomType_furniture_transfer_availability', // 家具譲渡の有無
    'roomType_checkin_cost', // check-in原価
    'roomType_other_cost_name', // 月額その他項目
    'roomType_other_cost', // 月額その他費用
];
// ...existing code...

// スタイル定義
const Container = styled.div`
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
  width: 95%;
`;
const Header = styled.h1`
  color: #333;
  margin-bottom: 20px;
`;
const TabContainer = styled.div`
  border-bottom: 1px solid #ddd;
  margin-bottom: 20px;
`;
const Tab = styled.button.withConfig({
    shouldForwardProp: (prop) => prop !== 'active'
})`
  padding: 10px 20px;
  border: none;
  background: ${props => props.active ? '#007bff' : '#f8f9fa'};
  color: ${props => props.active ? 'white' : '#333'};
  cursor: pointer;
  border-radius: 5px 5px 0 0;
  margin-right: 5px;
  
  &:hover {
    background: ${props => props.active ? '#0056b3' : '#e9ecef'};
  }
`;
const Section = styled.div`
  background: white;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
`;
const FormGroup = styled.div`
  margin-bottom: 15px;
`;
const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  
  /* アスタリスクのスタイル */
  &::after {
    content: ${props => props.required ? '"*"' : '""'};
    color: #dc3545;
    margin-left: 2px;
  }
`;
const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease-in-out;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    transform: translateY(-1px);
  }
  
  &.error {
    border-color: #ef4444;
    background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    animation: shake 0.5s ease-in-out;
  }
  
  &.error:focus {
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15);
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-2px); }
    75% { transform: translateX(2px); }
  }
`;
// 改良されたエラーメッセージスタイル
const ValidationError = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #dc2626;
  font-size: 12px;
  font-weight: 500;
  margin-top: 8px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
  border: 1px solid #fecaca;
  border-radius: 8px;
  animation: slideDown 0.3s ease-out;
  position: relative;
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.1);
  
  &::before {
    content: "⚠️";
    font-size: 14px;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
  }
  
  &::after {
    content: "";
    position: absolute;
    left: 14px;
    top: -6px;
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 6px solid #fecaca;
  }
  
  @keyframes slideDown {
    0% {
      opacity: 0;
      transform: translateY(-10px) scale(0.95);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;
// フィールドコンテナの改良
const FieldContainer = styled.div`
  position: relative;
  transition: all 0.3s ease;
  
  &.error {
    animation: errorPulse 0.6s ease-in-out;
  }
  
  &.success {
    animation: successGlow 0.6s ease-in-out;
  }
  
  @keyframes errorPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); }
  }
  
  @keyframes successGlow {
    0% { transform: scale(1); }
    50% { transform: scale(1.01); }
    100% { transform: scale(1); }
`;
const Select = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  
  &:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }
`;
const Button = styled.button`
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
  
  &:hover {
    background: #0056b3;
  }
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`;
const ErrorMessage = styled.div`
  color: red;
  padding: 10px;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  margin-bottom: 20px;
`;
const LoadingMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #666;
  
  .spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 10px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
const SearchInput = styled.input`
  width: 300px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 20px;
  
  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;
const BulkActions = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
`;
const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
`;
const PageButton = styled.button.withConfig({
    shouldForwardProp: (prop) => prop !== 'active'
})`
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: ${props => props.active ? '#007bff' : 'white'};
  color: ${props => props.active ? 'white' : '#333'};
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background: ${props => props.active ? '#0056b3' : '#f8f9fa'};
  }
  
  &:disabled {
    background: #f8f9fa;
    color: #6c757d;
    cursor: not-allowed;
  }
`;
const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;
const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
`;
const ActionButtons = styled.div`
  display: flex;
  gap: 5px;
`;
const IconButton = styled.button.withConfig({
    shouldForwardProp: (prop) => !['variant'].includes(prop)
})`
  padding: 6px 8px;
  border: none;
  background: ${props => props.variant === 'danger' ? '#dc3545' : '#007bff'};
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  
  &:hover {
    background: ${props => props.variant === 'danger' ? '#c82333' : '#0056b3'};
  }
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
`;
const RoomNameButton = styled.button`
  color: #007bff;
  text-decoration: none;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  
  &:hover {
    text-decoration: underline;
  }
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
`;
const TableHeader = styled.th`
  background: #f8f9fa;
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
  font-weight: bold;
`;
const TableCell = styled.td`
  border: 1px solid #ddd;
  padding: 12px;
  vertical-align: middle;
`;
const TableRow = styled.tr`
  &:nth-child(even) {
    background: #f9f9f9;
  }
  
  &:hover {
    background: #f0f8ff;
  }
`;
const StatusBadge = styled.span.withConfig({
    shouldForwardProp: (prop) => prop !== 'status'
})`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  color: white;
  background: ${props => {
        switch (props.status) {
            case '空室': return '#28a745';
            case '入居中': return '#dc3545';
            case 'リフォーム中': return '#ffc107';
            default: return '#6c757d';
        }
    }};
`;
const RoomTypeTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
`;
const RoomTypeTableHeader = styled.th`
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #495057;
`;
const RoomTypeTableCell = styled.td`
  border: 1px solid #dee2e6;
  padding: 12px;
  vertical-align: middle;
`;
const RoomTypeContainer = styled.div`
  background: white;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;
// 履歴表示用のスタイル
const HistoryContainer = styled.div`
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 5px;
  padding: 10px;
`;
const HistoryItem = styled.div`
  border-bottom: 1px solid #eee;
  padding: 15px 0;
  
  &:last-child {
    border-bottom: none;
  }
`;
const HistoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;
const HistoryDate = styled.div`
  font-weight: bold;
  color: #333;
  font-size: 14px;
`;
const HistoryUser = styled.div`
  color: #666;
  font-size: 12px;
`;
const HistoryChanges = styled.div`
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  border-left: 4px solid #007bff;
`;
const ChangeField = styled.div`
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;
const FieldName = styled.div`
  font-weight: bold;
  font-size: 12px;
  color: #495057;
  margin-bottom: 2px;
`;
const ChangeValue = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
`;
const OldValue = styled.span`
  color: #dc3545;
  text-decoration: line-through;
  background: #f8d7da;
  padding: 2px 4px;
  border-radius: 3px;
`;
const NewValue = styled.span`
  color: #28a745;
  background: #d4edda;
  padding: 2px 4px;
  border-radius: 3px;
`;
const Arrow = styled.span`
  color: #6c757d;
  font-weight: bold;
`;
// データ編集タブ用のスタイル
const EditTabContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
`;
const TableSection = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
`;
const TableSectionHeader = styled.div`
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 15px 20px;
  border-bottom: 2px solid #dee2e6;
  font-weight: 600;
  color: #495057;
  font-size: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
const ReadOnlyTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  min-width: 1200px; /* 最小幅を設定してスクロール可能に */
`;
const ReadOnlyTableHeader = styled.th`
  padding: 10px 8px;
  text-align: left;
  font-weight: 600;
  color: #495057;
  font-size: 13px;
  white-space: nowrap;
  position: sticky;
  top: 0;
  background: ${({ $roomtype }) =>
        $roomtype === 'room' ? '#fffbe6' :
            $roomtype === 'roomType' ? '#eaffea' :
                $roomtype === 'property' ? '#e3f2fd' :
                    '#f8f9fa'};
  border: 1px solid #dee2e6;
  z-index: 6;

  &.fixed-column {
    z-index: 10;
  }
  &.fixed-column-8 {
    left: 0; /* 左端に固定 */
    min-width: 120px;
    width: 120px;
  }
    width: 120px;
  }
  &[data-field="id"] { min-width: 100px; }
  &[data-field="property_id"] { min-width: 100px; }
  &[data-field="name"] { min-width: 180px; }
  &[data-field="room_number"] { min-width: 100px; }
  &[data-field="status"] { min-width: 120px; }
  &[data-field="key_handover_scheduled_date"] { min-width: 150px; }
  &[data-field="possible_key_handover_scheduled_date_1"],
  &[data-field="possible_key_handover_scheduled_date_2"],
  &[data-field="possible_key_handover_scheduled_date_3"] { min-width: 180px; }
  &[data-field="vacate_setup"] { min-width: 120px; }
  &[data-field="contract_collection_date"] { min-width: 150px; }
  &[data-field="application_intended_date"] { min-width: 150px; }
  &[data-field="create_date"] { min-width: 120px; }
  /* 物件情報のフィールド */
  &[data-field="property_name"] { min-width: 180px; }
  &[data-field="property_address"] { min-width: 200px; }
  &[data-field="property_type"] { min-width: 120px; }
  &[data-field="property_manager"] { min-width: 150px; }
  &[data-field="property_note"] { min-width: 200px; }
  /* lead_room_type_nameは削除 */
`;
const ReadOnlyTableCell = styled.td`
  border: 1px solid #dee2e6;
  padding: 8px;
  vertical-align: middle;
  font-size: 13px;
  cursor: pointer;
  position: relative;
  white-space: nowrap; /* 追加: 改行を防ぐ */
  overflow: hidden; /* 追加: はみ出したテキストを隠す */
  text-overflow: ellipsis; /* 追加: はみ出したテキストを「...」で表示 */

  
  &:hover {
    background: #e3f2fd;
  }
  
  &.changed {
    background: linear-gradient(135deg, #fff3cd 0%, #ffffff 100%);
  }
  
  /* 8列目（部屋名）のみを固定 */
  &.fixed-column {
    position: sticky;
    background: white;
    z-index: 5;
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1); /* 影を追加して区切りを明確に */
  }
  
  &.fixed-column-8 {
    left: 0; /* 左端に固定 */
    min-width: 120px;
    width: 120px;
  }
  
  /* 変更があった場合の背景色を固定列でも適用 */
  &.fixed-column.changed {
    background: linear-gradient(135deg, #fff3cd 0%, #ffffff 100%);
  }
  
  &.fixed-column:hover {
    background: #e3f2fd;
  }
`;

// 列フィルターの入力スタイル
const ColumnFilterInput = styled.input`
    width: calc(100% - 16px);
    padding: 4px 8px;
    margin-top: 5px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 12px;
    box-sizing: border-box;
    &:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 1px rgba(0, 123, 255, 0.25);
    }
`;

const ColumnFilterSelect = styled.select`
    width: calc(100% - 16px);
    padding: 4px 8px;
    margin-top: 5px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 12px;
    box-sizing: border-box;
    &:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 1px rgba(0, 123, 255, 0.25);
    }
`;

const ColumnFilterDateRange = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 5px;

    input {
        width: 100%;
        padding: 4px 8px;
        margin-bottom: 2px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 12px;
        box-sizing: border-box;

        &:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 1px rgba(0, 123, 255, 0.25);
        }
    }
    span {
        font-size: 10px;
        color: #555;
        text-align: center;
        margin: 0;
    }
`;


const EditableTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  background: ${({ $yellowtheme, $greentheme }) =>
        $yellowtheme ? '#fffde7'
            : $greentheme ? '#e8f5e9'
                : 'white'};
`;
const EditableTableHeader = styled.th`
  background: ${({ $yellowtheme, $greentheme }) =>
        $yellowtheme ? '#fff9c4'
            : $greentheme ? '#b9f6ca'
                : '#e8f4fd'};
  border: 1px solid ${({ $yellowtheme, $greentheme }) =>
        $yellowtheme ? '#ffe082'
            : $greentheme ? '#69f0ae'
                : '#b3d9f7'};
  padding: 10px 8px;
  text-align: left;
  font-weight: 600;
  color: ${({ $yellowtheme, $greentheme }) =>
        $yellowtheme ? '#7c6f00'
            : $greentheme ? '#00695c'
                : '#0c5aa6'};
  font-size: 13px;
  white-space: nowrap;

  /* 各列のmin-widthを追加 */
  &[data-field="id"] { min-width: 100px; }
  &[data-field="property_id"] { min-width: 100px; }
  &[data-field="name"] { min-width: 180px; }
  &[data-field="room_number"] { min-width: 100px; }
  &[data-field="status"] { min-width: 120px; }
  &[data-field="key_handover_scheduled_date"] { min-width: 150px; }
  &[data-field="possible_key_handover_scheduled_date_1"],
  &[data-field="possible_key_handover_scheduled_date_2"],
  &[data-field="possible_key_handover_scheduled_date_3"] { min-width: 180px; }
  &[data-field="vacate_setup"] { min-width: 120px; }
  &[data-field="contract_collection_date"] { min-width: 150px; }
  &[data-field="application_intended_date"] { min-width: 150px; }
  &[data-field="create_date"] { min-width: 120px; }
`;
const EditableTableCell = styled.td`
  border: 1px solid ${({ $yellowtheme, $greentheme }) =>
        $yellowtheme ? '#ffe082'
            : $greentheme ? '#69f0ae'
                : '#b3d9f7'};
  padding: 8px;
  vertical-align: middle;
  white-space: nowrap;
  background: ${({ $yellowtheme, $greentheme }) =>
        $yellowtheme ? '#fffde7'
            : $greentheme ? '#e8f5e9'
                : 'transparent'};
  
  &.focused {
    background: ${({ $yellowtheme, $greentheme }) =>
        $yellowtheme ? '#fff59d'
            : $greentheme ? '#b9f6ca'
                : '#e3f2fd'};
    box-shadow: inset 0 0 0 2px ${({ $yellowtheme, $greentheme }) =>
        $yellowtheme ? '#ffe082'
            : $greentheme ? '#00c853'
                : '#2196f3'};
  }
`;
const EditableInput = styled.input`
  width: 100%;
  border: none;
  background: transparent;
  padding: 4px;
  font-size: 13px;
  
  &:focus {
    outline: none;
    background: white;
    border: 1px solid #2196f3;
    position: absolute;
    top: -2px;
    right: -2px;
    background: #ff5722;
    color: white;
    font-size: 10px;
    padding: 2px 4px;
    border-radius: 3px;
  z-index: 1;
`;
const PreviewValue = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  margin-top: 4px;
`;
const OriginalValue = styled.span`
  color: #dc3545;
  text-decoration: line-through;
  background: #f8d7da;
  padding: 2px 4px;
  border-radius: 3px;
`;
const NewValueEdit = styled.span`
  color: #28a745;
  background: #d4edda;
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 500;
`;

const PropertyPage = () => {
    // 編集用テーブル下部のタブ状態（React Hooksは関数内で定義）
    const [editSubTab, setEditSubTab] = useState('property'); // 'property'（物件情報）を初期タブに
    // タブ切り替え時にselectedEditCellをリセットするラッパー
    const handleEditSubTabChange = (tab) => {
        setEditSubTab(tab);
        setSelectedEditCell(null);
        setFocusedCell(null);
    }


    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // URL から roomId と roomTypeId パラメータを取得
    const urlParams = new URLSearchParams(location.search);
    const roomIdFromUrl = urlParams.get('roomId');
    const roomTypeIdFromUrl = urlParams.get('roomTypeId');

    const [activeTab, setActiveTab] = useState('edit');
    const [property, setProperty] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [roomsLoading, setRoomsLoading] = useState(false);
    const [roomsError, setRoomsError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState({});
    const [originalData, setOriginalData] = useState({}); // 元のデータを保存
    const [validationErrors, setValidationErrors] = useState({}); // バリデーションエラー

    // データ編集タブ用の状態
    // { tab: "room" | "roomType", id: string, field: string }
    const [selectedEditCell, setSelectedEditCell] = useState(null);
    // フォーカス対象セル（部屋ID・フィールド名）
    const [focusedCell, setFocusedCell] = useState(null);
    useEffect(() => {
        if (focusedCell) {
            console.log('[PropertyPage] focusedCell changed:', focusedCell);
        }
    }, [focusedCell]);
    // 部屋関連カラム一覧（fromRoomTypeやfromPropertyを除外）
    const ROOM_RELATED_FIELDS = Object.keys(ROOM_INFO_FIELD_CONFIG);
    const [editChanges, setEditChanges] = useState(new Map());
    const [detailedRoomData, setDetailedRoomData] = useState([]);
    // 編集タブ用: 編集後のrowsを保持
    // サブタブごとに編集内容を保持
    const [editTabRows, setEditTabRows] = useState({}); // { room: [...], roomType: [...], property: [...] }

    // 差分判定: 元データと編集後rowsを比較し、変更セルを特定
    function getChangedCells(originalRows, editedRows, propertyOriginal = null, propertyEdited = null) {
        const changed = {};
        const origMap = {};
        originalRows.forEach(row => { origMap[row.id] = row; });
        editedRows.forEach(row => {
            const orig = origMap[row.id];
            if (!orig) return;
            Object.keys(row).forEach(field => {
                if (row[field] !== orig[field]) {
                    if (!changed[row.id]) changed[row.id] = {};
                    changed[row.id][field] = true;
                }
            });
        });
        // 物件情報カラムの差分判定
        if (propertyOriginal && propertyEdited) {
            Object.keys(propertyEdited).forEach(field => {
                if (propertyEdited[field] !== propertyOriginal[field]) {
                    // 全部屋の物件カラムにchangedを付与
                    Object.keys(origMap).forEach(roomId => {
                        if (!changed[roomId]) changed[roomId] = {};
                        changed[roomId][field] = true;
                    });
                }
            });
        }
        return changed;
    }

    // 編集タブでのみ: プレビュー用rowsと差分
    // サブタブごとに編集内容を保持
    const isEditTab = activeTab === 'edit';
    // 現在のサブタブの編集内容
    const currentEditRows = editTabRows[editSubTab] || null;
    // プレビュー内容をサブタブ切り替えで維持するためのstate
    const [previewRows, setPreviewRows] = useState([]);

    // 編集内容やデータが変わったときのみプレビューを更新（サブタブ切り替え時は更新しない）
    // 編集内容やAPIデータが更新されたときだけプレビューを上書きし、サブタブ切り替えでは消さない
    useEffect(() => {
        if (!isEditTab) {
            setPreviewRows([]);
            return;
        }
        // すべての編集内容をマージしてプレビュー表示
        let rows = [...detailedRoomData];
        console.log('[Preview生成] detailedRoomData:', detailedRoomData);
        // room編集
        if (editTabRows.room && editTabRows.room.length > 0) {
            console.log('[Preview生成] editTabRows.room:', editTabRows.room);
            rows = editTabRows.room;
        }
        // roomType編集（roomTypeDetailにマージ）
        if (editTabRows.roomType && editTabRows.roomType.length > 0) {
            console.log('[Preview生成] editTabRows.roomType:', editTabRows.roomType);
            const roomTypeEditMap = new Map(editTabRows.roomType.map(row => [row.id, row]));
            rows = (editTabRows.room && editTabRows.room.length > 0 ? editTabRows.room : detailedRoomData).map(row => {
                if (row.roomTypeDetail) {
                    const typeId = row.roomTypeDetail.room_type_id || row.roomTypeDetail.id;
                    const editRow = roomTypeEditMap.get(typeId);
                    console.log('[Preview生成] roomTypeDetail typeId:', typeId, 'roomTypeDetail:', row.roomTypeDetail);
                    console.log('[Preview生成] editRow:', editRow);
                    if (editRow) {
                        // 編集rowのkeyをroomTypeDetailのkeyに変換してマージ
                        const convertedEditRow = {};
                        Object.keys(editRow).forEach(key => {
                            // ROOM_TYPE_FIELD_CONFIGからfromRoomTypeを取得
                            const conf = ROOM_TYPE_FIELD_CONFIG[key];
                            const targetKey = conf && conf.fromRoomType ? conf.fromRoomType : key;
                            convertedEditRow[targetKey] = editRow[key];
                            console.log(`[Preview生成] マージ: key=${key} → targetKey=${targetKey} 元値=${row.roomTypeDetail[targetKey]} 編集値=${editRow[key]}`);
                        });
                        const mergedDetail = { ...row.roomTypeDetail, ...convertedEditRow };
                        console.log('[Preview生成] マージ後 roomTypeDetail:', mergedDetail);
                        return {
                            ...row,
                            roomTypeDetail: mergedDetail
                        };
                    }
                }
                return row;
            });
        }
        // property編集（propertyサブタブ時のみ、property系フィールドのみマージ）
        if (editTabRows.property && editTabRows.property.length > 0 && editSubTab === 'property') {
            console.log('[Preview生成] editTabRows.property:', editTabRows.property);
            const propertyRow = editTabRows.property[0];
            // property系フィールドのみ抽出
            const propertyFields = Object.keys(propertyRow).filter(f => PROPERTY_FIELD_CONFIG[f]);
            rows = rows.map(row => {
                const newRow = { ...row };
                propertyFields.forEach(f => {
                    newRow[f] = propertyRow[f];
                });
                return newRow;
            });
        }
        if (rows && rows.length > 0) {
            const sortedRows = [...rows].sort((a, b) => {
                const nameA = (a.name || '').toString();
                const nameB = (b.name || '').toString();
                return nameA.localeCompare(nameB, 'ja', { numeric: true, sensitivity: 'base' });
            });
            console.log('[Preview生成] setPreviewRows:', sortedRows);
            setPreviewRows(sortedRows);
        } else {
            setPreviewRows([]);
        }
    }, [isEditTab, editSubTab, detailedRoomData, editTabRows.room, editTabRows.property, editTabRows.roomType, property]);    // プレビュー内容とAPI取得直後のデータで差分判定
    const changedCells = useMemo(() => {
        if (!isEditTab || !detailedRoomData || !previewRows) return {};
        // 物件情報カラムの差分も渡す
        const propertyOriginal = property || {};
        const propertyEdited = (editTabRows.property && editTabRows.property[0]) || {};
        return getChangedCells(detailedRoomData, previewRows, propertyOriginal, propertyEdited);
    }, [isEditTab, detailedRoomData, previewRows]);
    const [detailedRoomDataLoading, setDetailedRoomDataLoading] = useState(false);
    // ドロワー・部屋ID
    const [selectedRoomId, setSelectedRoomId] = useState(roomIdFromUrl || null);
    const [drawerOpen, setDrawerOpen] = useState(!!roomIdFromUrl);
    // 部屋タイプドロワー
    const [selectedRoomTypeId, setSelectedRoomTypeId] = useState(roomTypeIdFromUrl || null);
    const [roomTypeDrawerOpen, setRoomTypeDrawerOpen] = useState(!!roomTypeIdFromUrl);
    // 部屋タイプリスト
    const [roomTypes, setRoomTypes] = useState([]);
    const [roomTypesLoading, setRoomTypesLoading] = useState(false);
    const [roomTypesError, setRoomTypesError] = useState(null);
    // 検索・ページネーション・選択
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRooms, setSelectedRooms] = useState(new Set());
    const [selectAll, setSelectAll] = useState(false);
    // 部屋タイプページネーション・検索
    const [roomTypeCurrentPage, setRoomTypeCurrentPage] = useState(1);
    const [roomTypeItemsPerPage] = useState(10);
    const [roomTypeSearchTerm, setRoomTypeSearchTerm] = useState('');
    const [roomTypeSelectAll, setRoomTypeSelectAll] = useState(false);
    const [selectedRoomTypes, setSelectedRoomTypes] = useState(new Set());
    // 履歴
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    // 一覧ページネーション
    const [itemsPerPage] = useState(10);

    // RoomDrawer/RoomTypeDrawerのopen/closeハンドラ
    const handleOpenRoomDrawer = useCallback((roomId) => {
        setSelectedRoomId(roomId);
        setDrawerOpen(true);
    }, []);
    const handleCloseRoomDrawer = useCallback(() => {
        setDrawerOpen(false);
        setSelectedRoomId(null);
    }, []);
    const handleOpenRoomTypeDrawer = useCallback((roomTypeId) => {
        setSelectedRoomTypeId(roomTypeId);
        setRoomTypeDrawerOpen(true);
    }, []);
    const handleCloseRoomTypeDrawer = useCallback(() => {
        setRoomTypeDrawerOpen(false);
        setSelectedRoomTypeId(null);
    }, []);
    // URLの変更を監視してドロワー状態を同期
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const roomIdFromUrl = urlParams.get('roomId');
        const roomTypeIdFromUrl = urlParams.get('roomTypeId');

        // 部屋ドロワーの状態を同期
        if (roomIdFromUrl && roomIdFromUrl !== selectedRoomId) {
            setSelectedRoomId(roomIdFromUrl);
            setDrawerOpen(true);
        } else if (!roomIdFromUrl && drawerOpen) {
            setDrawerOpen(false);
            setSelectedRoomId(null);
        }

        // 部屋タイプドロワーの状態を同期
        if (roomTypeIdFromUrl && roomTypeIdFromUrl !== selectedRoomTypeId) {
            setSelectedRoomTypeId(roomTypeIdFromUrl);
            setRoomTypeDrawerOpen(true);
        } else if (!roomTypeIdFromUrl && roomTypeDrawerOpen) {
            setRoomTypeDrawerOpen(false);
            setSelectedRoomTypeId(null);
        }
    }, [location.search, selectedRoomId, drawerOpen, selectedRoomTypeId, roomTypeDrawerOpen]);

    // データ取得 - クライアント側で最適化した一括取得版
    useEffect(() => {
        const fetchPropertyData = async () => {
            try {
                setLoading(true);
                setDetailedRoomDataLoading(true);
                setError(null);

                // 物件データの取得
                console.log(`物件ID ${id} のデータ取得を開始します`);

                // 物件基本データを取得（新API使用）
                const propertyData = await apiService.getPropertyData(id);

                // 詳細データを別途取得
                console.log('詳細データを別途取得します');
                const [allRoomDetails, allRoomTypeDetails] = await Promise.all([
                    apiService.getAllRoomDetails(id),
                    apiService.getAllRoomTypeDetails(id)
                ]);

                // 詳細データを基本データにマージ
                console.log('allRoomDetails lead_room_type_id:', (allRoomDetails || []).map(r => r.lead_room_type_id));
                console.log('allRoomTypeDetails id:', (allRoomTypeDetails || []).map(rt => rt.id));
                const enrichedPropertyData = {
                    ...propertyData,
                    allRoomDetails: allRoomDetails || [],
                    allRoomTypeDetails: allRoomTypeDetails || []
                };

                // 基本データをステートに設定
                setProperty(enrichedPropertyData);
                setEditData(enrichedPropertyData);
                setOriginalData(enrichedPropertyData); // 元のデータを保存

                // 部屋リストと部屋タイプリストを取得
                const roomListData = await apiService.getRoomListFormatted(allRoomDetails);
                setRooms(roomListData || []);
                // 名前で昇順ソート
                const sortedRoomTypes = (allRoomTypeDetails || []).slice().sort((a, b) => {
                    const nameA = (a.name || '').toLowerCase();
                    const nameB = (b.name || '').toLowerCase();
                    if (nameA < nameB) return -1;
                    if (nameA > nameB) return 1;
                    return 0;
                });
                setRoomTypes(sortedRoomTypes);
                // roomTypesステートの内容をログ出力
                setTimeout(() => {
                    console.log('roomTypesステートの内容:', allRoomTypeDetails);
                }, 0);

                console.log('基本データと詳細データの取得完了:', {
                    propertyId: id,
                    propertyName: enrichedPropertyData?.name,
                    hasRelatedRooms: enrichedPropertyData?.has_related_rooms,
                    roomsCount: (roomListData || []).length > 1 ? roomListData.length - 1 : 0,
                    roomTypesCount: (allRoomTypeDetails || []).length,
                    allRoomDetailsCount: allRoomDetails?.length || 0,
                    allRoomTypeDetailsCount: allRoomTypeDetails?.length || 0
                });

                // 編集タブが初期タブのため、関連部屋がある場合は詳細データを処理
                if (enrichedPropertyData?.has_related_rooms && allRoomDetails?.length > 0) {
                    console.log('物件に関連部屋があるため、詳細データを処理します');

                    // 部屋タイプ一覧データとして整形
                    const roomTypeListHeader = ['ID', '部屋タイプ名', '民泊単価', 'マンスリー単価', '収容人数'];
                    const roomTypeListData = [roomTypeListHeader];

                    // 部屋タイプIDをキーにしたマップを作成
                    const roomTypeMap = new Map();
                    allRoomTypeDetails.forEach(roomType => {
                        if (roomType && roomType.id) {
                            roomTypeMap.set(roomType.id, roomType);
                        }
                    });

                    // 詳細データに部屋タイプ情報を関連付け
                    const mergedDetailedData = allRoomDetails.map(roomData => {
                        if (!roomData) return null;

                        // 部屋タイプ詳細を関連付け
                        let roomTypeDetail = null;
                        if (roomData.lead_room_type_id) {
                            roomTypeDetail = roomTypeMap.get(roomData.lead_room_type_id) || null;
                        }

                        return { ...roomData, roomTypeDetail };
                    }).filter(data => data !== null);

                    // 詳細データをステートに設定
                    setDetailedRoomData(mergedDetailedData);
                    console.log('詳細データの一括取得・整形完了:', {
                        detailedRoomsCount: mergedDetailedData.length,
                        roomTypesCount: roomTypeMap.size,
                        mergedDetailedData: mergedDetailedData
                    });
                } else {
                    // 関連部屋がない場合は空配列を設定
                    setDetailedRoomData([]);
                }
            } catch (err) {
                setError(err.message || 'データの取得中にエラーが発生しました');
                console.error('データ取得エラー:', err);
            } finally {
                setLoading(false);
                setRoomsLoading(false);
                setRoomTypesLoading(false);
                setDetailedRoomDataLoading(false);
            }
        };

        if (id) {
            fetchPropertyData();
        }
    }, [id]);

    // 部屋データの手動更新（更新ボタン用）
    // eslint-disable-next-line no-unused-vars
    const fetchRoomsData = async () => {
        try {
            setRoomsLoading(true);
            setRoomsError(null);
            // BigQueryから部屋データを取得（新APIを使用）
            const roomData = await apiService.getRoomListFormatted([]);
            setRooms(roomData || []);
            // 検索結果をリセット
            setSearchTerm('');
            setCurrentPage(1);
            setSelectedRooms(new Set());
            setSelectAll(false);
        } catch (err) {
            setRoomsError(err.message || '部屋データの取得中にエラーが発生しました');
        } finally {
            setRoomsLoading(false);
        }
    };

    // 部屋タイプデータの手動更新（更新ボタン用）
    // eslint-disable-next-line no-unused-vars
    const fetchRoomTypesData = async () => {
        try {
            setRoomTypesLoading(true);
            setRoomTypesError(null);
            // 部屋タイプデータを取得（新APIを使用）
            const roomTypeData = await apiService.getRoomTypeListFormatted(id);
            setRoomTypes(roomTypeData || []);
        } catch (err) {
            setRoomTypesError(err.message || '部屋タイプデータの取得中にエラーが発生しました');
        } finally {
            setRoomTypesLoading(false);
        }
    };

    // 検索時のページリセット
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // 部屋タイプ検索時のページリセット
    useEffect(() => {
        setRoomTypeCurrentPage(1);
    }, [roomTypeSearchTerm]);


    // 値をフォーマットするヘルパー関数（部屋ドロワーと同じ）
    const formatRoomValue = useCallback((field, value) => {
        if (value === null || value === undefined || value === '') {
            return '';
        }
        const fieldConfig = ROOM_FIELD_CONFIG[field];

        // 日付フィールドの場合
        if (fieldConfig?.type === 'date') {
            try {
                const actualDateValue = value && typeof value === 'object' && value.value
                    ? value.value
                    : value;

                if (actualDateValue) {
                    const date = new Date(actualDateValue);
                    if (!isNaN(date.getTime())) {
                        return date.toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                        });
                    }
                }
            } catch (error) {
                console.error(`Error formatting date for field ${field}:`, error);
            }
        }
        return String(value);
    }, []);

    // 編集可能かどうかを判定する関数
    const isFieldEditable = useCallback((field) => {
        const fieldConfig = ROOM_FIELD_CONFIG[field];
        return fieldConfig?.editable === true;
    }, []);

    // データ編集タブのハンドラー関数
    // tab: "room" | "roomType", id: 部屋ID or 部屋タイプID, field: カラム名
    const handleReadOnlyCellClick = useCallback((tab, id, field) => {
        const cell = { tab, id, field };
        console.log('selectedEditCell:', cell);
        setSelectedEditCell(cell);
        // read-only table からは setFocusedCell を呼ばない（編集テーブルのみで呼ぶ）
    }, []);
    useEffect(() => {
        if (selectedEditCell && editSubTab !== selectedEditCell.tab) {
            setEditSubTab(selectedEditCell.tab);
        }
    }, [selectedEditCell]);

    // selectedEditCellの内容をfocusedCellに反映（編集テーブルで自動フォーカス・編集モードに入る）
    useEffect(() => {
        if (!selectedEditCell) return;
        // サブタブが切り替わった直後は編集テーブルのrowsがまだ切り替わっていない場合があるので、少し遅延させる
        const timer = setTimeout(() => {
            let rowId = null;
            let rows = [];
            if (selectedEditCell.tab === 'room') {
                rowId = selectedEditCell.id;
                rows = editTabRows.room || detailedRoomData;
            } else if (selectedEditCell.tab === 'property') {
                rowId = property?.id || (editTabRows.property && editTabRows.property[0]?.id);
                // propertyはrowsが空の場合でもpropertyデータから1行生成
                if (editTabRows.property && editTabRows.property.length > 0) {
                    rows = editTabRows.property;
                } else if (property) {
                    // columnsのfield名に合わせてpropertyをマッピング
                    const propCols = getPropertyInfoColumnsForEditableTable();
                    const row = {};
                    propCols.forEach(col => {
                        const conf = PROPERTY_FIELD_CONFIG[col.field];
                        if (conf && conf.fromProperty) {
                            row[col.field] = property[conf.fromProperty];
                        } else {
                            row[col.field] = property[col.field];
                        }
                    });
                    row.id = property.id;
                    rows = [row];
                } else {
                    rows = [];
                }
            } else if (selectedEditCell.tab === 'roomType') {
                rowId = selectedEditCell.id;
                rows = editTabRows.roomType || [];
            }
            // rowsにrowIdが存在し、columnsにfieldが存在する場合のみfocusedCellに渡す
            const exists = rows.some(row => row && row.id === rowId);
            // columns取得（RoomInfoEditableTableに渡すcolumnsと同じロジック）
            let columns = [];
            if (selectedEditCell.tab === 'room') {
                const row = (editTabRows.room && editTabRows.room.length > 0 ? editTabRows.room[0] : detailedRoomData[0]) || {};
                columns = Object.keys(row).filter(f => f !== 'actions').map(f => ({ field: f }));
            } else if (selectedEditCell.tab === 'property') {
                if (rows.length > 0) {
                    columns = Object.keys(rows[0]).map(f => ({ field: f }));
                } else {
                    columns = [];
                }
            } else if (selectedEditCell.tab === 'roomType') {
                columns = (editTabRows.roomType && editTabRows.roomType.length > 0 && Array.isArray(editTabRows.roomType))
                    ? Object.keys(editTabRows.roomType[0] || {}).map(f => ({ field: f }))
                    : [];
            }
            const fieldExists = columns.some(col => col.field === selectedEditCell.field);
            if (rowId && selectedEditCell.field && exists && fieldExists) {
                setFocusedCell({ rowId, field: selectedEditCell.field });
            } else {
                setFocusedCell(null);
            }
        }, 100); // 100ms遅延
        return () => clearTimeout(timer);
    }, [selectedEditCell, editSubTab, property, editTabRows, detailedRoomData]);

    const handleEditCellChange = useCallback((roomIndex, field, value) => {
        // 部屋タイプ情報タブの場合（roomIndex === -1）
        if (roomIndex === -1) {
            // selectedEditCellからroomTypeIdを取得
            const roomTypeId = selectedEditCell?.id;
            if (!roomTypeId) return;
            // fieldはROOM_TYPE_FIELD_CONFIGのfromRoomType名に変換
            const config = ROOM_TYPE_FIELD_CONFIG[field];
            const fromRoomType = config?.fromRoomType || field;
            const cellKey = `${roomTypeId}-${fromRoomType}`;
            // originalValue取得
            let originalValue = '';
            // roomTypeDetailを検索
            const allRoomTypes = [];
            const seenIds = new Set();
            detailedRoomData.forEach((room) => {
                const rt = room.roomTypeDetail;
                if (!rt) return;
                const typeId = rt.room_type_id || rt.id;
                if (!typeId || seenIds.has(typeId)) return;
                seenIds.add(typeId);
                allRoomTypes.push({ roomTypeDetail: rt, id: typeId });
            });
            const target = allRoomTypes.find(item => item.id === roomTypeId);
            if (target && target.roomTypeDetail) {
                const v = target.roomTypeDetail[fromRoomType];
                originalValue = (v && typeof v === 'object' && 'value' in v) ? v.value : v;
            }
            // 日付の場合はISO文字列に変換して比較
            const normalizedValue = config?.type === 'date' && value ? new Date(value).toISOString().split('T')[0] : value;
            const normalizedOriginalValue = config?.type === 'date' && originalValue ? new Date(originalValue).toISOString().split('T')[0] : originalValue;
            // ログ出力
            console.log('[部屋タイプ編集] handleEditCellChange', {
                roomTypeId,
                field,
                fromRoomType,
                value,
                cellKey,
                originalValue,
                normalizedValue,
                normalizedOriginalValue,
                editChanges: Array.from(editChanges.entries())
            });
            setEditChanges(prev => {
                const newChanges = new Map(prev);
                if (normalizedValue === normalizedOriginalValue || (normalizedValue === '' && (normalizedOriginalValue === null || normalizedOriginalValue === undefined))) {
                    newChanges.delete(cellKey);
                } else {
                    newChanges.set(cellKey, value);
                }
                // ログ出力
                console.log('[部屋タイプ編集] setEditChanges後', Array.from(newChanges.entries()));
                return newChanges;
            });
            // 追加: 編集内容を明示的にログ
            console.log('[部屋タイプ編集] editChangesに記録:', { cellKey, value });
            return;
        }
        // 通常の部屋タブ
        const room = detailedRoomData[roomIndex];
        if (!room) return;
        const cellKey = `${room.id}-${field}`;
        const originalValue = room[field];
        setEditChanges(prev => {
            const newChanges = new Map(prev);
            // 日付の場合はISO文字列に変換して比較
            const normalizedValue = ROOM_FIELD_CONFIG[field]?.type === 'date' && value ? new Date(value).toISOString().split('T')[0] : value;
            const normalizedOriginalValue = ROOM_FIELD_CONFIG[field]?.type === 'date' && originalValue ? new Date(originalValue).toISOString().split('T')[0] : originalValue;
            if (normalizedValue === normalizedOriginalValue || (normalizedValue === '' && (normalizedOriginalValue === null || normalizedOriginalValue === undefined))) {
                // 元の値と同じ場合は変更を削除
                newChanges.delete(cellKey);
            } else {
                // 変更がある場合は追加
                newChanges.set(cellKey, value);
            }
            return newChanges;
        });
    }, [detailedRoomData, selectedEditCell]);

    const handleResetChanges = useCallback(() => {
        setEditChanges(new Map());
        setSelectedEditCell(null);
    }, []);

    // 詳細な部屋データを取得する関数（一括取得版）
    const fetchDetailedRoomData = useCallback(async () => {
        if (!property || !property.has_related_rooms) return;

        try {
            setDetailedRoomDataLoading(true);

            // 物件に関連する全ての部屋詳細と部屋タイプ詳細を一括取得
            console.log(`物件ID ${id} の全詳細データを一括取得します`);

            // 新しいAPIメソッドを使用して一括取得
            const propertyWithDetails = await apiService.getPropertyData(id);
            const allRoomDetails = propertyWithDetails.allRoomDetails || [];
            const allRoomTypeDetails = propertyWithDetails.allRoomTypeDetails || [];

            // 部屋タイプIDをキーにしたマップを作成
            const roomTypeMap = new Map();
            allRoomTypeDetails.forEach(roomType => {
                if (roomType && roomType.id) {
                    roomTypeMap.set(roomType.id, roomType);
                }
            });

            // 部屋データに部屋タイプ詳細を関連付け
            const mergedData = allRoomDetails.map(roomData => {
                if (!roomData) return null;

                let roomTypeDetail = null;
                if (roomData.lead_room_type_id) {
                    roomTypeDetail = roomTypeMap.get(roomData.lead_room_type_id) || null;
                }

                return { ...roomData, roomTypeDetail };
            }).filter(data => data !== null);

            setDetailedRoomData(mergedData);
            console.log('全詳細データの一括取得完了:', {
                roomsCount: mergedData.length,
                roomTypesCount: roomTypeMap.size
            });

        } catch (error) {
            console.error('詳細部屋データの一括取得に失敗:', error);
        } finally {
            setDetailedRoomDataLoading(false);
        }
    }, [property, id]);


    const handleSaveChanges = useCallback(async () => {
        if (editChanges.size === 0) return;

        try {
            // TODO: API に変更データを送信する実装を追加
            console.log('保存する変更:', Array.from(editChanges.entries()));

            // 変更データを部屋ごとにグループ化
            const changesByRoom = new Map();
            editChanges.forEach((value, key) => {
                const [roomId, field] = key.split('-');
                if (!changesByRoom.has(roomId)) {
                    changesByRoom.set(roomId, {});
                }
                changesByRoom.get(roomId)[field] = value;
            });
            console.log('部屋ごとの変更:', Array.from(changesByRoom.entries()));

            // 仮の保存処理
            alert(`${changesByRoom.size}つの部屋で${editChanges.size}件の変更を保存しました。\n（現在はプレビュー機能のみです）`);

            // 保存後に変更をクリア
            setEditChanges(new Map());
            setSelectedEditCell(null);

            // データを再取得
            await fetchDetailedRoomData();

        } catch (error) {
            console.error('保存エラー:', error);
            alert('保存中にエラーが発生しました: ' + error.message);
        }
    }, [editChanges, fetchDetailedRoomData]);

    // データ編集タブがアクティブになったときに詳細データを取得
    // 注：一括取得方式に変更したため、初期ロード時に全データを取得するようになりました
    // このuseEffectは後方互換性のために残しています
    useEffect(() => {
        // 既に詳細データが取得済みであれば何もしない
        if (detailedRoomData.length > 0) {
            return;
        }

        // property.has_related_rooms が true で、かつ rooms.length > 1 (ヘッダー以外のデータがある) の場合のみ実行
        if (activeTab === 'edit' && property && property.has_related_rooms && rooms.length > 1) {
            console.log('タブ切り替えによる詳細データ取得（通常は初期ロードで既に取得済み）');
            fetchDetailedRoomData();
        }
    }, [activeTab, fetchDetailedRoomData, property, rooms.length, detailedRoomData.length]);


    const filteredRooms = useMemo(() => {
        if (rooms.length <= 1) return []; // ヘッダーのみの場合は空配列を返す

        const roomsData = rooms.slice(1); // ヘッダーを除く

        if (!searchTerm) return roomsData;

        const lowerSearchTerm = searchTerm.toLowerCase();

        return roomsData.filter(room => {
            const roomName = room[2]; // 部屋名のカラム
            return roomName && roomName.toLowerCase().includes(lowerSearchTerm);
        });
    }, [rooms, searchTerm]);

    // ページネーション用の計算 - メモ化
    const paginationData = useMemo(() => {
        const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentRooms = filteredRooms.slice(startIndex, endIndex);

        return { totalPages, currentRooms, startIndex, endIndex };
    }, [filteredRooms, currentPage, itemsPerPage]);

    const { totalPages, currentRooms, startIndex, endIndex } = paginationData;

    // 部屋タイプのフィルタリング
    const filteredRoomTypes = useMemo(() => {
        if (!roomTypes || roomTypes.length === 0) return [];

        if (!roomTypeSearchTerm) return roomTypes;

        const lowerSearchTerm = roomTypeSearchTerm.toLowerCase();

        return roomTypes.filter(roomType => {
            const roomTypeName = roomType.room_type_name || roomType.name;
            const roomTypeId = roomType.room_type_id || roomType.id; // room_type_id がない場合のフォールバック

            return (roomTypeName && roomTypeName.toLowerCase().includes(lowerSearchTerm)) ||
                (roomTypeId && roomTypeId.toString().toLowerCase().includes(lowerSearchTerm));
        });
    }, [roomTypes, roomTypeSearchTerm]);

    // 部屋タイプのページネーション用の計算
    const roomTypePaginationData = useMemo(() => {
        const totalPages = Math.ceil(filteredRoomTypes.length / roomTypeItemsPerPage);
        const startIndex = (roomTypeCurrentPage - 1) * roomTypeItemsPerPage;
        const endIndex = startIndex + roomTypeItemsPerPage;
        const currentRoomTypes = filteredRoomTypes.slice(startIndex, endIndex);

        return { totalPages, currentRoomTypes, startIndex, endIndex };
    }, [filteredRoomTypes, roomTypeCurrentPage, roomTypeItemsPerPage]);

    const {
        totalPages: roomTypeTotalPages,
        currentRoomTypes,
        startIndex: roomTypeStartIndex,
        endIndex: roomTypeEndIndex
    } = roomTypePaginationData;


    // チェックボックス関連の処理 - useCallbackで最適化
    const handleSelectAll = useCallback((checked) => {
        setSelectAll(checked);
        if (checked) {
            const allRoomIds = currentRooms.map(room => room[1]); // 部屋IDのカラム
            setSelectedRooms(new Set(allRoomIds));
        } else {
            setSelectedRooms(new Set());
        }
    }, [currentRooms]);

    const handleRoomSelect = useCallback((roomId, checked) => {
        const newSelected = new Set(selectedRooms);
        if (checked) {
            newSelected.add(roomId);
        } else {
            newSelected.delete(roomId);
        }
        setSelectedRooms(newSelected);

        // 全選択状態の更新
        setSelectAll(newSelected.size === currentRooms.length && currentRooms.length > 0);
    }, [selectedRooms, currentRooms.length]);

    // 一括操作
    const handleBulkUpdate = () => {
        if (selectedRooms.size === 0) {
            alert('部屋が選択されていません。');
            return;
        }
        const selectedRoomIds = Array.from(selectedRooms);
        // TODO: 一括更新ページへの遷移を実装
        alert(`選択された部屋（${selectedRoomIds.length}件）の一括更新機能は今後実装予定です。\n部屋ID: ${selectedRoomIds.join(', ')}`);
    };

    const handleBulkDelete = () => {
        if (selectedRooms.size === 0) {
            alert('部屋が選択されていません。');
            return;
        }

        const selectedRoomData = currentRooms.filter(room => selectedRooms.has(room[1]));
        const roomNames = selectedRoomData.map(room => room[2]).join(', '); // 部屋名を表示

        if (window.confirm(`以下の部屋を削除しますか？\n${roomNames}`)) {
            // TODO: 削除処理の実装
            alert('一括削除機能は今後実装予定です。');
        }
    };

    const handleRoomDelete = (roomId, roomName) => {
        if (window.confirm(`部屋「${roomName}」を削除しますか？`)) {
            // TODO: 個別削除処理の実装
            alert('個別削除機能は今後実装予定です。');
        }
    };

    // 部屋タイプのチェックボックス関連処理
    const handleRoomTypeSelectAll = useCallback((checked) => {
        setRoomTypeSelectAll(checked);
        if (checked) {
            const allRoomTypeIds = currentRoomTypes.map(roomType => roomType.room_type_id || roomType.id);
            setSelectedRoomTypes(new Set(allRoomTypeIds));
        } else {
            setSelectedRoomTypes(new Set());
        }
    }, [currentRoomTypes]);

    const handleRoomTypeSelect = useCallback((roomTypeId, checked) => {
        const newSelected = new Set(selectedRoomTypes);
        if (checked) {
            newSelected.add(roomTypeId);
        } else {
            newSelected.delete(roomTypeId);
        }
        setSelectedRoomTypes(newSelected);

        // 全選択状態の更新
        setRoomTypeSelectAll(newSelected.size === currentRoomTypes.length && currentRoomTypes.length > 0);
    }, [selectedRoomTypes, currentRoomTypes.length]);

    // 部屋タイプの一括操作
    const handleRoomTypeBulkUpdate = () => {
        if (selectedRoomTypes.size === 0) {
            alert('部屋タイプが選択されていません。');
            return;
        }
        const selectedRoomTypeIds = Array.from(selectedRoomTypes);
        alert(`選択された部屋タイプ（${selectedRoomTypeIds.length}件）の一括更新機能は今後実装予定です。\n部屋タイプID: ${selectedRoomTypeIds.join(', ')}`);
    };

    const handleRoomTypeBulkDelete = () => {
        if (selectedRoomTypes.size === 0) {
            alert('部屋タイプが選択されていません。');
            return;
        }

        const selectedRoomTypeData = currentRoomTypes.filter(roomType => selectedRoomTypes.has(roomType.room_type_id || roomType.id));
        const roomTypeNames = selectedRoomTypeData.map(roomType => roomType.room_type_name || roomType.name).join(', ');

        if (window.confirm(`以下の部屋タイプを削除しますか？\n${roomTypeNames}`)) {
            alert('一括削除機能は今後実装予定です。');
        }
    };

    const handleRoomTypeDelete = (roomTypeId, roomTypeName) => {
        if (window.confirm(`部屋タイプ「${roomTypeName}」を削除しますか？`)) {
            alert('個別削除機能は今後実装予定です。');
        }
    };

    // 編集データの更新 - useCallbackで最適化
    const handleInputChange = useCallback((field, value) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));

        // バリデーション実行（必須項目のみ）
        let validation = { isValid: true, errorMessage: '' };
        if (field === 'name') {
            validation = validatePropertyName(value);
        }

        // バリデーションエラーの状態を更新
        setValidationErrors(prev => ({
            ...prev,
            [field]: validation.isValid ? '' : validation.errorMessage
        }));
    }, []);

    // 全体バリデーションチェック（必須項目のみ）
    const validateAllFields = useCallback(() => {
        const errors = {};
        let hasErrors = false;

        // 建物名のバリデーション（必須項目）
        const nameValidation = validatePropertyName(editData.name);
        if (!nameValidation.isValid) {
            errors.name = nameValidation.errorMessage;
            hasErrors = true;
        }

        // lead_from のバリデーション（必須項目）
        if (!editData.lead_from || editData.lead_from.trim() === '') {
            errors.lead_from = 'lead元は必須項目です。';
            hasErrors = true;
        }

        setValidationErrors(errors);
        return !hasErrors;
    }, [editData]);

    // 履歴データ取得
    const fetchHistoryData = useCallback(async () => {
        if (!id) return;
        try {
            setHistoryLoading(true);
            setHistoryError(null);
            console.log(`物件変更履歴を取得中: ID=${id}`);
            const historyResponse = await apiService.getPropertyHistory(id);
            if (historyResponse && historyResponse.length > 0) {
                setHistoryData(historyResponse);
                console.log('物件変更履歴を取得しました:', historyResponse);
            } else {
                setHistoryData([]);
                console.log('変更履歴はありません');
            }
        } catch (error) {
            console.error('Error fetching property history:', error);
            setHistoryError('変更履歴の取得に失敗しました');
        } finally {
            setHistoryLoading(false);
        }
    }, [id]);

    // 履歴の日付をフォーマットするヘルパー関数
    const formatHistoryDate = (dateValue) => {
        if (!dateValue) {
            return '日付不明';
        }
        try {
            let date;
            if (typeof dateValue === 'object' && dateValue.value) {
                date = new Date(dateValue.value);
            } else if (typeof dateValue === 'string') {
                date = new Date(dateValue);
                if (isNaN(date.getTime())) {
                    const isoDate = dateValue.includes('T') ? dateValue : dateValue.replace(' ', 'T');
                    date = new Date(isoDate);
                }
                if (isNaN(date.getTime())) {
                    const dateMatch = dateValue.match(/(\d{4}-\d{2}-\d{2})/);
                    if (dateMatch) {
                        date = new Date(dateMatch[1]);
                    }
                }
            } else {
                date = new Date(dateValue);
            }

            if (isNaN(date.getTime())) {
                console.warn('Invalid date value:', dateValue);
                return `Invalid Date (${dateValue})`;
            }

            return date.toLocaleString('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (error) {
            console.error('Error formatting date:', dateValue, error);
            return `日付エラー (${dateValue})`;
        }
    };

    // 履歴の値をフォーマットするヘルパー関数
    const formatHistoryValue = (value) => {
        if (value === null || value === undefined || value === '') {
            return '(空)';
        }

        // オブジェクト形式の値を処理
        if (typeof value === 'object' && value !== null) {
            // BigQueryから取得した日付データ等の処理
            if (value.value !== undefined) {
                return formatHistoryValue(value.value);
            }
            // その他のオブジェクトはJSON文字列として表示（デバッグ用）
            return JSON.stringify(value);
        }

        // 日付形式の値を処理
        if (typeof value === 'string') {
            // 日付形式の場合
            if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/) || value.match(/^\d{4}-\d{2}-\d{2}$/)) {
                try {
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) {
                        return date.toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    }
                } catch (error) {
                    console.warn('日付フォーマットエラー:', error);
                }
            }
            // 通常の文字列値
            return value;
        }

        return String(value);
    };

    // フィールド名を表示名に変換するヘルパー関数
    const getFieldDisplayName = (fieldName) => {
        // ROOM_FIELD_CONFIGから取得を試みる
        if (ROOM_FIELD_CONFIG[fieldName] && ROOM_FIELD_CONFIG[fieldName].label) {
            return ROOM_FIELD_CONFIG[fieldName].label;
        }

        const fieldNames = {
            'name': '建物名',
            'tag': 'タグ',
            'is_trade': '売買',
            'is_lease': '借上',
            'lead_from': 'lead元',
            'is_fund': 'ファンド物件',
            'lead_channel': 'Leadチャネル',
            'trade_form': '取引形態',
            'lead_from_representative': '先方担当',
            'lead_from_tel': '担当者tel',
            'lead_from_mail': '担当者mail',
            'minpaku_feasibility': 'minpaku可否',
            'sp_feasibility': 'SP必要性',
            'done_property_viewing': '内見済み',
            'done_antisocial_check': '反社チェック済み',
            'memo': 'メモ'
            // 他の物件プロパティもここに追加
        };
        return fieldNames[fieldName] || fieldName; // 見つからない場合はそのまま返す
    };


    // 保存処理
    const handleSave = async () => {
        try {
            setLoading(true);
            setError('');

            // バリデーション実行
            if (!validateAllFields()) {
                alert('入力内容にエラーがあります。エラーメッセージを確認してください。');
                setLoading(false);
                return;
            }

            // 必須項目チェック（バリデーション済みだが念のため）
            if (!editData.name || editData.name.trim() === '') {
                alert('建物名は必須項目です。');
                setLoading(false);
                return;
            }
            if (!editData.lead_from || editData.lead_from.trim() === '') {
                alert('lead元は必須項目です。');
                setLoading(false);
                return;
            }

            // 変更されたフィールドのみを抽出
            const changedFields = {};
            const excludeFields = ['has_related_rooms', 'create_date']; // 更新対象外のフィールド

            for (const key in editData) {
                if (editData.hasOwnProperty(key) &&
                    key !== 'id' &&
                    !excludeFields.includes(key)) {

                    // 値の正規化（null, undefined, 空文字を統一）
                    const normalizeValue = (value) => {
                        if (value === null || value === undefined || value === '') {
                            return null;
                        }
                        return value;
                    };

                    const normalizedNewValue = normalizeValue(editData[key]);
                    const normalizedOriginalValue = normalizeValue(originalData[key]);


                    // 値が変更されている場合のみ送信対象に含める
                    // Dateオブジェクトを直接比較するとfalseになるため、プリミティブ値で比較
                    if (normalizedNewValue !== normalizedOriginalValue) {
                        changedFields[key] = editData[key];
                        console.log(`フィールド ${key} が変更されました: "${normalizedOriginalValue}" -> "${normalizedNewValue}"`);
                    }
                }
            }

            // 変更がない場合はアラートを表示
            if (Object.keys(changedFields).length === 0) {
                alert('変更されたデータがありません。');
                setLoading(false);
                return;
            }

            console.log('送信する変更データ:', changedFields);

            // BigQueryの物件データを更新（変更されたフィールドのみ）
            const response = await apiService.updatePropertyData(id, changedFields);

            if (response.success) {
                setEditMode(false);

                // 建物名変更時の成功メッセージを表示
                let successMessage = '保存しました';
                if (changedFields.name && property?.has_related_rooms) {
                    console.log(`建物名変更を検出:`, {
                        oldName: originalData.name,
                        newName: changedFields.name,
                        hasRelatedRooms: property?.has_related_rooms
                    });
                    try {
                        const startTime = performance.now();
                        console.log('一括部屋名更新を開始...');
                        const bulkUpdateResult = await apiService.bulkUpdateRoomNames(
                            id,
                            originalData.name,
                            changedFields.name,
                            'user'
                        );
                        const endTime = performance.now();
                        const duration = Math.round(endTime - startTime);
                        console.log('一括部屋名更新結果:', {
                            ...bulkUpdateResult,
                            performanceMs: duration
                        });

                        if (bulkUpdateResult.success && bulkUpdateResult.updatedCount > 0) {
                            successMessage += `\n部屋名も自動更新されました（${bulkUpdateResult.updatedCount}件、${duration}ms）`;
                            // 部屋データを再取得
                            try {
                                const roomRefreshStart = performance.now();
                                const updatedRoomsData = await apiService.getRoomListFormatted([]);
                                setRooms(updatedRoomsData || []);
                                const roomRefreshEnd = performance.now();
                                console.log(`部屋データ再取得完了 (${Math.round(roomRefreshEnd - roomRefreshStart)}ms)`);
                            } catch (roomError) {
                                console.warn('部屋データの再取得に失敗:', roomError);
                            }
                        } else if (bulkUpdateResult.success && bulkUpdateResult.totalTargets === 0) {
                            successMessage += '\n部屋名の更新対象はありませんでした';
                            if (bulkUpdateResult.debugInfo) {
                                console.log('更新対象なしの詳細:', bulkUpdateResult.debugInfo);
                                successMessage += `\n（検索パターン: "${bulkUpdateResult.debugInfo.searchPattern}"）`;
                                if (bulkUpdateResult.debugInfo.allRoomsCount > 0) {
                                    successMessage += `\n物件には${bulkUpdateResult.debugInfo.allRoomsCount}件の部屋がありますが、命名パターンが一致しませんでした`;
                                }
                            }
                        }
                        else if (bulkUpdateResult.errorCount > 0) {
                            successMessage += `\n部屋名更新中にエラーが発生しました（失敗: ${bulkUpdateResult.errorCount}件）`;
                        }
                    } catch (bulkUpdateError) {
                        console.error('部屋名の一括更新でエラーが発生しました:', bulkUpdateError);
                        successMessage += '\n※部屋名の更新でエラーが発生しました';
                    }
                }
                alert(successMessage);

                // キャッシュを無効化して最新のデータを強制的に再取得
                const latestData = await apiService.getPropertyData(id, true);
                setProperty(latestData);
                setOriginalData(latestData);

                // 履歴データがあれば更新
                if (historyData.length > 0) { // 既に履歴が表示されている場合のみ更新
                    setTimeout(() => {
                        fetchHistoryData();
                    }, 1000); // 1秒待ってから取得 (BigQueryへの反映待ち)
                } else {
                    // 初回保存時は履歴を自動的に取得して表示
                    setTimeout(() => {
                        fetchHistoryData();
                    }, 1000);
                }

            } else {
                throw new Error(response.error || '更新に失敗しました');
            }
        } catch (err) {
            console.error('保存エラー:', err);
            setError('保存中にエラーが発生しました: ' + (err.message || err));
        } finally {
            setLoading(false);
        }
    };

    // 部屋一覧タブクリック時の処理（データは初期読み込み済み）
    useEffect(() => {
        if (activeTab === 'rooms' && property?.has_related_rooms) {
            // 検索結果をリセット（データは既に取得済み）
            setSearchTerm('');
            setCurrentPage(1);
            setSelectedRooms(new Set());
            setSelectAll(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, property?.has_related_rooms]);

    // 部屋名フォーマット関連の関数を追加
    const generateRoomName = (propertyName, roomNumber) => {
        if (!propertyName || !roomNumber) return '';
        return `${propertyName} ${roomNumber}`;
    };

    // eslint-disable-next-line no-unused-vars
    const isRoomNameFormatCorrect = (roomName, propertyName, roomNumber) => {
        if (!roomName || !propertyName || !roomNumber) return false;
        const expectedFormat = generateRoomName(propertyName, roomNumber);
        return roomName === expectedFormat;
    };

    const getRoomNameFormatStatus = (roomName, propertyName, roomNumber) => {
        if (!roomName || !propertyName || !roomNumber) return { isCorrect: false, expected: '' };
        const expectedFormat = generateRoomName(propertyName, roomNumber);
        return {
            isCorrect: roomName === expectedFormat,
            expected: expectedFormat
        };
    };

    // ...existing code...

    // 詳細部屋データは部屋名昇順で全件表示（activeTab === 'edit' のときは必ず昇順）
    const filteredDetailedRoomData = useMemo(() => {
        if (!detailedRoomData) return [];
        // activeTab === 'edit' のときは常に部屋名昇順
        if (activeTab === 'edit') {
            return [...detailedRoomData].sort((a, b) => {
                const nameA = (a.name || '').toString();
                const nameB = (b.name || '').toString();
                return nameA.localeCompare(nameB, 'ja', { numeric: true, sensitivity: 'base' });
            });
        }
        // それ以外はそのまま返す（必要なら他タブ用のソートを追加）
        return detailedRoomData;
    }, [detailedRoomData, activeTab]);


    if (loading) {
        return (
            <Container>
                <LoadingMessage>
                    <div className="spinner"></div>
                    データを読み込み中...
                </LoadingMessage>
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <ErrorMessage>{error}</ErrorMessage>
            </Container>
        );
    }

    if (!property) {
        return (
            <Container>
                <ErrorMessage>物件データが見つかりません</ErrorMessage>
            </Container>
        );
    }

    return (
        <Container>
            <Header>{property.name} - 物件管理</Header>
            <TabContainer>
                {/* 一覧・物件情報・部屋一覧・部屋タイプの4タブ構成 */}
                <Tab
                    active={activeTab === 'edit'}
                    onClick={() => setActiveTab('edit')}
                >
                    一覧
                </Tab>
                <Tab
                    active={activeTab === 'building'}
                    onClick={() => setActiveTab('building')}
                >
                    物件情報
                </Tab>
                {property.has_related_rooms && (
                    <>
                        <Tab
                            active={activeTab === 'rooms'}
                            onClick={() => setActiveTab('rooms')}
                        >
                            部屋一覧
                        </Tab>
                        <Tab
                            active={activeTab === 'types'}
                            onClick={() => setActiveTab('types')}
                        >
                            部屋タイプ
                        </Tab>
                    </>
                )}
            </TabContainer>

            {activeTab === 'building' && (
                <Section>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3>物件基本情報</h3>
                        <Button onClick={() => {
                            if (!editMode) {
                                // 編集モードに入る際に元のデータを保存
                                setOriginalData({ ...property });
                            } else {
                                // キャンセル時は編集内容を元に戻す
                                setEditData({ ...originalData });
                                setValidationErrors({}); // エラーもクリア
                            }
                            setEditMode(!editMode);
                        }}>
                            {editMode ? 'キャンセル' : '編集'}
                        </Button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <FormGroup>
                                <Label>物件ID</Label>
                                <Input
                                    type="text"
                                    value={property.id}
                                    disabled={true}
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label required>建物名</Label>
                                <FieldContainer className={validationErrors.name ? 'error' : ''}>
                                    <Input
                                        type="text"
                                        value={editMode ? editData.name : property.name}
                                        disabled={!editMode}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        required
                                        className={validationErrors.name ? 'error' : ''}
                                    />
                                    {validationErrors.name && (
                                        <ValidationError>{validationErrors.name}</ValidationError>
                                    )}
                                </FieldContainer>
                            </FormGroup>
                            <FormGroup>
                                <Label>タグ</Label>
                                <Input
                                    type="text"
                                    value={editMode ? editData.tag : property.tag}
                                    disabled={!editMode}
                                    onChange={(e) => handleInputChange('tag', e.target.value)}
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>売買</Label>
                                {editMode ? (
                                    <Select
                                        value={editData.is_trade || ''}
                                        onChange={(e) => handleInputChange('is_trade', e.target.value)}
                                        style={{
                                            backgroundColor: editData.is_trade && !SELECT_OPTIONS.is_trade.includes(editData.is_trade) ? '#fff3cd' : 'white',
                                            borderColor: editData.is_trade && !SELECT_OPTIONS.is_trade.includes(editData.is_trade) ? '#ffc107' : '#ddd'
                                        }}
                                    >
                                        {editData.is_trade && !SELECT_OPTIONS.is_trade.includes(editData.is_trade) && (
                                            <option value={editData.is_trade} style={{ color: '#856404', backgroundColor: '#fff3cd' }}>
                                                ⚠️ {editData.is_trade} (不正な値)
                                            </option>
                                        )}
                                        {SELECT_OPTIONS.is_trade.map((option, index) => (
                                            <option key={index} value={option}>
                                                {option || '選択してください'}
                                            </option>
                                        ))}
                                    </Select>
                                ) : (
                                    <Input
                                        type="text"
                                        value={property.is_trade && !SELECT_OPTIONS.is_trade.includes(property.is_trade)
                                            ? `⚠️ ${property.is_trade} (不正な値)`
                                            : property.is_trade || ''
                                        }
                                        disabled={true}
                                        style={{
                                            backgroundColor: property.is_trade && !SELECT_OPTIONS.is_trade.includes(property.is_trade) ? '#fff3cd' : '#f8f9fa',
                                            borderColor: property.is_trade && !SELECT_OPTIONS.is_trade.includes(property.is_trade) ? '#ffc107' : '#ddd',
                                            color: property.is_trade && !SELECT_OPTIONS.is_trade.includes(property.is_trade) ? '#856404' : 'inherit'
                                        }}
                                    />
                                )}
                            </FormGroup>
                            <FormGroup>
                                <Label>借上</Label>
                                {editMode ? (
                                    <Select
                                        value={editData.is_lease || ''}
                                        onChange={(e) => handleInputChange('is_lease', e.target.value)}
                                        style={{
                                            backgroundColor: editData.is_lease && !SELECT_OPTIONS.is_lease.includes(editData.is_lease) ? '#fff3cd' : 'white',
                                            borderColor: editData.is_lease && !SELECT_OPTIONS.is_lease.includes(editData.is_lease) ? '#ffc107' : '#ddd'
                                        }}
                                    >
                                        {editData.is_lease && !SELECT_OPTIONS.is_lease.includes(editData.is_lease) && (
                                            <option value={editData.is_lease} style={{ color: '#856404', backgroundColor: '#fff3cd' }}>
                                                ⚠️ {editData.is_lease} (不正な値)
                                            </option>
                                        )}
                                        {SELECT_OPTIONS.is_lease.map((option, index) => (
                                            <option key={index} value={option}>
                                                {option || '選択してください'}
                                            </option>
                                        ))}
                                    </Select>
                                ) : (
                                    <Input
                                        type="text"
                                        value={property.is_lease && !SELECT_OPTIONS.is_lease.includes(property.is_lease)
                                            ? `⚠️ ${property.is_lease} (不正な値)`
                                            : property.is_lease || ''
                                        }
                                        disabled={true}
                                        style={{
                                            backgroundColor: property.is_lease && !SELECT_OPTIONS.is_lease.includes(property.is_lease) ? '#fff3cd' : '#f8f9fa',
                                            borderColor: property.is_lease && !SELECT_OPTIONS.is_lease.includes(property.is_lease) ? '#ffc107' : '#ddd',
                                            color: property.is_lease && !SELECT_OPTIONS.is_lease.includes(property.is_lease) ? '#856404' : 'inherit'
                                        }}
                                    />
                                )}
                            </FormGroup>
                            <FormGroup>
                                <Label required>lead元</Label>
                                <Input
                                    type="text"
                                    value={editMode ? editData.lead_from : property.lead_from}
                                    disabled={!editMode}
                                    onChange={(e) => handleInputChange('lead_from', e.target.value)}
                                    required
                                />
                                {validationErrors.lead_from && (
                                    <ValidationError>{validationErrors.lead_from}</ValidationError>
                                )}
                            </FormGroup>
                            <FormGroup>
                                <Label>ファンド物件</Label>
                                <Input
                                    type="text"
                                    value={editMode ? editData.is_fund : property.is_fund}
                                    disabled={!editMode}
                                    onChange={(e) => handleInputChange('is_fund', e.target.value)}
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>Leadチャネル</Label>
                                {editMode ? (
                                    <Select
                                        value={editData.lead_channel || ''}
                                        onChange={(e) => handleInputChange('lead_channel', e.target.value)}
                                        style={{
                                            backgroundColor: editData.lead_channel && !SELECT_OPTIONS.lead_channel.includes(editData.lead_channel) ? '#fff3cd' : 'white',
                                            borderColor: editData.lead_channel && !SELECT_OPTIONS.lead_channel.includes(editData.lead_channel) ? '#ffc107' : '#ddd'
                                        }}
                                    >
                                        {editData.lead_channel && !SELECT_OPTIONS.lead_channel.includes(editData.lead_channel) && (
                                            <option value={editData.lead_channel} style={{ color: '#856404', backgroundColor: '#fff3cd' }}>
                                                ⚠️ {editData.lead_channel} (不正な値)
                                            </option>
                                        )}
                                        {SELECT_OPTIONS.lead_channel.map((option, index) => (
                                            <option key={index} value={option}>
                                                {option || '選択してください'}
                                            </option>
                                        ))}
                                    </Select>
                                ) : (
                                    <Input
                                        type="text"
                                        value={property.lead_channel && !SELECT_OPTIONS.lead_channel.includes(property.lead_channel)
                                            ? `⚠️ ${property.lead_channel} (不正な値)`
                                            : property.lead_channel || ''
                                        }
                                        disabled={true}
                                        style={{
                                            backgroundColor: property.lead_channel && !SELECT_OPTIONS.lead_channel.includes(property.lead_channel) ? '#fff3cd' : '#f8f9fa',
                                            borderColor: property.lead_channel && !SELECT_OPTIONS.lead_channel.includes(property.lead_channel) ? '#ffc107' : '#ddd',
                                            color: property.lead_channel && !SELECT_OPTIONS.lead_channel.includes(property.lead_channel) ? '#856404' : 'inherit'
                                        }}
                                    />
                                )}
                            </FormGroup>
                            <FormGroup>
                                <Label>取引形態</Label>
                                <Input
                                    type="text"
                                    value={editMode ? editData.trade_form : property.trade_form}
                                    disabled={!editMode}
                                    onChange={(e) => handleInputChange('trade_form', e.target.value)}
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>先方担当</Label>
                                <Input
                                    type="text"
                                    value={editMode ? editData.lead_from_representative : property.lead_from_representative}
                                    disabled={!editMode}
                                    onChange={(e) => handleInputChange('lead_from_representative', e.target.value)}
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>担当者電話番号</Label>
                                <Input
                                    type="text"
                                    value={editMode ? editData.lead_from_representative_phone : property.lead_from_representative_phone}
                                    disabled={!editMode}
                                    onChange={(e) => handleInputChange('lead_from_representative_phone', e.target.value)}
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>担当者メールアドレス</Label>
                                <Input
                                    type="email"
                                    value={editMode ? editData.lead_from_representative_email : property.lead_from_representative_email}
                                    disabled={!editMode}
                                    onChange={(e) => handleInputChange('lead_from_representative_email', e.target.value)}
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>建物フォルダ</Label>
                                {editMode ? (
                                    <Input
                                        type="url"
                                        value={editData.folder}
                                        onChange={(e) => handleInputChange('folder', e.target.value)}
                                        placeholder="https://example.com/folder"
                                    />
                                ) : (
                                    <div>
                                        {property.folder ? (
                                            <a
                                                href={property.folder}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    color: '#007bff',
                                                    textDecoration: 'none',
                                                    padding: '8px',
                                                    display: 'inline-block',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    backgroundColor: '#f8f9fa',
                                                    width: '100%',
                                                    boxSizing: 'border-box'
                                                }}
                                                onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                                                onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                                            >
                                                🔗 {property.folder}
                                            </a>
                                        ) : (
                                            <Input
                                                type="text"
                                                value="未設定"
                                                disabled={true}
                                                style={{ color: '#6c757d' }}
                                            />
                                        )}
                                    </div>
                                )}
                            </FormGroup>
                        </div>
                        <div>
                            <FormGroup>
                                <Label>シリアルナンバー</Label>
                                <Input
                                    type="text"
                                    value={property.serial_number}
                                    disabled={true}
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>MT担当</Label>
                                <Input
                                    type="text"
                                    value={editMode ? editData.mt_representative : property.mt_representative}
                                    disabled={!editMode}
                                    onChange={(e) => handleInputChange('mt_representative', e.target.value)}
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>建物登録日</Label>
                                <Input
                                    type="text"
                                    value={property.create_date}
                                    disabled={true}
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>情報取得日</Label>
                                <Input
                                    type="date"
                                    value={editMode ? editData.information_acquisition_date : property.information_acquisition_date}
                                    disabled={!editMode}
                                    onChange={(e) => handleInputChange('information_acquisition_date', e.target.value)}
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>最終在庫確認日</Label>
                                <Input
                                    type="date"
                                    value={editMode ? editData.latest_inventory_confirmation_date : property.latest_inventory_confirmation_date}
                                    disabled={!editMode}
                                    onChange={(e) => handleInputChange('latest_inventory_confirmation_date', e.target.value)}
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>入居中室数</Label>
                                <Input
                                    type="number"
                                    value={editMode ? editData.num_of_occupied_rooms : property.num_of_occupied_rooms}
                                    disabled={!editMode}
                                    onChange={(e) => handleInputChange('num_of_occupied_rooms', parseInt(e.target.value))}
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>空室数</Label>
                                <Input
                                    type="number"
                                    value={editMode ? editData.num_of_vacant_rooms : property.num_of_vacant_rooms}
                                    disabled={!editMode}
                                    onChange={(e) => handleInputChange('num_of_vacant_rooms', parseInt(e.target.value))}
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>家具なし部屋数</Label>
                                <Input
                                    type="number"
                                    value={editMode ? editData.num_of_rooms_without_furniture : property.num_of_rooms_without_furniture}
                                    disabled={!editMode}
                                    onChange={(e) => handleInputChange('num_of_rooms_without_furniture', parseInt(e.target.value))}
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>民泊可否</Label>
                                {editMode ? (
                                    <Select
                                        value={editData.minpaku_feasibility || ''}
                                        onChange={(e) => handleInputChange('minpaku_feasibility', e.target.value)}
                                        style={{
                                            backgroundColor: editData.minpaku_feasibility && !SELECT_OPTIONS.minpaku_feasibility.includes(editData.minpaku_feasibility) ? '#fff3cd' : 'white',
                                            borderColor: editData.minpaku_feasibility && !SELECT_OPTIONS.minpaku_feasibility.includes(editData.minpaku_feasibility) ? '#ffc107' : '#ddd'
                                        }}
                                    >
                                        {editData.minpaku_feasibility && !SELECT_OPTIONS.minpaku_feasibility.includes(editData.minpaku_feasibility) && (
                                            <option value={editData.minpaku_feasibility} style={{ color: '#856404', backgroundColor: '#fff3cd' }}>
                                                ⚠️ {editData.minpaku_feasibility} (不正な値)
                                            </option>
                                        )}
                                        {SELECT_OPTIONS.minpaku_feasibility.map((option, index) => (
                                            <option key={index} value={option}>
                                                {option || '選択してください'}
                                            </option>
                                        ))}
                                    </Select>
                                ) : (
                                    <Input
                                        type="text"
                                        value={property.minpaku_feasibility && !SELECT_OPTIONS.minpaku_feasibility.includes(property.minpaku_feasibility)
                                            ? `⚠️ ${property.minpaku_feasibility} (不正な値)`
                                            : property.minpaku_feasibility || ''
                                        }
                                        disabled={true}
                                        style={{
                                            backgroundColor: property.minpaku_feasibility && !SELECT_OPTIONS.minpaku_feasibility.includes(property.minpaku_feasibility) ? '#fff3cd' : '#f8f9fa',
                                            borderColor: property.minpaku_feasibility && !SELECT_OPTIONS.minpaku_feasibility.includes(property.minpaku_feasibility) ? '#ffc107' : '#ddd',
                                            color: property.minpaku_feasibility && !SELECT_OPTIONS.minpaku_feasibility.includes(property.minpaku_feasibility) ? '#856404' : 'inherit'
                                        }}
                                    />
                                )}
                            </FormGroup>
                            <FormGroup>
                                <Label>SP可否</Label>
                                {editMode ? (
                                    <Select
                                        value={editData.sp_feasibility || ''}
                                        onChange={(e) => handleInputChange('sp_feasibility', e.target.value)}
                                        style={{
                                            backgroundColor: editData.sp_feasibility && !SELECT_OPTIONS.sp_feasibility.includes(editData.sp_feasibility) ? '#fff3cd' : 'white',
                                            borderColor: editData.sp_feasibility && !SELECT_OPTIONS.sp_feasibility.includes(editData.sp_feasibility) ? '#ffc107' : '#ddd'
                                        }}
                                    >
                                        {editData.sp_feasibility && !SELECT_OPTIONS.sp_feasibility.includes(editData.sp_feasibility) && (
                                            <option value={editData.sp_feasibility} style={{ color: '#856404', backgroundColor: '#fff3cd' }}>
                                                ⚠️ {editData.sp_feasibility} (不正な値)
                                            </option>
                                        )}
                                        {SELECT_OPTIONS.sp_feasibility.map((option, index) => (
                                            <option key={index} value={option}>
                                                {option || '選択してください'}
                                            </option>
                                        ))}
                                    </Select>
                                ) : (
                                    <Input
                                        type="text"
                                        value={property.sp_feasibility && !SELECT_OPTIONS.sp_feasibility.includes(property.sp_feasibility)
                                            ? `⚠️ ${property.sp_feasibility} (不正な値)`
                                            : property.sp_feasibility || ''
                                        }
                                        disabled={true}
                                        style={{
                                            backgroundColor: property.sp_feasibility && !SELECT_OPTIONS.sp_feasibility.includes(property.sp_feasibility) ? '#fff3cd' : '#f8f9fa',
                                            borderColor: property.sp_feasibility && !SELECT_OPTIONS.sp_feasibility.includes(property.sp_feasibility) ? '#ffc107' : '#ddd',
                                            color: property.sp_feasibility && !SELECT_OPTIONS.sp_feasibility.includes(property.sp_feasibility) ? '#856404' : 'inherit'
                                        }}
                                    />
                                )}
                            </FormGroup>
                            <FormGroup>
                                <Label>内見</Label>
                                {editMode ? (
                                    <Select
                                        value={editData.done_property_viewing || ''}
                                        onChange={(e) => handleInputChange('done_property_viewing', e.target.value)}
                                        style={{
                                            backgroundColor: editData.done_property_viewing && !SELECT_OPTIONS.done_property_viewing.includes(editData.done_property_viewing) ? '#fff3cd' : 'white',
                                            borderColor: editData.done_property_viewing && !SELECT_OPTIONS.done_property_viewing.includes(editData.done_property_viewing) ? '#ffc107' : '#ddd'
                                        }}
                                    >
                                        {editData.done_property_viewing && !SELECT_OPTIONS.done_property_viewing.includes(editData.done_property_viewing) && (
                                            <option value={editData.done_property_viewing} style={{ color: '#856404', backgroundColor: '#fff3cd' }}>
                                                ⚠️ {editData.done_property_viewing} (不正な値)
                                            </option>
                                        )}
                                        {SELECT_OPTIONS.done_property_viewing.map((option, index) => (
                                            <option key={index} value={option}>
                                                {option || '選択してください'}
                                            </option>
                                        ))}
                                    </Select>
                                ) : (
                                    <Input
                                        type="text"
                                        value={property.done_property_viewing && !SELECT_OPTIONS.done_property_viewing.includes(property.done_property_viewing)
                                            ? `⚠️ ${property.done_property_viewing} (不正な値)`
                                            : property.done_property_viewing || ''
                                        }
                                        disabled={true}
                                        style={{
                                            backgroundColor: property.done_property_viewing && !SELECT_OPTIONS.done_property_viewing.includes(property.done_property_viewing) ? '#fff3cd' : '#f8f9fa',
                                            borderColor: property.done_property_viewing && !SELECT_OPTIONS.done_property_viewing.includes(property.done_property_viewing) ? '#ffc107' : '#ddd',
                                            color: property.done_property_viewing && !SELECT_OPTIONS.done_property_viewing.includes(property.done_property_viewing) ? '#856404' : 'inherit'
                                        }}
                                    />
                                )}
                            </FormGroup>
                            <FormGroup>
                                <Label>鳥籠</Label>
                                <Input
                                    type="text"
                                    value={editMode ? editData.torikago : property.torikago}
                                    disabled={!editMode}
                                    onChange={(e) => handleInputChange('torikago', e.target.value)}
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>鍵引き渡し日</Label>
                                <Input
                                    type="date"
                                    value={editMode ? editData.key_handling_date : property.key_handling_date}
                                    disabled={!editMode}
                                    onChange={(e) => handleInputChange('key_handling_date', e.target.value)}
                                />
                            </FormGroup>
                            <FormGroup>
                                <Label>反社チェック有無</Label>
                                {editMode ? (
                                    <Select
                                        value={editData.done_antisocial_check || ''}
                                        onChange={(e) => handleInputChange('done_antisocial_check', e.target.value)}
                                        style={{
                                            backgroundColor: editData.done_antisocial_check && !SELECT_OPTIONS.done_antisocial_check.includes(editData.done_antisocial_check) ? '#fff3cd' : 'white',
                                            borderColor: editData.done_antisocial_check && !SELECT_OPTIONS.done_antisocial_check.includes(editData.done_antisocial_check) ? '#ffc107' : '#ddd'
                                        }}
                                    >
                                        {editData.done_antisocial_check && !SELECT_OPTIONS.done_antisocial_check.includes(editData.done_antisocial_check) && (
                                            <option value={editData.done_antisocial_check} style={{ color: '#856404', backgroundColor: '#fff3cd' }}>
                                                ⚠️ {editData.done_antisocial_check} (不正な値)
                                            </option>
                                        )}
                                        {SELECT_OPTIONS.done_antisocial_check.map((option, index) => (
                                            <option key={index} value={option}>
                                                {option || '選択してください'}
                                            </option>
                                        ))}
                                    </Select>
                                ) : (
                                    <Input
                                        type="text"
                                        value={property.done_antisocial_check && !SELECT_OPTIONS.done_antisocial_check.includes(property.done_antisocial_check)
                                            ? `⚠️ ${property.done_antisocial_check} (不正な値)`
                                            : property.done_antisocial_check || ''
                                        }
                                        disabled={true}
                                        style={{
                                            backgroundColor: property.done_antisocial_check && !SELECT_OPTIONS.done_antisocial_check.includes(property.done_antisocial_check) ? '#fff3cd' : '#f8f9fa',
                                            borderColor: property.done_antisocial_check && !SELECT_OPTIONS.done_antisocial_check.includes(property.done_antisocial_check) ? '#ffc107' : '#ddd',
                                            color: property.done_antisocial_check && !SELECT_OPTIONS.done_antisocial_check.includes(property.done_antisocial_check) ? '#856404' : 'inherit'
                                        }}
                                    />
                                )}
                            </FormGroup>
                            <FormGroup>
                                <Label>備考</Label>
                                <Input
                                    type="text"
                                    value={editMode ? editData.note : property.note}
                                    disabled={!editMode}
                                    onChange={(e) => handleInputChange('note', e.target.value)}
                                />
                            </FormGroup>
                        </div>
                    </div>
                    {editMode && (
                        <Button onClick={handleSave} disabled={loading}>
                            {loading ? '保存中...' : '保存'}
                        </Button>
                    )}

                    {/* 変更履歴セクション */}
                    <div style={{ marginTop: '40px', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3>変更履歴</h3>
                            <Button
                                onClick={() => {
                                    if (historyData.length === 0 && !historyLoading) {
                                        fetchHistoryData();
                                    }
                                }}
                                disabled={historyLoading}
                            >
                                {historyLoading ? '読み込み中...' : '履歴を表示'}
                            </Button>
                        </div>
                        {historyLoading && (
                            <LoadingMessage>
                                <div className="spinner"></div>
                                変更履歴を読み込んでいます...
                            </LoadingMessage>
                        )}
                        {historyError && (
                            <ErrorMessage>{historyError}</ErrorMessage>
                        )}
                        {!historyLoading && !historyError && historyData.length > 0 && (
                            <HistoryContainer>
                                {historyData.map((historyItem, index) => (
                                    <HistoryItem key={index}>
                                        <HistoryHeader>
                                            <HistoryDate>
                                                {formatHistoryDate(historyItem.changed_at)}
                                            </HistoryDate>
                                            <HistoryUser>
                                                {historyItem.changed_by || '不明'}
                                            </HistoryUser>
                                        </HistoryHeader>
                                        <HistoryChanges>
                                            {historyItem.changes && typeof historyItem.changes === 'object' ?
                                                Object.entries(historyItem.changes).map(([field, change]) => (
                                                    <ChangeField key={field}>
                                                        <FieldName>{getFieldDisplayName(field)}</FieldName>
                                                        <ChangeValue>
                                                            <OldValue>{formatHistoryValue(change.old_value || change.old)}</OldValue>
                                                            <Arrow>→</Arrow>
                                                            <NewValue>{formatHistoryValue(change.new_value || change.new)}</NewValue>
                                                        </ChangeValue>
                                                    </ChangeField>
                                                )) : (
                                                    <div style={{ color: '#666', fontStyle: 'italic' }}>
                                                        変更内容の詳細が利用できません
                                                    </div>
                                                )
                                            }
                                        </HistoryChanges>
                                    </HistoryItem>
                                ))}
                            </HistoryContainer>
                        )}
                        {!historyLoading && !historyError && historyData.length === 0 && (
                            <div style={{ textAlign: 'center', color: '#666', padding: '20px', border: '1px solid #eee', borderRadius: '5px' }}>
                                変更履歴はまだありません。「履歴を表示」ボタンをクリックして履歴を確認してください。
                            </div>
                        )}
                    </div>
                </Section>
            )}

            {property.has_related_rooms && activeTab === 'rooms' && (
                <Section>
                    <div style={{ marginBottom: '20px' }}>
                        <h3>部屋一覧</h3>
                    </div>
                    {roomsError && (
                        <ErrorMessage>{roomsError}</ErrorMessage>
                    )}
                    {roomsLoading && rooms.length === 0 ? (
                        <LoadingMessage>部屋データを読み込み中...</LoadingMessage>
                    ) : (
                        <div style={{ position: 'relative' }}>
                            {roomsLoading && (
                                <div style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    background: 'rgba(0, 123, 255, 0.1)',
                                    color: '#007bff',
                                    padding: '5px 10px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    zIndex: 1
                                }}>
                                    更新中...
                                </div>
                            )}
                            {rooms.length > 1 ? (
                                <>
                                    {/* 検索バー */}
                                    <SearchInput
                                        type="text"
                                        placeholder="部屋名で検索"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    {/* 一括操作ボタン */}
                                    <BulkActions>
                                        <span>選択された部屋: {selectedRooms.size}件</span>
                                        <Button
                                            onClick={handleBulkUpdate}
                                            disabled={selectedRooms.size === 0}
                                        >
                                            一括更新
                                        </Button>
                                        <Button
                                            onClick={handleBulkDelete}
                                            disabled={selectedRooms.size === 0}
                                            style={{ backgroundColor: '#dc3545' }}
                                        >
                                            一括削除
                                        </Button>
                                        <Button onClick={() => alert('新規部屋追加機能は今後実装予定です。')}>
                                            新規追加
                                        </Button>
                                    </BulkActions>
                                    {/* 部屋一覧テーブル */}
                                    <Table>
                                        <thead>
                                            <tr>
                                                <TableHeader>
                                                    <CheckboxWrapper>
                                                        <Checkbox
                                                            type="checkbox"
                                                            checked={selectAll}
                                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                                        />
                                                    </CheckboxWrapper>
                                                </TableHeader>
                                                {rooms[0].map((header, index) => (
                                                    <TableHeader key={index}>{header}</TableHeader>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentRooms.map((room, rowIndex) => {
                                                const roomId = room[1];
                                                const roomName = room[2];
                                                const isOperationEnabled = room[4] !== 'false';
                                                // 部屋タイプIDや物件情報取得
                                                const detailedRoom = detailedRoomData.find(r => r.id === roomId);
                                                // roomTypeIdはroomTypeDetail.id優先、なければlead_room_type_id
                                                let roomTypeId = null;
                                                if (detailedRoom && detailedRoom.roomTypeDetail) {
                                                    roomTypeId = detailedRoom.roomTypeDetail.id || detailedRoom.roomTypeDetail.room_type_id;
                                                }
                                                if (!roomTypeId && detailedRoom && detailedRoom.lead_room_type_id) {
                                                    roomTypeId = detailedRoom.lead_room_type_id;
                                                }
                                                return (
                                                    <TableRow key={rowIndex}>
                                                        <TableCell>
                                                            <CheckboxWrapper>
                                                                <Checkbox
                                                                    type="checkbox"
                                                                    checked={selectedRooms.has(roomId)}
                                                                    onChange={(e) => handleRoomSelect(roomId, e.target.checked)}
                                                                />
                                                            </CheckboxWrapper>
                                                        </TableCell>
                                                        {/* 各カラムをROOM_TABLE_FIELD_ORDER順に描画 */}
                                                        {ROOM_TABLE_FIELD_ORDER.map((field, colIdx) => {
                                                            // 値の取得
                                                            let value = detailedRoom ? detailedRoom[field] : room[colIdx];
                                                            // 部屋タイプ系フィールドはroomTypeDetailから値を取得
                                                            if (detailedRoom && ROOM_TYPE_FIELD_CONFIG[field] && detailedRoom.roomTypeDetail) {
                                                                const fromKey = ROOM_TYPE_FIELD_CONFIG[field].fromRoomType;
                                                                if (fromKey) {
                                                                    value = detailedRoom.roomTypeDetail[fromKey];
                                                                }
                                                            }
                                                            let previewKey = `${roomId}-${field}`;
                                                            let previewValue = editChanges.get(previewKey);
                                                            // 部屋タイプ情報の編集プレビュー
                                                            let roomTypeKey = null;
                                                            if (!previewValue && roomTypeId && ROOM_TYPE_FIELD_CONFIG[field]) {
                                                                roomTypeKey = `${roomTypeId}-${field}`;
                                                                previewValue = editChanges.get(roomTypeKey);
                                                            }
                                                            // 物件情報の編集プレビュー
                                                            if (!previewValue && PROPERTY_FIELD_CONFIG[field]) {
                                                                const propertyKey = `property-${field}`;
                                                                previewValue = editChanges.get(propertyKey);
                                                                // 物件情報はvalueもpropertyから取得
                                                                if (property && PROPERTY_FIELD_CONFIG[field]?.fromProperty) {
                                                                    value = property[PROPERTY_FIELD_CONFIG[field].fromProperty];
                                                                }
                                                            }
                                                            // デバッグ用ログ出力
                                                            console.log('[cell debug]', {
                                                                roomId,
                                                                roomTypeId,
                                                                field,
                                                                roomTypeKey,
                                                                previewKey,
                                                                editChanges: Array.from(editChanges.entries())
                                                            });
                                                            // プレビュー表示
                                                            // プレビュー値が存在し、元の値と異なる場合も通常表示に統一
                                                            return (
                                                                <TableCell key={colIdx}>{String(previewValue !== undefined && previewValue !== null ? previewValue : value ?? '')}</TableCell>
                                                            );
                                                        })}
                                                        <TableCell>
                                                            <ActionButtons>
                                                                <IconButton
                                                                    variant="primary"
                                                                    disabled={!isOperationEnabled}
                                                                    onClick={() => handleOpenRoomDrawer(roomId)}
                                                                    title="詳細を表示"
                                                                >
                                                                    📝
                                                                </IconButton>
                                                                <IconButton
                                                                    variant="danger"
                                                                    disabled={!isOperationEnabled}
                                                                    onClick={() => handleRoomDelete(roomId, roomName)}
                                                                    title="削除"
                                                                >
                                                                    🗑️
                                                                </IconButton>
                                                            </ActionButtons>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </tbody>
                                    </Table>
                                    {/* ページネーション */}
                                    {totalPages > 1 && (
                                        <Pagination>
                                            <PageButton
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                disabled={currentPage === 1}
                                            >
                                                前へ
                                            </PageButton>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                <PageButton
                                                    key={page}
                                                    active={page === currentPage}
                                                    onClick={() => setCurrentPage(page)}
                                                >
                                                    {page}
                                                </PageButton>
                                            ))}
                                            <PageButton
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                disabled={currentPage === totalPages}
                                            >
                                                次へ
                                            </PageButton>
                                        </Pagination>
                                    )}
                                    {/* 表示情報 */}
                                    <div style={{ textAlign: 'center', marginTop: '10px', color: '#666', fontSize: '14px' }}>
                                        {filteredRooms.length}件中 {startIndex + 1}-{Math.min(endIndex, filteredRooms.length)}件を表示
                                        {searchTerm && ` (「${searchTerm}」で検索)`}
                                    </div>
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                    この物件には部屋データがありません
                                </div>
                            )}
                        </div>
                    )}
                </Section>
            )}

            {property.has_related_rooms && activeTab === 'types' && (
                <Section>
                    <div style={{ marginBottom: '20px' }}>
                        <h3>部屋タイプ管理</h3>
                    </div>
                    {roomTypesError && (
                        <ErrorMessage>
                            {roomTypesError}
                        </ErrorMessage>
                    )}
                    {roomTypesLoading && roomTypes.length === 0 ? (
                        <LoadingMessage>部屋タイプデータを読み込み中...</LoadingMessage>
                    ) : (
                        <div style={{ position: 'relative' }}>
                            {roomTypesLoading && (
                                <div style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    background: 'rgba(0, 123, 255, 0.1)',
                                    color: '#007bff',
                                    padding: '5px 10px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    zIndex: 1
                                }}>
                                    更新中...
                                </div>
                            )}
                            {roomTypes.length > 0 ? (
                                <>
                                    {/* 検索バー */}
                                    <SearchInput
                                        type="text"
                                        placeholder="部屋タイプ名またはIDで検索"
                                        value={roomTypeSearchTerm}
                                        onChange={(e) => setRoomTypeSearchTerm(e.target.value)}
                                    />
                                    {/* 一括操作ボタン */}
                                    <BulkActions>
                                        <span>選択された部屋タイプ: {selectedRoomTypes.size}件</span>
                                        <Button
                                            onClick={handleRoomTypeBulkUpdate}
                                            disabled={selectedRoomTypes.size === 0}
                                        >
                                            一括更新
                                        </Button>
                                        <Button
                                            onClick={handleRoomTypeBulkDelete}
                                            disabled={selectedRoomTypes.size === 0}
                                            style={{ backgroundColor: '#dc3545' }}
                                        >
                                            一括削除
                                        </Button>
                                        <Button onClick={() => alert('新規部屋タイプ追加機能は今後実装予定です。')}>
                                            新規追加
                                        </Button>
                                    </BulkActions>
                                    {/* 部屋タイプ一覧テーブル */}
                                    <RoomTypeContainer>
                                        <RoomTypeTable>
                                            <thead>
                                                <tr>
                                                    <RoomTypeTableHeader>
                                                        <CheckboxWrapper>
                                                            <Checkbox
                                                                type="checkbox"
                                                                checked={roomTypeSelectAll}
                                                                onChange={(e) => handleRoomTypeSelectAll(e.target.checked)}
                                                            />
                                                        </CheckboxWrapper>
                                                    </RoomTypeTableHeader>
                                                    <RoomTypeTableHeader>部屋タイプID</RoomTypeTableHeader>
                                                    <RoomTypeTableHeader>部屋タイプ名</RoomTypeTableHeader>
                                                    <RoomTypeTableHeader>間取り</RoomTypeTableHeader>
                                                    <RoomTypeTableHeader>専有面積</RoomTypeTableHeader>
                                                    <RoomTypeTableHeader>家賃</RoomTypeTableHeader>
                                                    <RoomTypeTableHeader>操作</RoomTypeTableHeader>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentRoomTypes.map((roomType, index) => {
                                                    const roomTypeId = roomType.room_type_id || roomType.id;
                                                    const roomTypeName = roomType.room_type_name || roomType.name;
                                                    return (
                                                        <tr key={roomTypeId || index}>
                                                            <RoomTypeTableCell>
                                                                <CheckboxWrapper>
                                                                    <Checkbox
                                                                        type="checkbox"
                                                                        checked={selectedRoomTypes.has(roomTypeId)}
                                                                        onChange={(e) => handleRoomTypeSelect(roomTypeId, e.target.checked)}
                                                                    />
                                                                </CheckboxWrapper>
                                                            </RoomTypeTableCell>
                                                            <RoomTypeTableCell>{roomTypeId}</RoomTypeTableCell>
                                                            <RoomTypeTableCell>
                                                                <RoomNameButton onClick={() => handleOpenRoomTypeDrawer(roomTypeId)}>
                                                                    {roomTypeName}
                                                                </RoomNameButton>
                                                            </RoomTypeTableCell>
                                                            <RoomTypeTableCell>{roomType.floor_plan || 'N/A'}</RoomTypeTableCell>
                                                            <RoomTypeTableCell>{roomType.floor_area ? `${roomType.floor_area}㎡` : 'N/A'}</RoomTypeTableCell>
                                                            <RoomTypeTableCell>
                                                                {roomType.rent ? `¥${Number(roomType.rent).toLocaleString()}` : 'N/A'}
                                                            </RoomTypeTableCell>
                                                            <RoomTypeTableCell>
                                                                <Button
                                                                    onClick={() => handleRoomTypeDelete(roomTypeId, roomTypeName)}
                                                                    style={{
                                                                        padding: '4px 8px',
                                                                        fontSize: '12px',
                                                                        backgroundColor: '#dc3545'
                                                                    }}
                                                                >
                                                                    削除
                                                                </Button>
                                                            </RoomTypeTableCell>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </RoomTypeTable>
                                    </RoomTypeContainer>
                                    {/* ページネーション */}
                                    {roomTypeTotalPages > 1 && (
                                        <Pagination>
                                            <PageButton
                                                onClick={() => setRoomTypeCurrentPage(roomTypeCurrentPage - 1)}
                                                disabled={roomTypeCurrentPage === 1}
                                            >
                                                前へ
                                            </PageButton>
                                            {Array.from({ length: roomTypeTotalPages }, (_, i) => i + 1)
                                                .filter(page =>
                                                    page === 1 ||
                                                    page === roomTypeTotalPages ||
                                                    Math.abs(page - roomTypeCurrentPage) <= 2
                                                )
                                                .map((page, index, arr) => (
                                                    <React.Fragment key={page}>
                                                        {index > 0 && arr[index - 1] !== page - 1 && <span>...</span>}
                                                        <PageButton
                                                            active={page === roomTypeCurrentPage}
                                                            onClick={() => setRoomTypeCurrentPage(page)}
                                                        >
                                                            {page}
                                                        </PageButton>
                                                    </React.Fragment>
                                                ))
                                            }
                                            <PageButton
                                                onClick={() => setRoomTypeCurrentPage(roomTypeCurrentPage + 1)}
                                                disabled={roomTypeCurrentPage === roomTypeTotalPages}
                                            >
                                                次へ
                                            </PageButton>
                                        </Pagination>
                                    )}
                                    {/* 表示件数情報 */}
                                    <div style={{ textAlign: 'center', marginTop: '10px', color: '#666', fontSize: '14px' }}>
                                        {roomTypeStartIndex + 1} - {Math.min(roomTypeEndIndex, filteredRoomTypes.length)} 件 / 全 {filteredRoomTypes.length} 件
                                        {roomTypeSearchTerm && (
                                            <span style={{ marginLeft: '10px' }}>
                                                （「{roomTypeSearchTerm}」で検索）
                                            </span>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                    この物件には部屋タイプデータがありません
                                </div>
                            )}
                        </div>
                    )}
                </Section>
            )}

            {/* データ編集タブ */}
            {property.has_related_rooms && activeTab === 'edit' && (
                <EditTabContainer>
                    {detailedRoomDataLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                            <div className="spinner" style={{ display: 'inline-block', width: '20px', height: '20px', border: '3px solid #f3f3f3', borderTop: '3px solid #007bff', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '10px' }}></div>
                            詳細な部屋データを読み込んでいます...
                        </div>
                    ) : detailedRoomData.length > 0 ? (
                        <>
                            {/* 上部の閲覧用テーブル */}
                            <TableSection>
                                <TableSectionHeader>
                                    📊 全部屋データ閲覧テーブル（部屋ドロワー準拠）
                                </TableSectionHeader>
                                <div style={{
                                    overflowX: 'auto',
                                    maxHeight: '600px',
                                    overflowY: 'auto',
                                    position: 'relative'
                                }}>
                                    <ReadOnlyTable>
                                        <thead>
                                            <tr>
                                                {ROOM_TABLE_FIELD_ORDER.filter(field => ROOM_FIELD_CONFIG[field]).map((field, index) => {
                                                    const config = ROOM_FIELD_CONFIG[field];
                                                    // 8列目（部屋名）のみを固定
                                                    const isFixedColumn = index === 7;
                                                    const fixedClass = isFixedColumn ? `fixed-column fixed-column-${index + 1}` : '';
                                                    const isRoomType = !!config.fromRoomType;
                                                    const isProperty = !!config.fromProperty;
                                                    return (
                                                        <ReadOnlyTableHeader
                                                            key={field}
                                                            className={fixedClass}
                                                            data-field={field}
                                                            $roomtype={isRoomType ? 'roomType' : isProperty ? 'property' : 'room'}
                                                        >
                                                            <div>
                                                                {config.label}
                                                                {config.required && <span style={{ color: 'red' }}> *</span>}
                                                                {!config.editable && <span style={{ color: '#666', fontSize: '10px' }}> (読取専用)</span>}
                                                            </div>
                                                        </ReadOnlyTableHeader>
                                                    );
                                                })}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewRows.map((room) => (
                                                <tr key={room.id}>
                                                    {ROOM_TABLE_FIELD_ORDER.filter(field => ROOM_FIELD_CONFIG[field]).map((field, index) => {
                                                        const config = ROOM_FIELD_CONFIG[field];
                                                        const isFixedColumn = index === 7;
                                                        const fixedClass = isFixedColumn ? `fixed-column fixed-column-${index + 1}` : '';
                                                        const tabType = config.fromProperty ? "property" : (config.fromRoomType ? "roomType" : "room");
                                                        const idValue = config.fromRoomType ? (room.roomTypeDetail?.room_type_id || room.roomTypeDetail?.id) : room.id;
                                                        // 値取得
                                                        let value = room[field];
                                                        if (config.fromRoomType) {
                                                            let roomTypeDetail = room.roomTypeDetail || {};
                                                            if (editTabRows.roomType && editTabRows.roomType.length > 0) {
                                                                const editedType = editTabRows.roomType.find(rt => rt.id === (roomTypeDetail.room_type_id || roomTypeDetail.id));
                                                                if (editedType) {
                                                                    roomTypeDetail = { ...roomTypeDetail, ...editedType };
                                                                }
                                                            }
                                                            value = roomTypeDetail[config.fromRoomType];
                                                        }
                                                        let propertyEdit = {};
                                                        if (config.fromProperty) {
                                                            propertyEdit = (editTabRows.property && editTabRows.property[0]) || {};
                                                            if (propertyEdit[field] !== undefined && propertyEdit[field] !== null) {
                                                                value = propertyEdit[field];
                                                            } else if (propertyEdit[config.fromProperty] !== undefined && propertyEdit[config.fromProperty] !== null) {
                                                                value = propertyEdit[config.fromProperty];
                                                            } else {
                                                                value = property ? property[config.fromProperty] : undefined;
                                                            }
                                                        }
                                                        let displayValue = value;
                                                        if (displayValue && typeof displayValue === 'object' && 'value' in displayValue) {
                                                            displayValue = displayValue.value;
                                                        }
                                                        let isChanged = changedCells[room.id]?.[field];
                                                        // propertyカラムの差分判定
                                                        // propertyカラムの差分判定
                                                        if (config.fromProperty) {
                                                            const originalValue = property ? property[config.fromProperty] : undefined;
                                                            const editedValue = propertyEdit[field] !== undefined ? propertyEdit[field] : propertyEdit[config.fromProperty];
                                                            isChanged = editedValue !== undefined && editedValue !== originalValue;
                                                        }
                                                        // roomTypeカラムの差分判定
                                                        if (config.fromRoomType) {
                                                            // roomTypeDetailの元値と編集値を比較
                                                            const roomTypeDetail = room.roomTypeDetail || {};
                                                            const originalValue = detailedRoomData.find(r => r.id === room.id)?.roomTypeDetail?.[config.fromRoomType];
                                                            const editedValue = roomTypeDetail[config.fromRoomType];
                                                            // 両方未設定（undefined/null/空文字）の場合は変更扱いしない
                                                            const isEmpty = v => v === undefined || v === null || v === '';
                                                            if (isEmpty(originalValue) && isEmpty(editedValue)) {
                                                                isChanged = false;
                                                            } else {
                                                                isChanged = (editedValue !== undefined && editedValue !== null && editedValue !== originalValue);
                                                            }
                                                        }
                                                        const cellClass = [
                                                            fixedClass,
                                                            isChanged ? 'changed' : '',
                                                            config.fromProperty ? 'property-cell' : ''
                                                        ].filter(Boolean).join(' ');
                                                        // プレビューセルは背景色のみ淡い黄色に
                                                        if (isChanged) {
                                                            return (
                                                                <ReadOnlyTableCell key={field} className={cellClass} style={{ background: '#fffbe6' }}>
                                                                    {displayValue}
                                                                </ReadOnlyTableCell>
                                                            );
                                                        } else {
                                                            return (
                                                                <ReadOnlyTableCell
                                                                    key={field}
                                                                    className={cellClass}
                                                                    onClick={() => config.editable && handleReadOnlyCellClick(tabType, idValue, field)}
                                                                    style={{
                                                                        cursor: config.editable ? 'pointer' : 'default',
                                                                        backgroundColor: !config.editable ? '#f8f9fa' : undefined
                                                                    }}
                                                                >
                                                                    {displayValue}
                                                                </ReadOnlyTableCell>
                                                            );
                                                        }
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </ReadOnlyTable>
                                </div>
                            </TableSection>

                            {/* 下部の編集用テーブル：タブ切り替え */}
                            <TableSection>
                                <TableSectionHeader>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <span>✏️ 編集用テーブル</span>
                                        <div>
                                            <button
                                                style={{
                                                    padding: '6px 18px',
                                                    border: 'none',
                                                    borderRadius: '5px 5px 0 0',
                                                    background: editSubTab === 'property' ? '#007bff' : '#f8f9fa',
                                                    color: editSubTab === 'property' ? 'white' : '#333',
                                                    cursor: 'pointer',
                                                    marginRight: '5px',
                                                    fontWeight: 'bold'
                                                }}
                                                onClick={() => handleEditSubTabChange('property')}
                                            >物件情報</button>
                                            <button
                                                style={{
                                                    padding: '6px 18px',
                                                    border: 'none',
                                                    borderRadius: '5px 5px 0 0',
                                                    background: editSubTab === 'room' ? '#007bff' : '#f8f9fa',
                                                    color: editSubTab === 'room' ? 'white' : '#333',
                                                    cursor: 'pointer',
                                                    marginRight: '5px',
                                                    fontWeight: 'bold'
                                                }}
                                                onClick={() => handleEditSubTabChange('room')}
                                            >部屋情報</button>
                                            <button
                                                style={{
                                                    padding: '6px 18px',
                                                    border: 'none',
                                                    borderRadius: '5px 5px 0 0',
                                                    background: editSubTab === 'roomType' ? '#007bff' : '#f8f9fa',
                                                    color: editSubTab === 'roomType' ? 'white' : '#333',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold'
                                                }}
                                                onClick={() => handleEditSubTabChange('roomType')}
                                            >部屋タイプ情報</button>
                                        </div>
                                    </div>
                                </TableSectionHeader>
                                <div style={{ overflowX: 'auto' }}>

                                    {/* サブタブ: 編集テーブル */}
                                    {editSubTab === 'room' && (
                                        detailedRoomData.length > 0 ? (
                                            (() => {
                                                // columns生成: RoomInfoEditableTableのデフォルトcolumnsからactions列を除外
                                                const defaultColumns = require('../components/RoomInfoEditableTable').defaultColumns || [];
                                                // fallback: actions列を除外する関数
                                                const getColumnsWithoutActions = (columns) => columns.filter(col => col.field !== 'actions');
                                                // columnsPropが用意されていれば使う
                                                let columns = [];
                                                if (defaultColumns.length > 0) {
                                                    columns = getColumnsWithoutActions(defaultColumns);
                                                } else {
                                                    // fallback: detailedRoomDataの最初のrowからfieldsを推測
                                                    const row = (editTabRows.room && editTabRows.room.length > 0 ? editTabRows.room[0] : detailedRoomData[0]) || {};
                                                    columns = Object.keys(row).filter(f => f !== 'actions').map(f => ({ field: f, headerName: f, flex: 1 }));
                                                }
                                                return (
                                                    <RoomInfoEditableTable
                                                        detailedRoomData={editTabRows.room && editTabRows.room.length > 0 ? editTabRows.room : detailedRoomData}
                                                        columns={columns}
                                                        focusedCell={focusedCell}
                                                        onRowsChange={rows => {
                                                            setEditTabRows(prev => ({ ...prev, room: rows }));
                                                        }}
                                                        onCellEditStop={() => setSelectedEditCell(null)}
                                                    />
                                                );
                                            })()
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                                編集可能な部屋データがありません
                                            </div>
                                        )
                                    )}
                                    {editSubTab === 'roomType' && (
                                        (() => {
                                            // ROOM_TABLE_FIELD_ORDERからroomType系フィールドのみ抽出
                                            const roomTypeFields = ROOM_TABLE_FIELD_ORDER.filter(f => f.startsWith('roomType_') && ROOM_TYPE_FIELD_CONFIG[f]);
                                            const columns = roomTypeFields.map(field => {
                                                const conf = ROOM_TYPE_FIELD_CONFIG[field];
                                                let col = {
                                                    field,
                                                    headerName: conf.label,
                                                    editable: !!conf.editable,
                                                    minWidth: 120,
                                                    flex: 1,
                                                };
                                                if (conf.type === 'date') col.type = 'date';
                                                if (conf.type === 'number') col.type = 'number';
                                                if (conf.type === 'select') {
                                                    col.type = 'singleSelect';
                                                    col.valueOptions = conf.options || [];
                                                }
                                                return col;
                                            });
                                            // 部屋タイプごとに1行ずつ生成（全roomTypesをベースに）
                                            const rows = (editTabRows.roomType && editTabRows.roomType.length > 0)
                                                ? editTabRows.roomType
                                                : roomTypes.map(rt => {
                                                    const typeId = rt.room_type_id || rt.id;
                                                    const row = { id: typeId };
                                                    roomTypeFields.forEach(field => {
                                                        const conf = ROOM_TYPE_FIELD_CONFIG[field];
                                                        row[field] = rt[conf.fromRoomType] ?? '';
                                                    });
                                                    return row;
                                                });
                                            return rows.length > 0 ? (
                                                <RoomInfoEditableTable
                                                    detailedRoomData={rows}
                                                    columns={columns}
                                                    focusedCell={focusedCell}
                                                    onRowsChange={rows => setEditTabRows(prev => ({ ...prev, roomType: rows }))}
                                                    onCellEditStop={() => setSelectedEditCell(null)}
                                                    tableColor={'#e6f9e6'}
                                                />
                                            ) : (
                                                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                                    編集可能な部屋タイプデータがありません
                                                </div>
                                            );
                                        })()
                                    )}
                                    {editSubTab === 'property' && (
                                        property ? (
                                            (() => {
                                                // columnsのfield名に合わせてpropertyをマッピング
                                                const propCols = getPropertyInfoColumnsForEditableTable();
                                                const mapPropertyToRow = (propertyObj) => {
                                                    const row = {};
                                                    propCols.forEach(col => {
                                                        const conf = PROPERTY_FIELD_CONFIG[col.field];
                                                        if (conf && conf.fromProperty) {
                                                            row[col.field] = propertyObj[conf.fromProperty];
                                                        } else {
                                                            row[col.field] = propertyObj[col.field];
                                                        }
                                                    });
                                                    // id列は必須
                                                    if (!row.id && propertyObj.id) row.id = propertyObj.id;
                                                    return row;
                                                };
                                                const mappedRows = (editTabRows.property && Array.isArray(editTabRows.property) && editTabRows.property.length > 0)
                                                    ? editTabRows.property
                                                    : [mapPropertyToRow(property)];
                                                return (
                                                    <RoomInfoEditableTable
                                                        detailedRoomData={mappedRows}
                                                        columns={propCols}
                                                        focusedCell={focusedCell}
                                                        onRowsChange={rows => {
                                                            // rowsは必ず1要素配列で管理
                                                            setEditTabRows(prev => ({ ...prev, property: Array.isArray(rows) ? rows.slice(0, 1) : [] }));
                                                        }}
                                                        onCellEditStop={() => setSelectedEditCell(null)}
                                                        tableColor={'#e3f2fd'}
                                                    />
                                                );
                                            })()
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                                編集可能な物件データがありません
                                            </div>
                                        )
                                    )}
                                </div>
                            </TableSection>

                            {/* 保存・リセットボタン */}
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <Button
                                    onClick={handleSaveChanges}
                                    disabled={editChanges.size === 0}
                                    style={{ backgroundColor: '#28a745', fontSize: '16px', padding: '12px 24px' }}
                                >
                                    変更を保存 ({editChanges.size}件)
                                </Button>
                                <Button
                                    onClick={handleResetChanges}
                                    disabled={editChanges.size === 0}
                                    style={{ backgroundColor: '#dc3545', fontSize: '16px', padding: '12px 24px' }}
                                >
                                    変更をリセット
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                            編集可能な部屋データがありません
                        </div>
                    )}
                </EditTabContainer>
            )}

            {/* RoomDrawer を追加 */}
            <RoomDrawer
                isOpen={drawerOpen}
                onClose={handleCloseRoomDrawer}
                roomId={selectedRoomId}
                propertyData={property}
            />
            {/* RoomTypeDrawer を追加 */}
            <RoomTypeDrawer
                isOpen={roomTypeDrawerOpen}
                onClose={handleCloseRoomTypeDrawer}
                roomTypeId={selectedRoomTypeId}
            />

            {/* 開発環境でのみデバッグセクションを表示 */}
            {process.env.NODE_ENV !== 'production' && (
                <div style={{
                    marginTop: '30px',
                    padding: '15px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    backgroundColor: '#f9f9f9'
                }}>
                    <h3>API接続デバッグ</h3>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <button
                            onClick={async () => {
                                const result = await apiService.testApiConnection();
                                console.log('API接続テスト結果:', result);
                                alert(JSON.stringify(result, null, 2));
                            }}
                            style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
                        >
                            API接続テスト
                        </button>
                        <button
                            onClick={async () => {
                                const result = await apiService.testCorsSettings();
                                console.log('CORSテスト結果:', result);
                                alert(JSON.stringify(result, null, 2));
                            }}
                            style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
                        >
                            CORSテスト
                        </button>
                    </div>
                    <div>
                        <p>
                            <strong>環境情報:</strong> {process.env.NODE_ENV} / API URL: {process.env.REACT_APP_API_URL || '(未設定)'}
                        </p>
                    </div>
                </div>
            )}
        </Container>
    );
};

export default PropertyPage;