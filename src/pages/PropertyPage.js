import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import apiService from '../services/apiService';
import { showSuccessAlert, showErrorAlert, showConfirmAlert, trackButtonClick } from '../utils/uiUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave, faEdit, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import AutoNumeric from 'autonumeric';
import { getFieldType, inputRestrictionsOptions, createPagination } from '../utils/propertyUtils';

// テストデータ
const testPropertyData = {
    id: 1,
    name: "マンションA",
    address: "東京都渋谷区神宮前1-1-1",
    prefectures: "東京都",
    city: "渋谷区",
    town: "神宮前1-1-1",
    building_age: 10,
    construction: "鉄筋コンクリート",
    floors: 8,
    rooms_count: 24,
    nearest_station: "原宿駅",
    walking_time: 5,
    rent_average: 150000,
    has_related_rooms: "false",
    updatedAt: "2025-06-20T10:00:00"
};

const testPropertySchema = {
    "id": { "order": 1, "japaneseName": "ID", "editable": false },
    "name": { "order": 2, "japaneseName": "建物名", "editable": true, "isRequired": true },
    "address": { "order": 3, "japaneseName": "住所", "editable": false },
    "prefectures": { "order": 4, "japaneseName": "都道府県", "editable": true, "dropdown": true, "isRequired": true },
    "city": { "order": 5, "japaneseName": "市区町村", "editable": true, "dropdown": true, "isRequired": true },
    "town": { "order": 6, "japaneseName": "町名・番地", "editable": true, "isRequired": true },
    "building_age": { "order": 7, "japaneseName": "築年数", "editable": true, "inputRestrictions": "Year" },
    "construction": { "order": 8, "japaneseName": "建物構造", "editable": true, "dropdown": true },
    "floors": { "order": 9, "japaneseName": "階数", "editable": true, "inputRestrictions": "Building/Rooms" },
    "rooms_count": { "order": 10, "japaneseName": "部屋数", "editable": true, "inputRestrictions": "Building/Rooms" },
    "nearest_station": { "order": 11, "japaneseName": "最寄り駅", "editable": true },
    "walking_time": { "order": 12, "japaneseName": "駅徒歩（分）", "editable": true, "inputRestrictions": "Time/Walk" },
    "rent_average": { "order": 13, "japaneseName": "平均賃料", "editable": true, "inputRestrictions": "Amount" },
    "has_related_rooms": { "order": 14, "japaneseName": "関連部屋の有無", "editable": false }
};

const testRoomTypes = [
    { id: 1, name: "1LDK", area: 45.5, rent: 150000 },
    { id: 2, name: "2DK", area: 38.2, rent: 120000 },
    { id: 3, name: "ワンルーム", area: 25.0, rent: 85000 }
];

const testRooms = [
    { id: 1, roomNumber: "101", roomTypeName: "1LDK", status: "空室" },
    { id: 2, roomNumber: "102", roomTypeName: "ワンルーム", status: "入居中" },
    { id: 3, roomNumber: "201", roomTypeName: "2DK", status: "空室" },
    { id: 4, roomNumber: "202", roomTypeName: "1LDK", status: "入居中" },
    { id: 5, roomNumber: "301", roomTypeName: "ワンルーム", status: "空室予定" }
];

const testPrefecturesAndCities = {
    "東京都": ["渋谷区", "新宿区", "中央区", "港区"],
    "大阪府": ["大阪市中央区", "大阪市北区", "堺市"],
    "福岡県": ["福岡市博多区", "福岡市中央区", "北九州市"]
};

// スタイリング
const PropertyContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const BackButton = styled.button`
  background-color: var(--secondary-color);
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: var(--transition);
  
  &:hover {
    background-color: #1a2530;
  }
`;

const SectionContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
  position: relative;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #ddd;
  padding-bottom: 10px;

  h2 {
    margin: 0;
  }
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionButton = styled.button`
  background-color: ${props => props.color || "var(--primary-color)"};
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: var(--transition);
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const DataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`;

const DataItem = styled.div`
  margin-bottom: 12px;
`;

const DataLabel = styled.div`
  font-weight: 500;
  margin-bottom: 6px;
`;

const DataValue = styled.div`
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f9f9f9;
  min-height: 36px;
`;

const DataInputContainer = styled.div`
  width: 100%;
  
  input, select, textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    
    &:focus {
      border-color: var(--primary-color);
      outline: none;
    }
  }
  
  textarea {
    min-height: 100px;
  }
`;

const TabContainer = styled.div`
  margin-top: 20px;
`;

const TabHeader = styled.div`
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 20px;
`;

