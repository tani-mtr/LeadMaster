// 文字バリデーション用のユーティリティ関数

// GASと同じ特殊文字パターンを定義
export const specialCharactersPattern = /[^\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}0-9a-zA-Z\s\-_()・，．.ー,.]/u;

/**
 * 文字列が使用可能な文字のみを含んでいるかチェック
 * @param {string} value - チェックする文字列
 * @returns {boolean} - 有効な文字のみの場合true
 */
export const isValidCharacters = (value) => {
    if (!value || typeof value !== 'string') {
        return true; // 空文字列やnullは有効とする
    }
    return !specialCharactersPattern.test(value);
};

/**
 * 建物名のバリデーション
 * @param {string} value - 建物名
 * @returns {object} - { isValid: boolean, errorMessage: string }
 */
export const validatePropertyName = (value) => {
    if (!value || value.trim() === '') {
        return {
            isValid: false,
            errorMessage: 'この項目は必須です。'
        };
    }

    if (!isValidCharacters(value)) {
        return {
            isValid: false,
            errorMessage: '使用できない文字が含まれています。'
        };
    }

    return {
        isValid: true,
        errorMessage: ''
    };
};

/**
 * 部屋番号のバリデーション
 * @param {string} value - 部屋番号
 * @returns {object} - { isValid: boolean, errorMessage: string }
 */
export const validateRoomNumber = (value) => {
    if (!value || value.trim() === '') {
        return {
            isValid: false,
            errorMessage: 'この項目は必須です。'
        };
    }

    if (!isValidCharacters(value)) {
        return {
            isValid: false,
            errorMessage: '使用できない文字が含まれています。'
        };
    }

    return {
        isValid: true,
        errorMessage: ''
    };
};

/**
 * 部屋名のバリデーション
 * @param {string} value - 部屋名
 * @returns {object} - { isValid: boolean, errorMessage: string }
 */
export const validateRoomName = (value) => {
    if (!value || value.trim() === '') {
        return {
            isValid: false,
            errorMessage: 'この項目は必須です。'
        };
    }

    if (!isValidCharacters(value)) {
        return {
            isValid: false,
            errorMessage: '使用できない文字が含まれています。'
        };
    }

    return {
        isValid: true,
        errorMessage: ''
    };
};

/**
 * 部屋タイプ名のバリデーション
 * @param {string} value - 部屋タイプ名
 * @returns {object} - { isValid: boolean, errorMessage: string }
 */
export const validateRoomTypeName = (value) => {
    if (!value || value.trim() === '') {
        return {
            isValid: false,
            errorMessage: 'この項目は必須です。'
        };
    }

    if (!isValidCharacters(value)) {
        return {
            isValid: false,
            errorMessage: '使用できない文字が含まれています。'
        };
    }

    return {
        isValid: true,
        errorMessage: ''
    };
};

/**
 * 一般的なテキストフィールドのバリデーション（必須でない場合）
 * @param {string} value - 値
 * @returns {object} - { isValid: boolean, errorMessage: string }
 */
export const validateOptionalText = (value) => {
    if (!value || value.trim() === '') {
        return {
            isValid: true,
            errorMessage: ''
        };
    }

    if (!isValidCharacters(value)) {
        return {
            isValid: false,
            errorMessage: '使用できない文字が含まれています。'
        };
    }

    return {
        isValid: true,
        errorMessage: ''
    };
};

/**
 * 使用可能な文字の例を取得
 * @returns {string} - 使用可能な文字の説明
 */
export const getValidCharactersDescription = () => {
    return 'ひらがな、カタカナ、漢字、半角英数字、スペース、ハイフン（-）、アンダースコア（_）、スラッシュ（/）、括弧（）、中点（・）、コンマ、ピリオド、長音符（ー）が使用できます。';
};
