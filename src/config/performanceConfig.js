// パフォーマンス設定

export const PERFORMANCE_CONFIG = {
    // API関連
    API: {
        TIMEOUT: 30000, // APIタイムアウト（30秒）
        CACHE_DURATION: 5 * 60 * 1000, // キャッシュ保持時間（5分）
        RETRY_COUNT: 2, // リトライ回数
        PARALLEL_REQUESTS: 3, // 並列リクエスト数
    },

    // UIレスポンス
    UI: {
        DEBOUNCE_DELAY: 300, // デバウンス遅延（検索入力用）
        THROTTLE_LIMIT: 100, // スロットル制限（スクロール等）
        PAGINATION_SIZE: 10, // ページネーションサイズ
        VIRTUAL_SCROLL_THRESHOLD: 100, // 仮想スクロール開始閾値
    },

    // ローディング
    LOADING: {
        MIN_LOADING_TIME: 200, // 最小ローディング表示時間（フラッシュ防止）
        SKELETON_DELAY: 300, // スケルトンローディング表示遅延
        PROGRESSIVE_LOADING: true, // プログレッシブローディング有効化
    },

    // キャッシュ
    CACHE: {
        MAX_ENTRIES: 100, // 最大キャッシュエントリ数
        CLEANUP_INTERVAL: 10 * 60 * 1000, // クリーンアップ間隔（10分）
        PREFETCH_ENABLED: true, // プリフェッチ有効化
    },

    // BigQuery最適化
    BIGQUERY: {
        MAX_RESULTS: 1000, // 最大結果件数
        TIMEOUT: 30000, // クエリタイムアウト
        USE_CACHE: true, // キャッシュ使用
        BATCH_SIZE: 50, // バッチサイズ
    },

    // 開発モード設定
    DEV: {
        ENABLE_PERFORMANCE_LOGGING: true, // パフォーマンスログ有効化
        MOCK_DELAY: 0, // モックAPI遅延（開発用）
        SHOW_RENDER_COUNT: false, // レンダリング回数表示
    }
};

// パフォーマンス監視設定
export const PERFORMANCE_THRESHOLDS = {
    // 警告レベル
    WARNING: {
        API_RESPONSE_TIME: 2000, // API応答時間（2秒）
        COMPONENT_RENDER_TIME: 100, // コンポーネントレンダリング時間（100ms）
        MEMORY_USAGE: 50 * 1024 * 1024, // メモリ使用量（50MB）
    },

    // エラーレベル
    ERROR: {
        API_RESPONSE_TIME: 5000, // API応答時間（5秒）
        COMPONENT_RENDER_TIME: 500, // コンポーネントレンダリング時間（500ms）
        MEMORY_USAGE: 100 * 1024 * 1024, // メモリ使用量（100MB）
    }
};

// ターゲットパフォーマンス指標
export const PERFORMANCE_TARGETS = {
    // PropertyPage最適化目標
    PROPERTY_PAGE: {
        INITIAL_LOAD: 1000, // 初期ローディング時間（1秒）
        TAB_SWITCH: 200, // タブ切り替え時間（200ms）
        SEARCH_RESPONSE: 300, // 検索応答時間（300ms）
        PAGINATION: 100, // ページネーション時間（100ms）
    },

    // 一般的なパフォーマンス目標
    GENERAL: {
        TIME_TO_INTERACTIVE: 2000, // インタラクティブまでの時間（2秒）
        FIRST_CONTENTFUL_PAINT: 1000, // 初回コンテンツ描画（1秒）
        LARGEST_CONTENTFUL_PAINT: 2500, // 最大コンテンツ描画（2.5秒）
        CUMULATIVE_LAYOUT_SHIFT: 0.1, // レイアウトシフト（0.1以下）
    }
};
