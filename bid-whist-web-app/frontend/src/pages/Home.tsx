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
            setTimeout(() => {
                // Store user info for the room
                sessionStorage.setItem(`room_${code}_user`, JSON.stringify(user));
                history.push(`/room/${code}`);
            }, 500);
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
            const backendUrl = import.meta.env.VITE_WS_URL?.replace('wss://', 'https://').replace('ws://', 'http://') || 'http://localhost:8080';
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
            setTimeout(() => {
                // Store user info for the room
                sessionStorage.setItem(`room_${code}_user`, JSON.stringify(user));
                history.push(`/room/${code}`);
            }, 500);
        } catch (err) {
            console.error('Failed to join room:', err);
            setError('Failed to join room. Please try again.');
            setLoading(false);
        }
    };

    const isFormValid = username.trim().length > 0;
    const canCreate = isFormValid && createCode.length >= 4;
    const canJoin = isFormValid && joinCode.length >= 4;

    return (
        <div className="smoky-bar-bg min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Animated Smoke Wisps */}
            <div className="smoke-wisp smoke-wisp-1"></div>
            <div className="smoke-wisp smoke-wisp-2"></div>
            <div className="smoke-wisp smoke-wisp-3"></div>
            <div className="smoke-wisp smoke-wisp-4"></div>

            {/* Floating Card Suit Decorations */}
            <div className="absolute top-10 left-10 text-9xl float-animation opacity-60" style={{ animationDelay: '0s' }}>🎴</div>
            <div className="absolute top-20 right-20 text-9xl float-animation opacity-60" style={{ animationDelay: '2s' }}>♠️</div>
            <div className="absolute bottom-20 left-20 text-9xl float-animation opacity-60" style={{ animationDelay: '4s' }}>♥️</div>
            <div className="absolute bottom-10 right-10 text-9xl float-animation opacity-60" style={{ animationDelay: '1s' }}>♦️</div>

            <div className="glass-card rounded-3xl p-10 max-w-5xl w-full z-10 shadow-2xl">
                <h1 className="text-9xl font-bold text-center text-white mb-3" style={{ fontSize: '100px', lineHeight: '1.1', textShadow: '0 0 20px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.7), 4px 4px 8px rgba(0,0,0,1)' }}>
                    🎴 Bid Whist
                </h1>
                <p className="text-center text-2xl mb-6 font-bold px-6 py-3 rounded-xl inline-block" style={{ color: '#FFFFFF', textShadow: '0 0 15px rgba(0,0,0,0.9), 2px 2px 6px rgba(0,0,0,1)', backgroundColor: 'rgba(0,0,0,0.8)' }}>
                    Play with your friends and family!
                </p>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-500/20 backdrop-blur-sm border-2 border-red-400 text-white rounded-2xl">
                        <p className="text-xl font-semibold">⚠️ {error}</p>
                    </div>
                )}

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-4 p-4 bg-green-500/20 backdrop-blur-sm border-2 border-green-400 text-white rounded-2xl">
                        <p className="text-xl font-semibold">{successMessage}</p>
                    </div>
                )}

                <div className="space-y-6 flex flex-col items-center">
                    {/* Username Input */}
                    <div className="w-full max-w-3xl">
                        <input
                            type="text"
                            value={username}
                            onChange={handleUsernameChange}
                            placeholder="👤 Enter Your Name"
                            maxLength={20}
                            className="w-full px-6 py-4 text-3xl border-3 border-white/30 rounded-2xl focus:outline-none focus:border-white focus:ring-4 focus:ring-white/40 bg-white/15 backdrop-blur-sm text-white placeholder-white/60 font-semibold text-center"
                            style={{ height: '65px', fontSize: '28px' }}
                        />
                    </div>

                    <div className="border-t-4 border-white/40 pt-6 w-full max-w-3xl">
                        {/* Create Room Section */}
                        <div>
                            <input
                                type="text"
                                value={createCode}
                                onChange={handleCreateCode}
                                placeholder="🎮 CREATE ROOM CODE"
                                maxLength={8}
                                className="w-full px-6 py-4 text-3xl border-3 border-white/30 rounded-2xl focus:outline-none focus:border-white focus:ring-4 focus:ring-white/40 bg-white/15 backdrop-blur-sm text-white placeholder-white/60 uppercase font-mono text-center tracking-widest font-bold"
                                style={{ height: '65px', fontSize: '28px', letterSpacing: '0.3em' }}
                            />
                            <button
                                onClick={handleCreateRoom}
                                disabled={loading || !canCreate}
                                className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-3xl py-5 px-8 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-500 disabled:to-gray-600 shadow-2xl hover:shadow-green-500/50 hover:scale-105 glow-on-hover"
                            >
                                {loading ? '🔄 Creating...' : '🚀 Create & Join'}
                            </button>
                        </div>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t-4 border-white/40"></div>
                            </div>
                            <div className="relative flex justify-center text-2xl">
                                <span className="px-4 glass-card text-white font-bold py-1 rounded-xl">or</span>
                            </div>
                        </div>

                        {/* Join Room Section */}
                        <div>
                            <input
                                type="text"
                                value={joinCode}
                                onChange={handleJoinCode}
                                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoomClick()}
                                placeholder="🚪 ENTER ROOM CODE"
                                maxLength={8}
                                className="w-full px-6 py-4 text-3xl border-3 border-white/30 rounded-2xl focus:outline-none focus:border-white focus:ring-4 focus:ring-white/40 bg-white/15 backdrop-blur-sm text-white placeholder-white/60 uppercase font-mono text-center tracking-widest font-bold"
                                style={{ height: '65px', fontSize: '28px', letterSpacing: '0.3em' }}
                            />
                            <p className="text-lg font-bold text-center px-4 py-2 rounded-lg inline-block" style={{ color: '#FFFFFF', textShadow: '0 0 10px rgba(0,0,0,0.9), 2px 2px 4px rgba(0,0,0,1)', backgroundColor: 'rgba(0,0,0,0.8)' }}>
                                Ask your friend for their room code
                            </p>
                            <button
                                onClick={handleJoinRoomClick}
                                disabled={loading || !canJoin}
                                className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-3xl py-5 px-8 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-500 disabled:to-gray-600 shadow-2xl hover:shadow-green-500/50 hover:scale-105 glow-on-hover"
                            >
                                {loading ? '🔄 Joining...' : '📍 Join Room'}
                            </button>
                        </div>
                    </div>
                </div>

                <p className="text-center text-2xl mt-6 font-bold px-6 py-3 rounded-xl inline-block" style={{ color: '#FFFFFF', textShadow: '0 0 15px rgba(0,0,0,0.9), 2px 2px 6px rgba(0,0,0,1)', backgroundColor: 'rgba(0,0,0,0.8)' }}>
                    🎴 Create a room or ask a friend for their code! ♠️
                </p>
            </div>
        </div>
    );
};

export default Home;