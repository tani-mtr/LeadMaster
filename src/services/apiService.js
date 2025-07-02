import axios from 'axios';

// APIのベースURL
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// シンプルなメモリキャッシュ
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5分

// キャッシュヘルパー関数
const getCacheKey = (url, params = {}) => {
    return `${url}_${JSON.stringify(params)}`;
};

const isValidCache = (cacheEntry) => {
    return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_DURATION;
};

const setCache = (key, data) => {
    cache.set(key, {
        data,
        timestamp: Date.now()
    });
};

const getCache = (key) => {
    const cacheEntry = cache.get(key);
    if (isValidCache(cacheEntry)) {
        return cacheEntry.data;
    }
    cache.delete(key);
    return null;
};

// Axiosインスタンスを作成
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// リクエストインターセプター
apiClient.interceptors.request.use(
    (config) => {
        // リクエスト前の処理（認証トークンの追加など）
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// レスポンスインターセプター
apiClient.interceptors.response.use(
    (response) => {
        console.log('API Response Success:', response.status, response.data);
        return response;
    },
    (error) => {
        console.error('API Response Error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message,
            config: {
                url: error.config?.url,
                method: error.config?.method,
                baseURL: error.config?.baseURL
            }
        });

        // エラー処理（認証エラーなど）
        if (error.response && error.response.status === 401) {
            // 認証切れの場合はログアウト処理など
            console.error('認証エラーが発生しました');
            // localStorage.removeItem('authToken');
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// API関数
export const apiService = {
    // 建物一覧の取得
    getBuildings: async () => {
        try {
            console.log('API Request: GET /buildings');
            const response = await apiClient.get('/buildings');
            console.log('API Response: buildings data received', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching buildings:', error);
            throw error;
        }
    },

    // 建物詳細の取得
    getBuildingById: async (id) => {
        try {
            const response = await apiClient.get(`/buildings/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching building with id ${id}:`, error);
            throw error;
        }
    },

    // 建物情報の更新
    updateBuilding: async (id, data) => {
        try {
            const response = await apiClient.put(`/buildings/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`Error updating building with id ${id}:`, error);
            throw error;
        }
    },

    // 物件データの取得（GASのgetPropertyData関数と同様）
    getPropertyData: async (id) => {
        const cacheKey = getCacheKey(`/property/${id}`);
        const cachedData = getCache(cacheKey);

        if (cachedData) {
            console.log(`キャッシュから物件データを取得: ${id}`);
            return cachedData;
        }

        try {
            console.log(`API Request: GET /property/${id}`);
            const response = await apiClient.get(`/property/${id}`);
            console.log('API Response: property data received', response.data);

            setCache(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error(`Error fetching property with id ${id}:`, error);
            throw error;
        }
    },

    // ボタンクリックのログ送信
    logButtonClick: async (logData) => {
        try {
            const response = await apiClient.post('/log-button-click', logData);
            return response.data;
        } catch (error) {
            console.error('Error logging button click:', error);
            throw error;
        }
    },

    // BigQuery接続テスト
    testBigQueryConnection: async () => {
        try {
            const response = await apiClient.get('/test-bigquery');
            return response.data;
        } catch (error) {
            console.error('Error testing BigQuery connection:', error);
            throw error;
        }
    },

    // 部屋一覧の取得（物件IDごと）
    getRoomList: async (propertyId) => {
        const cacheKey = getCacheKey(`/property/${propertyId}/rooms`);
        const cachedData = getCache(cacheKey);

        if (cachedData) {
            console.log(`キャッシュから部屋データを取得: ${propertyId}`);
            return cachedData;
        }

        try {
            console.log(`API Request: GET /property/${propertyId}/rooms`);
            const response = await apiClient.get(`/property/${propertyId}/rooms`);
            console.log('API Response: room data received', response.data);

            setCache(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error(`Error fetching rooms for property ${propertyId}:`, error);
            throw error;
        }
    },

    // 部屋タイプリストの取得（物件IDごと）
    getRoomTypeList: async (propertyId) => {
        const cacheKey = getCacheKey(`/property/${propertyId}/room-types`);
        const cachedData = getCache(cacheKey);

        if (cachedData) {
            console.log(`キャッシュから部屋タイプデータを取得: ${propertyId}`);
            return cachedData;
        }

        try {
            console.log(`API Request: GET /property/${propertyId}/room-types`);
            const response = await apiClient.get(`/property/${propertyId}/room-types`);
            console.log('API Response: room type data received', response.data);

            setCache(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error(`Error fetching room types for property ${propertyId}:`, error);
            throw error;
        }
    },

    // 部屋タイプの詳細データの取得
    getRoomTypeData: async (id) => {
        const cacheKey = getCacheKey(`/room-type/${id}`);
        const cachedData = getCache(cacheKey);

        if (cachedData) {
            console.log(`キャッシュから部屋タイプ詳細データを取得: ${id}`);
            return cachedData;
        }

        try {
            console.log(`API Request: GET /room-type/${id}`);
            const response = await apiClient.get(`/room-type/${id}`);
            console.log('API Response: room type detail data received', response.data);

            setCache(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error(`Error fetching room type data for ID ${id}:`, error);
            throw error;
        }
    },

    // 部屋データの取得
    getRoomData: async (id) => {
        const cacheKey = getCacheKey(`/room/${id}`);
        const cachedData = getCache(cacheKey);

        if (cachedData) {
            console.log(`キャッシュから部屋データを取得: ${id}`);
            return cachedData;
        }

        try {
            console.log(`API Request: GET /room/${id}`);
            const response = await apiClient.get(`/room/${id}`);
            console.log('API Response: room data received', response.data);

            setCache(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error(`Error fetching room with id ${id}:`, error);
            throw error;
        }
    },

    // 部屋スキーマの取得
    getRoomSchema: async () => {
        const cacheKey = getCacheKey('/room/schema');
        const cachedData = getCache(cacheKey);

        if (cachedData) {
            console.log('キャッシュから部屋スキーマを取得');
            return cachedData;
        }

        try {
            console.log('API Request: GET /room/schema');
            const response = await apiClient.get('/room/schema');
            console.log('API Response: room schema received', response.data);

            setCache(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching room schema:', error);
            throw error;
        }
    },

    // ドロップダウンオプションの取得
    getDropdownOptions: async (propertyId) => {
        const cacheKey = getCacheKey(`/dropdown-options/${propertyId}`);
        const cachedData = getCache(cacheKey);

        if (cachedData) {
            console.log(`キャッシュからドロップダウンオプションを取得: ${propertyId}`);
            return cachedData;
        }

        try {
            console.log(`API Request: GET /dropdown-options/${propertyId}`);
            const response = await apiClient.get(`/dropdown-options/${propertyId}`);
            console.log('API Response: dropdown options received', response.data);

            setCache(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error(`Error fetching dropdown options for property ${propertyId}:`, error);
            throw error;
        }
    },

    // 部屋データの更新
    updateRoomData: async (id, data) => {
        try {
            console.log(`API Request: PUT /room/${id}`, data);
            const response = await apiClient.put(`/room/${id}`, data);
            console.log('API Response: room updated', response.data);

            // キャッシュをクリア
            const cacheKey = getCacheKey(`/room/${id}`);
            cache.delete(cacheKey);

            return response.data;
        } catch (error) {
            console.error(`Error updating room with id ${id}:`, error);
            throw error;
        }
    },

    // 重複チェック
    checkDuplication: async (type, value) => {
        try {
            console.log(`API Request: POST /check-duplication`, { type, value });
            const response = await apiClient.post('/check-duplication', { type, value });
            console.log('API Response: duplication check result', response.data);

            return response.data;
        } catch (error) {
            console.error('Error checking duplication:', error);
            throw error;
        }
    },
};
