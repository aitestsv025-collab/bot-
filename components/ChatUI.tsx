
import React, { useState, useRef, useEffect } from 'react';
import { Message, Role, BotConfig } from '../types';

interface ChatUIProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isTyping: boolean;
  botName: string;
}

const ChatUI: React.FC<ChatUIProps> = ({ messages, onSendMessage, isTyping, botName }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white lg:rounded-3xl shadow-xl border border-rose-100 overflow-hidden">
      {/* Header */}
      <div className="bg-rose-500 p-4 flex items-center gap-4">
        <div className="relative">
          <img
            src={`https://picsum.photos/seed/${botName}/100`}
            className="w-12 h-12 rounded-full border-2 border-white shadow-md"
            alt="GF Avatar"
          />
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
        </div>
        <div>
          <h2 className="text-white font-bold text-lg leading-tight">{botName}</h2>
          <p className="text-rose-100 text-xs flex items-center gap-1">
            <span className="animate-pulse">●</span> Online
          </p>
        </div>
        <div className="ml-auto flex gap-3">
          <button className="text-white/80 hover:text-white transition-colors"><i className="fas fa-phone"></i></button>
          <button className="text-white/80 hover:text-white transition-colors"><i className="fas fa-video"></i></button>
          <button className="text-white/80 hover:text-white transition-colors"><i className="fas fa-ellipsis-v"></i></button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-rose-50/30 to-white scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
            <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-4">
               <i className="fas fa-heart text-rose-500 text-3xl"></i>
            </div>
            <p className="text-rose-600 font-medium">Start chatting with {botName}!</p>
            <p className="text-sm text-gray-500 max-w-xs mt-2 italic">Try saying "Hi darling, how was your day?"</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl shadow-sm relative ${
                msg.role === Role.USER
                  ? 'bg-rose-500 text-white rounded-tr-none'
                  : 'bg-white border border-rose-100 text-gray-800 rounded-tl-none'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              <p className={`text-[10px] mt-1 ${msg.role === Role.USER ? 'text-rose-100' : 'text-gray-400'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-rose-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-rose-50 flex items-center gap-3">
        <button type="button" className="text-rose-400 hover:text-rose-600 transition-colors p-2">
          <i className="fas fa-plus"></i>
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message, baby..."
          className="flex-1 bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all text-sm"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
            input.trim() && !isTyping ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-gray-100 text-gray-400'
          }`}
        >
          <i className="fas fa-paper-plane text-lg"></i>
        </button>
      </form>
    </div>
  );
};

export default ChatUI;
