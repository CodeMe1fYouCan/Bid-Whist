import React, { useState } from 'react';

const Lobby: React.FC = () => {
    const [roomCode, setRoomCode] = useState('');
    const [playerCount, setPlayerCount] = useState(1);

    const handleJoinRoom = () => {
        // Logic to join the room using the roomCode
        console.log(`Joining room: ${roomCode} with ${playerCount} hands`);
    };

    return (
        <div className="lobby">
            <h1>Bid Whist Lobby</h1>
            <input
                type="text"
                placeholder="Enter Room Code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
            />
            <div>
                <label htmlFor="hands">Select Number of Hands:</label>
                <select
                    id="hands"
                    value={playerCount}
                    onChange={(e) => setPlayerCount(Number(e.target.value))}
                >
                    <option value={1}>1 Hand</option>
                    <option value={2}>2 Hands</option>
                    <option value={3}>3 Hands</option>
                </select>
            </div>
            <button onClick={handleJoinRoom}>Join Room</button>
        </div>
    );
};

export default Lobby;