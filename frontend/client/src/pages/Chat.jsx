import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useChatAPI, useRealTimeChat, useTypingIndicator } from '../hooks/useChat.js'
import { api } from '../lib/api.js'

export default function Chat() {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState([])
  const messagesEndRef = useRef(null)
  const currentUser = useMemo(() => localStorage.getItem('username'), [])

  // Use custom hooks
  const { loading, error, sendMessage: apiSendMessage, getConversations, getMessages, startConversation, markAsRead } = useChatAPI()
  const { messages, isConnected, typingUsers, sendMessage: wsSendMessage, setMessages } = useRealTimeChat(selectedConversation?.id)
  const { handleTyping } = useTypingIndicator(selectedConversation?.id, wsSendMessage)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Fetch conversations on component mount
  useEffect(() => {
    fetchConversations()
  }, [])

  // Handle search query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery)
        setShowUserSearch(true)
      } else {
        setSearchResults([])
        setShowUserSearch(false)
      }
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchUsers])

  // Fetch conversations from API
  const fetchConversations = useCallback(async () => {
    try {
      const conversations = await getConversations()
      setConversations(conversations)
    } catch (error) {
      console.error('Error fetching conversations:', error)
      setConversations([])
    }
  }, [getConversations])

  // Search users function
  const searchUsers = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`)
      if (response.success) {
        setSearchResults(response.users)
      }
    } catch (error) {
      console.error('Error searching users:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Start new conversation with user
  const startNewConversation = useCallback(async (user) => {
    try {
      const conversation = await startConversation(user.id)
      setSelectedConversation(conversation)
      setSearchQuery('')
      setSearchResults([])
      setShowUserSearch(false)
      fetchMessages(conversation.id)
    } catch (error) {
      console.error('Error starting conversation:', error)
    }
  }, [startConversation, fetchMessages])

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conversationId) => {
    try {
      const messages = await getMessages(conversationId)
      setMessages(messages)
    } catch (error) {
      console.error('Error fetching messages:', error)
      setMessages([])
    }
  }, [getMessages, setMessages])

  // Handle conversation selection
  const handleSelectConversation = useCallback((conversation) => {
    setSelectedConversation(conversation)
    fetchMessages(conversation.id)
  }, [fetchMessages])

  // Send a new message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      // Try WebSocket first for real-time delivery
      const wsSuccess = wsSendMessage({
        content: newMessage.trim(),
        conversationId: selectedConversation.id
      })

      if (!wsSuccess) {
        // Fallback to API if WebSocket is not available
        await apiSendMessage(selectedConversation.id, newMessage.trim())
      }

      // Add message to local state immediately for better UX
      const message = {
        id: Date.now().toString(), // Temporary ID
        content: newMessage.trim(),
        senderId: currentUser,
        senderUsername: currentUser,
        timestamp: new Date().toISOString(),
        type: 'text',
        status: 'sending'
      }

      setMessages(prev => [...prev, message])
      setNewMessage('')

      // Update conversation last message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, lastMessage: message.content, lastMessageTime: message.timestamp }
            : conv
        )
      )

      // Mark messages as read
      markAsRead(selectedConversation.id)

    } catch (error) {
      console.error('Error sending message:', error)
      // Remove failed message from local state
      setMessages(prev => prev.filter(msg => msg.status !== 'sending'))
    }
  }, [newMessage, selectedConversation, currentUser, wsSendMessage, apiSendMessage, setMessages, markAsRead])

  // Handle Enter key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }, [sendMessage])

  // Start new conversation
  const startNewConversation = useCallback(async (username) => {
    try {
      const response = await startConversation(username)
      
      const newConversation = {
        id: response.conversationId,
        participants: [
          { username: currentUser, isOnline: true },
          { username, isOnline: onlineUsers.includes(username) }
        ],
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0
      }

      setConversations(prev => [newConversation, ...prev])
      handleSelectConversation(newConversation)
    } catch (error) {
      console.error('Error starting conversation:', error)
    }
  }, [currentUser, onlineUsers, startConversation, handleSelectConversation])

  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations
    
    return conversations.filter(conv => 
      conv.participants.some(p => 
        p.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
        p.username !== currentUser
      )
    )
  }, [conversations, searchQuery, currentUser])

  // Format message time
  const formatMessageTime = useCallback((timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }, [])

  // Get conversation partner
  const getConversationPartner = useCallback((conversation) => {
    return conversation.participants.find(p => p.username !== currentUser)
  }, [currentUser])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 rounded-full mx-auto mb-4 animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading conversations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto h-screen flex">
        {/* Conversations Sidebar */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>
            
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search users or conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200"
              />
              <svg className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {showUserSearch ? (
              // User Search Results
              <div>
                {isSearching ? (
                  <div className="p-6 text-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 rounded-full mx-auto mb-4 animate-spin"></div>
                    <p className="text-gray-600">Searching users...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div>
                    <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                      <h3 className="text-sm font-medium text-gray-700">Search Results</h3>
                    </div>
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => startNewConversation(user)}
                        className="p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          {/* Avatar */}
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            {user.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          
                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-sm font-semibold text-gray-900 truncate">
                                {user.username}
                              </h3>
                              {user.isOnline && (
                                <span className="text-xs text-green-600 font-medium">Online</span>
                              )}
                            </div>
                            {user.bio && (
                              <p className="text-xs text-gray-500 truncate mt-1">{user.bio}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-xs text-gray-400">
                                {user.followersCount} followers
                              </span>
                              <span className="text-xs text-gray-400">
                                {user.followingCount} following
                              </span>
                            </div>
                          </div>
                          
                          {/* Start Chat Button */}
                          <button className="px-3 py-1 bg-pink-500 text-white text-xs font-medium rounded-full hover:bg-pink-600 transition-colors">
                            Chat
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium mb-2">No users found</p>
                    <p className="text-sm">Try searching with a different username</p>
                  </div>
                )}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-lg font-medium mb-2">No conversations yet</p>
                <p className="text-sm">Start a conversation with someone!</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => {
                const partner = getConversationPartner(conversation)
                const isSelected = selectedConversation?.id === conversation.id
                
                return (
                  <div
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                      isSelected ? 'bg-pink-50 border-r-4 border-r-pink-500' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {partner.username.charAt(0).toUpperCase()}
                        </div>
                        {partner.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {partner.username}
                          </h3>
                          {conversation.lastMessageTime && (
                            <span className="text-xs text-gray-500">
                              {formatMessageTime(conversation.lastMessageTime)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.lastMessage || 'No messages yet'}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
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
              <div className="p-6 border-b border-gray-100 bg-white">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {getConversationPartner(selectedConversation).username.charAt(0).toUpperCase()}
                    </div>
                    {getConversationPartner(selectedConversation).isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {getConversationPartner(selectedConversation).username}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {getConversationPartner(selectedConversation).isOnline ? 'Online' : 'Offline'}
                      {isConnected && (
                        <span className="ml-2 inline-flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                          Connected
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium mb-2">Start the conversation!</p>
                    <p className="text-sm">Send a message to begin chatting.</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwn = message.senderUsername === currentUser
                    const isSending = message.status === 'sending'
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                          isOwn 
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' 
                            : 'bg-white text-gray-900 border border-gray-200'
                        } ${isSending ? 'opacity-70' : ''}`}>
                          <p className="text-sm">{message.content}</p>
                          <div className={`flex items-center justify-between mt-2 text-xs ${
                            isOwn ? 'text-pink-100' : 'text-gray-500'
                          }`}>
                            <span>{formatMessageTime(message.timestamp)}</span>
                            {isOwn && (
                              <span>
                                {isSending ? '⏳' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                {typingUsers.length > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-2xl">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                        <span className="text-sm">
                          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-6 border-t border-gray-100 bg-white">
                <div className="flex items-center space-x-3">
                  <div className="flex-1 relative">
                    <textarea
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value)
                        handleTyping()
                      }}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      rows="1"
                      className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 resize-none"
                      style={{ minHeight: '48px', maxHeight: '120px' }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      className="absolute right-2 top-2 p-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {sendingMessage ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* No conversation selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
                <p className="text-sm">Choose a conversation from the sidebar to start chatting.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
