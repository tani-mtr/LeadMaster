// AddressService テスト用ファイル
import { AddressService } from './addressService';

// ブラウザのコンソールで直接テストできる関数
window.testAddressService = async () => {
    console.log('=== AddressService テスト開始 ===');

    try {
        console.log('1. 都道府県データ取得テスト...');
        const prefectures = await AddressService.fetchPrefectures();
        console.log('取得された都道府県数:', prefectures.length);
        console.log('最初の5件:', prefectures.slice(0, 5));
        console.log('全データ詳細:', prefectures);

        if (prefectures.length > 0) {
            const testPrefecture = prefectures[12]; // 東京都
            console.log(`2. ${testPrefecture.name}の市区町村データ取得テスト...`);
            const cities = await AddressService.fetchCities(testPrefecture.name);
            console.log(`${testPrefecture.name}の市区町村数:`, cities.length);
            console.log('最初の5件:', cities.slice(0, 5));
        }

        console.log('=== AddressService テスト完了 ===');
        return { success: true, prefectures };
    } catch (error) {
        console.error('=== AddressService テスト失敗 ===', error);
        return { success: false, error };
    }
};

// HeartRails APIを直接テストする関数
window.testHeartRailsAPI = async () => {
    console.log('=== HeartRails API 直接テスト ===');

    try {
        const response = await fetch('https://geoapi.heartrails.com/api/json?method=getPrefectures');
        const data = await response.json();
        console.log('HeartRails API 生レスポンス:', data);
        console.log('data.response:', data.response);
        console.log('data.response.prefecture:', data.response?.prefecture);

        if (data.response?.prefecture) {
            console.log('prefecture配列の最初の5件:', data.response.prefecture.slice(0, 5));
        }

        return data;
    } catch (error) {
        console.error('HeartRails API 直接呼び出し失敗:', error);
        return null;
    }
};

// 手動で都道府県データを確認する関数
window.checkPrefectureOptions = () => {
    // RoomTypeDrawerの状態を確認するためのヘルパー
    console.log('=== 都道府県オプション確認 ===');
    console.log('この関数は開発者ツールのElementsタブで');
    console.log('RoomTypeDrawerコンポーネントの状態を確認してください');

    // セレクトボックスの現在の選択肢を直接確認
    const selectElement = document.querySelector('select[value]');
    if (selectElement) {
        console.log('発見されたselectボックスのオプション数:', selectElement.options.length);
        console.log('最初の5つのオプション:');
        for (let i = 0; i < Math.min(5, selectElement.options.length); i++) {
            console.log(`  ${i}: "${selectElement.options[i].text}" (value: "${selectElement.options[i].value}")`);
        }
    } else {
        console.log('selectボックスが見つかりません');
    }
};

// React Devtoolsがない場合の状態確認用
window.forceRefreshPrefectures = () => {
    console.log('=== 都道府県データ強制再取得 ===');
    const editButton = document.querySelector('button[onClick]');
    if (editButton) {
        console.log('編集ボタンをクリックして強制再取得を試みます');
        editButton.click();
    } else {
        console.log('編集ボタンが見つかりません');
    }
};

console.log('AddressService テスト関数がロードされました');
console.log('使用方法:');
console.log('1. window.testAddressService() - APIテスト');
console.log('2. window.testHeartRailsAPI() - HeartRails API直接テスト');
console.log('3. window.checkPrefectureOptions() - 状態確認');
console.log('4. window.forceRefreshPrefectures() - 強制再取得');
