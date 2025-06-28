import Swal from 'sweetalert2';

// 成功アラート表示
export const showSuccessAlert = (title, message) => {
    return Swal.fire({
        title: title,
        html: message,
        icon: "success",
        confirmButtonText: "閉じる",
        confirmButtonColor: "#28a745",
        background: "#f8f9fa",
        customClass: {
            title: "text-success",
        },
    });
};

// エラーアラート表示
export const showErrorAlert = (title, message) => {
    return Swal.fire({
        title: title,
        html: message,
        icon: "error",
        confirmButtonText: "閉じる",
        confirmButtonColor: "#dc3545",
        background: "#f8f9fa",
        customClass: {
            title: "text-danger",
        },
    });
};

// 確認アラート表示
export const showConfirmAlert = (title, message, confirmButtonText = "OK") => {
    return Swal.fire({
        title: title,
        html: message,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: confirmButtonText,
        cancelButtonText: "キャンセル",
        confirmButtonColor: "#007bff",
        cancelButtonColor: "#6c757d",
        background: "#f8f9fa",
    });
};

// セッションストレージの操作
export const sessionStorage = {
    get: (key) => {
        return window.sessionStorage.getItem(key);
    },
    set: (key, value) => {
        window.sessionStorage.setItem(key, value);
    },
    remove: (key) => {
        window.sessionStorage.removeItem(key);
    },
    clear: () => {
        window.sessionStorage.clear();
    }
};

// トラッキング関数
export const trackButtonClick = (action) => {
    console.log(`Button click tracked: ${action}`);
    // ここに実際のトラッキングコードを実装（例：Googleアナリティクスなど）
};

// URL操作関連のユーティリティ
export const urlUtils = {
    getQueryParam: (name) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    },

    setQueryParams: (params) => {
        const urlParams = new URLSearchParams(window.location.search);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                urlParams.set(key, params[key]);
            } else {
                urlParams.delete(key);
            }
        });

        return urlParams.toString();
    }
};
