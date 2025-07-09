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

// RoomDrawerコンポーネント
const RoomDrawer = ({ isOpen, onClose, roomId }) => {
    const [loading, setLoading] = useState(false);
    const [roomData, setRoomData] = useState(null);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('details'); // 'details' or 'history'
    const [historyData, setHistoryData] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState(null);

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

            if (historyResponse && historyResponse.length > 0) {
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
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // データの保存（変更されたフィールドのみを送信）
    const handleSave = async () => {
        try {
            setSaving(true);
            setSaveMessage(null);

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
            setRoomData(prev => ({ ...prev, ...changedData }));
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
        return String(value);
    };

    // 編集可能なフィールドをレンダリングする関数
    const renderEditableField = (field, value, type = 'text', options = null) => {
        if (!isEditing) {
            // 表示モード
            if (type === 'date') {
                return <DataValue>{formatDisplayValue(field, value)}</DataValue>;
            }
            return <DataValue>{value || ''}</DataValue>;
        }

        // 編集モード
        if (type === 'select' && options) {
            return (
                <EditableSelect
                    value={editData[field] || ''}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                >
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
                <EditableInput
                    type="date"
                    value={dateValue}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                />
            );
        }

        return (
            <EditableInput
                type={type}
                value={editData[field] || ''}
                onChange={(e) => handleInputChange(field, e.target.value)}
                placeholder={`${field}を入力`}
            />
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
                                {new Date(historyItem.changed_at).toLocaleString('ja-JP')}
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
                                            <OldValue>{formatHistoryValue(change.old_value)}</OldValue>
                                            <Arrow>→</Arrow>
                                            <NewValue>{formatHistoryValue(change.new_value)}</NewValue>
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
                                        <DataValue>{roomData.name || ''}</DataValue>
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
