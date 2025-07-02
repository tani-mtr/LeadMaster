import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { apiService } from '../services/apiService';

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

// RoomTypeDrawerコンポーネント
const RoomTypeDrawer = ({ isOpen, onClose, roomTypeId }) => {
    const [loading, setLoading] = useState(false);
    const [roomTypeData, setRoomTypeData] = useState(null);
    const [error, setError] = useState(null);

    // データ取得
    const fetchRoomTypeData = useCallback(async () => {
        if (!roomTypeId || !isOpen) return;

        try {
            setLoading(true);
            setError(null);

            console.log(`部屋タイプデータを取得中: ID=${roomTypeId}`);
            const dataResponse = await apiService.getRoomTypeData(roomTypeId);

            if (dataResponse && dataResponse.length > 0) {
                setRoomTypeData(dataResponse[0]);
                console.log('部屋タイプデータを取得しました:', dataResponse[0]);
            } else {
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
                        <DataContainer>
                            <DataItem>
                                <HeaderText>部屋タイプID</HeaderText>
                                <DataValue>{roomTypeData.id || 'N/A'}</DataValue>
                            </DataItem>

                            <DataItem>
                                <HeaderText>進捗</HeaderText>
                                <DataValue>{roomTypeData.status || 'N/A'}</DataValue>
                            </DataItem>

                            <DataItem>
                                <HeaderText>部屋タイプ名</HeaderText>
                                <DataValue>{roomTypeData.name || 'N/A'}</DataValue>
                            </DataItem>

                            <DataItem>
                                <HeaderText>部屋タイプ番号</HeaderText>
                                <DataValue>{roomTypeData.room_type_number || 'N/A'}</DataValue>
                            </DataItem>

                            <DataItem>
                                <HeaderText>建物ID</HeaderText>
                                <DataValue>{roomTypeData.lead_property_id || 'N/A'}</DataValue>
                            </DataItem>

                            <DataItem>
                                <HeaderText>間取り</HeaderText>
                                <DataValue>{roomTypeData.floor_plan || 'N/A'}</DataValue>
                            </DataItem>

                            <DataItem>
                                <HeaderText>専有面積（㎡）</HeaderText>
                                <DataValue>{roomTypeData.floor_area || 'N/A'}</DataValue>
                            </DataItem>

                            <DataItem>
                                <HeaderText>バルコニー面積（㎡）</HeaderText>
                                <DataValue>{roomTypeData.balcony_area || 'N/A'}</DataValue>
                            </DataItem>

                            <DataItem>
                                <HeaderText>家賃（円）</HeaderText>
                                <DataValue>{roomTypeData.rent ? `¥${Number(roomTypeData.rent).toLocaleString()}` : 'N/A'}</DataValue>
                            </DataItem>

                            <DataItem>
                                <HeaderText>共益費（円）</HeaderText>
                                <DataValue>{roomTypeData.common_area_fee ? `¥${Number(roomTypeData.common_area_fee).toLocaleString()}` : 'N/A'}</DataValue>
                            </DataItem>

                            <DataItem>
                                <HeaderText>敷金（円）</HeaderText>
                                <DataValue>{roomTypeData.security_deposit ? `¥${Number(roomTypeData.security_deposit).toLocaleString()}` : 'N/A'}</DataValue>
                            </DataItem>

                            <DataItem>
                                <HeaderText>礼金（円）</HeaderText>
                                <DataValue>{roomTypeData.key_money ? `¥${Number(roomTypeData.key_money).toLocaleString()}` : 'N/A'}</DataValue>
                            </DataItem>

                            <DataItem>
                                <HeaderText>方位</HeaderText>
                                <DataValue>{roomTypeData.orientation || 'N/A'}</DataValue>
                            </DataItem>

                            <DataItem>
                                <HeaderText>最寄り駅</HeaderText>
                                <DataValue>{roomTypeData.nearest_station || 'N/A'}</DataValue>
                            </DataItem>

                            <DataItem>
                                <HeaderText>駅徒歩時間（分）</HeaderText>
                                <DataValue>{roomTypeData.walk_time_to_station ? `${roomTypeData.walk_time_to_station}分` : 'N/A'}</DataValue>
                            </DataItem>

                            <DataItem>
                                <HeaderText>設備</HeaderText>
                                <DataValue>{roomTypeData.facilities || 'N/A'}</DataValue>
                            </DataItem>

                            <DataItem>
                                <HeaderText>築年数</HeaderText>
                                <DataValue>{roomTypeData.building_age ? `${roomTypeData.building_age}年` : 'N/A'}</DataValue>
                            </DataItem>

                            <DataItem>
                                <HeaderText>構造</HeaderText>
                                <DataValue>{roomTypeData.building_structure || 'N/A'}</DataValue>
                            </DataItem>

                            <DataItem>
                                <HeaderText>階数</HeaderText>
                                <DataValue>{roomTypeData.floor_level || 'N/A'}</DataValue>
                            </DataItem>

                            <DataItem>
                                <HeaderText>作成日</HeaderText>
                                <DataValue>{roomTypeData.create_date || 'N/A'}</DataValue>
                            </DataItem>

                            {roomTypeData.lead_property_name && (
                                <DataItem style={{ gridColumn: '1 / -1' }}>
                                    <HeaderText>物件名</HeaderText>
                                    <DataValue>{roomTypeData.lead_property_name}</DataValue>
                                </DataItem>
                            )}

                            {roomTypeData.remarks && (
                                <DataItem style={{ gridColumn: '1 / -1' }}>
                                    <HeaderText>備考</HeaderText>
                                    <DataValue>{roomTypeData.remarks}</DataValue>
                                </DataItem>
                            )}
                        </DataContainer>
                    )}
                </DrawerContent>
            </DrawerContainer>
        </>
    );
};

export default RoomTypeDrawer;
