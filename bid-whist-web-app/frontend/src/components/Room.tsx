import React, { useState, useEffect, useRef } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import useWebSocket from '../hooks/useWebSocket';
import MultiHandController from './MultiHandController';
import Table from './Table';
import { isValidRoomCode } from '../utils/roomCodeValidator';
import { getRoom, removeUserFromRoom } from '../utils/roomManager';

interface StoredUser {
    id: string;
    name: string;
}

const Room: React.FC = () => {
    const { roomCode: rawRoomCode } = useParams<{ roomCode: string }>();
    const history = useHistory();
    const roomCode = (rawRoomCode || '').toUpperCase();
    const [players, setPlayers] = useState<any[]>([]);
    const [hands, setHands] = useState({});
    const [copied, setCopied] = useState(false);
    const [codeError, setCodeError] = useState('');
    const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [loading, setLoading] = useState(false);
    const { sendMessage, messages, isConnected, readyState } = useWebSocket(
        isValidRoomCode(roomCode) ? `ws://localhost:8080/room/${roomCode}` : ''
    );

    useEffect(() => {
        // Get stored user info
        const userKey = `room_${roomCode}_user`;
        const storedUser = sessionStorage.getItem(userKey);
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                console.log('Stored user found:', user);
                setCurrentUser(user);
                // Add current user to players list immediately
                setPlayers(prev => {
                    if (!prev.some(p => p.id === user.id)) {
                        console.log('Adding current user to local players:', user);
                        return [...prev, { id: user.id, name: user.name }];
                    }
                    return prev;
                });
            } catch (e) {
                console.error('Failed to parse stored user', e);
            }
        }

        // Validate room code
        if (!isValidRoomCode(roomCode)) {
            setCodeError('Invalid room code format. Room codes must be 4-8 alphanumeric characters.');
        }

    }, [roomCode]);

    // Cleanup when currentUser or roomCode change / on unmount
    useEffect(() => {
        return () => {
            if (currentUser) {
                removeUserFromRoom(roomCode, currentUser.id);
            }
        };
    }, [roomCode, currentUser]);

    useEffect(() => {
        // Handle incoming messages from the WebSocket
        if (messages && messages.length > 0) {
            const message = messages[messages.length - 1];
            try {
                const data = JSON.parse(message);
                switch (data.type) {
                    case 'PLAYER_JOINED':
                        // Add player if not already in list
                        setPlayers(prev => {
                            if (!prev.some(p => p.id === data.player.id)) {
                                return [...prev, data.player];
                            }
                            return prev;
                        });
                        break;
                    case 'ROOM_STATE':
                        // Use server's authoritative state directly
                        if (data.players && Array.isArray(data.players)) {
                            console.log('Received ROOM_STATE with players:', data.players);
                            setPlayers(data.players);
                        }
                        break;
                    case 'GAME_STARTED':
                        // Update players and mark game as started
                        if (data.players && Array.isArray(data.players)) {
                            setPlayers(data.players);
                        }
                        setGameStarted(true);
                        break;
                    case 'UPDATE_HANDS':
                        setHands(data.hands);
                        break;
                    default:
                        break;
                }
            } catch (e) {
                console.error('Failed to parse message', e);
            }
        }
    }, [messages]);

    const handlePlayCard = (handId: string, card: string) => {
        sendMessage(JSON.stringify({ type: 'PLAY_CARD', handId, card }));
    };

    // Prevent sending JOIN repeatedly
    const joinedRef = useRef(false);

    // Reset joined flag when connection drops
    useEffect(() => {
        if (!isConnected) joinedRef.current = false;
    }, [isConnected]);

    // Send join message to server when room is ready (only once per connection)
    useEffect(() => {
        if (currentUser && isValidRoomCode(roomCode) && isConnected && !joinedRef.current) {
            console.log('Sending PLAYER_JOINED for user:', currentUser);
            sendMessage(JSON.stringify({
                type: 'PLAYER_JOINED',
                player: {
                    id: currentUser.id,
                    name: currentUser.name
                }
            }));
            joinedRef.current = true;
        }
    }, [currentUser, roomCode, isConnected, sendMessage]);

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLeaveRoom = () => {
        if (currentUser) {
            removeUserFromRoom(roomCode, currentUser.id);
        }
        history.push('/');
    };

    const handleStartGame = async () => {
        setLoading(true);
        try {
            // Send START_GAME message to server with AI players if needed
            const aiPlayers = [];
            const playerNames = ['Oatmeal', 'Jacob', 'Reddy'];
            
            // Add AI players to reach 4 total
            for (let i = players.length; i < 4; i++) {
                aiPlayers.push({
                    id: `ai_${i}_${Date.now()}`,
                    name: playerNames[i - 1] || `Player ${i + 1}`,
                    isAI: true
                });
            }

            sendMessage(JSON.stringify({
                type: 'START_GAME',
                aiPlayers: aiPlayers
            }));

            setGameStarted(true);
        } catch (err) {
            console.error('Failed to start game:', err);
        } finally {
            setLoading(false);
        }
    };

    if (codeError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">⚠️ Invalid Room Code</h1>
                    <p className="text-gray-700 mb-6">{codeError}</p>
                    <a
                        href="/"
                        className="block text-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
                    >
                        ← Back to Home
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 p-6">
            {/* Decorative Animals */}
            <div className="fixed top-10 left-10 text-5xl opacity-70 animate-bounce">🦙</div>
            <div className="fixed bottom-10 right-10 text-5xl opacity-70 animate-bounce" style={{animationDelay: '0.5s'}}>🐱</div>

            <div className="max-w-6xl mx-auto">
                {/* Header with Room Code */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-purple-600">Bid Whist Room</h1>
                            <p className="text-gray-600 mt-1">
                                👤 Playing as: <span className="font-semibold text-purple-700">{currentUser?.name || 'Unknown'}</span>
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-2xl font-mono bg-purple-100 px-6 py-3 rounded-lg font-bold text-purple-700 tracking-widest">
                                {roomCode}
                            </span>
                            <button
                                onClick={copyRoomCode}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 flex-shrink-0"
                                title="Copy room code to clipboard"
                            >
                                {copied ? '✓ Copied!' : '📋 Copy'}
                            </button>
                        </div>
                    </div>
                    <p className="text-gray-600 mt-3">📢 Share this code with friends to join the room</p>
                    <button
                        onClick={handleLeaveRoom}
                        className="mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 text-sm"
                    >
                        🚪 Leave Room
                    </button>
                </div>

                {/* Players Section */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">
                            Players ({players.length}/4)
                        </h2>
                        {!gameStarted && (
                            <button
                                onClick={handleStartGame}
                                disabled={loading}
                                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg transition duration-200 text-sm"
                            >
                                {loading ? '🎮 Starting...' : '🎮 Start Game'}
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {players.map(player => (
                            <div key={player.id} className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg p-4 border-2 border-purple-200">
                                <h3 className="font-bold text-lg text-purple-700">{player.name}</h3>
                                <p className="text-sm text-gray-600">Ready</p>
                            </div>
                        ))}
                        {Array.from({ length: Math.max(0, 4 - players.length) }).map((_, i) => (
                            <div key={`empty-${i}`} className="bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300 flex items-center justify-center min-h-24">
                                <p className="text-gray-400 text-center">Will be filled with AI</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Game Table */}
                {players.length > 0 && (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <Table 
                            playerHands={players.map(p => ({ playerId: p.id, playerName: p.name, cards: hands[p.id] || [] }))}
                            currentPlayerIndex={0}
                            onCardPlay={handlePlayCard}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Room;