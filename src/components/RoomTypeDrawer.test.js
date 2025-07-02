import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RoomTypeDrawer from './RoomTypeDrawer';
import { apiService } from '../services/apiService';

// apiServiceをモック化
jest.mock('../services/apiService');

const mockRoomTypeData = {
    id: 'RT001',
    status: '公開中',
    name: '1K標準タイプ',
    room_type_number: 'T001',
    lead_property_id: 'P001',
    floor_plan: '1K',
    floor_area: 25.5,
    balcony_area: 5.2,
    rent: 80000,
    common_area_fee: 5000,
    security_deposit: 160000,
    key_money: 80000,
    orientation: '南',
    nearest_station: '新宿駅',
    walk_time_to_station: 5,
    facilities: 'エアコン、洗濯機置場、シューズボックス',
    building_age: 10,
    building_structure: 'RC',
    floor_level: '3階',
    create_date: '2024-01-01',
    lead_property_name: 'サンプル物件',
    remarks: 'テスト用の部屋タイプです'
};

describe('RoomTypeDrawer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('ドロワーが閉じている状態では表示されない', () => {
        render(
            <RoomTypeDrawer
                isOpen={false}
                onClose={jest.fn()}
                roomTypeId="RT001"
            />
        );

        expect(screen.queryByText('部屋タイプ詳細')).not.toBeInTheDocument();
    });

    test('ドロワーが開いている状態では表示される', () => {
        render(
            <RoomTypeDrawer
                isOpen={true}
                onClose={jest.fn()}
                roomTypeId="RT001"
            />
        );

        expect(screen.getByText('部屋タイプ詳細')).toBeInTheDocument();
    });

    test('データ取得中はローディング表示される', () => {
        // APIをモック化してPendingにする
        apiService.getRoomTypeData.mockImplementation(() => new Promise(() => { }));

        render(
            <RoomTypeDrawer
                isOpen={true}
                onClose={jest.fn()}
                roomTypeId="RT001"
            />
        );

        expect(screen.getByText('データを読み込んでいます...')).toBeInTheDocument();
    });

    test('データが正常に表示される', async () => {
        // APIをモック化
        apiService.getRoomTypeData.mockResolvedValue([mockRoomTypeData]);

        render(
            <RoomTypeDrawer
                isOpen={true}
                onClose={jest.fn()}
                roomTypeId="RT001"
            />
        );

        // データが表示されるまで待機
        await waitFor(() => {
            expect(screen.getByText('1K標準タイプ')).toBeInTheDocument();
        });

        // 各項目が表示されることを確認
        expect(screen.getByText('RT001')).toBeInTheDocument();
        expect(screen.getByText('公開中')).toBeInTheDocument();
        expect(screen.getByText('1K')).toBeInTheDocument();
        expect(screen.getByText('25.5')).toBeInTheDocument();
        expect(screen.getByText('¥80,000')).toBeInTheDocument();
        expect(screen.getByText('新宿駅')).toBeInTheDocument();
        expect(screen.getByText('5分')).toBeInTheDocument();
        expect(screen.getByText('サンプル物件')).toBeInTheDocument();
    });

    test('エラー発生時はエラーメッセージが表示される', async () => {
        // APIエラーをモック化
        apiService.getRoomTypeData.mockRejectedValue(new Error('API Error'));

        render(
            <RoomTypeDrawer
                isOpen={true}
                onClose={jest.fn()}
                roomTypeId="RT001"
            />
        );

        // エラーメッセージが表示されるまで待機
        await waitFor(() => {
            expect(screen.getByText('部屋タイプデータの取得に失敗しました')).toBeInTheDocument();
        });
    });

    test('データが空の場合はエラーメッセージが表示される', async () => {
        // 空データをモック化
        apiService.getRoomTypeData.mockResolvedValue([]);

        render(
            <RoomTypeDrawer
                isOpen={true}
                onClose={jest.fn()}
                roomTypeId="RT001"
            />
        );

        // エラーメッセージが表示されるまで待機
        await waitFor(() => {
            expect(screen.getByText('部屋タイプデータが見つかりませんでした')).toBeInTheDocument();
        });
    });

    test('閉じるボタンをクリックするとonCloseが呼ばれる', () => {
        const mockOnClose = jest.fn();

        render(
            <RoomTypeDrawer
                isOpen={true}
                onClose={mockOnClose}
                roomTypeId="RT001"
            />
        );

        const closeButton = screen.getByLabelText('閉じる');
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('オーバーレイをクリックするとonCloseが呼ばれる', () => {
        const mockOnClose = jest.fn();

        render(
            <RoomTypeDrawer
                isOpen={true}
                onClose={mockOnClose}
                roomTypeId="RT001"
            />
        );

        // オーバーレイ要素を取得してクリック
        const overlay = screen.getByText('部屋タイプ詳細').closest('div').previousSibling;
        fireEvent.click(overlay);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('roomTypeIdがない場合はAPIが呼ばれない', () => {
        render(
            <RoomTypeDrawer
                isOpen={true}
                onClose={jest.fn()}
                roomTypeId={null}
            />
        );

        expect(apiService.getRoomTypeData).not.toHaveBeenCalled();
    });

    test('ドロワーが閉じられるとデータがクリアされる', async () => {
        // まずデータを取得
        apiService.getRoomTypeData.mockResolvedValue([mockRoomTypeData]);

        const { rerender } = render(
            <RoomTypeDrawer
                isOpen={true}
                onClose={jest.fn()}
                roomTypeId="RT001"
            />
        );

        // データが表示されることを確認
        await waitFor(() => {
            expect(screen.getByText('1K標準タイプ')).toBeInTheDocument();
        });

        // ドロワーを閉じる
        rerender(
            <RoomTypeDrawer
                isOpen={false}
                onClose={jest.fn()}
                roomTypeId="RT001"
            />
        );

        // データがクリアされることを確認
        expect(screen.queryByText('1K標準タイプ')).not.toBeInTheDocument();
    });
});
