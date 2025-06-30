// パフォーマンス最適化ユーティリティ

/**
 * デバウンス関数 - 検索入力の遅延実行用
 * @param {Function} func - 実行する関数
 * @param {number} delay - 遅延時間（ミリ秒）
 * @returns {Function} デバウンスされた関数
 */
export const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

/**
 * スロットル関数 - イベントの実行頻度制限用
 * @param {Function} func - 実行する関数
 * @param {number} limit - 制限時間（ミリ秒）
 * @returns {Function} スロットルされた関数
 */
export const throttle = (func, limit) => {
    let lastFunc;
    let lastRan;
    return (...args) => {
        if (!lastRan) {
            func.apply(null, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(() => {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(null, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
};

/**
 * パフォーマンス測定ユーティリティ
 */
export const performanceMonitor = {
    /**
     * 処理時間を測定する
     * @param {string} name - 測定名
     * @param {Function} func - 測定する関数
     * @returns {Promise<any>} 関数の実行結果
     */
    async measure(name, func) {
        const start = performance.now();
        try {
            const result = await func();
            const end = performance.now();
            console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
            return result;
        } catch (error) {
            const end = performance.now();
            console.error(`[Performance] ${name} failed after ${(end - start).toFixed(2)}ms:`, error);
            throw error;
        }
    },

    /**
     * マークを設定
     * @param {string} name - マーク名
     */
    mark(name) {
        if (performance.mark) {
            performance.mark(name);
        }
    },

    /**
     * 2つのマーク間の時間を測定
     * @param {string} name - 測定名
     * @param {string} startMark - 開始マーク
     * @param {string} endMark - 終了マーク
     */
    measureBetween(name, startMark, endMark) {
        if (performance.measure) {
            performance.measure(name, startMark, endMark);
            const measure = performance.getEntriesByName(name)[0];
            console.log(`[Performance] ${name}: ${measure.duration.toFixed(2)}ms`);
        }
    }
};

/**
 * レンダリング最適化のためのメモ化ファクトリー
 */
export const memoFactory = {
    /**
     * 配列の変更検知用の浅い比較関数
     * @param {Array} prevArray - 前の配列
     * @param {Array} nextArray - 次の配列
     * @returns {boolean} 配列が同じかどうか
     */
    shallowArrayEqual: (prevArray, nextArray) => {
        if (prevArray.length !== nextArray.length) return false;
        for (let i = 0; i < prevArray.length; i++) {
            if (prevArray[i] !== nextArray[i]) return false;
        }
        return true;
    },

    /**
     * オブジェクトの浅い比較関数
     * @param {Object} prevObj - 前のオブジェクト
     * @param {Object} nextObj - 次のオブジェクト
     * @returns {boolean} オブジェクトが同じかどうか
     */
    shallowObjectEqual: (prevObj, nextObj) => {
        const prevKeys = Object.keys(prevObj);
        const nextKeys = Object.keys(nextObj);

        if (prevKeys.length !== nextKeys.length) return false;

        for (let key of prevKeys) {
            if (prevObj[key] !== nextObj[key]) return false;
        }
        return true;
    }
};

/**
 * バッチ処理ユーティリティ
 */
export const batchProcessor = {
    /**
     * 配列を指定サイズのチャンクに分割
     * @param {Array} array - 分割する配列
     * @param {number} chunkSize - チャンクサイズ
     * @returns {Array<Array>} チャンクの配列
     */
    chunk: (array, chunkSize) => {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    },

    /**
     * 非同期処理を並列実行（同時実行数制限付き）
     * @param {Array} items - 処理するアイテム
     * @param {Function} processor - 処理関数
     * @param {number} concurrency - 同時実行数
     * @returns {Promise<Array>} 処理結果の配列
     */
    async parallelProcess(items, processor, concurrency = 3) {
        const results = [];
        const chunks = this.chunk(items, concurrency);

        for (const chunk of chunks) {
            const chunkResults = await Promise.all(
                chunk.map(item => processor(item))
            );
            results.push(...chunkResults);
        }

        return results;
    }
};