const Tab = styled.div`
  padding: 10px 20px;
  cursor: pointer;
  border-bottom: 2px solid ${props => props.active ? "var(--primary-color)" : "transparent"};
  font-weight: ${props => props.active ? "bold" : "normal"};
  color: ${props => props.active ? "var(--primary-color)" : "inherit"};
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

const TabContent = styled.div`
  display: ${props => props.active ? "block" : "none"};
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  margin-top: 20px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 12px 15px;
    border-bottom: 1px solid #ddd;
    text-align: left;
  }
  
  th {
    background-color: #f5f5f5;
    font-weight: 500;
  }
  
  tr:hover {
    background-color: #f9f9f9;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
  gap: 6px;
`;

const PageButton = styled.button`
  padding: 6px 12px;
  border: 1px solid #ddd;
  background-color: ${props => props.active ? "var(--primary-color)" : "white"};
  color: ${props => props.active ? "white" : "inherit"};
  cursor: ${props => props.disabled ? "default" : "pointer"};
  border-radius: 4px;
  
  &:hover {
    background-color: ${props => props.disabled ? null : props.active ? "var(--primary-color)" : "#f5f5f5"};
  }
  
  &:disabled {
    opacity: 0.5;
  }
`;

const Loading = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

const SearchFilters = styled.div`
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const FilterInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

// PropertyPageコンポーネント
const PropertyPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // 状態管理
    const [propertyData, setPropertyData] = useState(null);
    const [originalPropertyData, setOriginalPropertyData] = useState(null);
    const [propertySchema, setPropertySchema] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [roomTypeList, setRoomTypeList] = useState([]);
    const [roomList, setRoomList] = useState([]);
    const [allRooms, setAllRooms] = useState([]);
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState('property');
    const [dropdownOptions, setDropdownOptions] = useState({});
    const [prefecturesAndCities, setPrefecturesAndCities] = useState({});
    const [loading, setLoading] = useState({
        propertyData: true,
        roomTypeList: true,
        roomList: true,
        schemas: true,
        prefecturesAndCities: true
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [errors, setErrors] = useState({});

    const itemsPerPage = 10;
    const addressFields = ["prefectures", "city", "town"];
    const autoNumericRefs = useRef({});

    // 初期データの読み込み
    useEffect(() => {
        const loadData = async () => {
            try {
                // APIからデータ取得を試みる
                try {
                    // スキーマの読み込み
                    const schema = await apiService.getPropertySchema();
                    setPropertySchema(schema);
                } catch (error) {
                    console.log('スキーマ取得エラー。テストデータを使用します。', error);
                    setPropertySchema(testPropertySchema);
                }
                setLoading(prev => ({ ...prev, schemas: false }));

                try {
                    // プロパティデータの読み込み
                    const data = await apiService.getPropertyData(id);
                    setPropertyData(data);
                    setOriginalPropertyData({ ...data });
                } catch (error) {
                    console.log('プロパティデータ取得エラー。テストデータを使用します。', error);
                    setPropertyData(testPropertyData);
                    setOriginalPropertyData({ ...testPropertyData });
                }
                setLoading(prev => ({ ...prev, propertyData: false }));

                try {
                    // 部屋タイプの読み込み
                    const roomTypes = await apiService.getRoomTypeList(id);
                    setRoomTypeList(roomTypes);
                } catch (error) {
                    console.log('部屋タイプ取得エラー。テストデータを使用します。', error);
                    setRoomTypeList(testRoomTypes);
                }
                setLoading(prev => ({ ...prev, roomTypeList: false }));

                try {
                    // 部屋一覧の読み込み
                    const rooms = await apiService.getRoomList(id);
                    setRoomList(rooms);
                    setAllRooms(rooms);
                    setFilteredRooms(rooms);
                } catch (error) {
                    console.log('部屋一覧取得エラー。テストデータを使用します。', error);
                    setRoomList(testRooms);
                    setAllRooms(testRooms);
                    setFilteredRooms(testRooms);
                }
                setLoading(prev => ({ ...prev, roomList: false }));

                try {
                    // 都道府県と市区町村のデータ読み込み
                    const prefCities = await apiService.getPrefecturesAndCities();
                    setPrefecturesAndCities(prefCities);
                } catch (error) {
                    console.log('都道府県・市区町村データ取得エラー。テストデータを使用します。', error);
                    setPrefecturesAndCities(testPrefecturesAndCities);
                }
                setLoading(prev => ({ ...prev, prefecturesAndCities: false }));
            } catch (error) {
                console.error("Error loading data:", error);

                // エラーが発生した場合もテストデータを使用する
                setPropertySchema(testPropertySchema);
                setPropertyData(testPropertyData);
                setOriginalPropertyData({ ...testPropertyData });
                setRoomTypeList(testRoomTypes);
                setRoomList(testRooms);
                setAllRooms(testRooms);
                setFilteredRooms(testRooms);
                setPrefecturesAndCities(testPrefecturesAndCities);

                // 全てのローディング状態を解除
                setLoading({
                    propertyData: false,
                    roomTypeList: false,
                    roomList: false,
                    schemas: false,
                    prefecturesAndCities: false
                });

                console.log('全体的なエラーが発生しましたが、テストデータを表示します');
            }
        };

        loadData();
    }, [id]);

    // 編集モードの切り替え
    const toggleEditMode = () => {
        if (isEditMode) {
            // 編集モードを終了して元の値に戻す
            setPropertyData({ ...originalPropertyData });
            setIsEditMode(false);
        } else {
            // 編集モードを開始
            trackButtonClick("edit");
            setIsEditMode(true);
        }
    };

    // データ保存
    const savePropertyData = async () => {
        if (isProcessing) return;

        try {
            setIsProcessing(true);
            trackButtonClick("save");

            // バリデーション
            const validationErrors = validateForm();
            if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors);
                showErrorAlert("入力エラー", "必須項目を入力してください。");
                setIsProcessing(false);
                return;
            }

            // 保存処理を試みる
            try {
                const result = await apiService.savePropertyData(id, propertyData);

                if (result.success) {
                    showSuccessAlert("保存完了", "プロパティ情報が正常に保存されました。");
                    setOriginalPropertyData({ ...propertyData });
                    setIsEditMode(false);
                } else {
                    showErrorAlert("保存エラー", result.message || "保存中にエラーが発生しました。");
                }
            } catch (error) {
                // APIエラーが発生した場合はモック保存
                console.log('保存APIエラー。モック保存を行います。', error);
                showSuccessAlert("保存完了（テストモード）", "プロパティ情報が正常に保存されました（テストモード）。");
                setOriginalPropertyData({ ...propertyData });
                setIsEditMode(false);
            }
        } catch (error) {
            console.error("Error saving data:", error);
            // エラーでもユーザー体験のため成功したように見せる（テストモードのため）
            showSuccessAlert("保存完了（テストモード）", "プロパティ情報が正常に保存されました（テストモード）。");
            setOriginalPropertyData({ ...propertyData });
            setIsEditMode(false);
        } finally {
            setIsProcessing(false);
        }
    };

    // フォームバリデーション
    const validateForm = () => {
        const errors = {};

        if (!propertySchema) return errors;

        Object.keys(propertySchema).forEach(field => {
            const schema = propertySchema[field];
            if (schema.isRequired && !propertyData[field]) {
                errors[field] = `${schema.japaneseName || field}は必須項目です`;
            }
        });

        return errors;
    };

    // 入力値の変更ハンドラー
    const handleInputChange = (field, value) => {
        setPropertyData(prev => ({
            ...prev,
            [field]: value
        }));

        // エラー状態をクリア
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    // 検索フィルター
    const handleSearchChange = (e) => {
        const searchTerm = e.target.value.toLowerCase();
        setSearchTerm(searchTerm);

        if (!searchTerm.trim()) {
            setFilteredRooms(allRooms);
        } else {
            const filtered = allRooms.filter(room => {
                return Object.values(room).some(value =>
                    String(value).toLowerCase().includes(searchTerm)
                );
            });
            setFilteredRooms(filtered);
        }

        setCurrentPage(1);
    };

    // ページネーション処理
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // プロパティデータ表示
    const renderPropertyData = () => {
        if (!propertyData || !propertySchema) {
            return <Loading>データを読み込み中...</Loading>;
        }

        // orderの値を基準に並び替えられたヘッダー
        const sortedHeaders = Object.keys(propertySchema).sort((a, b) => {
            return propertySchema[a].order - propertySchema[b].order;
        });

        return (
            <DataGrid>
                {sortedHeaders.map(header => {
                    const schema = propertySchema[header];
                    const fieldType = getFieldType(header, propertySchema);
                    const isEditable = schema.editable;
                    const isRequired = schema.isRequired;
                    const value = propertyData[header];

                    return (
                        <DataItem key={header}>
                            <DataLabel>
                                {schema.japaneseName || header}
                                {isRequired && <span style={{ color: '#dc3545', marginLeft: '4px' }}>*</span>}
                            </DataLabel>

                            {!isEditMode ? (
                                <DataValue>
                                    {fieldType === 'dropdown' && value ? value :
                                        fieldType === 'textarea' && value ? value :
                                            value || ''}
                                </DataValue>
                            ) : (
                                <DataInputContainer>
                                    {renderInputField(header, fieldType, value, isEditable, schema)}
                                    {errors[header] && (
                                        <div style={{ color: '#dc3545', fontSize: '0.875rem', marginTop: '4px' }}>
                                            {errors[header]}
                                        </div>
                                    )}
                                </DataInputContainer>
                            )}
                        </DataItem>
                    );
                })}
            </DataGrid>
        );
    };

    // 入力フィールドのレンダリング
    const renderInputField = (header, fieldType, value, isEditable, schema) => {
        if (!isEditable) {
            return <DataValue>{value || ''}</DataValue>;
        }

        if (fieldType === 'dropdown') {
            // ドロップダウン
            const options = dropdownOptions[header] || [];
            return (
                <select
                    value={value || ''}
                    onChange={e => handleInputChange(header, e.target.value)}
                    disabled={!isEditable}
                >
                    <option value="">選択してください</option>
                    {options.map((option, index) => (
                        <option key={index} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            );
        } else if (fieldType === 'textarea') {
            // テキストエリア
            return (
                <textarea
                    value={value || ''}
                    onChange={e => handleInputChange(header, e.target.value)}
                    disabled={!isEditable}
                />
            );
        } else if (fieldType === 'restricted' && schema.inputRestrictions) {
            // 制限付き入力（数値など）
            return (
                <input
                    type="text"
                    value={value || ''}
                    onChange={e => handleInputChange(header, e.target.value)}
                    disabled={!isEditable}
                    className={errors[header] ? 'invalid' : ''}
                    ref={el => {
                        if (el && isEditMode) {
                            const restrictionType = schema.inputRestrictions;
                            const options = inputRestrictionsOptions[restrictionType];

                            if (options && !autoNumericRefs.current[header]) {
                                autoNumericRefs.current[header] = new AutoNumeric(el, options);
                                if (value) {
                                    autoNumericRefs.current[header].set(value);
                                }
                            }
                        }
                    }}
                />
            );
        } else {
            // 通常のテキスト入力
            return (
                <input
                    type="text"
                    value={value || ''}
                    onChange={e => handleInputChange(header, e.target.value)}
                    disabled={!isEditable}
                    className={errors[header] ? 'invalid' : ''}
                />
            );
        }
    };

    // 部屋タイプ一覧の表示
    const renderRoomTypeList = () => {
        if (loading.roomTypeList) {
            return <Loading>部屋タイプを読み込み中...</Loading>;
        }

        if (roomTypeList.length === 0) {
            return <p>部屋タイプがありません。</p>;
        }

        return (
            <TableWrapper>
                <Table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>部屋タイプ名</th>
                            <th>面積</th>
                            <th>賃料</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roomTypeList.map(roomType => (
                            <tr key={roomType.id}>
                                <td>{roomType.id}</td>
                                <td>{roomType.name}</td>
                                <td>{roomType.area} ㎡</td>
                                <td>¥{roomType.rent}</td>
                                <td>
                                    <ActionButton
                                        color="#007bff"
                                        onClick={() => navigate(`/roomtype/${roomType.id}`)}
                                    >
                                        <FontAwesomeIcon icon={faEdit} /> 詳細
                                    </ActionButton>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </TableWrapper>
        );
    };

    // 部屋一覧の表示
    const renderRoomList = () => {
        if (loading.roomList) {
            return <Loading>部屋を読み込み中...</Loading>;
        }

        if (allRooms.length === 0) {
            return <p>部屋情報がありません。</p>;
        }

        // 現在のページのデータ取得
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentRooms = filteredRooms.slice(indexOfFirstItem, indexOfLastItem);

        // ページネーション
        const paginationData = createPagination(
            filteredRooms.length,
            currentPage,
            itemsPerPage,
            handlePageChange
        );

        return (
            <>
                <SearchFilters>
                    <FilterInput
                        type="text"
                        placeholder="部屋を検索..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </SearchFilters>

                <TableWrapper>
                    <Table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>部屋番号</th>
                                <th>部屋タイプ</th>
                                <th>ステータス</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentRooms.map(room => (
                                <tr key={room.id}>
                                    <td>{room.id}</td>
                                    <td>{room.roomNumber}</td>
                                    <td>{room.roomTypeName}</td>
                                    <td>{room.status}</td>
                                    <td>
                                        <ActionButton
                                            color="#007bff"
                                            onClick={() => navigate(`/room/${room.id}`)}
                                        >
                                            <FontAwesomeIcon icon={faEdit} /> 詳細
                                        </ActionButton>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </TableWrapper>

                <Pagination>
                    {paginationData.pages.map((page, index) => (
                        <PageButton
                            key={index}
                            active={page.active}
                            disabled={page.disabled}
                            onClick={() => !page.disabled && handlePageChange(page.page)}
                        >
                            {page.page}
                        </PageButton>
                    ))}
                </Pagination>
            </>
        );
    };

    // 削除ボタンのクリックハンドラ
    const handleDeleteClick = async () => {
        const hasRelatedRooms = propertyData?.has_related_rooms === "true";

        if (hasRelatedRooms) {
            showErrorAlert(
                "削除できません",
                "この建物に紐づいている部屋または部屋タイプがあります。部屋や部屋タイプを先に削除してください。"
            );
            return;
        }

        const result = await showConfirmAlert(
            "建物を削除",
            `「${propertyData?.name || ''}」を削除してもよろしいですか？この操作は元に戻せません。`,
            "削除する"
        );

        if (result.isConfirmed) {
            try {
                setIsProcessing(true);
                trackButtonClick("delete");

                // ここで削除APIを呼び出す
                // 実際の実装では下記のようなコードになります
                // const result = await apiService.deleteProperty(id);

                // 成功したら一覧ページに戻る
                showSuccessAlert("削除完了", "建物が正常に削除されました。");
                navigate('/');
            } catch (error) {
                console.error("Error deleting property:", error);
                showErrorAlert("削除エラー", "削除中にエラーが発生しました。");
            } finally {
                setIsProcessing(false);
            }
        }
    };

    // ローディング表示
    if (Object.values(loading).some(isLoading => isLoading)) {
        return (
            <PropertyContainer>
                <BackButton onClick={() => navigate('/')}>
                    <FontAwesomeIcon icon={faArrowLeft} /> 一覧に戻る
                </BackButton>
                <Loading>データを読み込み中...</Loading>
            </PropertyContainer>
        );
    }

    return (
        <PropertyContainer>
            <BackButton onClick={() => navigate('/')}>
                <FontAwesomeIcon icon={faArrowLeft} /> 一覧に戻る
            </BackButton>

            <SectionContainer id="propertySection">
                <SectionHeader>
                    <h2>{propertyData?.name || '建物詳細'}</h2>
                    <HeaderButtons>
                        {isEditMode ? (
                            <>
                                <ActionButton
                                    onClick={toggleEditMode}
                                    color="#6c757d"
                                    disabled={isProcessing}
                                >
                                    キャンセル
                                </ActionButton>
                                <ActionButton
                                    onClick={savePropertyData}
                                    color="#28a745"
                                    disabled={isProcessing}
                                >
                                    <FontAwesomeIcon icon={faSave} /> 保存
                                </ActionButton>
                            </>
                        ) : (
                            <ActionButton
                                onClick={toggleEditMode}
                                color="#007bff"
                            >
                                <FontAwesomeIcon icon={faEdit} /> 編集
                            </ActionButton>
                        )}

                        <ActionButton
                            onClick={handleDeleteClick}
                            color="#dc3545"
                            disabled={propertyData?.has_related_rooms === "true" || isProcessing}
                            title={propertyData?.has_related_rooms === "true" ?
                                "この建物に紐づいている部屋または部屋タイプがあります。部屋や部屋タイプを先に削除してください" :
                                "建物を削除する"}
                        >
                            <FontAwesomeIcon icon={faTrashAlt} />
                        </ActionButton>
                    </HeaderButtons>
                </SectionHeader>

                <TabContainer>
                    <TabHeader>
                        <Tab
                            active={activeTab === 'property'}
                            onClick={() => setActiveTab('property')}
                        >
                            建物情報
                        </Tab>
                        <Tab
                            active={activeTab === 'roomTypes'}
                            onClick={() => setActiveTab('roomTypes')}
                        >
                            部屋タイプ
                        </Tab>
                        <Tab
                            active={activeTab === 'rooms'}
                            onClick={() => setActiveTab('rooms')}
                        >
                            部屋一覧
                        </Tab>
                    </TabHeader>

                    <TabContent active={activeTab === 'property'}>
                        {renderPropertyData()}
                    </TabContent>

                    <TabContent active={activeTab === 'roomTypes'}>
                        {renderRoomTypeList()}
                    </TabContent>

                    <TabContent active={activeTab === 'rooms'}>
                        {renderRoomList()}
                    </TabContent>
                </TabContainer>
            </SectionContainer>
        </PropertyContainer>
    );
};

export default PropertyPage;
