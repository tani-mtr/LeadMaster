import React, { useState, useEffect } from 'react';
import { DataGrid, GridActionsCellItem, GRID_DEFAULT_LOCALE_TEXT, useGridApiRef } from '@mui/x-data-grid';
import { Button, Typography, Box } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';

export default function RoomInfoEditableTable({ detailedRoomData = [], columns: columnsProp, focusedCell }) {
    // データは親から受け取る
    const [rows, setRows] = useState(detailedRoomData);
    const apiRef = useGridApiRef();
    const [rowIdCounter, setRowIdCounter] = useState(detailedRoomData.length + 1);

    const handleRowEdit = (params) => {
        const updatedRows = rows.map((row) =>
            row.id === params.id ? { ...row, ...params } : row
        );
        setRows(updatedRows);
    };

    const handleProcessRowUpdate = (newRow) => {
        handleRowEdit(newRow);
        return newRow;
    };

    const handleDelete = (id) => () => {
        setRows((prev) => prev.filter((row) => row.id !== id));
    };

    const handleDuplicate = (id) => () => {
        const rowToDuplicate = rows.find((row) => row.id === id);
        if (!rowToDuplicate) return;
        const newId = rowIdCounter;
        setRowIdCounter((c) => c + 1);
        setRows((prev) => {
            const idx = prev.findIndex((row) => row.id === id);
            const newRow = { ...rowToDuplicate, id: newId };
            const newRows = [...prev];
            newRows.splice(idx + 1, 0, newRow);
            return newRows;
        });
    };

    const handleAddRow = () => {
        const newId = rowIdCounter;
        setRowIdCounter((c) => c + 1);
        setRows((prev) => [
            ...prev,
            { id: newId, name: `Room ${String.fromCharCode(65 + prev.length)}` }
        ]);
    };

    // PropertyPageのROOM_INFO_FIELD_CONFIG/ROOM_TABLE_FIELD_ORDERより部屋関連カラムのみ追加
    // 日付カラム用のvalueGetter
    const dateValueGetter = (params) => {
        // params そのもの、または value が falsy なら即 null を返す
        const v = params?.value;
        if (v == null) return null;

        if (v instanceof Date) return v;

        // { value: xxx } 形式
        if (typeof v === 'object') {
            const d = new Date(v.value);
            return isNaN(d.getTime()) ? null : d;
        }

        // 文字列や数値
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
    };


    const columns = [
        { field: 'id', headerName: '部屋ID', width: 80, editable: false, type: 'number' },
        { field: 'core_id', headerName: 'core部屋ID', width: 120, editable: false },
        { field: 'name', headerName: '部屋名', flex: 1, editable: false },
        { field: 'status', headerName: '進捗', width: 100, editable: true, type: 'singleSelect', valueOptions: ['', 'A', 'B', 'C', 'D', 'E', 'F', 'クローズ', '運営判断中', '試算入力待ち', '試算入力済み', '試算依頼済み', '他決', '見送り'] },
        { field: 'lead_property_id', headerName: '物件ID', width: 100, editable: false },
        { field: 'lead_room_type_id', headerName: '部屋タイプID', width: 120, editable: false },
        { field: 'create_date', headerName: '部屋登録日', width: 120, editable: false, type: 'date', valueGetter: dateValueGetter },
        { field: 'key_handover_scheduled_date', headerName: '鍵引き渡し予定日', width: 140, editable: true, type: 'date', valueGetter: dateValueGetter },
        { field: 'possible_key_handover_scheduled_date_1', headerName: '鍵引き渡し予定日①', width: 140, editable: true, type: 'date', valueGetter: dateValueGetter },
        { field: 'possible_key_handover_scheduled_date_2', headerName: '鍵引き渡し予定日②', width: 140, editable: true, type: 'date', valueGetter: dateValueGetter },
        { field: 'possible_key_handover_scheduled_date_3', headerName: '鍵引き渡し予定日③', width: 140, editable: true, type: 'date', valueGetter: dateValueGetter },
        { field: 'leaflet_distribution_date', headerName: 'チラシ配布日', width: 120, editable: true, type: 'date', valueGetter: dateValueGetter },
        { field: 'notification_complete_date', headerName: '通知完了日', width: 120, editable: true, type: 'date', valueGetter: dateValueGetter },
        { field: 'contract_collection_date', headerName: '契約書回収予定日', width: 140, editable: true, type: 'date', valueGetter: dateValueGetter },
        { field: 'application_intended_date', headerName: '申請予定日', width: 120, editable: true, type: 'date', valueGetter: dateValueGetter },
        { field: 'user_email', headerName: 'ユーザーEmail', width: 180, editable: false },
        { field: 'vacate_setup', headerName: '退去SU', width: 100, editable: true, type: 'singleSelect', valueOptions: ['', '一般賃貸中', '退去SU'] },
        { field: 'room_number', headerName: '部屋番号', width: 100, editable: false },
        {
            field: 'actions',
            headerName: '操作',
            type: 'actions',
            width: 90,
            getActions: (params) => [
                <GridActionsCellItem
                    icon={<ContentCopyIcon fontSize="small" />}
                    label="複製"
                    onClick={handleDuplicate(params.id)}
                    showInMenu={false}
                />,
                <GridActionsCellItem
                    icon={<DeleteIcon fontSize="small" />}
                    label="削除"
                    onClick={handleDelete(params.id)}
                    showInMenu={false}
                />
            ],
        },
    ];

    // columnsPropが未定義や空配列の場合はデフォルトcolumnsを使う
    const baseColumns = (columnsProp && columnsProp.length > 0) ? columnsProp : columns;
    // date型にはvalueGetterを必ず付与
    const patchedColumns = baseColumns.map((col) => {
        if (col.type === 'date' && !col.valueGetter) {
            return { ...col, valueGetter: dateValueGetter };
        }
        return col;
    });
    // デバッグ用: columnsの内容を出力
    if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.log('[RoomInfoEditableTable] patchedColumns:', patchedColumns);
    }

    // セルフォーカス＆編集モード副作用
    useEffect(() => {
        if (!focusedCell) return;
        if (!apiRef.current) {
            console.log('[RoomInfoEditableTable] apiRef.current is not ready');
            return;
        }
        if (typeof apiRef.current.setCellFocus !== 'function') {
            console.log('[RoomInfoEditableTable] setCellFocus is not a function');
            return;
        }
        if (typeof apiRef.current.startCellEditMode !== 'function') {
            console.log('[RoomInfoEditableTable] startCellEditMode is not a function');
            return;
        }
        console.log('[RoomInfoEditableTable] setCellFocus', focusedCell);
        apiRef.current.setCellFocus(focusedCell.rowId, focusedCell.field);
        setTimeout(() => {
            console.log('[RoomInfoEditableTable] startCellEditMode', focusedCell);
            apiRef.current.startCellEditMode({ id: focusedCell.rowId, field: focusedCell.field });
        }, 0);
    }, [focusedCell, apiRef]);

    return (
        <Box sx={{ p: 2, width: '100%', fontFamily: 'monospace', backgroundColor: '#FFFDE7', borderRadius: 2 }}>
            <Box sx={{ height: 500, width: '100%' }}>
                <DataGrid
                    rows={rows}
                    columns={patchedColumns}
                    pageSize={100}
                    disableRowSelectionOnClick
                    processRowUpdate={handleProcessRowUpdate}
                    experimentalFeatures={{ newEditingApi: true }}
                    localeText={GRID_DEFAULT_LOCALE_TEXT}
                    sx={{ backgroundColor: '#FFFDE7' }}
                    apiRef={apiRef}
                />
            </Box>
        </Box>
    );
}
//
