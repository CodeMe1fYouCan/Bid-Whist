import { useEffect, useRef, useState } from 'react';

const useWebSocket = (url: string) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [messages, setMessages] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
    const socketRef = useRef<WebSocket | null>(null);
    const isMountedRef = useRef(true);
    const messageQueueRef = useRef<string[]>([]);

    const reconnectTimeoutRef = useRef<any>(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectDelay = 30000; // 30 seconds max delay

    const connect = () => {
        if (!url) return;

        // Clear any pending reconnect
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        const ws = new WebSocket(url);
        socketRef.current = ws;

        ws.onopen = () => {
            if (isMountedRef.current) {
                console.log('WebSocket connection established');
                setIsConnected(true);
                setReadyState(WebSocket.OPEN);
                setError(null);
                reconnectAttemptsRef.current = 0; // Reset attempts on successful connection

                // Send any queued messages
                while (messageQueueRef.current.length > 0) {
                    const queuedMessage = messageQueueRef.current.shift();
                    if (queuedMessage) {
                        ws.send(queuedMessage);
                        console.log('Sent queued message:', queuedMessage);
                    }
                }
            }
        };

        ws.onmessage = (event) => {
            if (isMountedRef.current) {
                setMessages((prevMessages) => [...prevMessages, event.data]);
            }
        };

        ws.onerror = (event) => {
            if (isMountedRef.current) {
                console.error('WebSocket error:', event);
                // Don't set error state immediately, let onclose handle reconnection
            }
        };

        ws.onclose = () => {
            if (isMountedRef.current) {
                console.log('WebSocket connection closed');
                setSocket(null);
                setIsConnected(false);
                setReadyState(WebSocket.CLOSED);

                // Attempt to reconnect
                const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), maxReconnectDelay);
                console.log(`Attempting to reconnect in ${delay}ms...`);

                reconnectTimeoutRef.current = setTimeout(() => {
                    if (isMountedRef.current) {
                        reconnectAttemptsRef.current++;
                        connect();
                    }
                }, delay);
            }
        };

        if (isMountedRef.current) {
            setSocket(ws);
        }
    };

    useEffect(() => {
        connect();

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [url]);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const sendMessage = (message: string) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(message);
            console.log('Sent message:', message);
        } else {
            // Queue the message if not connected yet
            messageQueueRef.current.push(message);
            console.log('Message queued (not connected yet):', message);
        }
    };

    return { socket, messages, error, sendMessage, isConnected, readyState };
};

export default useWebSocket;