import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { apiService } from '../services/apiService';
import { formatDisplayValue } from '../utils/formatUtils';

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

  // 表示用の値を取得するヘルパー関数
  const getDisplayValue = (fieldName, value) => {
    const safeValue = getSafeValue(value);
    if (!safeValue || safeValue === '') {
      return '';
    }
    return formatDisplayValue(fieldName, safeValue);
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
  }, [fetchRoomTypeData]);

  // ドロワーが閉じたときにデータをクリア
  useEffect(() => {
    if (!isOpen) {
      setRoomTypeData(null);
      setError(null);
      setEditMode(false);
      setEditData({});
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
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 保存処理
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // APIサービスに保存処理を追加する必要があります
      await apiService.updateRoomTypeData(roomTypeId, editData);

      // データを再取得
      await fetchRoomTypeData();
      setEditMode(false);
      alert('部屋タイプデータを保存しました。');
    } catch (error) {
      console.error('Error saving room type data:', error);
      setError('部屋タイプデータの保存に失敗しました');
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

  return (
    <>
      <DrawerOverlay isOpen={isOpen} onClick={handleOverlayClick} />
      <DrawerContainer isOpen={isOpen}>
        <DrawerHeader>
          <DrawerTitle>部屋タイプ詳細</DrawerTitle>
          <CloseButton onClick={onClose} aria-label="閉じる">
            ×
          </CloseButton>
        </DrawerHeader>

        <DrawerContent>
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
                  <SectionTitle>基本情報</SectionTitle>                                    <FormGroup>
                    <Label>部屋タイプID</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.id)}
                      disabled={true}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>部屋タイプ名</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.name)}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </FormGroup>



                  <FormGroup>
                    <Label>部屋タイプ作成日</Label>
                    <Input
                      type="datetime-local"
                      value={getSafeValue(editData.create_date)}
                      onChange={(e) => handleInputChange('create_date', e.target.value)}
                    />
                  </FormGroup>

                  <SectionTitle>価格・運営情報</SectionTitle>
                  <FormGroup>
                    <Label>民泊単価</Label>
                    <Input
                      type="number"
                      value={getSafeValue(editData.minpaku_price)}
                      onChange={(e) => handleInputChange('minpaku_price', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>マンスリー単価</Label>
                    <Input
                      type="number"
                      value={getSafeValue(editData.monthly_price)}
                      onChange={(e) => handleInputChange('monthly_price', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>収容人数</Label>
                    <Input
                      type="number"
                      value={getSafeValue(editData.pax)}
                      onChange={(e) => handleInputChange('pax', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>所有者属性</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.owner_type)}
                      onChange={(e) => handleInputChange('owner_type', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>運営形態</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.register_type)}
                      onChange={(e) => handleInputChange('register_type', e.target.value)}
                    />
                  </FormGroup>

                  <SectionTitle>費用情報</SectionTitle>
                  <FormGroup>
                    <Label>賃料</Label>
                    <Input
                      type="number"
                      value={getSafeValue(editData.payment_rent)}
                      onChange={(e) => handleInputChange('payment_rent', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>管理費</Label>
                    <Input
                      type="number"
                      value={getSafeValue(editData.management_expenses)}
                      onChange={(e) => handleInputChange('management_expenses', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>仲介手数料</Label>
                    <Input
                      type="number"
                      value={getSafeValue(editData.brokerage_commission)}
                      onChange={(e) => handleInputChange('brokerage_commission', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>敷金</Label>
                    <Input
                      type="number"
                      value={getSafeValue(editData.deposit)}
                      onChange={(e) => handleInputChange('deposit', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>礼金</Label>
                    <Input
                      type="number"
                      value={getSafeValue(editData.key_money)}
                      onChange={(e) => handleInputChange('key_money', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>鍵交換費用</Label>
                    <Input
                      type="number"
                      value={getSafeValue(editData.key_exchange_money)}
                      onChange={(e) => handleInputChange('key_exchange_money', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>リフォーム費用</Label>
                    <Input
                      type="number"
                      value={getSafeValue(editData.renovation_cost)}
                      onChange={(e) => handleInputChange('renovation_cost', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>物件紹介手数料</Label>
                    <Input
                      type="number"
                      value={getSafeValue(editData.property_introduction_fee)}
                      onChange={(e) => handleInputChange('property_introduction_fee', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>初期その他項目</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.other_initial_cost_name)}
                      onChange={(e) => handleInputChange('other_initial_cost_name', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>初期その他金額</Label>
                    <Input
                      type="number"
                      value={getSafeValue(editData.other_initial_cost)}
                      onChange={(e) => handleInputChange('other_initial_cost', e.target.value)}
                    />
                  </FormGroup>

                  <SectionTitle>契約情報</SectionTitle>
                  <FormGroup>
                    <Label>契約種類</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.contract_type)}
                      onChange={(e) => handleInputChange('contract_type', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>契約期間 年間</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.contract_period)}
                      onChange={(e) => handleInputChange('contract_period', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>更新料</Label>
                    <Input
                      type="number"
                      value={getSafeValue(editData.renewal_fee)}
                      onChange={(e) => handleInputChange('renewal_fee', e.target.value)}
                    />
                  </FormGroup>

                  <SectionTitle>日付情報</SectionTitle>
                  <FormGroup>
                    <Label>入居日</Label>
                    <Input
                      type="date"
                      value={getSafeValue(editData.date_moving_in)}
                      onChange={(e) => handleInputChange('date_moving_in', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>賃発日</Label>
                    <Input
                      type="date"
                      value={getSafeValue(editData.rent_accrual_date)}
                      onChange={(e) => handleInputChange('rent_accrual_date', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>運営開始日</Label>
                    <Input
                      type="date"
                      value={getSafeValue(editData.operation_start_date)}
                      onChange={(e) => handleInputChange('operation_start_date', e.target.value)}
                    />
                  </FormGroup>

                  <SectionTitle>保証・保険情報</SectionTitle>
                  <FormGroup>
                    <Label>保証会社利用</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.use_guarantee_company)}
                      onChange={(e) => handleInputChange('use_guarantee_company', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>初回保証料割合 %</Label>
                    <Input
                      type="number"
                      value={getSafeValue(editData.Initial_guarantee_rate)}
                      onChange={(e) => handleInputChange('Initial_guarantee_rate', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>月額保証料割合 %</Label>
                    <Input
                      type="number"
                      value={getSafeValue(editData.monthly_guarantee_fee_rate)}
                      onChange={(e) => handleInputChange('monthly_guarantee_fee_rate', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>共済会 保険</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.maa_insurance)}
                      onChange={(e) => handleInputChange('maa_insurance', e.target.value)}
                    />
                  </FormGroup>

                  <SectionTitle>住所・立地情報</SectionTitle>
                  <FormGroup>
                    <Label>都道府県</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.prefectures)}
                      onChange={(e) => handleInputChange('prefectures', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>市区</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.city)}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>以後住所</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.town)}
                      onChange={(e) => handleInputChange('town', e.target.value)}
                    />
                  </FormGroup>

                  <SectionTitle>用途地域情報</SectionTitle>
                  <FormGroup>
                    <Label>用途地域</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.area_zoned_for_use)}
                      onChange={(e) => handleInputChange('area_zoned_for_use', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>用途地域確認依頼</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.request_checking_area_zoned_for_use)}
                      onChange={(e) => handleInputChange('request_checking_area_zoned_for_use', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>用途地域確認済</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.done_checking_area_zoned_for_use)}
                      onChange={(e) => handleInputChange('done_checking_area_zoned_for_use', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>特別用途地区</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.special_use_areas)}
                      onChange={(e) => handleInputChange('special_use_areas', e.target.value)}
                    />
                  </FormGroup>

                  <SectionTitle>交通情報</SectionTitle>
                  <FormGroup>
                    <Label>路線1</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.route_1)}
                      onChange={(e) => handleInputChange('route_1', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>駅1</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.station_1)}
                      onChange={(e) => handleInputChange('station_1', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>徒歩分数1</Label>
                    <Input
                      type="number"
                      value={getSafeValue(editData.walk_min_1)}
                      onChange={(e) => handleInputChange('walk_min_1', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>路線2</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.route_2)}
                      onChange={(e) => handleInputChange('route_2', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>駅2</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.station_2)}
                      onChange={(e) => handleInputChange('station_2', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>徒歩分数2</Label>
                    <Input
                      type="number"
                      value={getSafeValue(editData.walk_min_2)}
                      onChange={(e) => handleInputChange('walk_min_2', e.target.value)}
                    />
                  </FormGroup>

                  <SectionTitle>建物・部屋仕様</SectionTitle>
                  <FormGroup>
                    <Label>間取り</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.floor_plan)}
                      onChange={(e) => handleInputChange('floor_plan', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>EVの有無</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.ev)}
                      onChange={(e) => handleInputChange('ev', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>広さ</Label>
                    <Input
                      type="number"
                      value={getSafeValue(editData.sqm)}
                      onChange={(e) => handleInputChange('sqm', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>部屋種別</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.room_type)}
                      onChange={(e) => handleInputChange('room_type', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>建物構造</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.building_structure)}
                      onChange={(e) => handleInputChange('building_structure', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>竣工年</Label>
                    <Input
                      type="number"
                      value={getSafeValue(editData.completion_year)}
                      onChange={(e) => handleInputChange('completion_year', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>民泊利用 自社運営予定 予定数</Label>
                    <Input
                      type="number"
                      value={getSafeValue(editData.minpaku_plan)}
                      onChange={(e) => handleInputChange('minpaku_plan', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>部屋所在階</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.room_floor)}
                      onChange={(e) => handleInputChange('room_floor', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>建物階数</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.building_floor)}
                      onChange={(e) => handleInputChange('building_floor', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>建物全体部屋数</Label>
                    <Input
                      type="number"
                      value={getSafeValue(editData.num_of_room_per_building)}
                      onChange={(e) => handleInputChange('num_of_room_per_building', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>階段位置</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.staircase_location)}
                      onChange={(e) => handleInputChange('staircase_location', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>建物延床面積</Label>
                    <Input
                      type="number"
                      value={getSafeValue(editData.total_sqm)}
                      onChange={(e) => handleInputChange('total_sqm', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>平面図の有無</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.availability_of_floor_plan)}
                      onChange={(e) => handleInputChange('availability_of_floor_plan', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>他フロアの用途</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.applications_for_other_floors)}
                      onChange={(e) => handleInputChange('applications_for_other_floors', e.target.value)}
                    />
                  </FormGroup>

                  <SectionTitle>消防・設備情報</SectionTitle>
                  <FormGroup>
                    <Label>現況消防設備</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.firefighting_equipment)}
                      onChange={(e) => handleInputChange('firefighting_equipment', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>消防設備費用 自動</Label>
                    <Input
                      type="number"
                      value={getSafeValue(editData.firefighting_equipment_cost)}
                      onChange={(e) => handleInputChange('firefighting_equipment_cost', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>消防設備費用 手動</Label>
                    <Input
                      type="number"
                      value={getSafeValue(editData.firefighting_equipment_cost_manual)}
                      onChange={(e) => handleInputChange('firefighting_equipment_cost_manual', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>家具譲渡の有無</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.furniture_transfer_availability)}
                      onChange={(e) => handleInputChange('furniture_transfer_availability', e.target.value)}
                    />
                  </FormGroup>

                  <SectionTitle>その他費用</SectionTitle>
                  <FormGroup>
                    <Label>check-in原価</Label>
                    <Input
                      type="number"
                      value={getSafeValue(editData.checkin_cost)}
                      onChange={(e) => handleInputChange('checkin_cost', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>月額その他項目</Label>
                    <Input
                      type="text"
                      value={getSafeValue(editData.other_cost_name)}
                      onChange={(e) => handleInputChange('other_cost_name', e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>月額その他費用</Label>
                    <Input
                      type="number"
                      value={getSafeValue(editData.other_cost)}
                      onChange={(e) => handleInputChange('other_cost', e.target.value)}
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
        </DrawerContent>
      </DrawerContainer>
    </>
  );
};

export default RoomTypeDrawer;
