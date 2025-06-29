import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

// スタイル定義
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
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

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
`;

const Th = styled.th`
  border: 1px solid #ddd;
  padding: 12px;
  background: #f8f9fa;
  text-align: left;
`;

const Td = styled.td`
  border: 1px solid #ddd;
  padding: 12px;
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
`;

// テストデータ
const mockBuildingData = {
    1: {
        id: 1,
        name: '東京マンション',
        address: '東京都渋谷区1-1-1',
        manager: '田中太郎',
        phone: '03-1234-5678',
        email: 'tanaka@example.com',
        rooms: [
            { id: 1, roomNumber: '101', type: '1K', rent: 80000, status: '空室' },
            { id: 2, roomNumber: '102', type: '1DK', rent: 90000, status: '入居中' },
            { id: 3, roomNumber: '201', type: '1K', rent: 82000, status: '空室' },
            { id: 4, roomNumber: '202', type: '1DK', rent: 92000, status: '退去予定' },
            { id: 5, roomNumber: '301', type: '2LDK', rent: 120000, status: '空室' }
        ],
        roomTypes: [
            { id: 1, name: '1K', area: 25 },
            { id: 2, name: '1DK', area: 30 },
            { id: 3, name: '2LDK', area: 50 }
        ]
    },
    2: {
        id: 2,
        name: '大阪アパート',
        address: '大阪府大阪市北区2-2-2',
        manager: '佐藤花子',
        phone: '06-2345-6789',
        email: 'sato@example.com',
        rooms: [
            { id: 6, roomNumber: '101', type: '1R', rent: 60000, status: '空室' },
            { id: 7, roomNumber: '102', type: '1R', rent: 60000, status: '入居中' },
            { id: 8, roomNumber: '201', type: '1K', rent: 70000, status: '空室' }
        ],
        roomTypes: [
            { id: 4, name: '1R', area: 20 },
            { id: 5, name: '1K', area: 25 }
        ]
    }
};

const PropertyPage = () => {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('info');
    const [building, setBuilding] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState({});
    const [selectedRooms, setSelectedRooms] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [roomsPerPage] = useState(10);

    // データ取得
    useEffect(() => {
        const fetchBuildingData = async () => {
            try {
                setLoading(true);
                setError(null);

                // モックデータから取得（実際のAPIに置き換える）
                await new Promise(resolve => setTimeout(resolve, 1000)); // 模擬的な遅延

                const buildingData = mockBuildingData[id];
                if (!buildingData) {
                    throw new Error('建物が見つかりません');
                }

                setBuilding(buildingData);
                setEditData(buildingData);
            } catch (err) {
                setError(err.message || 'データの取得中にエラーが発生しました');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchBuildingData();
        }
    }, [id]);

    // 編集データの更新
    const handleInputChange = (field, value) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // 保存処理
    const handleSave = async () => {
        try {
            // 実際のAPI呼び出しに置き換える
            await new Promise(resolve => setTimeout(resolve, 500));

            setBuilding(editData);
            setEditMode(false);
            alert('保存しました');
        } catch (err) {
            setError('保存中にエラーが発生しました');
        }
    };

    // 部屋の検索とフィルタリング
    const filteredRooms = building?.rooms?.filter(room =>
        room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.status.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    // ページネーション
    const indexOfLastRoom = currentPage * roomsPerPage;
    const indexOfFirstRoom = indexOfLastRoom - roomsPerPage;
    const currentRooms = filteredRooms.slice(indexOfFirstRoom, indexOfLastRoom);
    const totalPages = Math.ceil(filteredRooms.length / roomsPerPage);

    // 部屋選択の処理
    const handleRoomSelect = (roomId) => {
        setSelectedRooms(prev =>
            prev.includes(roomId)
                ? prev.filter(id => id !== roomId)
                : [...prev, roomId]
        );
    };

    // 全選択/全解除
    const handleSelectAll = () => {
        if (selectedRooms.length === currentRooms.length) {
            setSelectedRooms([]);
        } else {
            setSelectedRooms(currentRooms.map(room => room.id));
        }
    };

    if (loading) {
        return (
            <Container>
                <LoadingMessage>データを読み込み中...</LoadingMessage>
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

    if (!building) {
        return (
            <Container>
                <ErrorMessage>建物データが見つかりません</ErrorMessage>
            </Container>
        );
    }

    return (
        <Container>
            <Header>{building.name} - 物件管理</Header>

            <TabContainer>
                <Tab
                    active={activeTab === 'info'}
                    onClick={() => setActiveTab('info')}
                >
                    建物情報
                </Tab>
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
            </TabContainer>

            {activeTab === 'info' && (
                <Section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3>建物基本情報</h3>
                        <Button onClick={() => setEditMode(!editMode)}>
                            {editMode ? 'キャンセル' : '編集'}
                        </Button>
                    </div>

                    <FormGroup>
                        <Label>建物名</Label>
                        <Input
                            type="text"
                            value={editMode ? editData.name : building.name}
                            disabled={!editMode}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>住所</Label>
                        <Input
                            type="text"
                            value={editMode ? editData.address : building.address}
                            disabled={!editMode}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>管理者</Label>
                        <Input
                            type="text"
                            value={editMode ? editData.manager : building.manager}
                            disabled={!editMode}
                            onChange={(e) => handleInputChange('manager', e.target.value)}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>電話番号</Label>
                        <Input
                            type="text"
                            value={editMode ? editData.phone : building.phone}
                            disabled={!editMode}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>メールアドレス</Label>
                        <Input
                            type="email"
                            value={editMode ? editData.email : building.email}
                            disabled={!editMode}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                        />
                    </FormGroup>

                    {editMode && (
                        <Button onClick={handleSave}>保存</Button>
                    )}
                </Section>
            )}

            {activeTab === 'rooms' && (
                <Section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3>部屋一覧</h3>
                        <div>
                            <Input
                                type="text"
                                placeholder="部屋番号、タイプ、ステータスで検索..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '300px', display: 'inline-block', marginRight: '10px' }}
                            />
                            <Button onClick={() => alert('新しい部屋を追加')}>
                                部屋追加
                            </Button>
                        </div>
                    </div>

                    {selectedRooms.length > 0 && (
                        <div style={{ marginBottom: '10px' }}>
                            <Button onClick={() => alert(`${selectedRooms.length}件の部屋を一括更新`)}>
                                一括更新
                            </Button>
                            <Button onClick={() => alert(`${selectedRooms.length}件の部屋を削除`)}>
                                一括削除
                            </Button>
                            <span style={{ marginLeft: '10px' }}>
                                {selectedRooms.length}件選択中
                            </span>
                        </div>
                    )}

                    <Table>
                        <thead>
                            <tr>
                                <Th>
                                    <input
                                        type="checkbox"
                                        checked={selectedRooms.length === currentRooms.length && currentRooms.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                </Th>
                                <Th>部屋番号</Th>
                                <Th>タイプ</Th>
                                <Th>家賃</Th>
                                <Th>ステータス</Th>
                                <Th>操作</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentRooms.map(room => (
                                <tr key={room.id}>
                                    <Td>
                                        <input
                                            type="checkbox"
                                            checked={selectedRooms.includes(room.id)}
                                            onChange={() => handleRoomSelect(room.id)}
                                        />
                                    </Td>
                                    <Td>{room.roomNumber}</Td>
                                    <Td>{room.type}</Td>
                                    <Td>¥{room.rent.toLocaleString()}</Td>
                                    <Td>{room.status}</Td>
                                    <Td>
                                        <Button onClick={() => alert(`部屋${room.roomNumber}を編集`)}>
                                            編集
                                        </Button>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    {/* ページネーション */}
                    {totalPages > 1 && (
                        <div style={{ marginTop: '20px', textAlign: 'center' }}>
                            <Button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                            >
                                前へ
                            </Button>
                            <span style={{ margin: '0 10px' }}>
                                {currentPage} / {totalPages}
                            </span>
                            <Button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                            >
                                次へ
                            </Button>
                        </div>
                    )}
                </Section>
            )}

            {activeTab === 'types' && (
                <Section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3>部屋タイプ管理</h3>
                        <Button onClick={() => alert('新しいタイプを追加')}>
                            タイプ追加
                        </Button>
                    </div>

                    <Table>
                        <thead>
                            <tr>
                                <Th>タイプ名</Th>
                                <Th>面積 (m²)</Th>
                                <Th>操作</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {building.roomTypes?.map(type => (
                                <tr key={type.id}>
                                    <Td>{type.name}</Td>
                                    <Td>{type.area}</Td>
                                    <Td>
                                        <Button onClick={() => alert(`タイプ${type.name}を編集`)}>
                                            編集
                                        </Button>
                                        <Button onClick={() => alert(`タイプ${type.name}を削除`)}>
                                            削除
                                        </Button>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Section>
            )}
        </Container>
    );
};

export default PropertyPage;
