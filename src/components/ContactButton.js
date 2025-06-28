import React from 'react';
import styled from 'styled-components';

const ContactButtonWrapper = styled.a`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #4A154B;
  color: white;
  padding: 15px 25px;
  border-radius: 30px;
  border: none;
  text-decoration: none;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);

  &:hover {
    background-color: #3B0D3D;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  }
`;

const ContactButton = ({ href, text = 'お問い合わせ' }) => {
    const logButtonAction = (e) => {
        // トラッキング処理
        trackButtonClick("openSlack");

        const logData = {
            page: 'slack-technical support thread',
            buttonId: e.currentTarget.id || 'contact-slack',
            buttonName: e.currentTarget.textContent.trim() || 'お問い合わせ',
            timestamp: new Date().toISOString(),
            url: href,
        };

        console.log("Button clicked:", logData);

        // Reactでサーバーへのログ送信はAPIを利用
        fetch('/api/log-button-click', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(logData),
        })
            .then(response => response.json())
            .then(data => {
                if (!data.success) {
                    console.error('Failed to log button click:', data.error);
                }
            })
            .catch(error => {
                console.error('Error logging button click:', error);
            });
    };

    // トラッキング関数
    const trackButtonClick = (action) => {
        console.log(`Button click tracked: ${action}`);
        // ここに実際のトラッキングコードを実装（例：Googleアナリティクスなど）
    };

    return (
        <ContactButtonWrapper
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={logButtonAction}
            id="contact-slack"
        >
            <i className="fa-brands fa-slack"></i>
            {text}
        </ContactButtonWrapper>
    );
};

export default ContactButton;
