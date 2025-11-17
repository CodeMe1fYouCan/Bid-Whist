import React from 'react';
import { Card as CardType } from '../types';

interface CardProps {
    card: CardType;
    onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ card, onClick }) => {
    const cardStyle: React.CSSProperties = {
        width: '100px',
        height: '150px',
        border: '1px solid black',
        borderRadius: '5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        fontSize: '18px',
        cursor: onClick ? 'pointer' : 'default',
    };

    return (
        <div style={cardStyle} onClick={onClick}>
            {`${card.rank} of ${card.suit}`}
        </div>
    );
};

export default Card;