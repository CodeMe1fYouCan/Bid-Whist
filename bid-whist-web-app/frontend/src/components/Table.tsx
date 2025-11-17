import React from 'react';
import Card from './Card';
import { PlayerHand } from '../types';

interface TableProps {
  playerHands: PlayerHand[];
  currentPlayerIndex: number;
  onCardPlay: (card: string) => void;
}

const Table: React.FC<TableProps> = ({ playerHands, currentPlayerIndex, onCardPlay }) => {
  const handleCardClick = (card: string) => {
    onCardPlay(card);
  };

  return (
    <div className="table">
      <h2>Game Table</h2>
      <div className="player-hands">
        {playerHands.map((hand, index) => (
          <div key={index} className={`player-hand ${index === currentPlayerIndex ? 'active' : ''}`}>
            <h3>Player {index + 1}</h3>
            <div className="cards">
              {hand.cards.map((card) => (
                <Card key={`${hand.playerId}-${card.suit}-${card.rank}`} card={card} onClick={() => handleCardClick(`${card.rank} of ${card.suit}`)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Table;