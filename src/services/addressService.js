// 住所データを取得するためのサービス
class AddressService {
    // サーバーサイドAPIのベースURL
    static BASE_URL = '/api/address';

    /**
     * 都道府県一覧を取得
     */
    static async fetchPrefectures() {
        try {
            const response = await fetch(`${this.BASE_URL}/prefectures`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            console.log('サーバーAPIレスポンス:', data);
            console.log('data.response:', data.response);
            console.log('data.response.prefecture:', data.response?.prefecture);
            console.log('data.response.location:', data.response?.location);

            // HeartRails APIの実際のレスポンス形式に対応
            if (data.response && data.response.prefecture) {
                const mappedData = data.response.prefecture.map(pref => {
                    console.log('マッピング前のprefデータ:', pref);
                    return {
                        code: pref.code || '',
                        name: pref.name || pref
                    };
                });
                console.log('マッピング後のデータ:', mappedData.slice(0, 5));
                return mappedData;
            }

            // location形式のレスポンスに対応（都道府県の場合）
            if (data.response && data.response.location && Array.isArray(data.response.location)) {
                console.log('location配列の最初の5件:', data.response.location.slice(0, 5));
                const mappedData = data.response.location.map(location => {
                    console.log('マッピング前のlocationデータ:', location);
                    return {
                        code: location.code || '',
                        name: location.prefecture || location.name || location
                    };
                });
                console.log('マッピング後のデータ:', mappedData.slice(0, 5));
                return mappedData;
            }

            // レスポンス形式が異なる場合の対応
            if (data.response && Array.isArray(data.response)) {
                console.log('配列形式のレスポンス:', data.response.slice(0, 5));
                return data.response.map(pref => ({
                    code: '',
                    name: pref
                }));
            }

            throw new Error('都道府県データの形式が不正です');
        } catch (error) {
            console.error('都道府県データの取得に失敗しました:', error);
            throw error;
        }
    }

    /**
     * 指定した都道府県の市区町村一覧を取得
     * @param {string} prefecture - 都道府県名
     */
    static async fetchCities(prefecture) {
        try {
            const response = await fetch(`${this.BASE_URL}/cities/${encodeURIComponent(prefecture)}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            console.log(`${prefecture}のサーバーAPIレスポンス:`, data);
            console.log('data.response:', data.response);
            console.log('data.response.location:', data.response?.location);

            // HeartRails APIの実際のレスポンス形式に対応
            if (data.response && data.response.location && Array.isArray(data.response.location)) {
                console.log('location配列の最初の5件:', data.response.location.slice(0, 5));
                return data.response.location.map(location => {
                    console.log('マッピング前のlocationデータ:', location);
                    return {
                        code: location.code || '',
                        name: location.city || location.name || location
                    };
                });
            }

            // 旧形式（data.response.city）にも対応
            if (data.response && data.response.city) {
                return data.response.city.map(city => ({
                    code: city.code || '',
                    name: city.name || ''
                }));
            }

            // レスポンス形式が配列の場合の対応
            if (data.response && Array.isArray(data.response)) {
                return data.response.map(city => ({
                    code: '',
                    name: city
                }));
            }

            throw new Error('市区町村データが見つかりませんでした');
        } catch (error) {
            console.error(`市区町村データの取得に失敗しました (${prefecture}):`, error);
            throw error;
        }
    }

    /**
     * 郵便番号から住所を取得（zipcloudサービス使用）
     * @param {string} zipcode - 郵便番号（ハイフンありなし両方対応）
     */
    static async fetchAddressByZipcode(zipcode) {
        try {
            // ハイフンを除去
            const cleanZipcode = zipcode.replace(/-/g, '');

            const response = await fetch(`${this.BASE_URL}/postal/${cleanZipcode}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.status === 200 && data.results && data.results.length > 0) {
                const result = data.results[0];
                return {
                    zipcode: result.zipcode,
                    prefecture: result.address1,
                    city: result.address2,
                    town: result.address3,
                    prefectureKana: result.kana1,
                    cityKana: result.kana2,
                    townKana: result.kana3
                };
            }

            throw new Error('該当する住所が見つかりませんでした');
        } catch (error) {
            console.error(`郵便番号検索に失敗しました (${zipcode}):`, error);
            throw error;
        }
    }
}

export { AddressService };

// デバッグ用のブラウザテストヘルパー
if (typeof window !== 'undefined') {
    window.testAddressService = async () => {
        console.log('=== AddressService テスト開始 ===');
        
        try {
            console.log('1. 都道府県データ取得テスト...');
            const prefectures = await AddressService.fetchPrefectures();
            console.log('都道府県データ:', prefectures?.slice(0, 10));
            
            if (prefectures && prefectures.length > 0) {
                const firstPref = prefectures[0].name;
                console.log(`2. ${firstPref}の市区町村データ取得テスト...`);
                const cities = await AddressService.fetchCities(firstPref);
                console.log(`${firstPref}の市区町村データ:`, cities?.slice(0, 10));
            }
            
            console.log('3. 郵便番号検索テスト (100-0001)...');
            const address = await AddressService.fetchAddressByZipcode('100-0001');
            console.log('郵便番号検索結果:', address);
            
            console.log('=== AddressService テスト完了 ===');
        } catch (error) {
            console.error('AddressService テストエラー:', error);
        }
    };

    // サーバーAPIテスト用のヘルパー
    window.testServerAPI = async () => {
        console.log('=== サーバーAPI テスト開始 ===');
        
        try {
            console.log('1. 都道府県APIテスト...');
            const prefResponse = await fetch('/api/address/prefectures');
            const prefData = await prefResponse.json();
            console.log('都道府県APIレスポンス:', prefData);
            
            if (prefData.response?.location?.length > 0) {
                const firstPref = prefData.response.location[0].prefecture;
                console.log(`2. ${firstPref}の市区町村APIテスト...`);
                const cityResponse = await fetch(`/api/address/cities/${encodeURIComponent(firstPref)}`);
                const cityData = await cityResponse.json();
                console.log(`${firstPref}の市区町村APIレスポンス:`, cityData);
            }
            
            console.log('3. 郵便番号APIテスト (100-0001)...');
            const postalResponse = await fetch('/api/address/postal/1000001');
            const postalData = await postalResponse.json();
            console.log('郵便番号APIレスポンス:', postalData);
            
            console.log('=== サーバーAPI テスト完了 ===');
        } catch (error) {
            console.error('サーバーAPI テストエラー:', error);
        }
    };
}
