import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080'; // Adjust the base URL as needed

export const createRoom = async (roomCode: string) => {
    const response = await axios.post(`${API_BASE_URL}/rooms`, { roomCode });
    return response.data;
};

export const joinRoom = async (roomCode: string, playerName: string) => {
    const response = await axios.post(`${API_BASE_URL}/rooms/${roomCode}/join`, { playerName });
    return response.data;
};

export const startGame = async (roomCode: string) => {
    const response = await axios.post(`${API_BASE_URL}/rooms/${roomCode}/start`);
    return response.data;
};

export const playCard = async (roomCode: string, handId: number, card: string) => {
    const response = await axios.post(`${API_BASE_URL}/rooms/${roomCode}/play`, { handId, card });
    return response.data;
};

export const getGameState = async (roomCode: string) => {
    const response = await axios.get(`${API_BASE_URL}/rooms/${roomCode}/state`);
    return response.data;
};