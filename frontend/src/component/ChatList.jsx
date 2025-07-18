import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaComments, FaUser, FaClock } from 'react-icons/fa';

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingChat, setStartingChat] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchChats();
    fetchUsers();
  }, []);

  const fetchChats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5001/api/chat', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const chatData = await response.json();
        setChats(chatData);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch chats');
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5001/api/users/search', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        const currentUserId = JSON.parse(localStorage.getItem('user'))?._id;
        setUsers(userData.filter(u => u._id !== currentUserId));
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const startNewChat = async (userId) => {
    if (startingChat) return; // Prevent multiple clicks
    
    setStartingChat(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/chat/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otherUserId: userId })
      });

      if (response.ok) {
        const chatData = await response.json();
        navigate(`/chat/${chatData._id}`);
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to start chat');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Failed to start chat. Please try again.');
    } finally {
      setStartingChat(false);
    }
  };

  const getLastMessage = (chat) => {
    if (!chat.messages || chat.messages.length === 0) {
      return 'No messages yet';
    }
    const lastMessage = chat.messages[chat.messages.length - 1];
    return lastMessage.content.length > 50 
      ? lastMessage.content.substring(0, 50) + '...' 
      : lastMessage.content;
  };

  const getLastMessageTime = (chat) => {
    if (!chat.messages || chat.messages.length === 0) {
      return null;
    }
    const lastMessage = chat.messages[chat.messages.length - 1];
    return new Date(lastMessage.timestamp);
  };

  const getOtherUser = (chat) => {
    const currentUserId = JSON.parse(localStorage.getItem('user'))?._id;
    return chat.participants.find(p => p._id !== currentUserId);
  };

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <button
            onClick={() => navigate('/home')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
            <button 
              onClick={fetchChats}
              className="ml-2 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Existing Chats */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Conversations</h2>
          </div>
          <div className="divide-y">
            {chats.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FaComments className="mx-auto text-4xl mb-4 text-gray-300" />
                <p>No conversations yet</p>
                <p className="text-sm">Start a chat with someone below!</p>
              </div>
            ) : (
              chats.map((chat) => {
                const otherUser = getOtherUser(chat);
                const lastMessageTime = getLastMessageTime(chat);
                
                return (
                  <div
                    key={chat._id}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => navigate(`/chat/${chat._id}`)}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={otherUser?.avatar || "https://randomuser.me/api/portraits/lego/1.jpg"}
                        alt={otherUser?.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900 truncate">
                            {otherUser?.name || 'Unknown User'}
                          </h3>
                          {lastMessageTime && (
                            <span className="text-xs text-gray-500 flex items-center">
                              <FaClock className="mr-1" />
                              {formatTime(lastMessageTime)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {getLastMessage(chat)}
                        </p>
                        <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                          <span className={`w-2 h-2 rounded-full ${otherUser?.isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                          <span>{otherUser?.isOnline ? 'Online' : 'Offline'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Start New Chat */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Start New Conversation</h2>
          </div>
          <div className="p-4">
            {users.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <FaUser className="mx-auto text-4xl mb-4 text-gray-300" />
                <p>No users available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((user) => (
                  <div
                    key={user._id}
                    className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                    onClick={() => startNewChat(user._id)}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={user.avatar || "https://randomuser.me/api/portraits/lego/1.jpg"}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.location || 'Location not specified'}</p>
                        <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                          <span className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                          <span>{user.isOnline ? 'Online' : 'Offline'}</span>
                        </div>
                      </div>
                    </div>
                    {startingChat && (
                      <div className="mt-2 text-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatList; 