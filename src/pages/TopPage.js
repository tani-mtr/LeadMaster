import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { showErrorAlert } from '../utils/uiUtils';

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

const TopPage = () => {
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
        { field: 'name', headerName: '建物名', minWidth: 200 },
        { field: '住所', headerName: '住所', minWidth: 300 },
        {
            field: '築年数',
            headerName: '築年数',
            minWidth: 100,
            type: 'numericColumn',
            filter: 'agNumberColumnFilter'
        },
        {
            field: 'updatedAt',
            headerName: '更新日',
            minWidth: 120,
            filter: 'agDateColumnFilter',
            valueFormatter: (params) => {
                return params.value ? new Date(params.value).toLocaleDateString('ja-JP') : '';
            }
        },
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
        // APIからデータを取得
        const fetchBuildings = async () => {
            try {
                setLoading(true);
                // 実際の環境では実際のAPIエンドポイントに置き換える
                const response = await fetch('/api/buildings');
                if (!response.ok) {
                    throw new Error('データの取得に失敗しました');
                }

                const data = await response.json();
                // DataGridではIDフィールドが必要
                const dataWithIds = data.map(item => ({
                    ...item,
                    id: item.id || Math.random().toString(36).substr(2, 9)
                }));
                setBuildings(dataWithIds);
            } catch (err) {
                console.error('Error fetching buildings:', err);
                setError(err.message);
                showErrorAlert('エラー', 'データの取得中にエラーが発生しました。');
            } finally {
                setLoading(false);
            }
        };

        fetchBuildings();
    }, []);

    // 不要なコードを削除

    if (error) {
        return <PageContainer>エラーが発生しました: {error}</PageContainer>;
    }

    return (
        <PageContainer>
            <h2>建物リスト</h2>

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
