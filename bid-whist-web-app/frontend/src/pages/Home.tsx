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
            const response = await fetch(`http://localhost:8080/api/room/${code}/exists`);
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
            const response = await fetch(`http://localhost:8080/api/room/${code}/exists`);
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
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500 flex flex-col items-center justify-center p-4">
            {/* Decorative Llamas and Raccoons */}
            <div className="absolute top-10 left-10 text-6xl animate-bounce">🦙</div>
            <div className="absolute top-20 right-20 text-6xl animate-bounce" style={{animationDelay: '0.5s'}}>🐱</div>
            <div className="absolute bottom-20 left-20 text-6xl animate-bounce" style={{animationDelay: '1s'}}>🦙</div>
            <div className="absolute bottom-10 right-10 text-6xl animate-bounce" style={{animationDelay: '1.5s'}}>🐱</div>

            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full z-10">
                <h1 className="text-4xl font-bold text-center text-purple-600 mb-2">Bid Whist</h1>
                <p className="text-center text-gray-600 mb-6">Play with your friends and family!</p>
                
                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
                        <p className="text-sm font-medium">⚠️ {error}</p>
                    </div>
                )}

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-4 p-3 bg-green-100 border-l-4 border-green-500 text-green-700 rounded">
                        <p className="text-sm font-medium">{successMessage}</p>
                    </div>
                )}

                <div className="space-y-4">
                    {/* Username Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            👤 Your Name
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={handleUsernameChange}
                            placeholder="Enter your name"
                            maxLength={20}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {username.length}/20 characters
                        </p>
                    </div>

                    <div className="border-t-2 border-gray-200 pt-4">
                        {/* Create Room Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                🎮 Create a New Room
                            </label>
                            <input
                                type="text"
                                value={createCode}
                                onChange={handleCreateCode}
                                placeholder="Enter room code (4-8 chars)"
                                maxLength={8}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 uppercase font-mono text-center tracking-wider"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {createCode.length}/8 characters
                            </p>
                            <button
                                onClick={handleCreateRoom}
                                disabled={loading || !canCreate}
                                className="w-full mt-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? '🔄 Creating...' : '🚀 Create & Join'}
                            </button>
                        </div>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t-2 border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-600">or</span>
                            </div>
                        </div>

                        {/* Join Room Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                🚪 Join an Existing Room
                            </label>
                            <input
                                type="text"
                                value={joinCode}
                                onChange={handleJoinCode}
                                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoomClick()}
                                placeholder="Enter room code"
                                maxLength={8}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 uppercase font-mono text-center tracking-wider"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Ask your friend for their room code
                            </p>
                            <button
                                onClick={handleJoinRoomClick}
                                disabled={loading || !canJoin}
                                className="w-full mt-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? '🔄 Joining...' : '📍 Join Room'}
                            </button>
                        </div>
                    </div>
                </div>

                <p className="text-center text-sm text-gray-500 mt-6">
                    🦙 Create a room or ask a friend for their code! 🐱
                </p>
            </div>
        </div>
    );
};

export default Home;