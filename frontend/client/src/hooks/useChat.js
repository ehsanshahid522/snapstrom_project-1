import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../lib/api.js'

// Custom hook for real-time messaging
export const useRealTimeChat = (conversationId) => {
  const [messages, setMessages] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const pingIntervalRef = useRef(null)

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      const token = localStorage.getItem('token')
      const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:3001'}/chat?token=${token}&conversationId=${conversationId}`
      
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        setIsConnected(true)
        console.log('WebSocket connected')
        
        // Clear reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }))
          }
        }, 30000)
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          switch (data.type) {
            case 'message':
              setMessages(prev => [...prev, data.message])
              break
            case 'typing':
              setTypingUsers(prev => {
                if (data.isTyping) {
                  return [...prev.filter(user => user !== data.username), data.username]
                } else {
                  return prev.filter(user => user !== data.username)
                }
              })
              break
            case 'message_status':
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === data.messageId 
                    ? { ...msg, status: data.status }
                    : msg
                )
              )
              break
            case 'pong':
              // Handle pong response
              break
            default:
              console.log('Unknown message type:', data.type)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      wsRef.current.onclose = () => {
        setIsConnected(false)
        console.log('WebSocket disconnected')
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
          pingIntervalRef.current = null
        }

        // Attempt to reconnect after 3 seconds
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, 3000)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setIsConnected(false)
      }

    } catch (error) {
      console.error('Error connecting to WebSocket:', error)
      setIsConnected(false)
    }
  }, [conversationId])

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    setIsConnected(false)
  }, [])

  // Send message via WebSocket
  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        content: message.content,
        conversationId: message.conversationId
      }))
      return true
    }
    return false
  }, [])

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        isTyping,
        conversationId
      }))
    }
  }, [conversationId])

  // Connect when conversationId changes
  useEffect(() => {
    if (conversationId) {
      connect()
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [conversationId, connect, disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    messages,
    isConnected,
    typingUsers,
    sendMessage,
    sendTypingIndicator,
    setMessages
  }
}

// Custom hook for chat API calls
export const useChatAPI = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const sendMessage = useCallback(async (conversationId, content, type = 'text') => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api('/chat/send', {
        method: 'POST',
        body: { conversationId, content, type }
      })

      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getConversations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api('/chat/conversations')
      return response.conversations || []
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getMessages = useCallback(async (conversationId) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api(`/chat/messages/${conversationId}`)
      return response.messages || []
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const startConversation = useCallback(async (username) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api('/chat/start-conversation', {
        method: 'POST',
        body: { username }
      })

      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (conversationId) => {
    try {
      await api(`/chat/mark-read/${conversationId}`, {
        method: 'POST'
      })
    } catch (err) {
      console.error('Error marking messages as read:', err)
    }
  }, [])

  return {
    loading,
    error,
    sendMessage,
    getConversations,
    getMessages,
    startConversation,
    markAsRead
  }
}

// Custom hook for typing indicator
export const useTypingIndicator = (conversationId, sendTypingIndicator) => {
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef(null)

  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true)
      sendTypingIndicator(true)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      sendTypingIndicator(false)
    }, 1000)
  }, [isTyping, sendTypingIndicator])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return { handleTyping }
}

