import React, { useEffect, useState } from 'react';

/**
 * props:
 * - targetId: string (スクロールで表示したい要素のid)
 * - containerId: string (スクロールを監視する親要素のid)
 */

const ScrollToReadOnlyTableButton = ({ targetId }) => {
    // 高速スクロール用カスタムアニメーション
    const handleClick = () => {
        const target = document.getElementById(targetId);
        if (target) {
            const rect = target.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const targetY = rect.top + scrollTop;
            const startY = window.scrollY;
            const distance = targetY - startY;
            const duration = 200; // ミリ秒（短くして速く）
            let startTime = null;

            function animateScroll(currentTime) {
                if (!startTime) startTime = currentTime;
                const timeElapsed = currentTime - startTime;
                const progress = Math.min(timeElapsed / duration, 1);
                const ease = progress < 1 ? 1 - Math.pow(1 - progress, 3) : 1; // easeOutCubic
                window.scrollTo(0, startY + distance * ease);
                if (progress < 1) {
                    window.requestAnimationFrame(animateScroll);
                }
            }
            window.requestAnimationFrame(animateScroll);
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
