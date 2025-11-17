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

interface Player {
    id: string;
    name: string;
    isReady: boolean;
    handCount: number;
    team: 'Us' | 'Them';
}

const Room: React.FC = () => {
    const { roomCode: rawRoomCode } = useParams<{ roomCode: string }>();
    const history = useHistory();
    const roomCode = (rawRoomCode || '').toUpperCase();
    const [players, setPlayers] = useState<Player[]>([]);
    const [hands, setHands] = useState({});
    const [copied, setCopied] = useState(false);
    const [codeError, setCodeError] = useState('');
    const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [handCount, setHandCount] = useState(1);
    const [isReady, setIsReady] = useState(false);
    const [team, setTeam] = useState<'Us' | 'Them'>('Us');
    const justToggledReadyRef = useRef(false);
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
                        // Use server's authoritative state directly for the players list
                        if (data.players && Array.isArray(data.players)) {
                            console.log('Received ROOM_STATE with players:', data.players);
                            // Create a new array with new objects to ensure React detects the change
                            setPlayers(data.players.map((p: Player) => ({ ...p })));
                            
                            // Update local state to match server for current user
                            if (currentUser) {
                                const myPlayer = data.players.find((p: Player) => p.id === currentUser.id);
                                if (myPlayer) {
                                    // Always sync handCount and team
                                    setHandCount(myPlayer.handCount);
                                    setTeam(myPlayer.team);
                                    // Only skip syncing isReady if we just toggled it to prevent flash
                                    if (!justToggledReadyRef.current) {
                                        setIsReady(myPlayer.isReady);
                                    }
                                }
                            }
                        }
                        break;
                    case 'DEALER_SELECTION':
                        // Game is starting - navigate to game page
                        console.log('Received DEALER_SELECTION, navigating to game page...');
                        setGameStarted(true);
                        // Navigate immediately so we don't miss any game messages
                        history.push(`/game/${roomCode}`);
                        break;
                    case 'GAME_STARTED':
                        // Legacy handler
                        console.log('Game starting, navigating to game page...');
                        setGameStarted(true);
                        history.push(`/game/${roomCode}`);
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
                    name: currentUser.name,
                    isReady: false,
                    handCount: 1,
                    team: 'Us'
                }
            }));
            joinedRef.current = true;
        }
    }, [currentUser, roomCode, isConnected, sendMessage]);

    const handleHandCountChange = (count: number) => {
        setHandCount(count);
        if (currentUser && isConnected) {
            sendMessage(JSON.stringify({
                type: 'UPDATE_HAND_COUNT',
                playerId: currentUser.id,
                handCount: count
            }));
        }
    };

    const handleTeamChange = (newTeam: 'Us' | 'Them') => {
        setTeam(newTeam);
        if (currentUser && isConnected) {
            sendMessage(JSON.stringify({
                type: 'UPDATE_TEAM',
                playerId: currentUser.id,
                team: newTeam
            }));
        }
    };

    const handleToggleReady = () => {
        const newReadyState = !isReady;
        setIsReady(newReadyState);
        justToggledReadyRef.current = true;
        if (currentUser && isConnected) {
            sendMessage(JSON.stringify({
                type: 'TOGGLE_READY',
                playerId: currentUser.id,
                isReady: newReadyState
            }));
        }
        // Reset the flag after a short delay
        setTimeout(() => {
            justToggledReadyRef.current = false;
        }, 500);
    };

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

    // Calculate total hands controlled by all players
    const totalHands = players.reduce((sum, p) => sum + p.handCount, 0);
    const usHands = players.filter(p => p.team === 'Us').reduce((sum, p) => sum + p.handCount, 0);
    const themHands = players.filter(p => p.team === 'Them').reduce((sum, p) => sum + p.handCount, 0);
    const allPlayersReady = players.length > 0 && players.every(p => p.isReady);
    const teamsBalanced = usHands === 2 && themHands === 2;
    const canStartGame = allPlayersReady && totalHands === 4 && teamsBalanced;

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

                {/* Hand Selection for Current Player */}
                {!gameStarted && currentUser && (
                    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Your Settings</h2>
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        🎴 Number of Hands to Control
                                    </label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3].map(count => {
                                            const isSelected = handCount === count;
                                            return (
                                                <button
                                                    key={count}
                                                    onClick={() => handleHandCountChange(count)}
                                                    disabled={isReady}
                                                    className={`px-6 py-2 rounded-lg font-bold transition duration-200 ${
                                                        isSelected
                                                            ? 'bg-purple-600 text-white shadow-md'
                                                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                                    } ${isReady ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                >
                                                    {count}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {isReady ? 'Uncheck ready to change settings' : 'Select how many hands you want to play'}
                                    </p>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        👥 Team
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleTeamChange('Us')}
                                            disabled={isReady}
                                            className={`flex-1 px-6 py-2 rounded-lg font-bold transition duration-200 ${
                                                team === 'Us'
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                            } ${isReady ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        >
                                            Us
                                        </button>
                                        <button
                                            onClick={() => handleTeamChange('Them')}
                                            disabled={isReady}
                                            className={`flex-1 px-6 py-2 rounded-lg font-bold transition duration-200 ${
                                                team === 'Them'
                                                    ? 'bg-red-600 text-white shadow-md'
                                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                            } ${isReady ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        >
                                            Them
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Choose your team
                                    </p>
                                </div>
                            </div>
                            <div className="border-t pt-4">
                                <button
                                    onClick={handleToggleReady}
                                    className={`w-full py-4 px-6 rounded-lg font-bold text-xl transition-all duration-200 ${
                                        isReady
                                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg'
                                            : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                                    }`}
                                >
                                    {isReady ? '❌ UNREADY' : '✓ READY UP'}
                                </button>
                                <p className="text-sm text-center text-gray-600 mt-3">
                                    {isReady 
                                        ? 'Waiting for other players to ready up...' 
                                        : 'Click when you\'re ready to begin the game'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Players Section */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">
                            Players in Room
                        </h2>
                        <div className="text-right">
                            <p className="text-sm text-gray-600">Total Hands: {totalHands}/4</p>
                            <p className="text-xs text-gray-500">
                                Team Us: {usHands}/2 hands | Team Them: {themHands}/2 hands
                            </p>
                            {!canStartGame && totalHands < 4 && (
                                <p className="text-xs text-orange-600 mt-1">Need {4 - totalHands} more hand(s)</p>
                            )}
                            {!canStartGame && totalHands === 4 && !teamsBalanced && (
                                <p className="text-xs text-orange-600 mt-1">
                                    Each team must have exactly 2 hands
                                </p>
                            )}
                            {!canStartGame && totalHands === 4 && teamsBalanced && !allPlayersReady && (
                                <p className="text-xs text-orange-600 mt-1">Waiting for all players to be ready</p>
                            )}
                            {canStartGame && (
                                <p className="text-xs text-green-600 mt-1 font-bold">✓ Ready to start!</p>
                            )}
                        </div>
                    </div>
                    <div className="space-y-6">
                        {/* Team Us */}
                        <div>
                            <h3 className="text-lg font-bold text-blue-700 mb-3 flex items-center gap-2">
                                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">Team Us</span>
                                <span className="text-sm text-gray-600">
                                    ({players.filter(p => p.team === 'Us').reduce((sum, p) => sum + p.handCount, 0)} hands)
                                </span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {players.filter(p => p.team === 'Us').map(player => (
                                    <div 
                                        key={player.id} 
                                        className={`rounded-lg p-4 border-2 ${
                                            player.isReady 
                                                ? 'bg-gradient-to-br from-blue-100 to-green-100 border-blue-400' 
                                                : 'bg-blue-50 border-blue-200'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-800">
                                                    {player.name}
                                                    {player.id === currentUser?.id && ' (You)'}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {player.handCount} hand{player.handCount !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={player.isReady}
                                                    disabled
                                                    className="w-5 h-5"
                                                />
                                                <span className={`text-sm font-bold ${
                                                    player.isReady ? 'text-green-600' : 'text-gray-500'
                                                }`}>
                                                    {player.isReady ? 'Ready' : 'Not Ready'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {players.filter(p => p.team === 'Us').length === 0 && (
                                    <div className="col-span-full bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg p-4 text-center text-gray-500">
                                        No players on Team Us yet
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Team Them */}
                        <div>
                            <h3 className="text-lg font-bold text-red-700 mb-3 flex items-center gap-2">
                                <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm">Team Them</span>
                                <span className="text-sm text-gray-600">
                                    ({players.filter(p => p.team === 'Them').reduce((sum, p) => sum + p.handCount, 0)} hands)
                                </span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {players.filter(p => p.team === 'Them').map(player => (
                                    <div 
                                        key={player.id} 
                                        className={`rounded-lg p-4 border-2 ${
                                            player.isReady 
                                                ? 'bg-gradient-to-br from-red-100 to-green-100 border-red-400' 
                                                : 'bg-red-50 border-red-200'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-800">
                                                    {player.name}
                                                    {player.id === currentUser?.id && ' (You)'}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {player.handCount} hand{player.handCount !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={player.isReady}
                                                    disabled
                                                    className="w-5 h-5"
                                                />
                                                <span className={`text-sm font-bold ${
                                                    player.isReady ? 'text-green-600' : 'text-gray-500'
                                                }`}>
                                                    {player.isReady ? 'Ready' : 'Not Ready'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {players.filter(p => p.team === 'Them').length === 0 && (
                                    <div className="col-span-full bg-red-50 border-2 border-dashed border-red-200 rounded-lg p-4 text-center text-gray-500">
                                        No players on Team Them yet
                                    </div>
                                )}
                            </div>
                        </div>
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