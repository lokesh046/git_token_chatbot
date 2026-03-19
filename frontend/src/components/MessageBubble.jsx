import { useEffect, useState } from 'react';
import { User, Bot, FileText } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

export default function MessageBubble({ message }) {
  const { role, content, file, isError } = message;
  const isUser = role === 'user';
  
  // Typing effect simulation for assistant messages
  const [displayedContent, setDisplayedContent] = useState((isUser || message.isHistory) ? content : '');

  useEffect(() => {
    if (isUser || message.isHistory) return;
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= content.length) {
        setDisplayedContent(content.slice(0, currentIndex));
        currentIndex += 3; // Type 3 chars at a time for speed
      } else {
        clearInterval(interval);
      }
    }, 20);
    
    return () => clearInterval(interval);
  }, [content, isUser, message.isHistory]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={clsx(
        "w-full max-w-4xl mx-auto flex mb-6 px-4 md:px-0",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={clsx(
        "flex gap-4 p-5 md:gap-5 text-base rounded-2xl shadow-xl max-w-[85%]",
        isUser 
          ? "bg-gradient-to-br from-indigo-600 to-purple-600 rounded-br-sm border border-white/10" 
          : "bg-white/5 backdrop-blur-xl rounded-bl-sm border border-white/5"
      )}>
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center flex-shrink-0 text-white shadow-lg">
            <Bot size={18} />
          </div>
        )}
        
        <div className="flex flex-col gap-2 w-full min-w-0 pt-1">
          <div className="prose prose-invert prose-indigo max-w-none text-white/95 leading-relaxed">
            {file && (
              <div className="flex items-center gap-2 mb-2 p-2 rounded bg-black/20 text-sm font-medium w-fit border border-gray-600">
                <FileText size={16} className="text-red-400" />
                <span>{file}</span>
              </div>
            )}
            
            {isUser ? (
               <p className="whitespace-pre-wrap">{displayedContent}</p>
            ) : (
               <div>
                 <ReactMarkdown>{displayedContent}</ReactMarkdown>
                 {displayedContent.length < content.length && (
                   <span className="inline-block w-2 h-4 ml-1 bg-white animate-pulse" />
                 )}
               </div>
            )}
          </div>
        </div>

        {isUser && (
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-white shadow-lg backdrop-blur-sm">
            <User size={18} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
