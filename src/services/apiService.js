import axios from 'axios';

// APIのベースURL
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

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
        try {
            console.log(`API Request: GET /property/${id}`);
            const response = await apiClient.get(`/property/${id}`);
            console.log('API Response: property data received', response.data);
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
            const response = await apiClient.get('/bigquery/test');
            return response.data;
        } catch (error) {
            console.error('Error testing BigQuery connection:', error);
            throw error;
        }
    },

    // 部屋一覧の取得（物件IDごと）
    getRoomList: async (propertyId) => {
        try {
            console.log(`API Request: GET /property/${propertyId}/rooms`);
            const response = await apiClient.get(`/property/${propertyId}/rooms`);
            console.log('API Response: room data received', response.data);
            return response.data;
        } catch (error) {
            console.error(`Error fetching rooms for property ${propertyId}:`, error);
            throw error;
        }
    },

    // 部屋タイプリストの取得（物件IDごと）
    getRoomTypeList: async (propertyId) => {
        try {
            console.log(`API Request: GET /property/${propertyId}/room-types`);
            const response = await apiClient.get(`/property/${propertyId}/room-types`);
            console.log('API Response: room type data received', response.data);
            return response.data;
        } catch (error) {
            console.error(`Error fetching room types for property ${propertyId}:`, error);
            throw error;
        }
    },
};

export default apiService;
