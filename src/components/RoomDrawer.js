import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { apiService } from '../services/apiService';
import { formatDisplayValue } from '../utils/formatUtils';
import { validateRoomName, validateRoomNumber, validateOptionalText } from '../utils/validationUtils';

// 選択肢の定数定義
const SELECT_OPTIONS = {
    status: ['', 'A', 'B', 'C', 'D', 'E', 'F', 'クローズ', '運営判断中', '試算入力待ち', '試算入力済み', '試算依頼済み', '他決', '見送り'],
    vacate_setup: ['', '一般賃貸中', '退去SU']
};

// 変更履歴の日付をフォーマットするヘルパー関数
const formatHistoryDate = (dateValue) => {
    if (!dateValue) {
        return '日付不明';
    }

    try {
        let date;

        // BigQueryから返される日付形式に応じて処理
        if (typeof dateValue === 'object' && dateValue.value) {
            // BigQueryのDATETIME型オブジェクトの場合
            date = new Date(dateValue.value);
        } else if (typeof dateValue === 'string') {
            // 文字列の場合
            // ISO形式、YYYY-MM-DD HH:mm:ss形式など様々な形式をサポート
            date = new Date(dateValue);

            // Invalid Dateの場合、BigQueryの特殊な日付形式を試す
            if (isNaN(date.getTime())) {
                // BigQueryのDATETIME形式（例：2023-01-01T12:00:00）を試す
                const isoDate = dateValue.includes('T') ? dateValue : dateValue.replace(' ', 'T');
                date = new Date(isoDate);
            }

            // それでもInvalid Dateの場合、日付部分のみを抽出してみる
            if (isNaN(date.getTime())) {
                const dateMatch = dateValue.match(/(\d{4}-\d{2}-\d{2})/);
                if (dateMatch) {
                    date = new Date(dateMatch[1]);
                }
            }
        } else {
            // その他の形式（数値など）の場合
            date = new Date(dateValue);
        }

        // 日付が有効かチェック
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
  width: 800px;
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
    width: 70%;
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

// 編集ボタン
const EditButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #0056b3;
  }
  
  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
`;

// 保存ボタン
const SaveButton = styled.button`
  background-color: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #1e7e34;
  }
  
  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
`;

// キャンセルボタン
const CancelButton = styled.button`
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #5a6268;
  }
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
const TabButton = styled.button.withConfig({
    shouldForwardProp: (prop) => prop !== 'active'
})`
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

// 編集可能な入力フィールド
const EditableInput = styled.input`
  width: 100%;
  padding: 10px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.4;
  background: white;
  transition: all 0.2s ease-in-out;
  
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
`;

// フィールドコンテナ（成功時のスタイルも含む）
const FieldContainer = styled.div`
  position: relative;
  
  &.success input {
    border-color: #10b981;
    background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }
`;

// バリデーションエラー表示
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
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// 成功メッセージ
const ValidationSuccess = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #10b981;
  font-size: 12px;
  font-weight: 500;
  margin-top: 6px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  animation: slideDown 0.3s ease-out;
  
  &::before {
    content: "✅";
    font-size: 14px;
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// 編集可能なセレクトフィールド
const EditableSelect = styled.select`
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 14px;
  line-height: 1.3;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

// 保存状態メッセージ
const SaveMessage = styled.div`
  padding: 10px;
  margin-bottom: 15px;
  border-radius: 4px;
  font-size: 14px;
  
  &.success {
    background-color: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
  }
  
  &.error {
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
  }
  
  &.info {
    background-color: #d1ecf1;
    border: 1px solid #bee5eb;
    color: #0c5460;
  }
`;

// エラー表示
const ErrorMessage = styled.div`
  color: #dc3545;
  padding: 20px;
  text-align: center;
`;

// フォーマット状態表示コンテナ
const FormatStatusContainer = styled.div`
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
  
  &.correct {
    background-color: #d4edda;
    border: 1px solid #c3e6cb;
    color: #155724;
  }
  
  &.incorrect {
    background-color: #fff3cd;
    border: 1px solid #ffeaa7;
    color: #856404;
  }
  
  &.missing {
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
  }
`;

// 期待される部屋名表示
const ExpectedRoomName = styled.div`
  margin-top: 4px;
  padding: 4px 8px;
  background-color: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 3px;
  font-family: monospace;
  font-size: 13px;
  color: #1976d2;
`;

