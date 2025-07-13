import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { apiService } from '../services/apiService';
import { formatDisplayValue } from '../utils/formatUtils';
import { getPrefectureOptions, getCityOptions } from '../utils/addressData';

// ドロワーのオーバーレイ
const DrawerOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  transition: opacity 0.3s ease-in-out;
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
`;

// ドロワー本体
const DrawerContainer = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: 900px;
  background-color: white;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  transition: transform 0.3s ease-in-out;
  transform: ${props => props.isOpen ? 'translateX(0)' : 'translateX(100%)'};
  overflow-y: auto;
  
  @media (max-width: 1024px) {
    width: 100%;
  }
  
  @media (min-width: 1025px) and (max-width: 1200px) {
    width: 80%;
  }
`;

// ドロワーヘッダー
const DrawerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f8f9fa;
`;

// ドロワーのタイトル
const DrawerTitle = styled.h2`
  margin: 0;
  color: #333;
  font-size: 1.5rem;
`;

// ヘッダーボタンコンテナ
const HeaderButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

// 閉じるボタン
const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 5px;
  border-radius: 3px;
  
  &:hover {
    background-color: #e9ecef;
    color: #333;
  }
`;

// タブボタンコンテナ
const TabContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f8f9fa;
`;

// タブボタン
const TabButton = styled.button`
  background: none;
  border: none;
  padding: 15px 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.active ? '#007bff' : '#666'};
  border-bottom: 2px solid ${props => props.active ? '#007bff' : 'transparent'};
  transition: all 0.2s;
  
  &:hover {
    background-color: #e9ecef;
    color: #007bff;
  }
`;

// 変更履歴コンテナ
const HistoryContainer = styled.div`
  padding: 20px;
`;

// 変更履歴アイテム
const HistoryItem = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  margin-bottom: 15px;
  padding: 15px;
  background: white;
`;

// 変更履歴ヘッダー
const HistoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
`;

// 変更日時
const HistoryDate = styled.div`
  font-size: 14px;
  color: #666;
  font-weight: 500;
`;

// 変更者
const HistoryUser = styled.div`
  font-size: 12px;
  color: #999;
`;

// 変更内容
const HistoryChanges = styled.div`
  margin-top: 10px;
`;

// 変更フィールド
const ChangeField = styled.div`
  margin-bottom: 8px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 3px;
  font-size: 13px;
`;

// フィールド名
const FieldName = styled.span`
  font-weight: bold;
  color: #333;
  margin-right: 8px;
`;

// 変更値
const ChangeValue = styled.div`
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

// 古い値
const OldValue = styled.span`
  color: #dc3545;
  text-decoration: line-through;
  background: #fdf2f2;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
`;

// 新しい値
const NewValue = styled.span`
  color: #28a745;
  background: #f0f8f0;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;
`;

// 矢印アイコン
const Arrow = styled.span`
  color: #666;
  font-size: 12px;
`;

// ドロワーコンテンツ
const DrawerContent = styled.div`
  padding: 20px;
`;

