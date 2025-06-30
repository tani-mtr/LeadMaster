import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { apiService } from '../services/apiService';

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

const PropertyPage = () => {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState('info');
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState({});

    // データ取得
    useEffect(() => {
        const fetchPropertyData = async () => {
            try {
                setLoading(true);
                setError(null);

                // BigQueryから物件データを取得
                const propertyData = await apiService.getPropertyData(id);

                setProperty(propertyData);
                setEditData(propertyData);
            } catch (err) {
                setError(err.message || 'データの取得中にエラーが発生しました');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchPropertyData();
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
            // 実際のAPI呼び出しに置き換える（今後実装予定）
            await new Promise(resolve => setTimeout(resolve, 500));

            setProperty(editData);
            setEditMode(false);
            alert('保存しました');
        } catch (err) {
            setError('保存中にエラーが発生しました');
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

                    <FormGroup>
                        <Label>物件ID</Label>
                        <Input
                            type="text"
                            value={property.id}
                            disabled={true}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>物件名</Label>
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
                        <p>部屋データの表示機能は今後実装予定です。</p>
                    </div>
                </Section>
            )}

            {property.has_related_rooms && activeTab === 'types' && (
                <Section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3>部屋タイプ管理</h3>
                        <p>部屋タイプ管理機能は今後実装予定です。</p>
                    </div>
                </Section>
            )}
        </Container>
    );
};

export default PropertyPage;
