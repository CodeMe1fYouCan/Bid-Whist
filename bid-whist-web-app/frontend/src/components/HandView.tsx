import React from 'react';
import Card from './Card';
import { Card as CardType } from '../types';

interface HandViewProps {
    hand: CardType[];
}

const HandView: React.FC<HandViewProps> = ({ hand }) => {
    return (
        <div className="hand-view">
            {hand.map((card, index) => (
                <Card key={index} card={card} />
            ))}
        </div>
    );
};

export default HandView;