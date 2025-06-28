import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTableCellsLarge } from '@fortawesome/free-solid-svg-icons';

const HeaderWrapper = styled.header`
  background-color: var(--primary-color);
  padding: 15px 0;
  color: white;
  box-shadow: 0 2px 5px var(--shadow-color);
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ServiceTitle = styled.div`
  font-size: 1.2rem;
  font-weight: 500;

  a {
    color: white;
    text-decoration: none;
    transition: var(--transition);

    &:hover {
      opacity: 0.8;
    }
  }
`;

const TitleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 24px;
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
`;

const Header = ({ title, deployURL }) => {
    const location = useLocation();
    const url = deployURL || "/";

    // トラッキング関数
    const trackButtonClick = (action) => {
        console.log(`Button click tracked: ${action}`);
        // ここに実際のトラッキングコードを実装（例：Googleアナリティクスなど）
    };

    // SQL情報をコピーする機能
    const handleCopyQuery = () => {
        // この部分はGASのコードから移行する必要があります
        console.log('Copy query functionality will be implemented here');
        // TODO: SQLクエリのコピー機能を実装
    };

    return (
        <HeaderWrapper>
            <div className="container">
                <HeaderContent>
                    <ServiceTitle>
                        <Link to={url} onClick={() => trackButtonClick('topBack')}>
                            WebApp版 LeadMaster
                        </Link>
                    </ServiceTitle>

                    {title && (
                        <TitleWrapper>
                            <PageTitle>{title}</PageTitle>

                            {title === '建物詳細' && (
                                <IconWrapper className="tooltip_top">
                                    <FontAwesomeIcon
                                        icon={faTableCellsLarge}
                                        size="lg"
                                        onClick={handleCopyQuery}
                                    />
                                    <span className="tooltiptext_top">【SQL実行】<br />表示内容：<strong>この建物に関するすべての情報</strong><br /></span>
                                </IconWrapper>
                            )}
                        </TitleWrapper>
                    )}
                </HeaderContent>
            </div>
        </HeaderWrapper>
    );
};

export default Header;
