import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useChat } from '../hooks/useChat.js'
import { api } from '../lib/api.js'
import { safeTimestampToString, safeObjectToString, safeRender, safeFormatTimeAgo } from '../utils/safeRender.js'

export default function Chat() {
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const currentUser = useMemo(() => localStorage.getItem('username'), [])

  // Use custom hooks
  const { 
    messages, 
    loading: chatLoading, 
    error: chatError, 
    isConnected, 
    typingUsers, 
    sendMessage, 
    fetchMessages, 
    markAsRead, 
    startConversation 
  } = useChat(selectedConversation?.id)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Fetch conversations from API
  const fetchConversations = useCallback(async () => {
    try {
      const response = await api('/api/chat/conversations')
      setConversations(response.conversations || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
      setConversations([])
    }
  }, [])

  // Search users function
  const searchUsers = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      const response = await api(`/api/users/search?q=${encodeURIComponent(query)}`)
      setSearchResults(response.users || [])
    } catch (error) {
      console.error('Error searching users:', error)
      setSearchResults([])
    }
  }, [])

  // Start new conversation
  const startNewConversation = useCallback(async (user) => {
    if (!user || !user.username) {
      console.error('Invalid user object:', user)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const conversation = await startConversation(user.username)
      
      if (conversation) {
        setSelectedConversation(conversation)
        setSearchQuery('')
        setSearchResults([])
        setShowUserSearch(false)
        
        const conversationId = conversation.id || conversation._id
        if (conversationId) {
          fetchMessages()
        }
        
        // Refresh conversations list
        fetchConversations()
      }
    } catch (error) {
      console.error('❌ Error starting conversation:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [startConversation, fetchMessages, fetchConversations])

  // Handle conversation selection
  const handleSelectConversation = useCallback((conversation) => {
    setSelectedConversation(conversation)
    setSearchQuery('')
    setSearchResults([])
    setShowUserSearch(false)
    
    const conversationId = conversation.id || conversation._id
    if (conversationId) {
      fetchMessages()
    }
    
    // Refresh conversations list
    fetchConversations()
  }, [fetchMessages, fetchConversations])

  // Handle sending messages
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      await sendMessage(newMessage.trim())
      setNewMessage('')
      
      // Update conversation last message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { 
                ...conv, 
                lastMessage: newMessage.trim(), 
                lastMessageAt: new Date().toISOString()
              }
            : conv
        )
      )

      // Mark messages as read
      markAsRead()
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }, [newMessage, selectedConversation, sendMessage, markAsRead])

  // Handle Enter key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  // Format message time - Enhanced with bulletproof object handling
  const formatMessageTime = useCallback((timestamp) => {
    // Use safeRender to ensure no objects are passed
    const safeTimestamp = safeRender(timestamp)
    
    if (!safeTimestamp || safeTimestamp === '[Object]' || safeTimestamp === '') {
      return ''
    }
    
    try {
      const date = new Date(safeTimestamp)
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return ''
      }
      
      const now = new Date()
      const diffInHours = (now - date) / (1000 * 60 * 60)
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
      }
    } catch (error) {
      return ''
    }
  }, [])

  // Get conversation partner
  const getConversationPartner = useCallback((conversation) => {
    if (!conversation?.participants || !Array.isArray(conversation.participants)) {
      return null
    }
    
    return conversation.participants.find(p => 
      p?.username && p.username !== currentUser
    )
  }, [currentUser])

  // Load initial data
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Handle URL parameters
  useEffect(() => {
    const username = searchParams.get('username')
    if (username && !selectedConversation) {
      startNewConversation({ username })
    }
  }, [searchParams, selectedConversation, startNewConversation])

  if (chatLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    )
  }

  if (chatError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-600 mb-4">Error loading chat: {chatError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="flex h-[calc(100vh-2rem)]">
            
            {/* Sidebar */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              
              {/* Header */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <h1 className="text-2xl font-bold mb-4">Messages</h1>
                
                {/* Search and New Chat */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowUserSearch(!showUserSearch)}
                    className="flex-1 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>+</span>
                    <span>New Chat</span>
                  </button>
                </div>
                
                {/* User Search */}
                {showUserSearch && (
                  <div className="mt-4">
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        searchUsers(e.target.value)
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-white/20 backdrop-blur-sm text-white placeholder-white/70 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                    
                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="mt-2 max-h-40 overflow-y-auto bg-white/10 backdrop-blur-sm rounded-lg">
                        {searchResults.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => startNewConversation(user)}
                            className="p-3 hover:bg-white/20 cursor-pointer transition-colors flex items-center gap-3"
                          >
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-medium">
                              {user.username?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className="font-medium">{user.username}</div>
                              {user.bio && <div className="text-sm opacity-75">{user.bio}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <div className="text-4xl mb-4">💬</div>
                    <p>No conversations yet</p>
                    <p className="text-sm mt-2">Start a new chat to begin messaging</p>
                  </div>
                ) : (
                  conversations.map((conversation) => {
                    const partner = getConversationPartner(conversation)
                    const isSelected = selectedConversation?.id === conversation.id || selectedConversation?._id === conversation._id
                    
                    if (!conversation || !partner || !partner.username) {
                      return null
                    }
                    
                    return (
                      <div
                        key={conversation.id || conversation._id}
                        onClick={() => handleSelectConversation(conversation)}
                        className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                          isSelected ? 'bg-purple-50 border-purple-200' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-medium">
                            {partner.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {partner.username}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {safeRender(conversation.lastMessage) || 'No messages yet'}
                            </div>
                            {conversation.lastMessageAt && (
                              <div className="text-xs text-gray-400 mt-1">
                                {formatMessageTime(conversation.lastMessageAt)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-6 border-b border-gray-200 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-medium">
                        {getConversationPartner(selectedConversation)?.username?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900">
                          {getConversationPartner(selectedConversation)?.username || 'Unknown User'}
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                          <span>{isConnected ? 'Online' : 'Offline'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((message) => {
                      if (!message?.id || !message?.content) {
                        return null
                      }
                      
                      const isSender = message.senderUsername === currentUser
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-4 px-4 animate-fade-in`}
                        >
                          <div className={`flex items-end gap-2 max-w-xs lg:max-w-md ${isSender ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            {!isSender && (
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                                {message.senderUsername?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                            )}
                            
                            {/* Message Bubble */}
                            <div
                              className={`px-4 py-3 rounded-2xl ${
                                isSender
                                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <div className="text-sm leading-relaxed break-words">
                                {safeRender(message.content)}
                              </div>
                              <div className={`text-xs mt-1 ${
                                isSender ? 'text-purple-100' : 'text-gray-500'
                              }`}>
                                {formatMessageTime(message.timestamp)}
                              </div>
                            </div>
                            
                            {/* Sender Avatar */}
                            {isSender && (
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                                {message.senderUsername?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-6 border-t border-gray-200 bg-white">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                      >
                        <span>Send</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">💬</div>
                    <h2 className="text-2xl font-semibold mb-2">Select a conversation</h2>
                    <p>Choose a conversation from the sidebar to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}