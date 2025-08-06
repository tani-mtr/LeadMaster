import React, { useEffect, useState } from 'react';

/**
 * props:
 * - targetId: string (スクロールで表示したい要素のid)
 * - containerId: string (スクロールを監視する親要素のid)
 */

const ScrollToReadOnlyTableButton = ({ targetId }) => {
    const handleClick = () => {
        const target = document.getElementById(targetId);
        if (target) {
            const rect = target.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            window.scrollTo({
                top: rect.top + scrollTop,
                behavior: 'smooth',
            });
        }
    };

    // 常に表示
    return (
        <button
            style={{
                position: 'fixed',
                right: 32,
                bottom: 32,
                zIndex: 1000,
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: 48,
                height: 48,
                fontSize: 28,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                cursor: 'pointer',
            }}
            onClick={handleClick}
            aria-label="上部テーブルへスクロール"
            title="上部テーブルへスクロール"
        >
            ↑
        </button>
    );
};

export default ScrollToReadOnlyTableButton;
