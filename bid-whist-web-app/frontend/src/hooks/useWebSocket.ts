import { useEffect, useRef, useState } from 'react';

const useWebSocket = (url: string) => {
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [messages, setMessages] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [readyState, setReadyState] = useState(WebSocket.CONNECTING);
    const socketRef = useRef<WebSocket | null>(null);
    const isMountedRef = useRef(true);
    const messageQueueRef = useRef<string[]>([]);

    useEffect(() => {
        if (!url) return;

        const ws = new WebSocket(url);
        socketRef.current = ws;

        ws.onopen = () => {
            if (isMountedRef.current) {
                console.log('WebSocket connection established');
                setIsConnected(true);
                setReadyState(WebSocket.OPEN);
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
                setError('WebSocket error');
                console.error('WebSocket error:', event);
            }
        };

        ws.onclose = () => {
            if (isMountedRef.current) {
                console.log('WebSocket connection closed');
                setSocket(null);
                setIsConnected(false);
                setReadyState(WebSocket.CLOSED);
            }
        };

        if (isMountedRef.current) {
            setSocket(ws);
        }

        return () => {
            ws.close();
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