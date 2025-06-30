import React from 'react';
import styled, { keyframes } from 'styled-components';

// スピナーアニメーション
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

// スタイル定義
const LoaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: 200px;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
  margin-bottom: 16px;
`;

const LoadingText = styled.div`
  color: #666;
  font-size: 14px;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const ProgressBar = styled.div`
  width: 200px;
  height: 4px;
  background-color: #f3f3f3;
  border-radius: 2px;
  overflow: hidden;
  margin: 16px 0 8px 0;
`;

const ProgressFill = styled.div`
  height: 100%;
  background-color: #007bff;
  border-radius: 2px;
  transition: width 0.3s ease;
  width: ${props => props.progress}%;
`;

const SkeletonContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  padding: 20px;
`;

const SkeletonRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  align-items: center;
`;

const SkeletonBox = styled.div`
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${pulse} 2s ease-in-out infinite;
  border-radius: 4px;
  height: ${props => props.height || '16px'};
  width: ${props => props.width || '100%'};
  flex: ${props => props.flex || 'none'};
`;

// コンポーネント
export const SimpleLoader = ({ message = 'データを読み込み中...' }) => (
    <LoaderContainer>
        <Spinner />
        <LoadingText>{message}</LoadingText>
    </LoaderContainer>
);

export const ProgressLoader = ({
    progress = 0,
    message = 'データを読み込み中...',
    showPercentage = true
}) => (
    <LoaderContainer>
        <Spinner />
        <ProgressBar>
            <ProgressFill progress={progress} />
        </ProgressBar>
        <LoadingText>
            {message} {showPercentage && `(${Math.round(progress)}%)`}
        </LoadingText>
    </LoaderContainer>
);

export const SkeletonLoader = ({ rows = 5 }) => (
    <SkeletonContainer>
        <SkeletonRow>
            <SkeletonBox width="200px" height="24px" />
            <SkeletonBox flex="1" height="20px" />
        </SkeletonRow>

        {Array.from({ length: rows }, (_, index) => (
            <SkeletonRow key={index}>
                <SkeletonBox width="60px" height="16px" />
                <SkeletonBox width="120px" height="16px" />
                <SkeletonBox flex="1" height="16px" />
                <SkeletonBox width="80px" height="16px" />
                <SkeletonBox width="100px" height="32px" />
            </SkeletonRow>
        ))}
    </SkeletonContainer>
);

export const PropertyPageLoader = ({ stage = 'loading' }) => {
    const getStageMessage = () => {
        switch (stage) {
            case 'property': return '物件データを取得中...';
            case 'rooms': return '部屋データを取得中...';
            case 'types': return '部屋タイプを取得中...';
            case 'complete': return 'データ処理中...';
            default: return 'データを読み込み中...';
        }
    };

    const getProgress = () => {
        switch (stage) {
            case 'property': return 30;
            case 'rooms': return 60;
            case 'types': return 80;
            case 'complete': return 100;
            default: return 0;
        }
    };

    return (
        <ProgressLoader
            progress={getProgress()}
            message={getStageMessage()}
        />
    );
};

// フックとしてローダーの状態管理を提供
export const useLoader = (initialState = false) => {
    const [isLoading, setIsLoading] = React.useState(initialState);
    const [progress, setProgress] = React.useState(0);
    const [stage, setStage] = React.useState('loading');

    const startLoading = React.useCallback((initialStage = 'loading') => {
        setIsLoading(true);
        setProgress(0);
        setStage(initialStage);
    }, []);

    const updateProgress = React.useCallback((newProgress, newStage) => {
        setProgress(newProgress);
        if (newStage) setStage(newStage);
    }, []);

    const finishLoading = React.useCallback(() => {
        setProgress(100);
        setStage('complete');
        // 短い遅延後にローディングを終了（ユーザビリティ向上）
        setTimeout(() => {
            setIsLoading(false);
            setProgress(0);
            setStage('loading');
        }, 200);
    }, []);

    return {
        isLoading,
        progress,
        stage,
        startLoading,
        updateProgress,
        finishLoading
    };
};
