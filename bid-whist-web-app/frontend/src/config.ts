// WebSocket configuration
// In development: ws://localhost:8080
// In production: wss://your-backend-url.ondigitalocean.app
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

export const getWebSocketUrl = (roomCode: string): string => {
  return `${WS_BASE_URL}/room/${roomCode}`;
};
