import { useState, useRef, useEffect } from 'react';
import { Send, Plus, X, Square } from 'lucide-react';
import clsx from 'clsx';

export default function ChatInput({ onSendMessage, isLoading, onStopGeneration }) {
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [content]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if ((!content.trim() && !selectedFile) || isLoading) return;
    
    onSendMessage(content.trim(), selectedFile);
    setContent('');
    setSelectedFile(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };

  return (
    <div className="w-full relative">
      {selectedFile && (
        <div className="absolute -top-12 left-0 w-full mb-2 flex items-center justify-between bg-chatgpt-light p-2 rounded-lg border border-gray-700 shadow-sm text-sm">
          <span className="truncate max-w-[80%]">{selectedFile.name}</span>
          <button 
            onClick={() => setSelectedFile(null)}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] focus-within:shadow-[0_0_30px_rgba(99,102,241,0.15)] focus-within:border-indigo-500/40 overflow-hidden items-end pr-2 transition-all duration-300">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="p-3 text-gray-400 hover:text-white transition self-end"
          title="Upload PDF"
        >
          <Plus size={20} />
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept=".pdf"
            onChange={handleFileChange} 
          />
        </button>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Send a message..."
          className="w-full max-h-[200px] bg-transparent text-white border-0 focus:ring-0 resize-none py-3 px-2 overflow-y-auto"
          rows={1}
        />

        {isLoading ? (
          <button
            onClick={onStopGeneration}
            className="p-2 rounded-lg transition-colors m-2 bg-transparent text-white hover:bg-gray-700 border border-gray-500 animate-pulse"
            title="Stop generation"
          >
            <Square size={16} className="fill-current" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!content.trim() && !selectedFile}
            className={clsx(
              "p-2 rounded-lg transition-colors m-2",
              (!content.trim() && !selectedFile)
                ? "bg-transparent text-gray-500" 
                : "bg-green-500 text-white hover:bg-green-600"
            )}
          >
            <Send size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
