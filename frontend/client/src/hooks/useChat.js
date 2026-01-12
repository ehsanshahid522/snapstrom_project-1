import { useState, useCallback, useRef, useEffect } from 'react'
import { io } from 'socket.io-client'
import { config } from '../config.js'
import { api } from '../lib/api.js'

export const useChat = (conversationId) => {
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [isConnected, setIsConnected] = useState(false)
    const [typingUsers, setTypingUsers] = useState([])
    const wsRef = useRef(null)

    // Socket.io integration
    const connect = useCallback(() => {
        if (!conversationId) return;

        // Connect to Socket.io
        const socket = io(config.API_BASE_URL || window.location.origin, {
            auth: {
                token: localStorage.getItem('token')
            }
        });

        wsRef.current = socket;

        socket.on('connect', () => {
            console.log('🔌 Socket connected');
            setIsConnected(true);
            socket.emit('join_room', conversationId);
        });

        socket.on('new_message', (message) => {
            console.log('📩 New message received via socket:', message);
            setMessages(prev => {
                // Prevent duplicate messages if the message was already added via REST response
                if (prev.some(m => m.id === message.id || m._id === message._id)) {
                    return prev;
                }
                return [...prev, message];
            });
        });

        socket.on('user_typing', (data) => {
            if (data.isTyping) {
                setTypingUsers(prev => [...new Set([...prev, data.username])]);
            } else {
                setTypingUsers(prev => prev.filter(u => u !== data.username));
            }
        });

        socket.on('disconnect', () => {
            console.log('🔌 Socket disconnected');
            setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('🔌 Socket connection error:', error);
            setIsConnected(false);
        });
    }, [conversationId]);

    // Disconnect and cleanup
    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.disconnect();
            wsRef.current = null;
        }
        setIsConnected(false);
        setTypingUsers([]);
    }, []);

    // Send message via API and emit via socket
    const sendMessageHandler = useCallback(async (messageContent) => {
        try {
            setLoading(true);
            setError(null);

            const response = await api('/api/chat/send-message', {
                method: 'POST',
                body: { conversationId, content: messageContent }
            });

            if (response.success && response.message) {
                // Add to local state immediately
                setMessages(prev => [...prev, response.message]);

                // Emit via socket for others
                if (wsRef.current && wsRef.current.connected) {
                    wsRef.current.emit('send_message', {
                        conversationId,
                        message: response.message
                    });
                }
            }

            return response;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [conversationId]);

    // Fetch messages
    const fetchMessages = useCallback(async () => {
        if (!conversationId) return

        try {
            setLoading(true)
            setError(null)

            const response = await api(`/api/chat/messages/${conversationId}`)
            setMessages(response.messages || [])

            return response
        } catch (err) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [conversationId])

    // Mark messages as read
    const markAsRead = useCallback(async () => {
        if (!conversationId) return

        try {
            await api(`/api/chat/mark-read/${conversationId}`, {
                method: 'POST'
            })
        } catch (err) {
            // Silent error handling
        }
    }, [conversationId])

    // Start conversation
    const startConversation = useCallback(async (username) => {
        try {
            setLoading(true)
            setError(null)

            if (!username || typeof username !== 'string' || username.trim() === '') {
                throw new Error('Username is required and must be a non-empty string')
            }

            const response = await api('/api/chat/start-conversation', {
                method: 'POST',
                body: { username: username.trim() }
            })

            if (response.conversation) {
                return response.conversation
            } else {
                throw new Error('No conversation in response')
            }
        } catch (err) {
            setError(err.message)
            throw err
        } finally {
            setLoading(false)
        }
    }, [])

    // Connect when conversation changes
    useEffect(() => {
        if (conversationId) {
            connect()
            fetchMessages()
        } else {
            disconnect()
        }

        return () => {
            disconnect()
        }
    }, [conversationId, connect, disconnect, fetchMessages])

    return {
        messages,
        loading,
        error,
        isConnected,
        typingUsers,
        sendMessage: sendMessageHandler,
        fetchMessages,
        markAsRead,
        startConversation
    }
}
