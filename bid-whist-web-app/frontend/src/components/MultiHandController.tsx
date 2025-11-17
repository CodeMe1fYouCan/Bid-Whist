import React, { useState } from 'react';

interface Hand {
  id: number;
  cards: string[];
}

const MultiHandController: React.FC = () => {
  const [hands, setHands] = useState<Hand[]>([]);
  const [playerCount, setPlayerCount] = useState<number>(1);

  const addHand = () => {
    const newHand: Hand = {
      id: hands.length + 1,
      cards: [],
    };
    setHands([...hands, newHand]);
  };

  const removeHand = (id: number) => {
    setHands(hands.filter(hand => hand.id !== id));
  };

  const handlePlayerCountChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setPlayerCount(Number(event.target.value));
  };

  return (
    <div>
      <h2>Multi-Hand Controller</h2>
      <label>
        Number of Hands for Player 1:
        <select value={playerCount} onChange={handlePlayerCountChange}>
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
        </select>
      </label>
      <button onClick={addHand}>Add Hand</button>
      <div>
        {hands.map(hand => (
          <div key={hand.id}>
            <h3>Hand {hand.id}</h3>
            <button onClick={() => removeHand(hand.id)}>Remove Hand</button>
            {/* Here you can add a component to display and manage cards in the hand */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiHandController;