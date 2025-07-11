import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import ContactButton from './components/ContactButton';
import TopPage from './pages/TopPage';
import DetailPage from './pages/DetailPage';
import PropertyPage from './pages/PropertyPage';
import RoomPage from './pages/RoomPage';
import NotFoundPage from './pages/NotFoundPage';
import { sessionStorage } from './utils/uiUtils';

function App() {
    const location = useLocation();
    const [deployURL, setDeployURL] = useState('/');
    const [currentPage, setCurrentPage] = useState('top');

    useEffect(() => {
        // URLパスに基づいて現在のページを判定
        const path = location.pathname;
        if (path === '/') {
            setCurrentPage('top');
        } else if (path.includes('/detail')) {
            setCurrentPage('detail');
        } else if (path.includes('/property')) {
            setCurrentPage('property');
        } else if (path.includes('/room')) {
            setCurrentPage('room');
        } else {
            setCurrentPage('other');
        }

        // GASのscriptURLに相当する値を環境変数から取得
        // 本番環境ではCloud Run URLになる
        const apiUrl = process.env.REACT_APP_API_URL || '/api';
        setDeployURL(apiUrl);

        // リファラーのチェック（GASコードの移植）
        const referrerUrl = sessionStorage.get('referrerUrl');
        if (referrerUrl) {
            sessionStorage.remove('referrerUrl');
        }
    }, [location]);

    // ページタイトルの設定
    const getPageTitle = () => {
        switch (currentPage) {
            case 'top':
                return '建物リスト';
            case 'detail':
                return '建物詳細';
            case 'property':
                return '物件管理';
            case 'room':
                return '部屋詳細';
            default:
                return '';
        }
    };

    return (
        <>
            <Header title={getPageTitle()} deployURL={deployURL} />

            <main>
                <Routes>
                    <Route path="/" element={<TopPage />} />
                    <Route path="/detail/:id" element={<DetailPage />} />
                    <Route path="/property/:id" element={<PropertyPage />} />
                    <Route path="/room/:id" element={<RoomPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </main>

            {/* Slack問い合わせボタン - 実際のSlack URLに置き換える必要があります */}
            <ContactButton href="https://slack.com/your-channel-url" text="お問い合わせ" />
        </>
    );
}

export default App;
