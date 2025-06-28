import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const NotFoundContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  text-align: center;
  padding: 20px;
`;

const Title = styled.h1`
  font-size: 4rem;
  color: var(--primary-color);
  margin: 0;
`;

const Message = styled.p`
  font-size: 1.2rem;
  margin: 20px 0 30px;
`;

const BackLink = styled(Link)`
  background-color: var(--primary-color);
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  text-decoration: none;
  transition: background-color 0.3s;

  &:hover {
    background-color: var(--secondary-color);
  }
`;

const NotFoundPage = () => {
    return (
        <NotFoundContainer>
            <Title>404</Title>
            <Message>お探しのページは見つかりませんでした。</Message>
            <BackLink to="/">トップページへ戻る</BackLink>
        </NotFoundContainer>
    );
};

export default NotFoundPage;
