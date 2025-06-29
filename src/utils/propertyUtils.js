import AutoNumeric from 'autonumeric';

// フィールドの種類を判定
export const getFieldType = (header, schema) => {
    if (!schema[header]) {
        return "text";
    }

    const fieldInfo = schema[header];

    if (fieldInfo.dropdown) {
        return "dropdown";
    }

    if (fieldInfo.textarea) {
        return "textarea";
    }

    if (fieldInfo.inputRestrictions) {
        return "restricted";
    }

    return "text";
};

// 入力制限のオプション
export const inputRestrictionsOptions = {
    Amount: {
        minimumValue: 0,
        currencySymbol: "¥",
        digitGroupSeparator: ",",
        decimalCharacter: ".",
        decimalPlaces: 2, // 金額の場合、通常小数点2桁
    },
    Percentage: {
        minimumValue: 0,
        maximumValue: 100,
        decimalPlaces: 2, // 小数点2桁に固定
        suffixText: "%",
        decimalCharacter: ".",
    },
    "Time/Walk": {
        minimumValue: 1,
        decimalPlaces: 0, // 時間や分などは小数点なし
        suffixText: "分",
    },
    Area: {
        minimumValue: 0,
        decimalPlaces: 2, // 小数点2桁
        suffixText: "㎡",
        digitGroupSeparator: ",",
        decimalCharacter: ".",
    },
    "Building/Rooms": {
        minimumValue: 1,
        decimalPlaces: 0,
        decimalCharacter: ".",
    },
    Year: {
        minimumValue: 0,
        maximumValue: 2100,
        decimalPlaces: 0,
        digitGroupSeparator: "", // カンマ区切りを無効化
        decimalCharacter: "."
    },
    "Minpaku Count": {
        minimumValue: 0,
        decimalPlaces: 0, // 部屋数や件数も整数で扱う
    },
};

// データ要素の作成
export const createDataElement = (fieldType, value, isEditMode, isEditable, header, schema, originalData) => {
    const container = document.createElement('div');
    container.className = 'data-input-container';

    if (!isEditMode || !isEditable) {
        // 表示モード
        const display = document.createElement('div');
        display.className = 'data-display';

        if (fieldType === 'dropdown' && value) {
            // ドロップダウンの場合は表示値を取得
            display.textContent = value;
        } else if (fieldType === 'restricted' && value) {
            // 制限付き入力の場合はフォーマットして表示
            const restrictionType = schema[header].inputRestrictions;
            const options = inputRestrictionsOptions[restrictionType];

            if (options) {
                const formatted = new AutoNumeric.multiple([display], options)[0];
                formatted.set(value);
            } else {
                display.textContent = value || '';
            }
        } else {
            // 通常のテキスト
            display.textContent = value || '';
        }

        container.appendChild(display);
    } else {
        // 編集モード
        if (fieldType === 'dropdown') {
            const select = document.createElement('select');
            select.className = 'data-input dropdown';
            select.dataset.field = header;
            // ドロップダウンのオプションを追加
            // この部分は実際のAPIコールの後に実装します
            container.appendChild(select);
        } else if (fieldType === 'textarea') {
            const textarea = document.createElement('textarea');
            textarea.className = 'data-input';
            textarea.dataset.field = header;
            textarea.value = value || '';
            container.appendChild(textarea);
        } else if (fieldType === 'restricted') {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'data-input restricted';
            input.dataset.field = header;
            input.dataset.restrictionType = schema[header].inputRestrictions;
            input.value = value || '';
            container.appendChild(input);
        } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'data-input';
            input.dataset.field = header;
            input.value = value || '';
            container.appendChild(input);
        }
    }

    return container;
};

// ページネーションの管理
export const createPagination = (totalItems, currentPage, itemsPerPage, onPageChange) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // ページが少ない場合はシンプルな表示
    if (totalPages <= 7) {
        const pageButtons = [];
        for (let i = 1; i <= totalPages; i++) {
            pageButtons.push({
                page: i,
                active: i === currentPage
            });
        }
        return { pages: pageButtons, totalPages };
    }

    // 多くのページがある場合は省略表示
    const pageButtons = [];

    // 最初のページ
    pageButtons.push({ page: 1, active: currentPage === 1 });

    if (currentPage > 3) {
        pageButtons.push({ page: '...', active: false, disabled: true });
    }

    // 現在のページの前後
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
        pageButtons.push({ page: i, active: i === currentPage });
    }

    if (currentPage < totalPages - 2) {
        pageButtons.push({ page: '...', active: false, disabled: true });
    }

    // 最後のページ
    if (totalPages > 1) {
        pageButtons.push({ page: totalPages, active: currentPage === totalPages });
    }

    return { pages: pageButtons, totalPages };
};

// 日付のフォーマット
export const formatDate = (dateStr) => {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

// 住所フィールドの検証
export const validateAddressFields = (data, addressFields) => {
    const errors = {};

    addressFields.forEach(field => {
        if (!data[field]) {
            errors[field] = `${field}は必須項目です`;
        }
    });

    return errors;
};

// GASのconstants.jsから移植した機能

// グローバル変数的な設定
export const propertyPageConfig = {
    itemsPerPage: 10,
    addressFields: ["prefectures", "city", "town"]
};

// データ読み込み状態管理のためのデフォルト設定
export const defaultDataLoaded = {
    propertyData: false,
    roomTypeList: false,
    roomList: false,
    schemas: false,
    prefecturesAndCities: false,
};

// 入力タイプを取得する関数
export const getInputType = (fieldType) => {
    switch (fieldType) {
        case "restricted":
            return "text"; // AutoNumericで制御
        case "number":
            return "number";
        case "email":
            return "email";
        case "date":
            return "date";
        case "url":
            return "url";
        default:
            return "text";
    }
};

// 入力値の検証
export const validateInput = (value, fieldType, isRequired, header) => {
    const errors = [];

    // 必須フィールドのチェック
    if (isRequired && (!value || value.toString().trim() === "")) {
        errors.push("この項目は必須です");
    }

    // フィールドタイプ固有の検証
    switch (fieldType) {
        case "email":
            if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                errors.push("有効なメールアドレスを入力してください");
            }
            break;
        case "url":
            if (value && !/^https?:\/\/.+/.test(value)) {
                errors.push("有効なURLを入力してください");
            }
            break;
        case "number":
            if (value && isNaN(value)) {
                errors.push("数値を入力してください");
            }
            break;
    }

    return errors;
};

// AutoNumericの設定を取得
export const getAutoNumericConfig = (inputRestrictions) => {
    const config = inputRestrictionsOptions[inputRestrictions];
    if (!config) {
        return null;
    }

    return {
        ...config,
        watchExternalChanges: true,
        formatOnPageLoad: true,
    };
};

// 修正された値かどうかを判定
export const isModified = (currentValue, originalValue) => {
    // null, undefined, 空文字の統一的な扱い
    const normalizeValue = (val) => {
        if (val === null || val === undefined || val === "") {
            return "";
        }
        return val.toString();
    };

    return normalizeValue(currentValue) !== normalizeValue(originalValue);
};
