import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { sanitizeRoomCode, validateRoomCode } from '../utils/roomCodeValidator';
import { createRoom, joinRoom, isRoomCodeTaken } from '../utils/roomManager';

const Home: React.FC = () => {
    const history = useHistory();
    const [username, setUsername] = useState('');
    const [createCode, setCreateCode] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const sanitizeUsername = (input: string): string => {
        // Allow alphanumeric, spaces, and hyphens; limit to 20 chars
        return input
            .replace(/[^A-Za-z0-9\s\-]/g, '')
            .trim()
            .slice(0, 20);
    };

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const sanitized = sanitizeUsername(e.target.value);
        setUsername(sanitized);
        setError('');
    };

    const handleCreateCode = (e: React.ChangeEvent<HTMLInputElement>) => {
        const sanitized = sanitizeRoomCode(e.target.value);
        setCreateCode(sanitized);
        setError('');
    };

    const handleJoinCode = (e: React.ChangeEvent<HTMLInputElement>) => {
        const sanitized = sanitizeRoomCode(e.target.value);
        setJoinCode(sanitized);
        setError('');
    };

    const handleCreateRoom = async () => {
        setError('');
        setSuccessMessage('');

        // Validate username
        if (!username.trim()) {
            setError('Please enter a username');
            return;
        }

        // Validate room code
        const codeValidation = validateRoomCode(createCode);
        if (!codeValidation.valid) {
            setError(codeValidation.error || 'Invalid room code');
            return;
        }

        const code = codeValidation.code!;

        // Check if code is already taken on the server
        setLoading(true);
        try {
            const backendUrl = import.meta.env.VITE_WS_URL?.replace('wss://', 'https://').replace('ws://', 'http://') || 'http://localhost:8080';
            const response = await fetch(`${backendUrl}/api/room/${code}/exists`);
            const data = await response.json();

            if (data.exists) {
                setError(`Room code "${code}" is already in use. Please choose another.`);
                setLoading(false);
                return;
            }

            const user = {
                id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: username.trim(),
            };

            // Create room locally first (for backup)
            const room = createRoom(code, user);
            if (!room) {
                setError('Failed to create room. Please try again.');
                setLoading(false);
                return;
            }

            setSuccessMessage(`✓ Room created! Joining as ${username}...`);

            // Store user info for the room
            sessionStorage.setItem(`room_${code}_user`, JSON.stringify(user));
            history.push(`/room/${code}`);
        } catch (err) {
            console.error('Failed to create room:', err);
            setError('Failed to create room. Please try again.');
            setLoading(false);
        }
    };

    const handleJoinRoomClick = async () => {
        setError('');
        setSuccessMessage('');

        // Validate username
        if (!username.trim()) {
            setError('Please enter a username');
            return;
        }

        // Validate room code
        const codeValidation = validateRoomCode(joinCode);
        if (!codeValidation.valid) {
            setError(codeValidation.error || 'Invalid room code');
            return;
        }

        const code = codeValidation.code!;

        setLoading(true);
        try {
            // Check if room exists on the server
            const backendUrl = (import.meta.env.VITE_WS_URL || 'ws://localhost:8080').replace('wss://', 'https://').replace('ws://', 'http://');
            const response = await fetch(`${backendUrl}/api/room/${code}/exists`);
            const data = await response.json();

            if (!data.exists) {
                setError(`Room "${code}" does not exist or has been closed.`);
                setLoading(false);
                return;
            }

            const user = {
                id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: username.trim(),
            };

            setSuccessMessage(`✓ Joining as ${username}...`);

            // Store user info for the room
            sessionStorage.setItem(`room_${code}_user`, JSON.stringify(user));
            history.push(`/room/${code}`);
        } catch (err) {
            console.error('Failed to join room:', err);
            setError('Failed to join room. Please try again.');
            setLoading(false);
        }
    };

    const isFormValid = username.trim().length > 0;
    const canCreate = isFormValid && createCode.length >= 4 && !loading;
    const canJoin = isFormValid && joinCode.length >= 4 && !loading;

    return (
        <div className="smoky-bar-bg min-h-screen flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden">
            {/* Animated Smoke Wisps */}
            <div className="smoke-wisp smoke-wisp-1"></div>
            <div className="smoke-wisp smoke-wisp-2"></div>
            <div className="smoke-wisp smoke-wisp-3"></div>
            <div className="smoke-wisp smoke-wisp-4"></div>

            {/* Floating Card Suit Decorations - Hidden on small mobile to save space */}
            <div className="hidden md:block absolute top-10 left-10 text-7xl md:text-9xl float-animation opacity-60" style={{ animationDelay: '0s' }}>🎴</div>
            <div className="hidden md:block absolute top-20 right-20 text-7xl md:text-9xl float-animation opacity-60" style={{ animationDelay: '2s' }}>♠️</div>
            <div className="hidden md:block absolute bottom-20 left-20 text-7xl md:text-9xl float-animation opacity-60" style={{ animationDelay: '4s' }}>♥️</div>
            <div className="hidden md:block absolute bottom-10 right-10 text-7xl md:text-9xl float-animation opacity-60" style={{ animationDelay: '1s' }}>♦️</div>

            <div className="glass-card rounded-2xl md:rounded-3xl p-6 md:p-10 w-full max-w-lg md:max-w-3xl lg:max-w-5xl z-10 shadow-2xl mx-auto my-auto">
                <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-center mb-3 leading-tight" style={{ color: '#fbbf24', textShadow: '0 0 20px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.7), 4px 4px 8px rgba(0,0,0,1)' }}>
                    <span className="inline-block align-middle w-[2em] h-[2em]">
                        <img src="/cards/back.svg" alt="Bid Whist Logo" className="w-full h-full" />
                    </span> Bid Whist <span className="inline-block align-middle w-[2em] h-[2em]">
                        <img src="/cards/no_trump.svg" alt="No Trump Logo" className="w-full h-full" />
                    </span>
                </h1>
                <div className="text-center mb-6 md:mb-8">
                    <p className="text-xl md:text-2xl font-bold mb-8" style={{ color: '#fbbf24', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                        🐱 Play with your friends and family! 🦙
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 md:p-4 bg-red-500/20 backdrop-blur-sm border-2 border-red-400 rounded-xl md:rounded-2xl">
                        <p className="text-lg md:text-xl font-semibold" style={{ color: '#ef4444' }}>⚠️ {error}</p>
                    </div>
                )}

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-4 p-3 md:p-4 bg-green-500/20 backdrop-blur-sm border-2 border-green-400 text-white rounded-xl md:rounded-2xl">
                        <p className="text-lg md:text-xl font-semibold">{successMessage}</p>
                    </div>
                )}

                <div className="space-y-6 md:space-y-8 flex flex-col items-center w-full">
                    {/* Username Input */}
                    <div className="w-full max-w-md md:max-w-2xl">
                        <input
                            type="text"
                            value={username}
                            onChange={handleUsernameChange}
                            placeholder="👤 Enter Your Name"
                            maxLength={20}
                            className="w-full px-4 md:px-6 py-3 md:py-4 text-xl md:text-3xl border-3 rounded-xl md:rounded-2xl focus:outline-none focus:ring-4 font-semibold text-center h-14 md:h-[65px]"
                            style={{
                                backgroundColor: 'rgba(120, 53, 15, 0.3)',
                                borderColor: 'rgba(217, 119, 6, 0.5)',
                                color: '#FFFFFF',
                                textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                            }}
                        />
                        <div className="mt-2 text-center">
                            {/* Helper text removed as per user request */}
                        </div>
                    </div>

                    {/* Create Room Section */}
                    <div className="w-full max-w-md md:max-w-2xl bg-white/5 p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/10">
                        <div className="mb-2 text-center">
                            <span className="inline-block px-3 py-1 text-xs md:text-sm font-medium" style={{ color: '#fbbf24', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                                Start a new game as host
                            </span>
                        </div>
                        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                            <input
                                type="text"
                                value={createCode}
                                onChange={handleCreateCode}
                                placeholder="🔑 Create Room Code (4-8 chars)"
                                maxLength={8}
                                className="flex-1 px-4 md:px-6 py-3 md:py-4 text-lg md:text-2xl border-3 rounded-xl md:rounded-2xl focus:outline-none focus:ring-4 font-semibold text-center uppercase h-14 md:h-[65px]"
                                style={{
                                    backgroundColor: 'rgba(120, 53, 15, 0.3)',
                                    borderColor: 'rgba(217, 119, 6, 0.5)',
                                    color: '#FFFFFF',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                }}
                            />
                            <button
                                onClick={handleCreateRoom}
                                disabled={!canCreate}
                                className={`px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-lg md:text-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg h-14 md:h-[65px] w-full md:w-auto whitespace-nowrap ${canCreate
                                    ? 'opacity-100 cursor-pointer hover:shadow-amber-500/50'
                                    : 'opacity-50 cursor-not-allowed grayscale'
                                    }`}
                                style={{
                                    background: canCreate ? 'linear-gradient(to right, #f59e0b, #d97706)' : 'linear-gradient(to right, #4b5563, #374151)',
                                    color: '#FFFFFF',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                    boxShadow: canCreate ? '0 0 15px rgba(245, 158, 11, 0.4)' : 'none'
                                }}
                            >
                                {loading && createCode === createCode ? '🔄 Creating...' : '✨ Create Room'}
                            </button>
                        </div>
                    </div>

                    {/* Join Room Section */}
                    <div className="w-full max-w-md md:max-w-2xl bg-white/5 p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/10">
                        <div className="mb-2 text-center">
                            <span className="inline-block px-3 py-1 text-xs md:text-sm font-medium" style={{ color: '#fbbf24', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                                Ask your friend for their room code
                            </span>
                        </div>
                        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                            <input
                                type="text"
                                value={joinCode}
                                onChange={handleJoinCode}
                                placeholder="🔑 Enter Room Code"
                                maxLength={8}
                                className="flex-1 px-4 md:px-6 py-3 md:py-4 text-lg md:text-2xl border-3 rounded-xl md:rounded-2xl focus:outline-none focus:ring-4 font-semibold text-center uppercase h-14 md:h-[65px]"
                                style={{
                                    backgroundColor: 'rgba(120, 53, 15, 0.3)',
                                    borderColor: 'rgba(217, 119, 6, 0.5)',
                                    color: '#FFFFFF',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                }}
                            />
                            <button
                                onClick={handleJoinRoomClick}
                                disabled={loading || !canJoin}
                                className={`px-6 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold text-lg md:text-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg h-14 md:h-[65px] w-full md:w-auto whitespace-nowrap ${(!loading && canJoin)
                                    ? 'opacity-100 cursor-pointer hover:shadow-amber-500/50'
                                    : 'opacity-50 cursor-not-allowed grayscale'
                                    }`}
                                style={{
                                    background: (!loading && canJoin) ? 'linear-gradient(to right, #f59e0b, #d97706)' : 'linear-gradient(to right, #4b5563, #374151)',
                                    color: '#FFFFFF',
                                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                                    boxShadow: (!loading && canJoin) ? '0 0 15px rgba(245, 158, 11, 0.4)' : 'none'
                                }}
                            >
                                {loading ? '🔄 Joining...' : '📍 Join Room'}
                            </button>
                        </div>
                    </div>
                </div>

                <p className="text-center text-2xl mt-6 font-bold" style={{ color: '#fbbf24', textShadow: '0 0 15px rgba(0,0,0,0.9), 2px 2px 6px rgba(0,0,0,1)' }}>
                    🎴 Create a room or ask a friend for their code! ♠️
                </p>
            </div>
        </div>
    );
};

export default Home;