// ローディング表示
const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  font-size: 16px;
  color: #666;
  
  .spinner {
    margin-right: 10px;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// データ表示コンテナ
const DataContainer = styled.div`
  background: white;
  border-radius: 5px;
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

// セクション見出し（表示用）
const DataSectionTitle = styled.h3`
  grid-column: 1 / -1;
  margin: 20px 0 10px 0;
  padding: 10px;
  background-color: #f8f9fa;
  border-left: 4px solid #007bff;
  color: #333;
  font-size: 16px;
  font-weight: bold;
`;

const DataItem = styled.div`
  margin-bottom: 15px;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  min-height: 70px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const HeaderText = styled.div`
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
  font-size: 13px;
  line-height: 1.2;
`;

const DataValue = styled.div`
  padding: 6px 8px;
  background: #f8f9fa;
  border-radius: 3px;
  color: #333;
  font-size: 14px;
  line-height: 1.3;
  word-break: break-word;
  flex: 1;
  display: flex;
  align-items: center;
`;

// エラー表示
const ErrorMessage = styled.div`
  color: #dc3545;
  padding: 20px;
  text-align: center;
`;

// 編集用のスタイル
const EditForm = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

// セクション見出し
const SectionTitle = styled.h3`
  grid-column: 1 / -1;
  margin: 20px 0 10px 0;
  padding: 10px;
  background-color: #f8f9fa;
  border-left: 4px solid #007bff;
  color: #333;
  font-size: 16px;
  font-weight: bold;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
  font-size: 13px;
  
  /* 必須項目のアスタリスク */
  &.required::after {
    content: " *";
    color: #dc3545;
    margin-left: 2px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
  
  &:disabled {
    background-color: #f8f9fa;
    color: #6c757d;
    cursor: not-allowed;
  }
  
  &:required {
    border-color: #dc3545;
  }
  
  &:required:valid {
    border-color: #28a745;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
  
  &:disabled {
    background-color: #f8f9fa;
    color: #6c757d;
    cursor: not-allowed;
  }
  
  &:required {
    border-color: #dc3545;
  }
  
  &:required:valid {
    border-color: #28a745;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  
  ${props => props.primary ? `
    background: #007bff;
    color: white;
    
    &:hover {
      background: #0056b3;
    }
  ` : `
    background: #6c757d;
    color: white;
    
    &:hover {
      background: #545b62;
    }
  `}
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

// RoomTypeDrawerコンポーネント
const RoomTypeDrawer = ({ isOpen, onClose, roomTypeId }) => {
  const [loading, setLoading] = useState(false);
  const [roomTypeData, setRoomTypeData] = useState(null);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  // フィールドの設定（編集可否と必須項目）
  const fieldConfig = {
    id: { editable: false, required: false },
    name: { editable: true, required: true },
    lead_property_id: { editable: false, required: false },
    create_date: { editable: false, required: false },
    minpaku_price: { editable: true, required: false },
    monthly_price: { editable: true, required: false },
    pax: { editable: true, required: false },
    owner_type: { editable: true, required: true },
    register_type: { editable: true, required: true },
    payment_rent: { editable: true, required: false },
    management_expenses: { editable: true, required: false },
    brokerage_commission: { editable: true, required: false },
    deposit: { editable: true, required: false },
    key_money: { editable: true, required: false },
    key_exchange_money: { editable: true, required: false },
    renovation_cost: { editable: true, required: false },
    property_introduction_fee: { editable: true, required: false },
    other_initial_cost_name: { editable: true, required: false },
    other_initial_cost: { editable: true, required: false },
    contract_type: { editable: true, required: false },
    contract_period: { editable: true, required: false },
    renewal_fee: { editable: true, required: false },
    date_moving_in: { editable: true, required: false },
    rent_accrual_date: { editable: true, required: false },
    operation_start_date: { editable: true, required: false },
    use_guarantee_company: { editable: true, required: false },
    Initial_guarantee_rate: { editable: true, required: false },
    monthly_guarantee_fee_rate: { editable: true, required: false },
    maa_insurance: { editable: true, required: false },
    prefectures: { editable: true, required: false },
    city: { editable: true, required: false },
    town: { editable: true, required: false },
    area_zoned_for_use: { editable: true, required: false },
    request_checking_area_zoned_for_use: { editable: true, required: false },
    done_checking_area_zoned_for_use: { editable: true, required: false },
    special_use_areas: { editable: true, required: false },
    route_1: { editable: true, required: false },
    station_1: { editable: true, required: false },
    walk_min_1: { editable: true, required: false },
    route_2: { editable: true, required: false },
    station_2: { editable: true, required: false },
    walk_min_2: { editable: true, required: false },
    floor_plan: { editable: true, required: false },
    ev: { editable: true, required: false },
    sqm: { editable: true, required: false },
    room_type: { editable: true, required: false },
    building_structure: { editable: true, required: false },
    completion_year: { editable: true, required: false },
    minpaku_plan: { editable: true, required: false },
    room_floor: { editable: true, required: false },
    building_floor: { editable: true, required: false },
    num_of_room_per_building: { editable: true, required: false },
    staircase_location: { editable: true, required: false },
    total_sqm: { editable: true, required: false },
    availability_of_floor_plan: { editable: true, required: false },
    applications_for_other_floors: { editable: true, required: false },
    firefighting_equipment: { editable: true, required: false },
    firefighting_equipment_cost: { editable: true, required: false },
    firefighting_equipment_cost_manual: { editable: true, required: false },
    furniture_transfer_availability: { editable: true, required: false },
    checkin_cost: { editable: true, required: false },
    other_cost_name: { editable: true, required: false },
    other_cost: { editable: true, required: false }
  };

  // データの値を安全に取得するヘルパー関数
  const getSafeValue = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object' && value.value !== undefined) {
      return value.value;
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  // ドロップダウンの選択肢を取得する関数
  const getSelectOptions = () => ({
    owner_type: ['', '自社', 'ファンド'],
    register_type: ['', '住宅宿泊事業', '旅館業', '特区民泊'],
    contract_type: ['', '普通借家', '定期借家'],
    use_guarantee_company: ['', '有', '無', '済'],
    maa_insurance: ['', '保険', '共済会'],
    area_zoned_for_use: ['', '商業', '近隣商業', '工業', '準工業', '工業専用', '第一種低層住居専用', '第二種低層住居専用', '第一種中高層住居専用', '第二種中高層住居専用', '第一種住居地域', '第二種住居', '準住居', '田園住居'],
    request_checking_area_zoned_for_use: ['', '◯'],
    done_checking_area_zoned_for_use: ['', '◯'],
    floor_plan: ['', '1R', '1K', '1DK', '1LDK', '2K', '2DK', '2LDK', '3DK', '3LDK', '5LDK'],
    ev: ['', '有', '無', '済'],
    room_type: ['', 'マンション・アパート', '戸建', 'メゾネット', 'ロフト付き', '長屋'],
    building_structure: ['', 'RC', 'S', 'SRC', '木造', '鉄骨鉄造', 'WRC', 'W'],
    availability_of_floor_plan: ['', '有', '無', '済'],
    furniture_transfer_availability: ['', '有', '無', '済'],
    prefectures: getPrefectureOptions(),
    city: getCityOptions(getSafeValue(editData.prefectures))
  });

  // 表示用の値を取得するヘルパー関数
  const getDisplayValue = (fieldName, value) => {
    const safeValue = getSafeValue(value);
    if (!safeValue || safeValue === '') {
      return '';
    }
    return formatDisplayValue(fieldName, safeValue);
  };

  // 履歴データの取得
  const fetchHistoryData = useCallback(async () => {
    if (!roomTypeId || !isOpen) return;

    try {
      setHistoryLoading(true);
      setHistoryError(null);

      console.log(`部屋タイプ履歴を取得中: ID=${roomTypeId}`);
      const historyResponse = await apiService.getRoomTypeChangeHistory(roomTypeId);

      console.log('取得した履歴データ:', historyResponse);

      if (historyResponse && historyResponse.length > 0) {
        // 各履歴項目の詳細をデバッグ
        historyResponse.forEach((item, index) => {
          console.log(`履歴項目 ${index}:`, {
            changed_at: item.changed_at,
            changed_at_type: typeof item.changed_at,
            changed_by: item.changed_by,
            changes: item.changes,
            formatResult: formatHistoryDate(item.changed_at)
          });
        });

        setHistoryData(historyResponse);
        console.log('部屋タイプ変更履歴を取得しました:', historyResponse);
      } else {
        setHistoryData([]);
        console.log('変更履歴はありません');
      }
    } catch (error) {
      console.error('Error fetching room type change history:', error);
      setHistoryError('変更履歴の取得に失敗しました');
    } finally {
      setHistoryLoading(false);
    }
  }, [roomTypeId, isOpen]);

  // 履歴の日付をフォーマットする関数
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

  // 履歴値をフォーマットする関数
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
      if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
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

  // フィールドの表示名を取得する関数
  const getFieldDisplayName = (fieldName) => {
    const fieldNames = {
      'id': '部屋タイプID',
      'name': '部屋タイプ名',
      'create_date': '部屋タイプ作成日',
      'minpaku_price': '民泊単価',
      'monthly_price': 'マンスリー単価',
      'pax': '収容人数',
      'owner_type': '所有者属性',
      'register_type': '運営形態',
      'payment_rent': '賃料',
      'management_expenses': '管理費',
      'brokerage_commission': '仲介手数料',
      'deposit': '敷金',
      'key_money': '礼金',
      'key_exchange_money': '鍵交換費用',
      'renovation_cost': 'リフォーム費用',
      'property_introduction_fee': '物件紹介手数料',
      'other_initial_cost_name': '初期その他項目',
      'other_initial_cost': '初期その他金額',
      'contract_type': '契約種類',
      'contract_period': '契約期間 年間',
      'renewal_fee': '更新料',
      'date_moving_in': '入居日',
      'rent_accrual_date': '賃発日',
      'operation_start_date': '運営開始日',
      'use_guarantee_company': '保証会社利用',
      'Initial_guarantee_rate': '初回保証料割合 %',
      'monthly_guarantee_fee_rate': '月額保証料割合 %',
      'maa_insurance': '共済会 保険',
      'prefectures': '都道府県',
      'city': '市区',
      'town': '以後住所',
      'area_zoned_for_use': '用途地域',
      'request_checking_area_zoned_for_use': '用途地域確認依頼',
      'done_checking_area_zoned_for_use': '用途地域確認済',
      'special_use_areas': '特別用途地区',
      'route_1': '路線1',
      'station_1': '駅1',
      'walk_min_1': '徒歩分数1',
      'route_2': '路線2',
      'station_2': '駅2',
      'walk_min_2': '徒歩分数2',
      'floor_plan': '間取り',
      'ev': 'EVの有無',
      'sqm': '広さ',
      'room_type': '部屋種別',
      'building_structure': '建物構造',
      'completion_year': '竣工年',
      'minpaku_plan': '民泊利用 自社運営予定 予定数',
      'room_floor': '部屋所在階',
      'building_floor': '建物階数',
      'num_of_room_per_building': '建物全体部屋数',
      'staircase_location': '階段位置',
      'total_sqm': '建物延床面積',
      'availability_of_floor_plan': '平面図の有無',
      'applications_for_other_floors': '他フロアの用途',
      'firefighting_equipment': '現況消防設備',
      'firefighting_equipment_cost': '消防設備費用 自動',
      'firefighting_equipment_cost_manual': '消防設備費用 手動',
      'furniture_transfer_availability': '家具譲渡の有無',
      'checkin_cost': 'check-in原価',
      'other_cost_name': '月額その他項目',
      'other_cost': '月額その他費用'
    };
    return fieldNames[fieldName] || fieldName;
  };

  // フィールドをレンダリングするヘルパー関数
  const renderField = (fieldName, label, value) => {
    const config = fieldConfig[fieldName];
    const selectOptions = getSelectOptions();
    const options = selectOptions[fieldName];

    if (options) {
      // ドロップダウンの場合
      return (
        <Select
          value={getSafeValue(value)}
          onChange={(e) => handleInputChange(fieldName, e.target.value)}
          disabled={!config.editable}
          required={config.required}
        >
          {options.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      );
    } else {
      // 通常の入力フィールドの場合
      let inputType = 'text';

      // BigQueryスキーマに基づく型判定
      const numericFields = [
        'minpaku_price', 'monthly_price', 'payment_rent', 'management_expenses',
        'brokerage_commission', 'deposit', 'key_money', 'key_exchange_money',
        'renovation_cost', 'property_introduction_fee', 'other_initial_cost',
        'renewal_fee', 'Initial_guarantee_rate', 'monthly_guarantee_fee_rate',
        'walk_min_1', 'walk_min_2', 'sqm', 'pax', 'completion_year',
        'minpaku_plan', 'num_of_room_per_building', 'total_sqm',
        'firefighting_equipment_cost', 'firefighting_equipment_cost_manual',
        'checkin_cost', 'other_cost'
      ];

      const dateFields = [
        'date_moving_in', 'rent_accrual_date', 'operation_start_date'
      ];

      if (dateFields.includes(fieldName)) {
        inputType = 'date';
      } else if (numericFields.includes(fieldName)) {
        inputType = 'number';
      }

      return (
        <Input
          type={inputType}
          value={getSafeValue(value)}
          onChange={(e) => handleInputChange(fieldName, e.target.value)}
          disabled={!config.editable}
          required={config.required}
        />
      );
    }
  };

  // データ取得
  const fetchRoomTypeData = useCallback(async () => {
    if (!roomTypeId || !isOpen) return;

    try {
      setLoading(true);
      setError(null);

      console.log(`部屋タイプデータを取得中: ID=${roomTypeId}`);
      const dataResponse = await apiService.getRoomTypeData(roomTypeId);

      console.log('APIレスポンス:', dataResponse);
      console.log('レスポンスの型:', typeof dataResponse);
      console.log('レスポンスの配列判定:', Array.isArray(dataResponse));

      if (dataResponse && dataResponse.length > 0) {
        console.log('配列の最初の要素:', dataResponse[0]);
        console.log('最初の要素のキー:', Object.keys(dataResponse[0]));

        // 各フィールドのデータ型と値をチェック
        const firstItem = dataResponse[0];
        Object.keys(firstItem).forEach(key => {
          const value = firstItem[key];
          console.log(`フィールド ${key}:`, {
            value: value,
            type: typeof value,
            isObject: typeof value === 'object',
            hasValueProperty: value && typeof value === 'object' && 'value' in value
          });
        });

        setRoomTypeData(dataResponse[0]);
        console.log('部屋タイプデータを取得しました:', dataResponse[0]);
      } else if (dataResponse && !Array.isArray(dataResponse)) {
        // 配列ではなく単一オブジェクトの場合
        console.log('単一オブジェクトとして設定:', dataResponse);
        console.log('オブジェクトのキー:', Object.keys(dataResponse));
        setRoomTypeData(dataResponse);
      } else {
        console.log('データが見つかりません:', dataResponse);
        setError('部屋タイプデータが見つかりませんでした');
      }

    } catch (error) {
      console.error('Error fetching room type data:', error);
      setError('部屋タイプデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [roomTypeId, isOpen]);

  // ドロワーが開いたときにデータを取得
  useEffect(() => {
    fetchRoomTypeData();
    if (activeTab === 'history') {
      fetchHistoryData();
    }
  }, [fetchRoomTypeData, fetchHistoryData, activeTab]);

  // タブ切り替え時の処理
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'history' && historyData.length === 0 && !historyLoading) {
      fetchHistoryData();
    }
  };

  // ドロワーが閉じたときにデータをクリア
  useEffect(() => {
    if (!isOpen) {
      setRoomTypeData(null);
      setError(null);
      setEditMode(false);
      setEditData({});
      setActiveTab('details');
      setHistoryData([]);
      setHistoryError(null);
    }
  }, [isOpen]);

  // 編集データの初期化
  useEffect(() => {
    if (roomTypeData && !editMode) {
      setEditData(roomTypeData);
    }
  }, [roomTypeData, editMode]);

  // 入力値の変更処理
  const handleInputChange = (field, value) => {
    setEditData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      // 都道府県が変更された場合、市区をリセット
      if (field === 'prefectures') {
        newData.city = '';
      }

      return newData;
    });
  };  // 保存処理（変更されたフィールドのみを送信）
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      console.log('部屋タイプデータを更新中:', editData);
      console.log('元の部屋タイプデータ:', roomTypeData);

      // 変更されたフィールドのみを抽出
      const changedData = {};

      // 値の正規化関数（BigQueryの型に合わせた変換）
      const normalizeValue = (value, fieldName) => {
        if (value === null || value === undefined || value === '') {
          return null;
        }

        // BigQueryの型に合わせて値を変換
        if (fieldName === 'minpaku_price' || fieldName === 'monthly_price' ||
          fieldName === 'payment_rent' || fieldName === 'management_expenses' ||
          fieldName === 'brokerage_commission' || fieldName === 'deposit' ||
          fieldName === 'key_money' || fieldName === 'key_exchange_money' ||
          fieldName === 'renovation_cost' || fieldName === 'property_introduction_fee' ||
          fieldName === 'other_initial_cost' || fieldName === 'renewal_fee' ||
          fieldName === 'Initial_guarantee_rate' || fieldName === 'monthly_guarantee_fee_rate' ||
          fieldName === 'walk_min_1' || fieldName === 'walk_min_2' ||
          fieldName === 'sqm' || fieldName === 'pax' || fieldName === 'completion_year' ||
          fieldName === 'minpaku_plan' || fieldName === 'num_of_room_per_building' ||
          fieldName === 'total_sqm' || fieldName === 'firefighting_equipment_cost' ||
          fieldName === 'firefighting_equipment_cost_manual' || fieldName === 'checkin_cost' ||
          fieldName === 'other_cost') {
          // NUMERIC型フィールドの場合、数値に変換
          const numValue = parseFloat(value);
          return isNaN(numValue) ? null : numValue;
        }

        if (fieldName === 'date_moving_in' || fieldName === 'rent_accrual_date' ||
          fieldName === 'operation_start_date') {
          // DATE型フィールドの場合、日付形式をチェック
          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return value;
          }
          return null;
        }

        // STRING型フィールドの場合、文字列に変換
        return String(value);
      };

      // 各フィールドを比較して変更があるもののみを抽出
      Object.keys(editData).forEach(key => {
        let newValue = editData[key];
        let currentValue = roomTypeData[key];

        // BigQueryのオブジェクト形式の値を処理
        if (newValue && typeof newValue === 'object' && newValue.value !== undefined) {
          newValue = newValue.value;
        }
        if (currentValue && typeof currentValue === 'object' && currentValue.value !== undefined) {
          currentValue = currentValue.value;
        }

        // 値を正規化して比較
        const normalizedNewValue = normalizeValue(newValue, key);
        const normalizedCurrentValue = normalizeValue(currentValue, key);

        // 値が変更されている場合のみ送信データに含める
        if (normalizedNewValue !== normalizedCurrentValue) {
          console.log(`フィールド ${key} が変更されました: "${normalizedCurrentValue}" -> "${normalizedNewValue}"`);
          changedData[key] = normalizedNewValue;
        }
      });

      // 変更がない場合は早期リターン
      if (Object.keys(changedData).length === 0) {
        setError('変更されたデータがないため、更新は行われませんでした');
        setEditMode(false);
        setSaving(false);
        return;
      }

      // 必須項目の検証（変更されたフィールドのみ）
      const requiredFields = Object.keys(fieldConfig).filter(key => fieldConfig[key].required);
      const missingFields = requiredFields.filter(field => {
        // 変更されたフィールドまたは既存のデータがない場合のみチェック
        const fieldValue = changedData.hasOwnProperty(field) ? changedData[field] : roomTypeData[field];
        const normalizedValue = normalizeValue(fieldValue, field);
        return normalizedValue === null || normalizedValue === '';
      });

      if (missingFields.length > 0) {
        const fieldNames = missingFields.map(field => getFieldDisplayName(field));
        setError(`以下の必須項目が入力されていません: ${fieldNames.join(', ')}`);
        setSaving(false);
        return;
      }

      console.log('変更されたフィールド:', changedData);
      console.log('BigQueryに送信するデータ:', changedData);

      // APIを呼び出してBigQueryのデータを更新（変更されたフィールドのみ）
      await apiService.updateRoomTypeData(roomTypeId, changedData);

      // 成功した場合、表示データを更新
      setRoomTypeData(prev => ({ ...prev, ...changedData }));
      setEditMode(false);
      alert(`部屋タイプデータが正常に更新されました（${Object.keys(changedData).length}個のフィールド）`);

      console.log('BigQueryの部屋タイプデータが更新されました:', changedData);

      // データを再取得して最新状態を確保
      setTimeout(() => {
        fetchRoomTypeData();
        // 履歴データも更新
        if (activeTab === 'history' || historyData.length > 0) {
          fetchHistoryData();
        }
      }, 1000);

    } catch (error) {
      console.error('Error saving room type data:', error);
      setError('部屋タイプデータの保存に失敗しました: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  // 編集モードの切り替え
  const toggleEditMode = () => {
    if (editMode) {
      // 編集をキャンセル
      setEditData(roomTypeData);
    }
    setEditMode(!editMode);
  };

  // オーバーレイクリックで閉じる
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // ESCキーで閉じる
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.keyCode === 27) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  // 変更履歴を表示するコンポーネント
  const renderHistoryContent = () => {
    if (historyLoading) {
      return (
        <LoadingContainer>
          <div className="spinner">⟳</div>
          変更履歴を読み込んでいます...
        </LoadingContainer>
      );
    }

    if (historyError) {
      return (
        <ErrorMessage>{historyError}</ErrorMessage>
      );
    }

    if (historyData.length === 0) {
      return (
        <HistoryContainer>
          <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
            変更履歴はありません
          </div>
        </HistoryContainer>
      );
    }

    return (
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
                      <OldValue>{formatHistoryValue(change.old || change.old_value)}</OldValue>
                      <Arrow>→</Arrow>
                      <NewValue>{formatHistoryValue(change.new || change.new_value)}</NewValue>
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
    );
  };

  return (
    <>
      <DrawerOverlay isOpen={isOpen} onClick={handleOverlayClick} />
      <DrawerContainer isOpen={isOpen}>
        <DrawerHeader>
          <DrawerTitle>部屋タイプ詳細</DrawerTitle>
          <HeaderButtons>
            <CloseButton onClick={onClose} aria-label="閉じる">
              ×
            </CloseButton>
          </HeaderButtons>
        </DrawerHeader>

        {/* タブ */}
        <TabContainer>
          <TabButton
            active={activeTab === 'details'}
            onClick={() => handleTabChange('details')}
          >
            基本情報
          </TabButton>
          <TabButton
            active={activeTab === 'history'}
            onClick={() => handleTabChange('history')}
          >
            変更履歴
          </TabButton>
        </TabContainer>

        <DrawerContent>
          {activeTab === 'details' && (
            <>
              {loading && (
                <LoadingContainer>
                  <div className="spinner">⟳</div>
                  データを読み込んでいます...
                </LoadingContainer>
              )}

              {error && (
                <ErrorMessage>{error}</ErrorMessage>
              )}

              {roomTypeData && !loading && !error && (
                <>
                  {editMode ? (
                    <EditForm>
                      <SectionTitle>基本情報</SectionTitle>
                      <FormGroup>
                        <Label>部屋タイプID</Label>
                        <Input
                          type="text"
                          value={getSafeValue(editData.id)}
                          disabled={true}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label className={fieldConfig.name.required ? 'required' : ''}>部屋タイプ名</Label>
                        <Input
                          type="text"
                          value={getSafeValue(editData.name)}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          disabled={!fieldConfig.name.editable}
                          required={fieldConfig.name.required}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>部屋タイプ作成日</Label>
                        <Input
                          type="datetime-local"
                          value={getSafeValue(editData.create_date)}
                          disabled={true}
                        />
                      </FormGroup>

                      <SectionTitle>価格・運営情報</SectionTitle>
                      <FormGroup>
                        <Label>民泊単価</Label>
                        <Input
                          type="number"
                          value={getSafeValue(editData.minpaku_price)}
                          onChange={(e) => handleInputChange('minpaku_price', e.target.value)}
                          disabled={!fieldConfig.minpaku_price.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>マンスリー単価</Label>
                        <Input
                          type="number"
                          value={getSafeValue(editData.monthly_price)}
                          onChange={(e) => handleInputChange('monthly_price', e.target.value)}
                          disabled={!fieldConfig.monthly_price.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>収容人数</Label>
                        <Input
                          type="number"
                          value={getSafeValue(editData.pax)}
                          onChange={(e) => handleInputChange('pax', e.target.value)}
                          disabled={!fieldConfig.pax.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label className={fieldConfig.owner_type.required ? 'required' : ''}>所有者属性</Label>
                        {renderField('owner_type', '所有者属性', editData.owner_type)}
                      </FormGroup>

                      <FormGroup>
                        <Label className={fieldConfig.register_type.required ? 'required' : ''}>運営形態</Label>
                        {renderField('register_type', '運営形態', editData.register_type)}
                      </FormGroup>

                      <SectionTitle>費用情報</SectionTitle>
                      <FormGroup>
                        <Label>賃料</Label>
                        <Input
                          type="number"
                          value={getSafeValue(editData.payment_rent)}
                          onChange={(e) => handleInputChange('payment_rent', e.target.value)}
                          disabled={!fieldConfig.payment_rent.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>管理費</Label>
                        <Input
                          type="number"
                          value={getSafeValue(editData.management_expenses)}
                          onChange={(e) => handleInputChange('management_expenses', e.target.value)}
                          disabled={!fieldConfig.management_expenses.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>仲介手数料</Label>
                        <Input
                          type="number"
                          value={getSafeValue(editData.brokerage_commission)}
                          onChange={(e) => handleInputChange('brokerage_commission', e.target.value)}
                          disabled={!fieldConfig.brokerage_commission.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>敷金</Label>
                        <Input
                          type="number"
                          value={getSafeValue(editData.deposit)}
                          onChange={(e) => handleInputChange('deposit', e.target.value)}
                          disabled={!fieldConfig.deposit.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>礼金</Label>
                        <Input
                          type="number"
                          value={getSafeValue(editData.key_money)}
                          onChange={(e) => handleInputChange('key_money', e.target.value)}
                          disabled={!fieldConfig.key_money.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>鍵交換費用</Label>
                        <Input
                          type="number"
                          value={getSafeValue(editData.key_exchange_money)}
                          onChange={(e) => handleInputChange('key_exchange_money', e.target.value)}
                          disabled={!fieldConfig.key_exchange_money.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>リフォーム費用</Label>
                        <Input
                          type="number"
                          value={getSafeValue(editData.renovation_cost)}
                          onChange={(e) => handleInputChange('renovation_cost', e.target.value)}
                          disabled={!fieldConfig.renovation_cost.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>物件紹介手数料</Label>
                        <Input
                          type="number"
                          value={getSafeValue(editData.property_introduction_fee)}
                          onChange={(e) => handleInputChange('property_introduction_fee', e.target.value)}
                          disabled={!fieldConfig.property_introduction_fee.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>初期その他項目</Label>
                        <Input
                          type="text"
                          value={getSafeValue(editData.other_initial_cost_name)}
                          onChange={(e) => handleInputChange('other_initial_cost_name', e.target.value)}
                          disabled={!fieldConfig.other_initial_cost_name.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>初期その他金額</Label>
                        <Input
                          type="number"
                          value={getSafeValue(editData.other_initial_cost)}
                          onChange={(e) => handleInputChange('other_initial_cost', e.target.value)}
                          disabled={!fieldConfig.other_initial_cost.editable}
                        />
                      </FormGroup>

                      <SectionTitle>契約情報</SectionTitle>
                      <FormGroup>
                        <Label>契約種類</Label>
                        {renderField('contract_type', '契約種類', editData.contract_type)}
                      </FormGroup>

                      <FormGroup>
                        <Label>契約期間 年間</Label>
                        <Input
                          type="text"
                          value={getSafeValue(editData.contract_period)}
                          onChange={(e) => handleInputChange('contract_period', e.target.value)}
                          disabled={!fieldConfig.contract_period.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>更新料</Label>
                        <Input
                          type="number"
                          value={getSafeValue(editData.renewal_fee)}
                          onChange={(e) => handleInputChange('renewal_fee', e.target.value)}
                          disabled={!fieldConfig.renewal_fee.editable}
                        />
                      </FormGroup>

                      <SectionTitle>日付情報</SectionTitle>
                      <FormGroup>
                        <Label>入居日</Label>
                        <Input
                          type="date"
                          value={getSafeValue(editData.date_moving_in)}
                          onChange={(e) => handleInputChange('date_moving_in', e.target.value)}
                          disabled={!fieldConfig.date_moving_in.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>賃発日</Label>
                        <Input
                          type="date"
                          value={getSafeValue(editData.rent_accrual_date)}
                          onChange={(e) => handleInputChange('rent_accrual_date', e.target.value)}
                          disabled={!fieldConfig.rent_accrual_date.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>運営開始日</Label>
                        <Input
                          type="date"
                          value={getSafeValue(editData.operation_start_date)}
                          onChange={(e) => handleInputChange('operation_start_date', e.target.value)}
                          disabled={!fieldConfig.operation_start_date.editable}
                        />
                      </FormGroup>

                      <SectionTitle>保証・保険情報</SectionTitle>
                      <FormGroup>
                        <Label>保証会社利用</Label>
                        {renderField('use_guarantee_company', '保証会社利用', editData.use_guarantee_company)}
                      </FormGroup>

                      <FormGroup>
                        <Label>初回保証料割合 %</Label>
                        {renderField('Initial_guarantee_rate', '初回保証料割合 %', editData.Initial_guarantee_rate)}
                      </FormGroup>

                      <FormGroup>
                        <Label>月額保証料割合 %</Label>
                        {renderField('monthly_guarantee_fee_rate', '月額保証料割合 %', editData.monthly_guarantee_fee_rate)}
                      </FormGroup>

                      <FormGroup>
                        <Label>共済会 保険</Label>
                        {renderField('maa_insurance', '共済会 保険', editData.maa_insurance)}
                      </FormGroup>

                      <SectionTitle>住所・立地情報</SectionTitle>
                      <FormGroup>
                        <Label>都道府県</Label>
                        <Select
                          value={getSafeValue(editData.prefectures)}
                          onChange={(e) => handleInputChange('prefectures', e.target.value)}
                          disabled={!fieldConfig.prefectures.editable}
                        >
                          {getSelectOptions().prefectures.map((option, index) => (
                            <option key={index} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                      </FormGroup>

                      <FormGroup>
                        <Label>市区</Label>
                        <Select
                          value={getSafeValue(editData.city)}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          disabled={!fieldConfig.city.editable}
                        >
                          {getSelectOptions().city.map((option, index) => (
                            <option key={index} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                      </FormGroup>

                      <FormGroup>
                        <Label>以後住所</Label>
                        <Input
                          type="text"
                          value={getSafeValue(editData.town)}
                          onChange={(e) => handleInputChange('town', e.target.value)}
                          disabled={!fieldConfig.town.editable}
                        />
                      </FormGroup>

                      <SectionTitle>用途地域情報</SectionTitle>
                      <FormGroup>
                        <Label>用途地域</Label>
                        {renderField('area_zoned_for_use', '用途地域', editData.area_zoned_for_use)}
                      </FormGroup>

                      <FormGroup>
                        <Label>用途地域確認依頼</Label>
                        {renderField('request_checking_area_zoned_for_use', '用途地域確認依頼', editData.request_checking_area_zoned_for_use)}
                      </FormGroup>

                      <FormGroup>
                        <Label>用途地域確認済</Label>
                        {renderField('done_checking_area_zoned_for_use', '用途地域確認済', editData.done_checking_area_zoned_for_use)}
                      </FormGroup>

                      <FormGroup>
                        <Label>特別用途地区</Label>
                        <Input
                          type="text"
                          value={getSafeValue(editData.special_use_areas)}
                          onChange={(e) => handleInputChange('special_use_areas', e.target.value)}
                          disabled={!fieldConfig.special_use_areas.editable}
                        />
                      </FormGroup>

                      <SectionTitle>交通情報</SectionTitle>
                      <FormGroup>
                        <Label>路線1</Label>
                        <Input
                          type="text"
                          value={getSafeValue(editData.route_1)}
                          onChange={(e) => handleInputChange('route_1', e.target.value)}
                          disabled={!fieldConfig.route_1.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>駅1</Label>
                        <Input
                          type="text"
                          value={getSafeValue(editData.station_1)}
                          onChange={(e) => handleInputChange('station_1', e.target.value)}
                          disabled={!fieldConfig.station_1.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>徒歩分数1</Label>
                        <Input
                          type="number"
                          value={getSafeValue(editData.walk_min_1)}
                          onChange={(e) => handleInputChange('walk_min_1', e.target.value)}
                          disabled={!fieldConfig.walk_min_1.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>路線2</Label>
                        <Input
                          type="text"
                          value={getSafeValue(editData.route_2)}
                          onChange={(e) => handleInputChange('route_2', e.target.value)}
                          disabled={!fieldConfig.route_2.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>駅2</Label>
                        <Input
                          type="text"
                          value={getSafeValue(editData.station_2)}
                          onChange={(e) => handleInputChange('station_2', e.target.value)}
                          disabled={!fieldConfig.station_2.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>徒歩分数2</Label>
                        <Input
                          type="number"
                          value={getSafeValue(editData.walk_min_2)}
                          onChange={(e) => handleInputChange('walk_min_2', e.target.value)}
                          disabled={!fieldConfig.walk_min_2.editable}
                        />
                      </FormGroup>

                      <SectionTitle>建物・部屋仕様</SectionTitle>
                      <FormGroup>
                        <Label>間取り</Label>
                        {renderField('floor_plan', '間取り', editData.floor_plan)}
                      </FormGroup>

                      <FormGroup>
                        <Label>EVの有無</Label>
                        {renderField('ev', 'EVの有無', editData.ev)}
                      </FormGroup>

                      <FormGroup>
                        <Label>広さ</Label>
                        {renderField('sqm', '広さ', editData.sqm)}
                      </FormGroup>

                      <FormGroup>
                        <Label>部屋種別</Label>
                        {renderField('room_type', '部屋種別', editData.room_type)}
                      </FormGroup>

                      <FormGroup>
                        <Label>建物構造</Label>
                        {renderField('building_structure', '建物構造', editData.building_structure)}
                      </FormGroup>

                      <FormGroup>
                        <Label>竣工年</Label>
                        <Input
                          type="number"
                          value={getSafeValue(editData.completion_year)}
                          onChange={(e) => handleInputChange('completion_year', e.target.value)}
                          disabled={!fieldConfig.completion_year.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>民泊利用 自社運営予定 予定数</Label>
                        <Input
                          type="number"
                          value={getSafeValue(editData.minpaku_plan)}
                          onChange={(e) => handleInputChange('minpaku_plan', e.target.value)}
                          disabled={!fieldConfig.minpaku_plan.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>部屋所在階</Label>
                        <Input
                          type="text"
                          value={getSafeValue(editData.room_floor)}
                          onChange={(e) => handleInputChange('room_floor', e.target.value)}
                          disabled={!fieldConfig.room_floor.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>建物階数</Label>
                        <Input
                          type="text"
                          value={getSafeValue(editData.building_floor)}
                          onChange={(e) => handleInputChange('building_floor', e.target.value)}
                          disabled={!fieldConfig.building_floor.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>建物全体部屋数</Label>
                        <Input
                          type="number"
                          value={getSafeValue(editData.num_of_room_per_building)}
                          onChange={(e) => handleInputChange('num_of_room_per_building', e.target.value)}
                          disabled={!fieldConfig.num_of_room_per_building.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>階段位置</Label>
                        <Input
                          type="text"
                          value={getSafeValue(editData.staircase_location)}
                          onChange={(e) => handleInputChange('staircase_location', e.target.value)}
                          disabled={!fieldConfig.staircase_location.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>建物延床面積</Label>
                        <Input
                          type="number"
                          value={getSafeValue(editData.total_sqm)}
                          onChange={(e) => handleInputChange('total_sqm', e.target.value)}
                          disabled={!fieldConfig.total_sqm.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>平面図の有無</Label>
                        {renderField('availability_of_floor_plan', '平面図の有無', editData.availability_of_floor_plan)}
                      </FormGroup>

                      <FormGroup>
                        <Label>他フロアの用途</Label>
                        {renderField('applications_for_other_floors', '他フロアの用途', editData.applications_for_other_floors)}
                      </FormGroup>

                      <SectionTitle>消防・設備情報</SectionTitle>
                      <FormGroup>
                        <Label>現況消防設備</Label>
                        {renderField('firefighting_equipment', '現況消防設備', editData.firefighting_equipment)}
                      </FormGroup>

                      <FormGroup>
                        <Label>消防設備費用 自動</Label>
                        {renderField('firefighting_equipment_cost', '消防設備費用 自動', editData.firefighting_equipment_cost)}
                      </FormGroup>

                      <FormGroup>
                        <Label>消防設備費用 手動</Label>
                        {renderField('firefighting_equipment_cost_manual', '消防設備費用 手動', editData.firefighting_equipment_cost_manual)}
                      </FormGroup>

                      <FormGroup>
                        <Label>家具譲渡の有無</Label>
                        {renderField('furniture_transfer_availability', '家具譲渡の有無', editData.furniture_transfer_availability)}
                      </FormGroup>

                      <SectionTitle>その他費用</SectionTitle>
                      <FormGroup>
                        <Label>check-in原価</Label>
                        <Input
                          type="number"
                          value={getSafeValue(editData.checkin_cost)}
                          onChange={(e) => handleInputChange('checkin_cost', e.target.value)}
                          disabled={!fieldConfig.checkin_cost.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>月額その他項目</Label>
                        <Input
                          type="text"
                          value={getSafeValue(editData.other_cost_name)}
                          onChange={(e) => handleInputChange('other_cost_name', e.target.value)}
                          disabled={!fieldConfig.other_cost_name.editable}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>月額その他費用</Label>
                        <Input
                          type="number"
                          value={getSafeValue(editData.other_cost)}
                          onChange={(e) => handleInputChange('other_cost', e.target.value)}
                          disabled={!fieldConfig.other_cost.editable}
                        />
                      </FormGroup>
                    </EditForm>
                  ) : (
                    <DataContainer>
                      <DataSectionTitle>基本情報</DataSectionTitle>                                    <DataItem>
                        <HeaderText>部屋タイプID</HeaderText>
                        <DataValue>{getDisplayValue('id', roomTypeData.id)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>部屋タイプ名</HeaderText>
                        <DataValue>{getDisplayValue('name', roomTypeData.name)}</DataValue>
                      </DataItem>



                      <DataItem>
                        <HeaderText>部屋タイプ作成日</HeaderText>
                        <DataValue>{getDisplayValue('create_date', roomTypeData.create_date)}</DataValue>
                      </DataItem>                                    <DataSectionTitle>価格・運営情報</DataSectionTitle>
                      <DataItem>
                        <HeaderText>民泊単価</HeaderText>
                        <DataValue>{getDisplayValue('minpaku_price', roomTypeData.minpaku_price)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>マンスリー単価</HeaderText>
                        <DataValue>{getDisplayValue('monthly_price', roomTypeData.monthly_price)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>収容人数</HeaderText>
                        <DataValue>{getDisplayValue('pax', roomTypeData.pax)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>所有者属性</HeaderText>
                        <DataValue>{getDisplayValue('owner_type', roomTypeData.owner_type)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>運営形態</HeaderText>
                        <DataValue>{getDisplayValue('register_type', roomTypeData.register_type)}</DataValue>
                      </DataItem>

                      <DataSectionTitle>費用情報</DataSectionTitle>
                      <DataItem>
                        <HeaderText>賃料</HeaderText>
                        <DataValue>{getDisplayValue('payment_rent', roomTypeData.payment_rent)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>管理費</HeaderText>
                        <DataValue>{getDisplayValue('management_expenses', roomTypeData.management_expenses)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>仲介手数料</HeaderText>
                        <DataValue>{getDisplayValue('brokerage_commission', roomTypeData.brokerage_commission)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>敷金</HeaderText>
                        <DataValue>{getDisplayValue('deposit', roomTypeData.deposit)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>礼金</HeaderText>
                        <DataValue>{getDisplayValue('key_money', roomTypeData.key_money)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>鍵交換費用</HeaderText>
                        <DataValue>{getDisplayValue('key_exchange_money', roomTypeData.key_exchange_money)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>リフォーム費用</HeaderText>
                        <DataValue>{getDisplayValue('renovation_cost', roomTypeData.renovation_cost)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>物件紹介手数料</HeaderText>
                        <DataValue>{getDisplayValue('property_introduction_fee', roomTypeData.property_introduction_fee)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>初期その他項目</HeaderText>
                        <DataValue>{getDisplayValue('other_initial_cost_name', roomTypeData.other_initial_cost_name)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>初期その他金額</HeaderText>
                        <DataValue>{getDisplayValue('other_initial_cost', roomTypeData.other_initial_cost)}</DataValue>
                      </DataItem>

                      <DataSectionTitle>契約情報</DataSectionTitle>
                      <DataItem>
                        <HeaderText>契約種類</HeaderText>
                        <DataValue>{getDisplayValue('contract_type', roomTypeData.contract_type)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>契約期間 年間</HeaderText>
                        <DataValue>{getDisplayValue('contract_period', roomTypeData.contract_period)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>更新料</HeaderText>
                        <DataValue>{getDisplayValue('renewal_fee', roomTypeData.renewal_fee)}</DataValue>
                      </DataItem>

                      <DataSectionTitle>日付情報</DataSectionTitle>
                      <DataItem>
                        <HeaderText>入居日</HeaderText>
                        <DataValue>{getDisplayValue('date_moving_in', roomTypeData.date_moving_in)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>賃発日</HeaderText>
                        <DataValue>{getDisplayValue('rent_accrual_date', roomTypeData.rent_accrual_date)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>運営開始日</HeaderText>
                        <DataValue>{getDisplayValue('operation_start_date', roomTypeData.operation_start_date)}</DataValue>
                      </DataItem>

                      <DataSectionTitle>保証・保険情報</DataSectionTitle>
                      <DataItem>
                        <HeaderText>保証会社利用</HeaderText>
                        <DataValue>{getDisplayValue('use_guarantee_company', roomTypeData.use_guarantee_company)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>初回保証料割合 %</HeaderText>
                        <DataValue>{getDisplayValue('Initial_guarantee_rate', roomTypeData.Initial_guarantee_rate)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>月額保証料割合 %</HeaderText>
                        <DataValue>{getDisplayValue('monthly_guarantee_fee_rate', roomTypeData.monthly_guarantee_fee_rate)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>共済会 保険</HeaderText>
                        <DataValue>{getDisplayValue('maa_insurance', roomTypeData.maa_insurance)}</DataValue>
                      </DataItem>

                      <DataSectionTitle>住所・立地情報</DataSectionTitle>
                      <DataItem>
                        <HeaderText>都道府県</HeaderText>
                        <DataValue>{getDisplayValue('prefectures', roomTypeData.prefectures)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>市区</HeaderText>
                        <DataValue>{getDisplayValue('city', roomTypeData.city)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>以後住所</HeaderText>
                        <DataValue>{getDisplayValue('town', roomTypeData.town)}</DataValue>
                      </DataItem>

                      <DataSectionTitle>用途地域情報</DataSectionTitle>
                      <DataItem>
                        <HeaderText>用途地域</HeaderText>
                        <DataValue>{getDisplayValue('area_zoned_for_use', roomTypeData.area_zoned_for_use)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>用途地域確認依頼</HeaderText>
                        <DataValue>{getDisplayValue('request_checking_area_zoned_for_use', roomTypeData.request_checking_area_zoned_for_use)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>用途地域確認済</HeaderText>
                        <DataValue>{getDisplayValue('done_checking_area_zoned_for_use', roomTypeData.done_checking_area_zoned_for_use)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>特別用途地区</HeaderText>
                        <DataValue>{getDisplayValue('special_use_areas', roomTypeData.special_use_areas)}</DataValue>
                      </DataItem>

                      <DataSectionTitle>交通情報</DataSectionTitle>
                      <DataItem>
                        <HeaderText>路線1</HeaderText>
                        <DataValue>{getDisplayValue('route_1', roomTypeData.route_1)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>駅1</HeaderText>
                        <DataValue>{getDisplayValue('station_1', roomTypeData.station_1)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>徒歩分数1</HeaderText>
                        <DataValue>{getDisplayValue('walk_min_1', roomTypeData.walk_min_1)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>路線2</HeaderText>
                        <DataValue>{getDisplayValue('route_2', roomTypeData.route_2)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>駅2</HeaderText>
                        <DataValue>{getDisplayValue('station_2', roomTypeData.station_2)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>徒歩分数2</HeaderText>
                        <DataValue>{getDisplayValue('walk_min_2', roomTypeData.walk_min_2)}</DataValue>
                      </DataItem>

                      <DataSectionTitle>建物・部屋仕様</DataSectionTitle>
                      <DataItem>
                        <HeaderText>間取り</HeaderText>
                        <DataValue>{getDisplayValue('floor_plan', roomTypeData.floor_plan)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>EVの有無</HeaderText>
                        <DataValue>{getDisplayValue('ev', roomTypeData.ev)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>広さ</HeaderText>
                        <DataValue>{getDisplayValue('sqm', roomTypeData.sqm)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>部屋種別</HeaderText>
                        <DataValue>{getDisplayValue('room_type', roomTypeData.room_type)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>建物構造</HeaderText>
                        <DataValue>{getDisplayValue('building_structure', roomTypeData.building_structure)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>竣工年</HeaderText>
                        <DataValue>{getDisplayValue('completion_year', roomTypeData.completion_year)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>民泊利用 自社運営予定 予定数</HeaderText>
                        <DataValue>{getDisplayValue('minpaku_plan', roomTypeData.minpaku_plan)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>部屋所在階</HeaderText>
                        <DataValue>{getDisplayValue('room_floor', roomTypeData.room_floor)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>建物階数</HeaderText>
                        <DataValue>{getDisplayValue('building_floor', roomTypeData.building_floor)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>建物全体部屋数</HeaderText>
                        <DataValue>{getDisplayValue('num_of_room_per_building', roomTypeData.num_of_room_per_building)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>階段位置</HeaderText>
                        <DataValue>{getDisplayValue('staircase_location', roomTypeData.staircase_location)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>建物延床面積</HeaderText>
                        <DataValue>{getDisplayValue('total_sqm', roomTypeData.total_sqm)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>平面図の有無</HeaderText>
                        <DataValue>{getDisplayValue('availability_of_floor_plan', roomTypeData.availability_of_floor_plan)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>他フロアの用途</HeaderText>
                        <DataValue>{getDisplayValue('applications_for_other_floors', roomTypeData.applications_for_other_floors)}</DataValue>
                      </DataItem>

                      <DataSectionTitle>消防・設備情報</DataSectionTitle>
                      <DataItem>
                        <HeaderText>現況消防設備</HeaderText>
                        <DataValue>{getDisplayValue('firefighting_equipment', roomTypeData.firefighting_equipment)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>消防設備費用 自動</HeaderText>
                        <DataValue>{getDisplayValue('firefighting_equipment_cost', roomTypeData.firefighting_equipment_cost)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>消防設備費用 手動</HeaderText>
                        <DataValue>{getDisplayValue('firefighting_equipment_cost_manual', roomTypeData.firefighting_equipment_cost_manual)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>家具譲渡の有無</HeaderText>
                        <DataValue>{getDisplayValue('furniture_transfer_availability', roomTypeData.furniture_transfer_availability)}</DataValue>
                      </DataItem>

                      <DataSectionTitle>その他費用</DataSectionTitle>
                      <DataItem>
                        <HeaderText>check-in原価</HeaderText>
                        <DataValue>{getDisplayValue('checkin_cost', roomTypeData.checkin_cost)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>月額その他項目</HeaderText>
                        <DataValue>{getDisplayValue('other_cost_name', roomTypeData.other_cost_name)}</DataValue>
                      </DataItem>

                      <DataItem>
                        <HeaderText>月額その他費用</HeaderText>
                        <DataValue>{getDisplayValue('other_cost', roomTypeData.other_cost)}</DataValue>
                      </DataItem>
                    </DataContainer>
                  )}

                  <ButtonGroup>
                    {editMode ? (
                      <>
                        <Button
                          primary
                          onClick={handleSave}
                          disabled={saving}
                        >
                          {saving ? '保存中...' : '保存'}
                        </Button>
                        <Button onClick={toggleEditMode}>
                          キャンセル
                        </Button>
                      </>
                    ) : (
                      <Button primary onClick={toggleEditMode}>
                        編集
                      </Button>
                    )}
                  </ButtonGroup>
                </>
              )}
            </>
          )}

          {activeTab === 'history' && renderHistoryContent()}
        </DrawerContent>
      </DrawerContainer>
    </>
  );
};

export default RoomTypeDrawer;
