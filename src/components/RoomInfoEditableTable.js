import React, { useState, useEffect } from 'react';
import { DataGrid, GridActionsCellItem, GRID_DEFAULT_LOCALE_TEXT, useGridApiRef } from '@mui/x-data-grid';
import { Button, Typography, Box } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';

export const defaultColumns = [
    { field: 'id', headerName: '部屋ID', minWidth: 80, editable: false, type: 'number' },
    { field: 'core_id', headerName: 'core部屋ID', minWidth: 120, flex: 1, editable: false },
    { field: 'name', headerName: '部屋名', minWidth: 120, flex: 1, editable: false },
    { field: 'status', headerName: '進捗', minWidth: 100, flex: 1, editable: true, type: 'singleSelect', valueOptions: ['', 'A', 'B', 'C', 'D', 'E', 'F', 'クローズ', '運営判断中', '試算入力待ち', '試算入力済み', '試算依頼済み', '他決', '見送り'] },
    { field: 'lead_property_id', headerName: '物件ID', minWidth: 100, flex: 1, editable: false },
    { field: 'lead_room_type_id', headerName: '部屋タイプID', minWidth: 120, flex: 1, editable: false },
    { field: 'create_date', headerName: '部屋登録日', minWidth: 120, flex: 1, editable: false, type: 'date' },
    { field: 'key_handover_scheduled_date', headerName: '鍵引き渡し予定日', minWidth: 140, flex: 1, editable: true, type: 'date' },
    { field: 'possible_key_handover_scheduled_date_1', headerName: '鍵引き渡し予定日①', minWidth: 140, flex: 1, editable: true, type: 'date' },
    { field: 'possible_key_handover_scheduled_date_2', headerName: '鍵引き渡し予定日②', minWidth: 140, flex: 1, editable: true, type: 'date' },
    { field: 'possible_key_handover_scheduled_date_3', headerName: '鍵引き渡し予定日③', minWidth: 140, flex: 1, editable: true, type: 'date' },
    { field: 'leaflet_distribution_date', headerName: 'チラシ配布日', minWidth: 120, flex: 1, editable: true, type: 'date' },
    { field: 'notification_complete_date', headerName: '通知完了日', minWidth: 120, flex: 1, editable: true, type: 'date' },
    { field: 'contract_collection_date', headerName: '契約書回収予定日', minWidth: 140, flex: 1, editable: true, type: 'date' },
    { field: 'application_intended_date', headerName: '申請予定日', minWidth: 120, flex: 1, editable: true, type: 'date' },
    { field: 'user_email', headerName: 'ユーザーEmail', minWidth: 180, flex: 1, editable: false },
    { field: 'vacate_setup', headerName: '退去SU', minWidth: 100, flex: 1, editable: true, type: 'singleSelect', valueOptions: ['', '一般賃貸中', '退去SU'] },
    { field: 'room_number', headerName: '部屋番号', minWidth: 100, flex: 1, editable: false }
];

