import React, { useEffect, useState } from 'react';
import useWebSocket from '../hooks/useWebSocket';
import MultiHandController from '../components/MultiHandController';
import Table from '../components/Table';
import HandView from '../components/HandView';

const Game: React.FC = () => {
    const [roomCode, setRoomCode] = useState<string>('');
    const [playerHands, setPlayerHands] = useState<any[]>([]);
    const [gameState, setGameState] = useState<any>(null);
    const { sendMessage, messages } = useWebSocket(`ws://localhost:8080/room/${roomCode}`);

    useEffect(() => {
        if (messages && messages.length > 0) {
            // Parse the latest message
            try {
                const latest = messages[messages.length - 1];
                const updatedGameState = JSON.parse(latest);
                setGameState(updatedGameState);
                // If server provides playerHands, use it; otherwise derive from gameState
                if (updatedGameState.playerHands) {
                    setPlayerHands(updatedGameState.playerHands);
                } else if (updatedGameState.room && updatedGameState.room.players) {
                    const derived = updatedGameState.room.players.map((p: any) => ({ playerId: p.id, playerName: p.name, cards: p.hands && p.hands[updatedGameState.currentHand] ? p.hands[updatedGameState.currentHand] : [] }));
                    setPlayerHands(derived);
                }
            } catch (err) {
                console.error('Failed to parse WS message', err);
            }
        }
    }, [messages]);

    const handleStartGame = () => {
        sendMessage(JSON.stringify({ action: 'startGame', roomCode }));
    };

    return (
        <div className="game-container">
            <h1>Bid Whist Game</h1>
            <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="Enter Room Code"
            />
            <button onClick={handleStartGame}>Start Game</button>
            <Table gameState={gameState} />
            <MultiHandController playerHands={playerHands} />
            {playerHands.map((hand, index) => (
                <HandView key={index} hand={hand} />
            ))}
        </div>
    );
};

export default Game;