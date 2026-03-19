import { MessageSquarePlus, Settings, SlidersHorizontal, Trash2, MessageSquare } from 'lucide-react';
import clsx from 'clsx';

export default function Sidebar({ 
  onClearChat, 
  sessions = [], 
  currentSessionId, 
  onSelectSession, 
  onDeleteSession,
  model, 
  setModel, 
  temperature, 
  setTemperature, 
  availableModels = [] 
}) {
  return (
    <aside className="w-64 bg-black/40 backdrop-blur-2xl flex-shrink-0 flex flex-col p-4 border-r border-white/5 hidden md:flex shadow-2xl z-10">
      <button 
        onClick={onClearChat}
        className="flex items-center gap-3 border border-indigo-500/30 bg-indigo-500/10 rounded-xl p-3 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all duration-300 text-sm w-full mb-6 font-medium shadow-[0_0_15px_rgba(99,102,241,0.15)] text-indigo-100"
      >
        <MessageSquarePlus size={18} />
        New Chat
      </button>

      {/* Chat History List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden mb-4">
        <div className="text-xs font-semibold text-chatgpt-gray mb-3 px-2 uppercase tracking-wider">
          Chat History
        </div>
        <div className="space-y-1">
          {sessions.map(session => (
            <div key={session.id} className={clsx(
              "w-full rounded-xl text-sm transition-all flex items-center gap-2 group",
              currentSessionId === session.id 
                ? "bg-indigo-500/20 text-indigo-100 border border-indigo-500/30" 
                : "text-gray-300 hover:bg-white/5 hover:text-white border border-transparent"
            )}>
              <button
                onClick={() => onSelectSession(session.id)}
                className="flex-1 p-2 truncate flex items-center gap-2 cursor-pointer"
              >
                <MessageSquare size={14} className="flex-shrink-0 opacity-70" />
                <span className="truncate">{session.title}</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 rounded transition-all flex-shrink-0 mr-1"
                title="Delete Session"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="text-xs text-gray-500 px-2">No history yet.</div>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 pt-4 overflow-y-auto overflow-x-hidden">
        <div className="text-xs font-semibold text-chatgpt-gray mb-3 px-2 uppercase tracking-wider">
          Settings
        </div>
        
        <div className="px-2 space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-chatgpt-gray flex items-center gap-2">
              <Settings size={14} /> Model
            </label>
            <select 
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-chatgpt-light border border-white/10 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-xs text-chatgpt-gray flex items-center gap-2">
              <SlidersHorizontal size={14} /> Temperature ({temperature})
            </label>
            <input 
              type="range" 
              min="0" max="2" step="0.1" 
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full cursor-pointer accent-blue-500"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
