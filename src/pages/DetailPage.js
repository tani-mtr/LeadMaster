import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { showSuccessAlert, showErrorAlert } from '../utils/uiUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave } from '@fortawesome/free-solid-svg-icons';

const DetailContainer = styled.div`
  padding: 20px;
  max-width: 1000px;
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
  transition: var(--transition);
  
  &:hover {
    background-color: #1a2530;
  }
`;

const DetailCard = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
  
  label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
  }
  
  input, select, textarea {
    width: 100%;
    padding: 8px 12px;
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

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const SaveButton = styled.button`
  background-color: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: var(--transition);
  
  &:hover {
    background-color: #218838;
  }
`;

const DetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [building, setBuilding] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // APIからデータを取得
        const fetchBuildingDetail = async () => {
            try {
                setLoading(true);
                // 実際の環境では実際のAPIエンドポイントに置き換える
                const response = await fetch(`/api/buildings/${id}`);
                if (!response.ok) {
                    throw new Error('建物データの取得に失敗しました');
                }

                const data = await response.json();
                setBuilding(data);
            } catch (err) {
                console.error('Error fetching building detail:', err);
                setError(err.message);
                showErrorAlert('エラー', '建物情報の取得中にエラーが発生しました。');
            } finally {
                setLoading(false);
            }
        };

        fetchBuildingDetail();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setBuilding(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);

            // 実際の環境では実際のAPIエンドポイントに置き換える
            const response = await fetch(`/api/buildings/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(building),
            });

            if (!response.ok) {
                throw new Error('建物データの更新に失敗しました');
            }

            showSuccessAlert('保存完了', '建物情報が正常に更新されました');
        } catch (err) {
            console.error('Error saving building:', err);
            showErrorAlert('エラー', '建物情報の保存中にエラーが発生しました。');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <DetailContainer>データを読み込み中...</DetailContainer>;
    }

    if (error) {
        return <DetailContainer>エラーが発生しました: {error}</DetailContainer>;
    }

    if (!building) {
        return <DetailContainer>建物情報が見つかりません</DetailContainer>;
    }

    return (
        <DetailContainer>
            <BackButton onClick={() => navigate('/')}>
                <FontAwesomeIcon icon={faArrowLeft} />
                一覧に戻る
            </BackButton>

            <h2>建物詳細情報</h2>

            <form onSubmit={handleSubmit}>
                <DetailCard>
                    <h3>基本情報</h3>
                    <FormGroup>
                        <label htmlFor="name">建物名</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={building.name || ''}
                            onChange={handleChange}
                            required
                        />
                    </FormGroup>

                    <FormGroup>
                        <label htmlFor="address">住所</label>
                        <input
                            id="address"
                            name="address"
                            type="text"
                            value={building.address || ''}
                            onChange={handleChange}
                            required
                        />
                    </FormGroup>

                    <FormGroup>
                        <label htmlFor="buildYear">建築年</label>
                        <input
                            id="buildYear"
                            name="buildYear"
                            type="number"
                            value={building.buildYear || ''}
                            onChange={handleChange}
                        />
                    </FormGroup>
                </DetailCard>

                <DetailCard>
                    <h3>詳細情報</h3>
                    <FormGroup>
                        <label htmlFor="description">説明</label>
                        <textarea
                            id="description"
                            name="description"
                            value={building.description || ''}
                            onChange={handleChange}
                        />
                    </FormGroup>

                    {/* 必要に応じて詳細情報のフィールドを追加 */}
                </DetailCard>

                <ButtonGroup>
                    <SaveButton type="submit" disabled={saving}>
                        <FontAwesomeIcon icon={faSave} />
                        {saving ? '保存中...' : '保存する'}
                    </SaveButton>
                </ButtonGroup>
            </form>
        </DetailContainer>
    );
};

export default DetailPage;
