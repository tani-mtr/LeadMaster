import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { apiService } from '../services/apiService';
import RoomDrawer from '../components/RoomDrawer';
import RoomTypeDrawer from '../components/RoomTypeDrawer';

// 選択肢の定数定義
const SELECT_OPTIONS = {
    is_trade: ['', '売買'],
    is_lease: ['', '通常借上'],
    lead_channel: ['', 'ダイレクト', 'レインズ'],
    minpaku_feasibility: ['', '可', '不可', '確認中', '可能', '旅館業'],
    sp_feasibility: ['', 'SP不要', 'SP必要', '確認中'],
    done_property_viewing: ['', '未内見', '竣工待ち', '内見済み', '内見可能', '内見済', '済', '竣工前'],
    done_antisocial_check: ['', '有', '無', '済']
};

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
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
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

const HistoryTabContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 1px solid #ddd;
`;

const HistoryTab = styled.button`
  padding: 10px 15px;
  border: none;
  background: ${props => props.active ? '#007bff' : 'transparent'};
  color: ${props => props.active ? 'white' : '#333'};
  cursor: pointer;
  border-radius: 5px 5px 0 0;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  
  &:hover {
    background: ${props => props.active ? '#0056b3' : '#f8f9fa'};
  }
`;

const PropertyPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // URL から roomId パラメータを取得
    const urlParams = new URLSearchParams(location.search);
    const roomIdFromUrl = urlParams.get('roomId');

    const [activeTab, setActiveTab] = useState('info');
    const [property, setProperty] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [roomsLoading, setRoomsLoading] = useState(false);
    const [roomsError, setRoomsError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState({});
    const [originalData, setOriginalData] = useState({}); // 元のデータを保存

    // 履歴関連の状態
    const [historyData, setHistoryData] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState(null);

    // ドロワー関連の状態
    const [drawerOpen, setDrawerOpen] = useState(!!roomIdFromUrl);
    const [selectedRoomId, setSelectedRoomId] = useState(roomIdFromUrl);

    // 部屋タイプドロワー関連の状態
    const [roomTypeDrawerOpen, setRoomTypeDrawerOpen] = useState(false);
    const [selectedRoomTypeId, setSelectedRoomTypeId] = useState(null);

    // 部屋一覧の検索・ページネーション・選択機能
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRooms, setSelectedRooms] = useState(new Set());
    const [selectAll, setSelectAll] = useState(false);

    // 部屋タイプ関連の状態
    const [roomTypes, setRoomTypes] = useState([]);
    const [roomTypesLoading, setRoomTypesLoading] = useState(false);
    const [roomTypesError, setRoomTypesError] = useState(null);
    const [roomTypeSearchTerm, setRoomTypeSearchTerm] = useState('');
    const [selectedRoomTypes, setSelectedRoomTypes] = useState(new Set());
    const [roomTypeSelectAll, setRoomTypeSelectAll] = useState(false);
    const [roomTypeCurrentPage, setRoomTypeCurrentPage] = useState(1);
    const [roomTypeItemsPerPage] = useState(10);

    const itemsPerPage = 10;

    // ドロワーを開く関数
    const handleOpenRoomDrawer = useCallback((roomId) => {
        setSelectedRoomId(roomId);
        setDrawerOpen(true);

        // URLにroomIdパラメータを追加
        const newParams = new URLSearchParams(location.search);
        newParams.set('roomId', roomId);
        navigate(`${location.pathname}?${newParams.toString()}`, { replace: true });
    }, [navigate, location.pathname, location.search]);

    // ドロワーを閉じる関数
    const handleCloseRoomDrawer = useCallback(() => {
        setDrawerOpen(false);
        setSelectedRoomId(null);

        // URLからroomIdパラメータを削除
        const newParams = new URLSearchParams(location.search);
        newParams.delete('roomId');
        const newSearch = newParams.toString();
        navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ''}`, { replace: true });
    }, [navigate, location.pathname, location.search]);

    // 部屋タイプドロワーを開く関数
    const handleOpenRoomTypeDrawer = useCallback((roomTypeId) => {
        setSelectedRoomTypeId(roomTypeId);
        setRoomTypeDrawerOpen(true);
    }, []);

    // 部屋タイプドロワーを閉じる関数
    const handleCloseRoomTypeDrawer = useCallback(() => {
        setRoomTypeDrawerOpen(false);
        setSelectedRoomTypeId(null);
    }, []);

    // URLの変更を監視してドロワー状態を同期
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const roomIdFromUrl = urlParams.get('roomId');

        if (roomIdFromUrl && roomIdFromUrl !== selectedRoomId) {
            setSelectedRoomId(roomIdFromUrl);
            setDrawerOpen(true);
        } else if (!roomIdFromUrl && drawerOpen) {
            setDrawerOpen(false);
            setSelectedRoomId(null);
        }
    }, [location.search, selectedRoomId, drawerOpen]);

    // データ取得 - パフォーマンス最適化版
    useEffect(() => {
        const fetchPropertyData = async () => {
            try {
                setLoading(true);
                setError(null);

                // 物件データ、部屋データ、部屋タイプデータを並行取得
                const requests = [apiService.getPropertyData(id)];

                // 最初から全データを並行取得（部屋データの有無は物件データ取得後に判断）
                console.log(`物件ID ${id} のデータ取得を開始します`);
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
                setOriginalData(propertyData); // 元のデータを保存

                // 部屋データとタイプデータを常に設定（空配列でも設定）
                setRooms(roomData || []);
                setRoomTypes(roomTypeData || []);

                console.log('データ取得完了:', {
                    propertyId: id,
                    propertyName: propertyData?.name,
                    hasRelatedRooms: propertyData?.has_related_rooms,
                    roomsCount: (roomData || []).length,
                    roomTypesCount: (roomTypeData || []).length
                });
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
        try {
            setRoomsLoading(true);
            setRoomsError(null);

            // BigQueryから部屋データを取得
            const roomData = await apiService.getRoomList(id);
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
    const fetchRoomTypesData = async () => {
        try {
            setRoomTypesLoading(true);
            setRoomTypesError(null);

            // 部屋タイプデータを取得
            const roomTypeData = await apiService.getRoomTypeList(id);
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

    // 部屋タイプのフィルタリング
    const filteredRoomTypes = useMemo(() => {
        if (!roomTypes || roomTypes.length === 0) return [];

        if (!roomTypeSearchTerm) return roomTypes;

        const lowerSearchTerm = roomTypeSearchTerm.toLowerCase();
        return roomTypes.filter(roomType => {
            const roomTypeName = roomType.room_type_name || roomType.name;
            const roomTypeId = roomType.room_type_id || roomType.id;
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
    }, []);

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

    // フィールド名を表示名に変換するヘルパー関数
    const getFieldDisplayName = (fieldName) => {
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
        };
        return fieldNames[fieldName] || fieldName;
    };

    // 保存処理
    const handleSave = async () => {
        try {
            setLoading(true);
            setError('');

            // バリデーション - 必須項目チェック
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
                alert('保存しました');

                // キャッシュを無効化して最新のデータを強制的に再取得
                const latestData = await apiService.getPropertyData(id, true);
                setProperty(latestData);
                setOriginalData(latestData);

                // 履歴データがあれば更新
                if (historyData.length > 0) {
                    setTimeout(() => {
                        fetchHistoryData();
                    }, 1000);
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
                        <Button onClick={() => {
                            if (!editMode) {
                                // 編集モードに入る際に元のデータを保存
                                setOriginalData({ ...property });
                            } else {
                                // キャンセル時は編集内容を元に戻す
                                setEditData({ ...originalData });
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
                                <Input
                                    type="text"
                                    value={editMode ? editData.name : property.name}
                                    disabled={!editMode}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    required
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
                                {editMode ? (
                                    <Select
                                        value={editData.is_trade || ''}
                                        onChange={(e) => handleInputChange('is_trade', e.target.value)}
                                    >
                                        {SELECT_OPTIONS.is_trade.map((option, index) => (
                                            <option key={index} value={option}>
                                                {option || '選択してください'}
                                            </option>
                                        ))}
                                    </Select>
                                ) : (
                                    <Input
                                        type="text"
                                        value={property.is_trade || ''}
                                        disabled={true}
                                    />
                                )}
                            </FormGroup>

                            <FormGroup>
                                <Label>借上</Label>
                                {editMode ? (
                                    <Select
                                        value={editData.is_lease || ''}
                                        onChange={(e) => handleInputChange('is_lease', e.target.value)}
                                    >
                                        {SELECT_OPTIONS.is_lease.map((option, index) => (
                                            <option key={index} value={option}>
                                                {option || '選択してください'}
                                            </option>
                                        ))}
                                    </Select>
                                ) : (
                                    <Input
                                        type="text"
                                        value={property.is_lease || ''}
                                        disabled={true}
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
                                    >
                                        {SELECT_OPTIONS.lead_channel.map((option, index) => (
                                            <option key={index} value={option}>
                                                {option || '選択してください'}
                                            </option>
                                        ))}
                                    </Select>
                                ) : (
                                    <Input
                                        type="text"
                                        value={property.lead_channel || ''}
                                        disabled={true}
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
                                    >
                                        {SELECT_OPTIONS.minpaku_feasibility.map((option, index) => (
                                            <option key={index} value={option}>
                                                {option || '選択してください'}
                                            </option>
                                        ))}
                                    </Select>
                                ) : (
                                    <Input
                                        type="text"
                                        value={property.minpaku_feasibility || ''}
                                        disabled={true}
                                    />
                                )}
                            </FormGroup>

                            <FormGroup>
                                <Label>SP可否</Label>
                                {editMode ? (
                                    <Select
                                        value={editData.sp_feasibility || ''}
                                        onChange={(e) => handleInputChange('sp_feasibility', e.target.value)}
                                    >
                                        {SELECT_OPTIONS.sp_feasibility.map((option, index) => (
                                            <option key={index} value={option}>
                                                {option || '選択してください'}
                                            </option>
                                        ))}
                                    </Select>
                                ) : (
                                    <Input
                                        type="text"
                                        value={property.sp_feasibility || ''}
                                        disabled={true}
                                    />
                                )}
                            </FormGroup>

                            <FormGroup>
                                <Label>内見</Label>
                                {editMode ? (
                                    <Select
                                        value={editData.done_property_viewing || ''}
                                        onChange={(e) => handleInputChange('done_property_viewing', e.target.value)}
                                    >
                                        {SELECT_OPTIONS.done_property_viewing.map((option, index) => (
                                            <option key={index} value={option}>
                                                {option || '選択してください'}
                                            </option>
                                        ))}
                                    </Select>
                                ) : (
                                    <Input
                                        type="text"
                                        value={property.done_property_viewing || ''}
                                        disabled={true}
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
                                    >
                                        {SELECT_OPTIONS.done_antisocial_check.map((option, index) => (
                                            <option key={index} value={option}>
                                                {option || '選択してください'}
                                            </option>
                                        ))}
                                    </Select>
                                ) : (
                                    <Input
                                        type="text"
                                        value={property.done_antisocial_check || ''}
                                        disabled={true}
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
                                                            <RoomNameButton onClick={() => handleOpenRoomDrawer(roomId)}>
                                                                {roomName}
                                                            </RoomNameButton>
                                                        </TableCell>
                                                        <TableCell>{room[3]}</TableCell>
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

            {/* RoomDrawer を追加 */}
            <RoomDrawer
                isOpen={drawerOpen}
                onClose={handleCloseRoomDrawer}
                roomId={selectedRoomId}
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
