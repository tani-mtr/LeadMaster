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
  width: 500px;
  background-color: white;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  transition: transform 0.3s ease-in-out;
  transform: ${props => props.isOpen ? 'translateX(0)' : 'translateX(100%)'};
  overflow-y: auto;
  
  @media (max-width: 768px) {
    width: 100%;
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
`;

const DataItem = styled.div`
  margin-bottom: 15px;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
`;

const HeaderText = styled.div`
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
  font-size: 14px;
`;

const DataValue = styled.div`
  padding: 8px;
  background: #f8f9fa;
  border-radius: 3px;
  color: #333;
  font-size: 16px;
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

    // ドロワーが開いたときにデータを取得
    useEffect(() => {
        fetchRoomData();
    }, [fetchRoomData]);

    // ドロワーが閉じたときにデータをクリア
    useEffect(() => {
        if (!isOpen) {
            setRoomData(null);
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
                    <DrawerTitle>部屋詳細</DrawerTitle>
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

                    {roomData && !loading && !error && (
                        <DataContainer>
                            <DataItem>
                                <HeaderText>ID</HeaderText>
                                <DataValue>{roomData.id}</DataValue>
                            </DataItem>

                            <DataItem>
                                <HeaderText>部屋名</HeaderText>
                                <DataValue>{roomData.name}</DataValue>
                            </DataItem>

                            {roomData.lead_property_name && (
                                <DataItem>
                                    <HeaderText>物件名</HeaderText>
                                    <DataValue>{roomData.lead_property_name}</DataValue>
                                </DataItem>
                            )}

                            {roomData.lead_room_type_name && (
                                <DataItem>
                                    <HeaderText>部屋タイプ</HeaderText>
                                    <DataValue>{roomData.lead_room_type_name}</DataValue>
                                </DataItem>
                            )}
                        </DataContainer>
                    )}
                </DrawerContent>
            </DrawerContainer>
        </>
    );
};

export default RoomDrawer;
