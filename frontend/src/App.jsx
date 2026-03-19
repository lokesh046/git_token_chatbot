import { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';

function App() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState("gpt-4o");
  const [availableModels, setAvailableModels] = useState(["gpt-4o"]);
  const [temperature, setTemperature] = useState(0.7);
  
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const abortControllerRef = useRef(null);

  // Load models & sessions on mount
  useEffect(() => {
    fetch("http://localhost:8000/models")
      .then(res => res.json())
      .then(data => {
        if (data.models && data.models.length > 0) {
          setAvailableModels(data.models);
          if (!data.models.includes(model)) setModel(data.models[0]);
        }
      })
      .catch(console.error);

    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch("http://localhost:8000/sessions");
      const data = await res.json();
      setSessions(data);
      if (data.length > 0 && !currentSessionId) {
        handleLoadSession(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSession = async () => {
    try {
      const res = await fetch("http://localhost:8000/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" })
      });
      const data = await res.json();
      setCurrentSessionId(data.id);
      setMessages([]);
      fetchSessions(); // Refresh sidebar list
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoadSession = async (sessionId) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setCurrentSessionId(sessionId);
    try {
      const res = await fetch(`http://localhost:8000/sessions/${sessionId}/messages`);
      const data = await res.json();
      
      const parsedMessages = (data.messages || []).map(msg => ({
        ...msg, 
        isHistory: true
      }));
      
      setMessages(parsedMessages);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await fetch(`http://localhost:8000/sessions/${sessionId}`, { method: "DELETE" });
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSessionId === sessionId) {
         handleCreateSession();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (text, file) => {
    if (!text && !file) return;

    // Create session if none exists
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      const res = await fetch("http://localhost:8000/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: text.slice(0, 30) || "New Chat" })
      });
      const data = await res.json();
      activeSessionId = data.id;
      setCurrentSessionId(activeSessionId);
      fetchSessions();
    }

    const newUserMsg = { id: Date.now(), role: 'user', content: text, file: file?.name };
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        await fetch("http://localhost:8000/upload", {
          method: "POST",
          body: formData,
        });
      }

      // Initialize AbortController for stop generation
      abortControllerRef.current = new AbortController();

      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: activeSessionId,
          prompt: text || "Please analyze the uploaded document.",
          model: model,
          temperature: temperature
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) throw new Error("API Request Failed");
      const data = await response.json();
      
      const newAssistantMsg = { id: Date.now() + 1, role: 'assistant', content: data.reply };
      setMessages(prev => [...prev, newAssistantMsg]);
    } catch (error) {
      if (error.name === 'AbortError') {
         // User stopped generation manually, API request killed
         setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: '[Generation Stopped by User]', isError: true }]);
      } else {
         setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', content: 'An error occurred while processing your request.', isError: true }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <div className="flex h-screen bg-[#090b14] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#090b14] to-black text-white font-sans overflow-hidden selection:bg-purple-500/30">
      <Sidebar 
        onClearChat={handleCreateSession} 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleLoadSession}
        onDeleteSession={handleDeleteSession}
        model={model} 
        setModel={setModel} 
        temperature={temperature} 
        setTemperature={setTemperature}
        availableModels={availableModels}
      />
      <main className="flex-1 flex flex-col relative h-full max-w-full">
        <ChatWindow messages={messages} isLoading={isLoading} />
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-chatgpt-main pt-6 pb-6 px-4">
          <div className="max-w-3xl mx-auto">
            <ChatInput 
               onSendMessage={handleSendMessage} 
               isLoading={isLoading} 
               onStopGeneration={handleStopGeneration} 
            />
            <div className="text-center text-xs text-chatgpt-gray mt-3">
              ChatGPT can make mistakes. Consider verifying important information.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
