import { useState, useCallback, useRef, useEffect } from 'react'
import { api } from '../lib/api'

export const useChat = (conversationId) => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const wsRef = useRef(null)

  // Use polling mode only - WebSocket completely disabled
  const connect = useCallback(() => {
    setIsConnected(false)
    
    // Start polling for new messages every 5 seconds
    if (conversationId) {
      const pollInterval = setInterval(async () => {
        try {
          const response = await api(`/api/chat/messages/${conversationId}`)
          if (response.messages) {
            setMessages(response.messages)
          }
        } catch (error) {
          // Silent error handling
        }
      }, 5000)
      
      // Store interval reference for cleanup
      wsRef.current = { pollInterval }
    }
  }, [conversationId])

  // Disconnect and cleanup
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      if (wsRef.current.pollInterval) {
        clearInterval(wsRef.current.pollInterval)
      }
      wsRef.current = null
    }
    setIsConnected(false)
  }, [])

  // Send message via API
  const sendMessage = useCallback(async (message) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api(`/api/chat/messages/${conversationId}`, {
        method: 'POST',
        body: { content: message }
      })
      
      if (response.message) {
        setMessages(prev => [...prev, response.message])
      }
      
      return response
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [conversationId])

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
    sendMessage,
    fetchMessages,
    markAsRead,
    startConversation
  }
}