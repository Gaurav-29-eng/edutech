import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL;

function AITutor({ context = '' }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const question = input.trim();
    if (!question) {
      toast.error('Please enter a question');
      return;
    }

    if (question.length > 1000) {
      toast.error('Question too long (max 1000 characters)');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to use AI tutor');
      return;
    }

    // Add user message immediately
    const userMessage = { type: 'user', content: question, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(`${API}/api/ai/ask`, {
        question,
        context
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Add AI response
      const aiMessage = {
        type: 'ai',
        content: response.data.answer,
        timestamp: new Date(),
        isFallback: response.data.fallback
      };
      setMessages(prev => [...prev, aiMessage]);

      if (response.data.fallback) {
        toast.info('AI tutor is using fallback mode');
      }
    } catch (error) {
      console.error('AI tutor error:', error);
      
      const errorMessage = error.response?.data?.message || 
        'Failed to get AI response. Please try again.';
      
      // Add error message
      setMessages(prev => [...prev, {
        type: 'error',
        content: errorMessage,
        timestamp: new Date()
      }]);
      
      toast.error('AI tutor unavailable. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Quick question suggestions
  const suggestions = [
    'Explain this concept in simple terms',
    'Give me an example',
    'What are the key points?',
    'Help me understand this better'
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-50"
        title="Ask AI Tutor"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-full max-w-md z-50">
      {/* Chat Window */}
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold">AI Tutor</h3>
              <p className="text-xs text-white/80">Ask me anything!</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                Hi! I'm your AI tutor. Ask me anything about your studies!
              </p>
              
              {/* Quick Suggestions */}
              <div className="space-y-2">
                <p className="text-xs text-gray-400">Quick suggestions:</p>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInput(suggestion);
                    }}
                    className="block w-full text-left px-3 py-2 bg-white rounded-lg text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-gray-200"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : message.type === 'error'
                        ? 'bg-red-100 text-red-700 rounded-bl-md'
                        : message.isFallback
                        ? 'bg-yellow-50 text-gray-800 border border-yellow-200 rounded-bl-md'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.type === 'user' ? 'text-white/70' : 'text-gray-400'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Loading Indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">AI is thinking...</p>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              maxLength={1000}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-2 text-center">
            AI responses are for educational purposes only.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AITutor;
