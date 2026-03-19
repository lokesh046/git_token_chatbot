import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ messages, isLoading }) {
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-chatgpt-gray">
        <h1 className="text-4xl font-bold text-white/90 mb-8">PDF RAG Chatbot</h1>
        <p className="max-w-md text-center">Hello! How can I help you today? You can drag and drop a PDF below to analyze it, or just start chatting.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto pb-36 pt-4 w-full">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      
      {isLoading && (
        <div className="w-full bg-chatgpt-light/50 border-b border-white/5">
          <div className="max-w-3xl mx-auto flex gap-4 p-4 md:p-6 text-base md:gap-6">
            <div className="w-8 h-8 rounded-sm bg-green-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs">AI</span>
            </div>
            <div className="flex items-center px-1">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-chatgpt-gray rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-chatgpt-gray rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-chatgpt-gray rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </div>
      )}
      <div ref={endOfMessagesRef} />
    </div>
  );
}
