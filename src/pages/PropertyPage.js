import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { apiService } from '../services/apiService';

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

const Tab = styled.button`
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
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
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

const PageButton = styled.button`
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

const IconButton = styled.button`
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

const RoomNameLink = styled(Link)`
  color: #007bff;
  text-decoration: none;
  cursor: pointer;
  
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

const StatusBadge = styled.span`
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

const PropertyPage = () => {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('info');
    const [property, setProperty] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [roomsLoading, setRoomsLoading] = useState(false);
    const [roomsError, setRoomsError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState({});

    // 部屋一覧の検索・ページネーション・選択機能
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRooms, setSelectedRooms] = useState(new Set());
    const [selectAll, setSelectAll] = useState(false);

    // 部屋タイプ関連の状態
    const [roomTypes, setRoomTypes] = useState([]);
    const [roomTypesLoading, setRoomTypesLoading] = useState(false);
    const [roomTypesError, setRoomTypesError] = useState(null);

    const itemsPerPage = 10;

    // データ取得 - パフォーマンス最適化版
    useEffect(() => {
        const fetchPropertyData = async () => {
            try {
                setLoading(true);
                setError(null);

                // 物件データ、部屋データ、部屋タイプデータを並行取得
                const requests = [apiService.getPropertyData(id)];

                // 最初から全データを並行取得（部屋データの有無は物件データ取得後に判断）
                requests.push(
                    apiService.getRoomList(id).catch(err => {
                        console.warn('部屋データ取得失敗（スキップ）:', err.message);
                        return [];
                    }),
                    apiService.getRoomTypeList(id).catch(err => {
                        console.warn('部屋タイプデータ取得失敗（スキップ）:', err.message);
                        return [];
                    })
                );

                const [propertyData, roomData, roomTypeData] = await Promise.all(requests);

                setProperty(propertyData);
                setEditData(propertyData);

                // 部屋データがある場合のみ設定
                if (propertyData.has_related_rooms) {
                    setRooms(roomData);
                    setRoomTypes(roomTypeData);
                }
            } catch (err) {
                setError(err.message || 'データの取得中にエラーが発生しました');
            } finally {
                setLoading(false);
                setRoomsLoading(false);
                setRoomTypesLoading(false);
            }
        };

        if (id) {
            fetchPropertyData();
        }
    }, [id]);

    // 部屋データの手動更新（更新ボタン用）
    const fetchRoomsData = async () => {
        if (!property?.has_related_rooms) return;

        try {
            setRoomsLoading(true);
            setRoomsError(null);

            // BigQueryから部屋データを取得
            const roomData = await apiService.getRoomList(id);
            setRooms(roomData);

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
    const fetchRoomTypesData = async () => {
        if (!property?.has_related_rooms) return;

        try {
            setRoomTypesLoading(true);
            setRoomTypesError(null);

            // 部屋タイプデータを取得
            const roomTypeData = await apiService.getRoomTypeList(id);
            setRoomTypes(roomTypeData);
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
    const filteredRooms = useMemo(() => {
        if (rooms.length <= 1) return [];

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
        const roomNames = selectedRoomData.map(room => room[2]).join(', ');

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

    // 編集データの更新 - useCallbackで最適化
    const handleInputChange = useCallback((field, value) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    // 保存処理
    const handleSave = async () => {
        try {
            // 実際のAPI呼び出しに置き換える（今後実装予定）
            await new Promise(resolve => setTimeout(resolve, 500));

            setProperty(editData);
            setEditMode(false);
            alert('保存しました');
        } catch (err) {
            setError('保存中にエラーが発生しました');
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
                <Tab
                    active={activeTab === 'info'}
                    onClick={() => setActiveTab('info')}
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

            {activeTab === 'info' && (
                <Section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3>物件基本情報</h3>
                        <Button onClick={() => setEditMode(!editMode)}>
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
                                <Label>建物名</Label>
                                <Input
                                    type="text"
                                    value={editMode ? editData.name : property.name}
                                    disabled={!editMode}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                />
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
                                <Input
                                    type="text"
                                    value={editMode ? editData.is_trade : property.is_trade}
                                    disabled={!editMode}
                                    onChange={(e) => handleInputChange('is_trade', e.target.value)}
                                />
                            </FormGroup>

                            <FormGroup>
                                <Label>借上</Label>
                                <Input
                                    type="text"
                                    value={editMode ? editData.is_lease : property.is_lease}
                                    disabled={!editMode}
                                    onChange={(e) => handleInputChange('is_lease', e.target.value)}
                                />
                            </FormGroup>

                            <FormGroup>
                                <Label>lead元</Label>
                                <Input
                                    type="text"
                                    value={editMode ? editData.lead_from : property.lead_from}
                                    disabled={!editMode}
                                    onChange={(e) => handleInputChange('lead_from', e.target.value)}
                                />
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
                                <Input
                                    type="text"
                                    value={editMode ? editData.lead_channel : property.lead_channel}
                                    disabled={!editMode}
                                    onChange={(e) => handleInputChange('lead_channel', e.target.value)}
                                />
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
                                <Label>担当者tel</Label>
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
                                    value={editMode ? editData.serial_number : property.serial_number}
                                    disabled={!editMode}
                                    onChange={(e) => handleInputChange('serial_number', e.target.value)}
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
                                <Input
                                    type="text"
                                    value={editMode ? editData.minpaku_feasibility : property.minpaku_feasibility}
                                    disabled={!editMode}
                                    onChange={(e) => handleInputChange('minpaku_feasibility', e.target.value)}
                                />
                            </FormGroup>

                            <FormGroup>
                                <Label>SP可否</Label>
                                <Input
                                    type="text"
                                    value={editMode ? editData.sp_feasibility : property.sp_feasibility}
                                    disabled={!editMode}
                                    onChange={(e) => handleInputChange('sp_feasibility', e.target.value)}
                                />
                            </FormGroup>

                            <FormGroup>
                                <Label>内見</Label>
                                <Input
                                    type="text"
                                    value={editMode ? editData.done_property_viewing : property.done_property_viewing}
                                    disabled={!editMode}
                                    onChange={(e) => handleInputChange('done_property_viewing', e.target.value)}
                                />
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
                                <Input
                                    type="text"
                                    value={editMode ? editData.done_antisocial_check : property.done_antisocial_check}
                                    disabled={!editMode}
                                    onChange={(e) => handleInputChange('done_antisocial_check', e.target.value)}
                                />
                            </FormGroup>
                        </div>
                    </div>

                    <FormGroup style={{ marginTop: '20px' }}>
                        <Label>備考</Label>
                        <textarea
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px',
                                minHeight: '100px',
                                resize: 'vertical'
                            }}
                            value={editMode ? editData.note : property.note}
                            disabled={!editMode}
                            onChange={(e) => handleInputChange('note', e.target.value)}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>関連部屋データ</Label>
                        <Input
                            type="text"
                            value={property.has_related_rooms ? 'あり' : 'なし'}
                            disabled={true}
                        />
                    </FormGroup>

                    {editMode && (
                        <Button onClick={handleSave}>保存</Button>
                    )}
                </Section>
            )}

            {property.has_related_rooms && activeTab === 'rooms' && (
                <Section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3>部屋一覧</h3>
                        <Button onClick={fetchRoomsData} disabled={roomsLoading}>
                            {roomsLoading ? '読み込み中...' : '更新'}
                        </Button>
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
                                                        <TableCell>
                                                            <StatusBadge status={room[0]}>
                                                                {room[0]}
                                                            </StatusBadge>
                                                        </TableCell>
                                                        <TableCell>{roomId}</TableCell>
                                                        <TableCell>
                                                            <RoomNameLink to={`/room/${roomId}`}>
                                                                {roomName}
                                                            </RoomNameLink>
                                                        </TableCell>
                                                        <TableCell>{room[3]}</TableCell>
                                                        <TableCell>
                                                            <ActionButtons>
                                                                <IconButton
                                                                    variant="primary"
                                                                    disabled={!isOperationEnabled}
                                                                    as={Link}
                                                                    to={`/room/${roomId}`}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3>部屋タイプ管理</h3>
                        <Button onClick={fetchRoomTypesData} disabled={roomTypesLoading}>
                            {roomTypesLoading ? '更新中...' : '更新'}
                        </Button>
                    </div>

                    {roomTypesError && (
                        <ErrorMessage>
                            {roomTypesError}
                        </ErrorMessage>
                    )}

                    {roomTypesLoading ? (
                        <LoadingMessage>部屋タイプデータを読み込み中...</LoadingMessage>
                    ) : roomTypes.length > 0 ? (
                        <RoomTypeContainer>
                            <RoomTypeTable>
                                <thead>
                                    <tr>
                                        <RoomTypeTableHeader>部屋タイプID</RoomTypeTableHeader>
                                        <RoomTypeTableHeader>部屋タイプ名</RoomTypeTableHeader>
                                    </tr>
                                </thead>
                                <tbody>
                                    {roomTypes.map((roomType, index) => (
                                        <tr key={roomType.room_type_id || index}>
                                            <RoomTypeTableCell>{roomType.room_type_id}</RoomTypeTableCell>
                                            <RoomTypeTableCell>{roomType.room_type_name}</RoomTypeTableCell>
                                        </tr>
                                    ))}
                                </tbody>
                            </RoomTypeTable>
                        </RoomTypeContainer>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                            この物件には部屋タイプデータがありません
                        </div>
                    )}
                </Section>
            )}
        </Container>
    );
};

export default PropertyPage;
