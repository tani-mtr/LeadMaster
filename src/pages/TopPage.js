import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { showErrorAlert } from '../utils/uiUtils';
import { apiService } from '../services/apiService';

// AG Gridモジュールの登録
ModuleRegistry.registerModules([AllCommunityModule]);

const PageContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const TableContainer = styled.div`
  margin-top: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
`;

const StatusBadge = styled.div`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  margin-left: 10px;
  background-color: ${props => props.connected ? '#28a745' : '#ffc107'};
  color: ${props => props.connected ? 'white' : '#212529'};
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const TopPage = () => {
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bigQueryStatus, setBigQueryStatus] = useState({ connected: false, message: 'チェック中...' });

    // AG Gridのデフォルト設定
    const defaultColDef = useMemo(() => ({
        sortable: true,
        filter: true,
        resizable: true,
        minWidth: 100,
        flex: 1
    }), []);

    // AG Gridの列定義
    const columnDefs = useMemo(() => [
        { field: 'id', headerName: 'ID', minWidth: 70 },
        {
            field: 'name',
            headerName: '物件名',
            minWidth: 200,
            cellRenderer: (params) => {
                return (
                    <Link
                        to={`/property/${params.data.id}`}
                        style={{
                            color: '#007bff',
                            textDecoration: 'none',
                            fontWeight: '500'
                        }}
                        onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                        onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                    >
                        {params.value}
                    </Link>
                );
            }
        },
        { field: 'tag', headerName: 'タグ', minWidth: 120 },
        { field: 'mt_representative', headerName: 'MT担当者', minWidth: 120 },
        {
            field: 'create_date',
            headerName: '作成日',
            minWidth: 120,
            filter: 'agDateColumnFilter',
            valueFormatter: (params) => {
                return params.value ? new Date(params.value).toLocaleDateString('ja-JP') : '';
            }
        },
        { field: 'adress', headerName: '住所', minWidth: 300 },
        { field: 'area_zoned_for_use', headerName: '用途地域', minWidth: 150 },
        { field: 'route_1', headerName: '路線1', minWidth: 120 },
        { field: 'station_1', headerName: '駅1', minWidth: 120 },
        { field: 'walk_min_1', headerName: '徒歩分数1', minWidth: 100 },
        {
            headerName: '詳細',
            minWidth: 120,
            filter: false,
            sortable: false,
            cellRenderer: (params) => {
                return `<a href="/detail/${params.data.id}" style="color: blue; text-decoration: underline;">詳細を見る</a>`;
            }
        }
    ], []);

    useEffect(() => {
        // BigQuery接続テスト
        const testBigQueryConnection = async () => {
            try {
                const result = await apiService.testBigQueryConnection();
                setBigQueryStatus(result);
            } catch (error) {
                console.error('BigQuery接続テストエラー:', error);
                setBigQueryStatus({
                    connected: false,
                    message: 'モックデータを使用中'
                });
            }
        };

        // APIからデータを取得
        const fetchBuildings = async () => {
            try {
                setLoading(true);
                console.log('Building data fetch started...');
                // apiServiceを使用してデータを取得
                const data = await apiService.getBuildings();
                console.log('Building data received:', data);

                // DataGridではIDフィールドが必要
                const dataWithIds = data.map(item => ({
                    ...item,
                    id: item.id || Math.random().toString(36).substr(2, 9)
                }));
                setBuildings(dataWithIds);
            } catch (err) {
                console.error('Error fetching buildings:', err);
                console.error('Error details:', {
                    message: err.message,
                    status: err.response?.status,
                    statusText: err.response?.statusText,
                    data: err.response?.data
                });
                setError(`エラーが発生しました: ${err.message || 'Request failed with status code 500'}`);
                showErrorAlert('エラー', `データの取得中にエラーが発生しました: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        testBigQueryConnection();
        fetchBuildings();
    }, []);

    if (error) {
        return <PageContainer>エラーが発生しました: {error}</PageContainer>;
    }

    return (
        <PageContainer>
            <HeaderSection>
                <h2>物件リスト（重複除去済み）</h2>
                <div>
                    <StatusBadge connected={bigQueryStatus.connected}>
                        {bigQueryStatus.message}
                    </StatusBadge>
                </div>
            </HeaderSection>

            <TableContainer>
                <div className="ag-theme-alpine" style={{ height: 500, width: '100%' }}>
                    <AgGridReact
                        rowData={buildings}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        pagination={true}
                        paginationPageSize={10}
                        paginationPageSizeSelector={[5, 10, 20, 50]}
                        rowSelection="single"
                        animateRows={true}
                        enableCellTextSelection={true}
                        domLayout="autoHeight"
                        overlayLoadingTemplate={
                            '<span class="ag-overlay-loading-center">データを読み込み中...</span>'
                        }
                        overlayNoRowsTemplate={
                            '<span class="ag-overlay-no-rows-center">データがありません</span>'
                        }
                    />
                </div>
            </TableContainer>
        </PageContainer>
    );
};

export default TopPage;
