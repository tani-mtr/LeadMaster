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
        return response;
    },
    (error) => {
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
};

export default apiService;
