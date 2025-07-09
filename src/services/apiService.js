import axios from 'axios';

// APIのベースURL
// 開発環境では常にプロキシを使用（相対パス）
const API_BASE_URL = '/api';

console.log('API Service 初期化 - Base URL:', API_BASE_URL);

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
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
            baseURL: config.baseURL,
            fullURL: `${config.baseURL}${config.url}`,
            headers: config.headers
        });

        // リクエスト前の処理（認証トークンの追加など）
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// レスポンスインターセプター
apiClient.interceptors.response.use(
    (response) => {
        console.log(`API Success: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`, {
            data: response.data,
            status: response.status,
            statusText: response.statusText
        });
        return response;
    },
    (error) => {
        console.error(`API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || 'Network Error'}`, {
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.message,
            config: {
                baseURL: error.config?.baseURL,
                url: error.config?.url,
                method: error.config?.method,
                fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'Unknown'
            },
            errorCode: error.code,
            errorType: error.name,
            isAxiosError: error.isAxiosError,
            networkError: !error.response && error.request ? true : false,
            errorDetails: {
                request: error.request ? {
                    readyState: error.request.readyState,
                    status: error.request.status,
                    responseURL: error.request.responseURL
                } : null,
                stack: error.stack
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
            const response = await apiClient.get('/buildings');
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
    getPropertyData: async (id, forceRefresh = false) => {
        const cacheKey = getCacheKey(`/property/${id}`);

        if (forceRefresh) {
            // 強制更新の場合はキャッシュを削除
            cache.delete(cacheKey);
        } else {
            const cachedData = getCache(cacheKey);
            if (cachedData) {
                return cachedData;
            }
        }

        try {
            const url = forceRefresh ? `/property/${id}?forceRefresh=true` : `/property/${id}`;
            const response = await apiClient.get(url);
            setCache(cacheKey, response.data);
            return response.data;
        } catch (error) {
            console.error(`Error fetching property with id ${id}:`, error);
            throw error;
        }
    },

    // 物件データの更新（GASのupdateProperty関数と同様）
    updatePropertyData: async (id, updatedData) => {
        try {
            console.log(`物件データ更新開始 - ID: ${id}`, {
                updatedData,
                dataKeys: Object.keys(updatedData),
                dataSize: JSON.stringify(updatedData).length
            });

            const response = await apiClient.put(`/property/${id}`, updatedData);

            console.log('物件データ更新レスポンス:', response.data);

            // 更新が成功したら、該当のキャッシュを削除して次回取得時に最新データを取得
            const cacheKey = getCacheKey(`/property/${id}`);
            cache.delete(cacheKey);

            // キャッシュを完全にクリアして確実に最新データを取得
            cache.clear();

            return response.data;
        } catch (error) {
            console.error(`物件データ更新エラー - ID: ${id}`, {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                headers: error.response?.headers,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    data: error.config?.data
                }
            });

            // サーバーからのエラーレスポンスがある場合はそれを使用
            if (error.response?.data?.error) {
                const serverError = new Error(error.response.data.error);
                serverError.details = error.response.data.details;
                serverError.errorType = error.response.data.errorType;
                serverError.status = error.response.status;
                throw serverError;
            }

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

    // 部屋タイプデータの更新
    updateRoomTypeData: async (id, data) => {
        try {
            console.log(`API Request: PUT /room-type/${id}`, data);
            const response = await apiClient.put(`/room-type/${id}`, data);
            console.log('API Response: room type data updated', response.data);

            // キャッシュをクリア
            const cacheKey = getCacheKey(`/room-type/${id}`);
            cache.delete(cacheKey);

            return response.data;
        } catch (error) {
            console.error(`Error updating room type data for ID ${id}:`, error);
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
    updateRoomData: async (id, data, changedBy = 'user') => {
        try {
            // 変更者情報を含むリクエストボディを作成
            const requestBody = {
                data: data,
                changedBy: changedBy
            };

            console.log(`API Request: PUT /room/${id}`, requestBody);
            const response = await apiClient.put(`/room/${id}`, requestBody);
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

    // 部屋データの変更履歴を取得
    getRoomHistory: async (id) => {
        try {
            console.log(`API Request: GET /room/${id}/history`);
            const response = await apiClient.get(`/room/${id}/history`);
            console.log('API Response: room history received', response.data);
            return response.data;
        } catch (error) {
            console.error(`Error fetching room history for id ${id}:`, error);
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

    // API接続のデバッグ
    testApiConnection: async () => {
        try {
            console.log(`API Connection Test: GET /health`);
            const response = await apiClient.get('/health');
            console.log('API Health Response:', response.data);
            return {
                success: true,
                message: 'API接続テスト成功',
                data: response.data,
                details: {
                    baseURL: apiClient.defaults.baseURL,
                    headers: apiClient.defaults.headers,
                    env: {
                        NODE_ENV: process.env.NODE_ENV,
                        REACT_APP_API_URL: process.env.REACT_APP_API_URL
                    }
                }
            };
        } catch (error) {
            console.error('API接続テストエラー:', error);
            return {
                success: false,
                message: 'API接続テスト失敗',
                error: {
                    message: error.message,
                    code: error.code,
                    response: error.response?.data,
                    status: error.response?.status,
                    config: {
                        baseURL: error.config?.baseURL,
                        url: error.config?.url,
                        method: error.config?.method
                    }
                }
            };
        }
    },

    // CORSデバッグ
    testCorsSettings: async () => {
        try {
            console.log(`CORS Debug: GET /debug/cors`);
            const response = await apiClient.get('/debug/cors');
            console.log('CORS Debug Response:', response.data);
            return {
                success: true,
                message: 'CORSテスト成功',
                data: response.data
            };
        } catch (error) {
            console.error('CORSテストエラー:', error);
            return {
                success: false,
                message: 'CORSテスト失敗',
                error: {
                    message: error.message,
                    code: error.code,
                    response: error.response?.data,
                    status: error.response?.status,
                }
            };
        }
    }
};
