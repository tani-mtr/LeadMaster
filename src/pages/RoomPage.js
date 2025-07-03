import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { apiService } from '../services/apiService';

// スタイル定義
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  width: 95%;
`;

const Header = styled.h1`
  color: #333;
  margin-bottom: 20px;
`;

const BackButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: #0056b3;
  }
`;

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

const DataContainer = styled.div`
  background: white;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
`;

const DataItem = styled.div`
  margin-bottom: 15px;
`;

const HeaderText = styled.div`
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
`;

const DataValue = styled.div`
  padding: 8px;
  background: #f8f9fa;
  border-radius: 3px;
  color: #333;
`;

// メインコンポーネント
const RoomPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // State管理
    const [loading, setLoading] = useState(true);
    const [roomData, setRoomData] = useState(null);
    const [error, setError] = useState(null);

    // データ取得
    const fetchRoomData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            console.log(`部屋データを取得中: ID=${id}`);
            const dataResponse = await apiService.getRoomData(id);

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
    }, [id]);

    // 初期化
    useEffect(() => {
        fetchRoomData();
    }, [fetchRoomData]);

    // 戻るボタン処理
    const handleBack = () => {
        navigate(-1); // 前のページに戻る
    };

    if (loading) {
        return (
            <Container>
                <LoadingContainer>
                    <div className="spinner">⟳</div>
                    データを読み込んでいます...
                </LoadingContainer>
            </Container>
        );
    }

    if (error) {
        return (
            <Container>
                <BackButton onClick={handleBack}>
                    ← 戻る
                </BackButton>
                <Header>部屋詳細</Header>
                <div style={{ color: 'red', padding: '20px' }}>{error}</div>
            </Container>
        );
    }

    if (!roomData) {
        return (
            <Container>
                <BackButton onClick={handleBack}>
                    ← 戻る
                </BackButton>
                <Header>部屋詳細</Header>
                <div>データが見つかりません。</div>
            </Container>
        );
    }

    return (
        <Container>
            <BackButton onClick={handleBack}>
                ← 戻る
            </BackButton>

            <Header>部屋詳細</Header>

            <DataContainer>
                <DataItem>
                    <HeaderText>部屋ID</HeaderText>
                    <DataValue>{roomData.id || 'N/A'}</DataValue>
                </DataItem>

                <DataItem>
                    <HeaderText>進捗</HeaderText>
                    <DataValue>{roomData.status || 'N/A'}</DataValue>
                </DataItem>

                <DataItem>
                    <HeaderText>部屋名</HeaderText>
                    <DataValue>{roomData.name || 'N/A'}</DataValue>
                </DataItem>

                <DataItem>
                    <HeaderText>部屋番号</HeaderText>
                    <DataValue>{roomData.room_number || 'N/A'}</DataValue>
                </DataItem>

                <DataItem>
                    <HeaderText>建物ID</HeaderText>
                    <DataValue>{roomData.lead_property_id || 'N/A'}</DataValue>
                </DataItem>

                <DataItem>
                    <HeaderText>部屋タイプID</HeaderText>
                    <DataValue>{roomData.lead_room_type_id || 'N/A'}</DataValue>
                </DataItem>

                <DataItem>
                    <HeaderText>部屋登録日</HeaderText>
                    <DataValue>{roomData.create_date || 'N/A'}</DataValue>
                </DataItem>

                <DataItem>
                    <HeaderText>鍵引き渡し予定日</HeaderText>
                    <DataValue>{roomData.key_handover_scheduled_date || 'N/A'}</DataValue>
                </DataItem>

                <DataItem>
                    <HeaderText>鍵引き渡し予定日①</HeaderText>
                    <DataValue>{roomData.possible_key_handover_scheduled_date_1 || 'N/A'}</DataValue>
                </DataItem>

                <DataItem>
                    <HeaderText>鍵引き渡し予定日②</HeaderText>
                    <DataValue>{roomData.possible_key_handover_scheduled_date_2 || 'N/A'}</DataValue>
                </DataItem>

                <DataItem>
                    <HeaderText>鍵引き渡し予定日③</HeaderText>
                    <DataValue>{roomData.possible_key_handover_scheduled_date_3 || 'N/A'}</DataValue>
                </DataItem>

                <DataItem>
                    <HeaderText>退去SU</HeaderText>
                    <DataValue>{roomData.vacate_setup || 'N/A'}</DataValue>
                </DataItem>

                <DataItem>
                    <HeaderText>契約書回収予定日</HeaderText>
                    <DataValue>{roomData.contract_collection_date || 'N/A'}</DataValue>
                </DataItem>

                <DataItem>
                    <HeaderText>申請予定日</HeaderText>
                    <DataValue>{roomData.application_intended_date || 'N/A'}</DataValue>
                </DataItem>
            </DataContainer>
        </Container>
    );
};

export default RoomPage;
