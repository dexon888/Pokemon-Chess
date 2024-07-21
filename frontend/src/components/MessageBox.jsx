// src/components/MessageBox.jsx
import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const BoxContainer = styled.div`
  border: 2px solid black;
  padding: 10px;
  width: 100%;
  font-family: 'Press Start 2P', cursive;
  background-color: white;
  color: black;
`;

const MessageBox = ({ messages }) => {
  return (
    <BoxContainer>
      {messages.map((message, index) => (
        <p key={index}>{message}</p>
      ))}
    </BoxContainer>
  );
};

MessageBox.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default MessageBox;
