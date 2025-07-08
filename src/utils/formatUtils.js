/**
 * 日付を日本時刻の "yyyy/MM/dd HH:mm:ss" 形式でフォーマットする
 * @param {string|Date} dateString - フォーマットする日付文字列またはDateオブジェクト
 * @returns {string} フォーマットされた日付文字列、または'N/A'
 */
export const formatJapaneseDateTime = (dateString) => {
    if (!dateString || dateString === '' || dateString === 'N/A') {
        return '';
    }

    try {
        let date;

        // 既にDateオブジェクトの場合
        if (dateString instanceof Date) {
            date = dateString;
        } else {
            // 文字列の場合、Dateオブジェクトに変換
            date = new Date(dateString);
        }

        // 無効な日付の場合
        if (isNaN(date.getTime())) {
            return '';
        }

        // 日本時刻でフォーマット
        const japanDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));

        const year = japanDate.getFullYear();
        const month = String(japanDate.getMonth() + 1).padStart(2, '0');
        const day = String(japanDate.getDate()).padStart(2, '0');
        const hours = String(japanDate.getHours()).padStart(2, '0');
        const minutes = String(japanDate.getMinutes()).padStart(2, '0');
        const seconds = String(japanDate.getSeconds()).padStart(2, '0');

        return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
        console.error('日付フォーマットエラー:', error);
        return '';
    }
};

/**
 * 日付を "yyyy/MM/dd" 形式でフォーマットする（date用）
 * @param {string|Date} dateString - フォーマットする日付文字列またはDateオブジェクト
 * @returns {string} フォーマットされた日付文字列、または'N/A'
 */
export const formatJapaneseDate = (dateString) => {
    if (!dateString || dateString === '' || dateString === 'N/A') {
        return '';
    }

    try {
        let date;

        // 既にDateオブジェクトの場合
        if (dateString instanceof Date) {
            date = dateString;
        } else {
            // 文字列の場合、Dateオブジェクトに変換
            date = new Date(dateString);
        }

        // 無効な日付の場合
        if (isNaN(date.getTime())) {
            return '';
        }

        // 日本時刻で日付のみフォーマット
        const japanDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));

        const year = japanDate.getFullYear();
        const month = String(japanDate.getMonth() + 1).padStart(2, '0');
        const day = String(japanDate.getDate()).padStart(2, '0');

        return `${year}/${month}/${day}`;
    } catch (error) {
        console.error('日付フォーマットエラー:', error);
        return '';
    }
};

/**
 * 数値を3桁区切りでフォーマットする
 * @param {string|number} value - フォーマットする値
 * @returns {string} フォーマットされた数値文字列、または'N/A'
 */
export const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '' || value === 'N/A') {
        return '';
    }

    try {
        // 文字列から数値に変換
        const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : Number(value);

        // 無効な数値の場合
        if (isNaN(numValue)) {
            return '';
        }

        // 3桁区切りでフォーマット
        return numValue.toLocaleString('ja-JP');
    } catch (error) {
        console.error('金額フォーマットエラー:', error);
        return '';
    }
};

/**
 * timestampフィールドかどうかを判定する（時分秒まで表示）
 * @param {string} fieldName - フィールド名
 * @returns {boolean} timestampフィールドかどうか
 */
export const isTimestampField = (fieldName) => {
    const timestampFields = [
        'create_date'  // 部屋とRoomTypeの両方のcreate_date
    ];

    return timestampFields.includes(fieldName);
};

/**
 * dateフィールドかどうかを判定する（日付のみ表示）
 * @param {string} fieldName - フィールド名
 * @returns {boolean} dateフィールドかどうか
 */
export const isDateField = (fieldName) => {
    const dateFields = [
        'key_handover_scheduled_date',
        'possible_key_handover_scheduled_date_1',
        'possible_key_handover_scheduled_date_2',
        'possible_key_handover_scheduled_date_3',
        'contract_collection_date',
        'application_intended_date',
        'date_moving_in',
        'rent_accrual_date',
        'operation_start_date'
    ];

    return dateFields.includes(fieldName);
};

/**
 * 金額フィールドかどうかを判定する
 * @param {string} fieldName - フィールド名
 * @returns {boolean} 金額フィールドかどうか
 */
export const isCurrencyField = (fieldName) => {
    const currencyFields = [
        'minpaku_price',
        'monthly_price',
        'payment_rent',
        'management_expenses',
        'brokerage_commission',
        'deposit',
        'key_money',
        'key_exchange_money',
        'renovation_cost',
        'property_introduction_fee',
        'other_initial_cost',
        'renewal_fee',
        'firefighting_equipment_cost',
        'firefighting_equipment_cost_manual',
        'checkin_cost',
        'other_cost'
    ];

    return currencyFields.includes(fieldName);
};

/**
 * 値を適切にフォーマットする
 * @param {string} fieldName - フィールド名
 * @param {any} value - フォーマットする値
 * @returns {string} フォーマットされた値
 */
export const formatDisplayValue = (fieldName, value) => {
    // null、undefined、空文字列の場合は空欄を返す
    if (value === null || value === undefined || value === '') {
        return '';
    }

    // BigQueryから返されるオブジェクト形式の値を処理
    let actualValue = value;
    if (typeof value === 'object' && value !== null && 'value' in value) {
        actualValue = value.value;
        // 再度null/undefinedチェック
        if (actualValue === null || actualValue === undefined || actualValue === '') {
            return '';
        }
    }

    if (isTimestampField(fieldName)) {
        return formatJapaneseDateTime(actualValue);
    }

    if (isDateField(fieldName)) {
        return formatJapaneseDate(actualValue);
    }

    if (isCurrencyField(fieldName)) {
        return formatCurrency(actualValue);
    }

    return String(actualValue);
};
