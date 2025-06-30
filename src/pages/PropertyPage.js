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
