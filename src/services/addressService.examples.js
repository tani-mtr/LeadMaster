// AddressService使用例とテスト

import { AddressService } from './addressService';

// 使用例1: 都道府県一覧を取得
async function testFetchPrefectures() {
    try {
        console.log('都道府県一覧を取得中...');
        const prefectures = await AddressService.fetchPrefectures();
        console.log('取得された都道府県:', prefectures);
        return prefectures;
    } catch (error) {
        console.error('都道府県取得エラー:', error);
    }
}

// 使用例2: 指定都道府県の市区町村を取得
async function testFetchCities(prefecture = '東京都') {
    try {
        console.log(`${prefecture}の市区町村を取得中...`);
        const cities = await AddressService.fetchCities(prefecture);
        console.log(`${prefecture}の市区町村:`, cities);
        return cities;
    } catch (error) {
        console.error('市区町村取得エラー:', error);
    }
}

// 使用例3: 郵便番号から住所を取得
async function testFetchAddressByZipcode(zipcode = '100-0001') {
    try {
        console.log(`郵便番号${zipcode}の住所を取得中...`);
        const address = await AddressService.fetchAddressByZipcode(zipcode);
        console.log('取得された住所:', address);
        return address;
    } catch (error) {
        console.error('郵便番号検索エラー:', error);
    }
}

// 使用例4: React コンポーネントでの使用パターン
export const useAddressData = () => {
    const [prefectures, setPrefectures] = React.useState([]);
    const [cities, setCities] = React.useState([]);
    const [loading, setLoading] = React.useState(false);

    // 都道府県一覧を取得
    const loadPrefectures = async () => {
        setLoading(true);
        try {
            const data = await AddressService.fetchPrefectures();
            setPrefectures(['', ...data.map(p => p.name)]);
        } catch (error) {
            console.error('都道府県データの取得に失敗:', error);
            setPrefectures(['']);
        } finally {
            setLoading(false);
        }
    };

    // 指定都道府県の市区町村を取得
    const loadCities = async (prefecture) => {
        if (!prefecture) {
            setCities(['']);
            return;
        }

        setLoading(true);
        try {
            const data = await AddressService.fetchCities(prefecture);
            setCities(['', ...data.map(c => c.name)]);
        } catch (error) {
            console.error('市区町村データの取得に失敗:', error);
            setCities(['']);
        } finally {
            setLoading(false);
        }
    };

    return {
        prefectures,
        cities,
        loading,
        loadPrefectures,
        loadCities
    };
};

export {
    testFetchPrefectures,
    testFetchCities,
    testFetchAddressByZipcode
};
