import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useChatAPI, useRealTimeChat, useTypingIndicator } from '../hooks/useChat.js'
import { api } from '../lib/api.js'

export default function Chat() {
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
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
      const response = await api(`/api/search/users?q=${encodeURIComponent(query)}`)
      if (response.users) {
        setSearchResults(response.users || [])
      }
    } catch (error) {
      console.error('Error searching users:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Handle search query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery)
      } else {
        setSearchResults([])
      }
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchUsers])

  // Start new conversation with user
  const startNewConversation = useCallback(async (user) => {
    try {
      const conversation = await startConversation(user.username)
      setSelectedConversation(conversation)
      setSearchQuery('')
      setSearchResults([])
      setShowUserSearch(false)
      fetchMessages(conversation.id)
      // Refresh conversations list
      fetchConversations()
    } catch (error) {
      console.error('Error starting conversation:', error)
    }
  }, [startConversation, fetchMessages, fetchConversations])

  // Handle conversation selection
  const handleSelectConversation = useCallback((conversation) => {
    setSelectedConversation(conversation)
    fetchMessages(conversation.id)
  }, [fetchMessages])

  // Auto-scroll effect
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Fetch conversations on component mount
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Handle user parameter from URL
  useEffect(() => {
    const userId = searchParams.get('user')
    if (userId && conversations.length > 0) {
      // Find existing conversation with this user
      const existingConversation = conversations.find(conv => 
        conv.participants.some(p => p.id === userId)
      )
      
      if (existingConversation) {
        // Open existing conversation
        setSelectedConversation(existingConversation)
        fetchMessages(existingConversation.id)
      } else {
        // Start new conversation with this user
        startNewConversation({ id: userId })
      }
    }
  }, [searchParams, conversations, fetchMessages, startNewConversation])

  // Removed search query handling - using header search only

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
    }
  }, [newMessage, selectedConversation, wsSendMessage, apiSendMessage, currentUser, setMessages, markAsRead])

  // Handle Enter key press
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }, [sendMessage])

  // Use conversations directly since search is removed
  const filteredConversations = conversations

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
            
            {/* Start New Chat Button */}
            <button
              onClick={() => setShowUserSearch(true)}
              className="w-full px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Start New Chat</span>
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {showUserSearch ? (
              // User Search Interface
              <div>
                {/* Search Input */}
                <div className="p-4 border-b border-gray-100">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search users to chat with..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <button
                      onClick={() => setShowUserSearch(false)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Search Results */}
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
                ) : searchQuery ? (
                  <div className="p-6 text-center text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium mb-2">No users found</p>
                    <p className="text-sm">Try searching with a different username</p>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium mb-2">Search for users</p>
                    <p className="text-sm">Type a username to find someone to chat with</p>
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
                <p className="text-sm mb-4">Start a conversation with someone!</p>
                <button
                  onClick={() => setShowUserSearch(true)}
                  className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                >
                  Find Someone to Chat With
                </button>
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
                      
                      {/* Conversation Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {partner.username}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {formatMessageTime(conversation.lastMessageTime)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate mt-1">
                          {conversation.lastMessage || 'No messages yet'}
                        </p>
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
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {getConversationPartner(selectedConversation).username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {getConversationPartner(selectedConversation).username}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {getConversationPartner(selectedConversation).isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderUsername === currentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderUsername === currentUser
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.senderUsername === currentUser ? 'text-pink-100' : 'text-gray-500'
                      }`}>
                        {formatMessageTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-6 border-t border-gray-100 bg-white">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="px-6 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium mb-2">Select a conversation</h3>
                <p className="text-sm">Choose a conversation from the sidebar to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}