// フォーマット修正ボタン
const FixFormatButton = styled.button`
  margin-top: 6px;
  padding: 4px 8px;
  background-color: #ff9800;
  color: white;
  border: none;
  border-radius: 3px;
  font-size: 11px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f57c00;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

// RoomDrawerコンポーネント
const RoomDrawer = ({ isOpen, onClose, roomId, propertyData }) => {
    const [loading, setLoading] = useState(false);
    const [roomData, setRoomData] = useState(null);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [validationErrors, setValidationErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('details'); // 'details' or 'history'
    const [historyData, setHistoryData] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState(null);

    // 部屋名を自動生成する関数
    const generateRoomName = useCallback((roomNumber) => {
        if (!propertyData?.name || !roomNumber) {
            return '';
        }
        return `${propertyData.name} ${roomNumber}`;
    }, [propertyData?.name]);

    // 現在の編集データから生成される部屋名を取得
    const getUpdatedRoomName = useCallback(() => {
        return generateRoomName(editData.room_number);
    }, [editData.room_number, generateRoomName]);

    // 部屋名が正しいフォーマットかチェックする関数
    const isRoomNameFormatCorrect = useCallback((roomName, roomNumber) => {
        if (!propertyData?.name || !roomNumber || !roomName) {
            return false;
        }
        const expectedName = `${propertyData.name} ${roomNumber}`;
        return roomName === expectedName;
    }, [propertyData?.name]);

    // 部屋名のフォーマット状態を取得する関数
    const getRoomNameFormatStatus = useCallback((roomData) => {
        if (!roomData?.name || !roomData?.room_number) {
            return { isCorrect: false, type: 'missing', message: '部屋名または部屋番号が未設定です' };
        }

        const isCorrect = isRoomNameFormatCorrect(roomData.name, roomData.room_number);
        if (isCorrect) {
            return { isCorrect: true, type: 'correct', message: '正しいフォーマットです' };
        } else {
            const expectedName = generateRoomName(roomData.room_number);
            return {
                isCorrect: false,
                type: 'incorrect',
                message: `フォーマットが古い形式です`,
                expectedName: expectedName
            };
        }
    }, [isRoomNameFormatCorrect, generateRoomName]);

    // データ取得
    const fetchRoomData = useCallback(async () => {
        if (!roomId || !isOpen) return;

        try {
            setLoading(true);
            setError(null);

            console.log(`部屋データを取得中: ID=${roomId}`);
            const dataResponse = await apiService.getRoomData(roomId);

            if (dataResponse && dataResponse.length > 0) {
                setRoomData(dataResponse[0]);
                setEditData(dataResponse[0]); // 編集用データも初期化
                console.log('部屋データを取得しました:', dataResponse[0]);
            } else {
                setError('部屋データが見つかりませんでした');
            }

        } catch (error) {
            console.error('Error fetching room data:', error);
            setError('部屋データの取得に失敗しました');
        } finally {
            setLoading(false);
        }
    }, [roomId, isOpen]);

    // 変更履歴データ取得
    const fetchHistoryData = useCallback(async () => {
        if (!roomId || !isOpen) return;

        try {
            setHistoryLoading(true);
            setHistoryError(null);

            console.log(`部屋変更履歴を取得中: ID=${roomId}`);
            const historyResponse = await apiService.getRoomHistory(roomId);

            console.log('取得した履歴データ:', historyResponse);

            if (historyResponse && historyResponse.length > 0) {
                // 各履歴項目の日付形式をデバッグ
                historyResponse.forEach((item, index) => {
                    console.log(`履歴項目 ${index}:`, {
                        changed_at: item.changed_at,
                        changed_at_type: typeof item.changed_at,
                        changed_at_value: JSON.stringify(item.changed_at),
                        changed_by: item.changed_by,
                        changes: item.changes,
                        formatResult: formatHistoryDate(item.changed_at)
                    });
                });

                setHistoryData(historyResponse);
                console.log('部屋変更履歴を取得しました:', historyResponse);
            } else {
                setHistoryData([]);
                console.log('変更履歴はありません');
            }

        } catch (error) {
            console.error('Error fetching room history:', error);
            setHistoryError('変更履歴の取得に失敗しました');
        } finally {
            setHistoryLoading(false);
        }
    }, [roomId, isOpen]);

    // 編集モードの開始
    const handleEditStart = () => {
        setIsEditing(true);
        setEditData({ ...roomData }); // 現在のデータをコピー
        setSaveMessage(null);
    };

    // 編集のキャンセル
    const handleEditCancel = () => {
        setIsEditing(false);
        setEditData({ ...roomData }); // 元のデータに戻す
        setSaveMessage(null);
    };

    // 入力値の変更処理
    const handleInputChange = (field, value) => {
        setEditData(prev => {
            const newData = {
                ...prev,
                [field]: value
            };

            // 部屋番号が変更された場合、部屋名を自動更新するかの選択肢を提供
            if (field === 'room_number') {
                const newRoomName = generateRoomName(value);
                if (newRoomName && prev.name !== newRoomName) {
                    // 自動的には更新せず、ユーザーがボタンで選択できるようにする
                    // ここでは何もしない
                }
            }

            return newData;
        });

        // バリデーション実行（必須項目のみ）
        let validation = { isValid: true, errorMessage: '' };

        if (field === 'name') {
            validation = validateRoomName(value);
        } else if (field === 'room_number') {
            validation = validateRoomNumber(value);
        }

        // バリデーションエラーの状態を更新
        setValidationErrors(prev => ({
            ...prev,
            [field]: validation.isValid ? '' : validation.errorMessage
        }));
    };

    // 部屋名のフォーマットを修正する関数
    const handleFixRoomNameFormat = () => {
        if (!roomData?.room_number) {
            return;
        }

        const correctName = generateRoomName(roomData.room_number);
        if (correctName) {
            setEditData(prev => ({
                ...prev,
                name: correctName
            }));
        }
    };

    // データの保存（変更されたフィールドのみを送信）
    const handleSave = async () => {
        try {
            setSaving(true);
            setSaveMessage(null);

            // バリデーション実行
            if (!validateAllFields()) {
                setSaveMessage({
                    type: 'error',
                    text: '入力内容にエラーがあります。エラーメッセージを確認してください。'
                });
                setSaving(false);
                return;
            }

            console.log('部屋データを更新中:', editData);
            console.log('元の部屋データ:', roomData);

            // 変更されたフィールドのみを抽出
            const changedData = {};

            // 値の正規化関数（null、undefined、空文字を統一）
            const normalizeValue = (value) => {
                if (value === null || value === undefined || value === '') {
                    return null;
                }
                return value;
            };

            // 各フィールドを比較して変更があるもののみを抽出
            Object.keys(editData).forEach(key => {
                let newValue = editData[key];
                let currentValue = roomData[key];

                // 日付フィールドの特別処理
                const dateFields = [
                    'key_handover_scheduled_date',
                    'possible_key_handover_scheduled_date_1',
                    'possible_key_handover_scheduled_date_2',
                    'possible_key_handover_scheduled_date_3',
                    'contract_collection_date',
                    'application_intended_date'
                ];

                if (dateFields.includes(key)) {
                    // 日付フィールドのデータ形式を整備
                    if (newValue && typeof newValue === 'object' && newValue.value) {
                        newValue = newValue.value;
                    }
                    if (currentValue && typeof currentValue === 'object' && currentValue.value) {
                        currentValue = currentValue.value;
                    }
                }

                // 値を正規化して比較
                const normalizedNewValue = normalizeValue(newValue);
                const normalizedCurrentValue = normalizeValue(currentValue);

                // 値が変更されている場合のみ送信データに含める
                if (normalizedNewValue !== normalizedCurrentValue) {
                    console.log(`フィールド ${key} が変更されました: "${normalizedCurrentValue}" -> "${normalizedNewValue}"`);
                    changedData[key] = normalizedNewValue;
                }
            });

            // 部屋番号が変更された場合、部屋名も自動更新
            if (changedData.room_number !== undefined) {
                const newRoomName = generateRoomName(changedData.room_number);
                if (newRoomName && newRoomName !== roomData.name) {
                    changedData.name = newRoomName;
                    console.log(`部屋名を自動更新: "${roomData.name}" -> "${newRoomName}"`);
                }
            }

            // 変更がない場合は早期リターン
            if (Object.keys(changedData).length === 0) {
                setSaveMessage({
                    type: 'info',
                    text: '変更されたデータがないため、更新は行われませんでした'
                });
                setIsEditing(false);
                setSaving(false);
                return;
            }

            console.log('変更されたフィールド:', changedData);
            console.log('BigQueryに送信するデータ:', changedData);

            // APIを呼び出してBigQueryのデータを更新（変更されたフィールドのみ、変更者情報付き）
            const updatedData = await apiService.updateRoomData(roomId, changedData, 'user@example.com');

            // 成功した場合、表示データを更新
            const updatedRoomData = { ...roomData, ...changedData };
            setRoomData(updatedRoomData);
            setEditData(updatedRoomData); // 編集データも更新
            setIsEditing(false);
            setSaveMessage({
                type: 'success',
                text: `BigQueryの部屋データが正常に更新されました（${Object.keys(changedData).length}個のフィールド）`
            });

            console.log('BigQueryの部屋データが更新されました:', updatedData);

            // データを再取得して最新状態を確保
            setTimeout(() => {
                fetchRoomData();
                // 変更履歴タブがアクティブまたは変更履歴データが既に存在する場合は更新
                if (activeTab === 'history' || historyData.length > 0) {
                    fetchHistoryData();
                }
            }, 1000);

        } catch (error) {
            console.error('BigQueryの部屋データ更新に失敗しました:', error);
            setSaveMessage({
                type: 'error',
                text: 'BigQueryの部屋データ更新に失敗しました: ' + (error.response?.data?.message || error.message)
            });
        } finally {
            setSaving(false);
        }
    };

    // 全体バリデーションチェック
    const validateAllFields = useCallback(() => {
        const errors = {};
        let hasErrors = false;

        // 部屋名のバリデーション（必須項目）
        const nameValidation = validateRoomName(editData.name);
        if (!nameValidation.isValid) {
            errors.name = nameValidation.errorMessage;
            hasErrors = true;
        }

        // 部屋番号のバリデーション（必須項目）
        const roomNumberValidation = validateRoomNumber(editData.room_number);
        if (!roomNumberValidation.isValid) {
            errors.room_number = roomNumberValidation.errorMessage;
            hasErrors = true;
        }

        setValidationErrors(errors);
        return !hasErrors;
    }, [editData]);

    // ドロワーが開いたときにデータを取得
    useEffect(() => {
        fetchRoomData();
        if (activeTab === 'history') {
            fetchHistoryData();
        }
    }, [fetchRoomData, fetchHistoryData, activeTab]);

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
            setRoomData(null);
            setError(null);
            setIsEditing(false);
            setEditData({});
            setSaveMessage(null);
            setActiveTab('details');
            setHistoryData([]);
            setHistoryError(null);
        }
    }, [isOpen]);

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

    // フィールド名を日本語に変換する関数
    const getFieldDisplayName = (fieldName) => {
        const fieldMap = {
            'status': '進捗',
            'room_number': '部屋番号',
            'key_handover_scheduled_date': '鍵引き渡し予定日',
            'possible_key_handover_scheduled_date_1': '鍵引き渡し予定日①',
            'possible_key_handover_scheduled_date_2': '鍵引き渡し予定日②',
            'possible_key_handover_scheduled_date_3': '鍵引き渡し予定日③',
            'vacate_setup': '退去SU',
            'contract_collection_date': '契約書回収予定日',
            'application_intended_date': '申請予定日',
            'name': '部屋名',
            'create_date': '部屋登録日'
        };

        return fieldMap[fieldName] || fieldName;
    };

    // 値を表示用にフォーマットする関数
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

    // 編集可能なフィールドをレンダリングする関数
    const renderEditableField = (field, value, type = 'text', options = null) => {
        if (!isEditing) {
            // 表示モード
            if (type === 'date') {
                return <DataValue>{formatDisplayValue(field, value)}</DataValue>;
            }

            // 選択肢フィールドの場合、不正な値を検証
            if (type === 'select' && SELECT_OPTIONS[field]) {
                const isInvalidValue = value && !SELECT_OPTIONS[field].includes(value);

                if (isInvalidValue) {
                    return (
                        <DataValue
                            style={{
                                backgroundColor: '#fff3cd',
                                borderColor: '#ffc107',
                                color: '#856404'
                            }}
                        >
                            ⚠️ {value} (不正な値)
                        </DataValue>
                    );
                }
            }

            return <DataValue>{value || ''}</DataValue>;
        }

        // 編集モード
        if (type === 'select' && options) {
            const hasInvalidValue = editData[field] && SELECT_OPTIONS[field] && !SELECT_OPTIONS[field].includes(editData[field]);

            return (
                <EditableSelect
                    value={editData[field] || ''}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    style={{
                        backgroundColor: hasInvalidValue ? '#fff3cd' : 'white',
                        borderColor: hasInvalidValue ? '#ffc107' : '#ddd'
                    }}
                >
                    {hasInvalidValue && (
                        <option value={editData[field]} style={{ color: '#856404', backgroundColor: '#fff3cd' }}>
                            ⚠️ {editData[field]} (不正な値)
                        </option>
                    )}
                    <option value="">選択してください</option>
                    {options.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </EditableSelect>
            );
        }

        // 日付フィールドの場合の特別処理
        if (type === 'date') {
            // 日付データをYYYY-MM-DD形式に変換
            let dateValue = '';
            const dateSource = editData[field] !== undefined ? editData[field] : value;

            console.log(`Date field ${field}:`, {
                editData: editData[field],
                value: value,
                dateSource: dateSource
            });

            if (dateSource) {
                try {
                    // データがオブジェクト形式の場合は.valueプロパティを使用
                    const actualDateValue = dateSource && typeof dateSource === 'object' && dateSource.value
                        ? dateSource.value
                        : dateSource;

                    if (actualDateValue) {
                        const date = new Date(actualDateValue);
                        if (!isNaN(date.getTime())) {
                            dateValue = date.toISOString().split('T')[0];
                        }
                    }
                } catch (error) {
                    console.error(`Error parsing date for field ${field}:`, error);
                }
            }

            return (
                <div>
                    <EditableInput
                        type="date"
                        value={dateValue}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        className={validationErrors[field] ? 'error' : ''}
                    />
                    {validationErrors[field] && (
                        <ValidationError>{validationErrors[field]}</ValidationError>
                    )}
                </div>
            );
        }

        return (
            <div>
                <EditableInput
                    type={type}
                    value={editData[field] || ''}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    placeholder={`${field}を入力`}
                    className={validationErrors[field] ? 'error' : ''}
                />
                {validationErrors[field] && (
                    <ValidationError>{validationErrors[field]}</ValidationError>
                )}
            </div>
        );
    };

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
        );
    };

    return (
        <>
            <DrawerOverlay isOpen={isOpen} onClick={handleOverlayClick} />
            <DrawerContainer isOpen={isOpen}>
                <DrawerHeader>
                    <DrawerTitle>部屋詳細</DrawerTitle>
                    <HeaderButtons>
                        {roomData && !loading && !error && (
                            <>
                                {!isEditing ? (
                                    <EditButton onClick={handleEditStart}>
                                        編集
                                    </EditButton>
                                ) : (
                                    <>
                                        <SaveButton
                                            onClick={handleSave}
                                            disabled={saving}
                                        >
                                            {saving ? '保存中...' : '保存'}
                                        </SaveButton>
                                        <CancelButton onClick={handleEditCancel}>
                                            キャンセル
                                        </CancelButton>
                                    </>
                                )}
                            </>
                        )}
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
                    {saveMessage && (
                        <SaveMessage className={saveMessage.type}>
                            {saveMessage.text}
                        </SaveMessage>
                    )}

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

                            {roomData && !loading && !error && (
                                <DataContainer>
                                    <DataItem>
                                        <HeaderText>部屋ID</HeaderText>
                                        <DataValue>{roomData.id || ''}</DataValue>
                                    </DataItem>

                                    <DataItem>
                                        <HeaderText>進捗</HeaderText>
                                        {renderEditableField('status', roomData.status, 'select', [
                                            { value: 'A', label: 'A' },
                                            { value: 'B', label: 'B' },
                                            { value: 'C', label: 'C' },
                                            { value: 'D', label: 'D' },
                                            { value: 'E', label: 'E' },
                                            { value: 'F', label: 'F' },
                                            { value: 'クローズ', label: 'クローズ' },
                                            { value: '運営判断中', label: '運営判断中' },
                                            { value: '試算入力待ち', label: '試算入力待ち' },
                                            { value: '試算入力済み', label: '試算入力済み' },
                                            { value: '試算依頼済み', label: '試算依頼済み' },
                                            { value: '他決', label: '他決' },
                                            { value: '見送り', label: '見送り' }
                                        ])}
                                    </DataItem>

                                    <DataItem>
                                        <HeaderText>部屋名</HeaderText>
                                        {(() => {
                                            const formatStatus = getRoomNameFormatStatus(roomData);
                                            const isCorrectFormat = formatStatus.isCorrect;

                                            if (isEditing) {
                                                // 編集モードでは常に編集不可（正しいフォーマット・間違ったフォーマット問わず）
                                                return (
                                                    <div>
                                                        <DataValue>{roomData.name || ''}</DataValue>
                                                        <div style={{ marginTop: '8px' }}>
                                                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                                                変更後の部屋名:
                                                            </div>
                                                            <DataValue style={{ backgroundColor: '#e3f2fd', border: '1px solid #2196f3' }}>
                                                                {getUpdatedRoomName() || '(部屋番号を入力してください)'}
                                                            </DataValue>
                                                        </div>
                                                    </div>
                                                );
                                            } else {
                                                // 表示モード
                                                return (
                                                    <div>
                                                        <DataValue>{roomData.name || ''}</DataValue>
                                                        <FormatStatusContainer className={formatStatus.type}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                {formatStatus.isCorrect ? (
                                                                    <>
                                                                        <span>✅</span>
                                                                        <span>{formatStatus.message}</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span>⚠️</span>
                                                                        <span>{formatStatus.message}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                            {formatStatus.expectedName && (
                                                                <ExpectedRoomName>
                                                                    推奨: {formatStatus.expectedName}
                                                                </ExpectedRoomName>
                                                            )}
                                                        </FormatStatusContainer>
                                                    </div>
                                                );
                                            }
                                        })()}
                                    </DataItem>

                                    <DataItem>
                                        <HeaderText>部屋番号 <span style={{ color: 'red' }}>*</span></HeaderText>
                                        {renderEditableField('room_number', roomData.room_number)}
                                    </DataItem>

                                    <DataItem>
                                        <HeaderText>部屋登録日</HeaderText>
                                        <DataValue>{formatDisplayValue('create_date', roomData.create_date)}</DataValue>
                                    </DataItem>

                                    <DataItem>
                                        <HeaderText>鍵引き渡し予定日</HeaderText>
                                        {renderEditableField('key_handover_scheduled_date', roomData.key_handover_scheduled_date, 'date')}
                                    </DataItem>

                                    <DataItem>
                                        <HeaderText>鍵引き渡し予定日①</HeaderText>
                                        {renderEditableField('possible_key_handover_scheduled_date_1', roomData.possible_key_handover_scheduled_date_1, 'date')}
                                    </DataItem>

                                    <DataItem>
                                        <HeaderText>鍵引き渡し予定日②</HeaderText>
                                        {renderEditableField('possible_key_handover_scheduled_date_2', roomData.possible_key_handover_scheduled_date_2, 'date')}
                                    </DataItem>

                                    <DataItem>
                                        <HeaderText>鍵引き渡し予定日③</HeaderText>
                                        {renderEditableField('possible_key_handover_scheduled_date_3', roomData.possible_key_handover_scheduled_date_3, 'date')}
                                    </DataItem>

                                    <DataItem>
                                        <HeaderText>退去SU</HeaderText>
                                        {renderEditableField('vacate_setup', roomData.vacate_setup, 'select', [
                                            { value: '一般賃貸中', label: '一般賃貸中' },
                                            { value: '退去SU', label: '退去SU' }
                                        ])}
                                    </DataItem>

                                    <DataItem>
                                        <HeaderText>契約書回収予定日</HeaderText>
                                        {renderEditableField('contract_collection_date', roomData.contract_collection_date, 'date')}
                                    </DataItem>

                                    <DataItem>
                                        <HeaderText>申請予定日</HeaderText>
                                        {renderEditableField('application_intended_date', roomData.application_intended_date, 'date')}
                                    </DataItem>

                                    {roomData.lead_room_type_name && (
                                        <DataItem style={{ gridColumn: '1 / -1' }}>
                                            <HeaderText>部屋タイプ名</HeaderText>
                                            <DataValue>{roomData.lead_room_type_name}</DataValue>
                                        </DataItem>
                                    )}
                                </DataContainer>
                            )}
                        </>
                    )}

                    {activeTab === 'history' && renderHistoryContent()}
                </DrawerContent>
            </DrawerContainer>
        </>
    );
};

export default RoomDrawer;