export default function RoomInfoEditableTable({ detailedRoomData = [], columns: columnsProp, focusedCell, onRowsChange, onCellEditStop, tableColor }) {
    // 編集完了時のコールバック
    const handleCellEditStop = (...args) => {
        if (onCellEditStop) onCellEditStop(...args);
    };
    // データ受け取り直後のログ
    // データは親から受け取る
    const [rows, setRows] = useState(detailedRoomData);
    const apiRef = useGridApiRef();
    const [rowIdCounter, setRowIdCounter] = useState(detailedRoomData.length + 1);


    const handleRowEdit = (params) => {
        const updatedRows = rows.map((row) =>
            row.id === params.id ? { ...row, ...params } : row
        );
        setRows(updatedRows);
        if (onRowsChange) {
            onRowsChange(updatedRows);
        }
    };


    const handleProcessRowUpdate = (newRow) => {
        handleRowEdit(newRow);
        return newRow;
    };


    const handleDelete = (id) => () => {
        const updatedRows = rows.filter((row) => row.id !== id);
        setRows(updatedRows);
        if (onRowsChange) {
            onRowsChange(updatedRows);
        }
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
            if (onRowsChange) {
                onRowsChange(newRows);
            }
            return newRows;
        });
    };


    const handleAddRow = () => {
        const newId = rowIdCounter;
        setRowIdCounter((c) => c + 1);
        setRows((prev) => {
            const newRows = [
                ...prev,
                { id: newId, name: `Room ${String.fromCharCode(65 + prev.length)}` }
            ];
            if (onRowsChange) {
                onRowsChange(newRows);
            }
            return newRows;
        });
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
        { field: 'id', headerName: '部屋ID', minWidth: 80, editable: false, type: 'number' },
        { field: 'core_id', headerName: 'core部屋ID', minWidth: 120, flex: 1, editable: false },
        { field: 'name', headerName: '部屋名', minWidth: 120, flex: 1, editable: false },
        { field: 'status', headerName: '進捗', minWidth: 100, flex: 1, editable: true, type: 'singleSelect', valueOptions: ['', 'A', 'B', 'C', 'D', 'E', 'F', 'クローズ', '運営判断中', '試算入力待ち', '試算入力済み', '試算依頼済み', '他決', '見送り'] },
        { field: 'lead_property_id', headerName: '物件ID', minWidth: 100, flex: 1, editable: false },
        { field: 'lead_room_type_id', headerName: '部屋タイプID', minWidth: 120, flex: 1, editable: false },
        { field: 'create_date', headerName: '部屋登録日', minWidth: 120, flex: 1, editable: false, type: 'date', valueGetter: dateValueGetter },
        { field: 'key_handover_scheduled_date', headerName: '鍵引き渡し予定日', minWidth: 140, flex: 1, editable: true, type: 'date', valueGetter: dateValueGetter },
        { field: 'possible_key_handover_scheduled_date_1', headerName: '鍵引き渡し予定日①', minWidth: 140, flex: 1, editable: true, type: 'date', valueGetter: dateValueGetter },
        { field: 'possible_key_handover_scheduled_date_2', headerName: '鍵引き渡し予定日②', minWidth: 140, flex: 1, editable: true, type: 'date', valueGetter: dateValueGetter },
        { field: 'possible_key_handover_scheduled_date_3', headerName: '鍵引き渡し予定日③', minWidth: 140, flex: 1, editable: true, type: 'date', valueGetter: dateValueGetter },
        { field: 'leaflet_distribution_date', headerName: 'チラシ配布日', minWidth: 120, flex: 1, editable: true, type: 'date', valueGetter: dateValueGetter },
        { field: 'notification_complete_date', headerName: '通知完了日', minWidth: 120, flex: 1, editable: true, type: 'date', valueGetter: dateValueGetter },
        { field: 'contract_collection_date', headerName: '契約書回収予定日', minWidth: 140, flex: 1, editable: true, type: 'date', valueGetter: dateValueGetter },
        { field: 'application_intended_date', headerName: '申請予定日', minWidth: 120, flex: 1, editable: true, type: 'date', valueGetter: dateValueGetter },
        { field: 'user_email', headerName: 'ユーザーEmail', minWidth: 180, flex: 1, editable: false },
        { field: 'vacate_setup', headerName: '退去SU', minWidth: 100, flex: 1, editable: true, type: 'singleSelect', valueOptions: ['', '一般賃貸中', '退去SU'] },
        { field: 'room_number', headerName: '部屋番号', minWidth: 100, flex: 1, editable: false },
        {
            field: 'actions',
            headerName: '操作',
            type: 'actions',
            minWidth: 90,
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
                    onCellEditStop={handleCellEditStop}
                />
            ],
        },
    ];

    // columnsPropが未定義や空配列の場合はデフォルトcolumnsを使う
    // 受け取ったcolumnsPropにもflex:1とminWidthを付与（ID/操作列以外）
    const baseColumns = (columnsProp && columnsProp.length > 0) ? columnsProp : columns;
    // 各カラムの最大内容長からwidthを動的に決定
    const getMaxContentLength = (field, headerName) => {
        const headerLen = headerName ? String(headerName).length : 0;
        const maxCellLen = rows.reduce((max, row) => {
            const val = row[field];
            if (val == null) return max;
            return Math.max(max, String(val).length);
        }, 0);
        return Math.max(headerLen, maxCellLen);
    };
    const patchedColumns = baseColumns.map((col) => {
        let newCol = { ...col };
        // date型にはvalueGetterを必ず付与
        if (newCol.type === 'date' && !newCol.valueGetter) {
            newCol.valueGetter = dateValueGetter;
        }
        // IDや操作列以外は内容長に応じてwidthを決定
        if (!['id', 'actions'].includes(newCol.field)) {
            const maxLen = getMaxContentLength(newCol.field, newCol.headerName);
            // 1文字あたり12px+余白40pxで計算
            newCol.width = Math.max(80, Math.min(600, maxLen * 12 + 40));
            delete newCol.flex;
            delete newCol.minWidth;
        } else {
            // idやactionsは固定幅
            newCol.width = newCol.width || 80;
            delete newCol.flex;
            delete newCol.minWidth;
        }
        return newCol;
    });
    // DataGrid描画直前のデータを出力
    // ...existing code...

    // セルフォーカス＆編集モード副作用
    useEffect(() => {
        if (!focusedCell) return;
        if (!apiRef.current) {
            return;
        }
        if (typeof apiRef.current.setCellFocus !== 'function') {
            return;
        }
        if (typeof apiRef.current.startCellEditMode !== 'function') {
            return;
        }
        apiRef.current.setCellFocus(focusedCell.rowId, focusedCell.field);
        setTimeout(() => {
            apiRef.current.startCellEditMode({ id: focusedCell.rowId, field: focusedCell.field });
        }, 0);
    }, [focusedCell, apiRef]);

    return (
        <Box sx={{ p: 2, width: '100%', fontFamily: 'monospace', backgroundColor: tableColor || '#FFFDE7', borderRadius: 2 }}>
            <Box sx={{ height: 500, width: '100%' }}>
                <DataGrid
                    rows={rows}
                    columns={patchedColumns}
                    pageSize={100}
                    disableRowSelectionOnClick
                    processRowUpdate={handleProcessRowUpdate}
                    experimentalFeatures={{ newEditingApi: true }}
                    localeText={GRID_DEFAULT_LOCALE_TEXT}
                    sx={{ backgroundColor: tableColor || '#FFFDE7' }}
                    apiRef={apiRef}
                    onCellEditStop={handleCellEditStop}
                />
            </Box>
        </Box>
    );
}
//
