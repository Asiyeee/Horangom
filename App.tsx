
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, AppMode, SavedSession } from './types';
import { geminiService } from './services/geminiService';
import ChatMessage from './components/ChatMessage';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AppMode>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('horangom_sessions');
    if (saved) {
      setSavedSessions(JSON.parse(saved));
    }
  }, []);

  const syncStorage = (sessions: SavedSession[]) => {
    localStorage.setItem('horangom_sessions', JSON.stringify(sessions));
    setSavedSessions(sessions);
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const startNewSession = async (selectedMode: AppMode) => {
    const sessionId = Date.now().toString();
    setCurrentSessionId(sessionId);
    setMode(selectedMode);
    setShowHistory(false);
    setIsLoading(true);
    
    const initialGreeting = await geminiService.startLesson(selectedMode);
    const newMsg: Message = {
      role: 'model',
      text: initialGreeting,
      timestamp: Date.now()
    };
    
    const newMessages = [newMsg];
    setMessages(newMessages);
    
    const newSession: SavedSession = {
      id: sessionId,
      mode: selectedMode,
      messages: newMessages,
      lastTimestamp: Date.now()
    };
    
    syncStorage([newSession, ...savedSessions]);
    setIsLoading(false);
  };

  const loadSession = (session: SavedSession) => {
    setCurrentSessionId(session.id);
    setMode(session.mode);
    setMessages(session.messages);
    setShowHistory(false);
  };

  const updateCurrentSession = (updatedMessages: Message[]) => {
    if (!currentSessionId) return;
    const updated = savedSessions.map(s => 
      s.id === currentSessionId 
        ? { ...s, messages: updatedMessages, lastTimestamp: Date.now() }
        : s
    );
    syncStorage(updated);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = savedSessions.filter(s => s.id !== id);
    syncStorage(updated);
    if (currentSessionId === id) {
      setMode(null);
      setCurrentSessionId(null);
      setMessages([]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    const newMessagesWithUser = [...messages, userMessage];
    setMessages(newMessagesWithUser);
    updateCurrentSession(newMessagesWithUser);
    
    setInput('');
    setIsLoading(true);

    const responseText = await geminiService.sendMessage(input);
    
    const modelMessage: Message = {
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };

    const finalMessages = [...newMessagesWithUser, modelMessage];
    setMessages(finalMessages);
    updateCurrentSession(finalMessages);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getModeLabel = (m: AppMode) => {
    switch(m) {
      case 'sohbet': return 'Sohbet Pratiği';
      case 'konu': return 'Konu Öğrenme';
      case 'topik': return 'TOPIK Pratik';
      case 'hangul': return 'Başlangıç Hangıl';
      case 'soru': return 'Soru Hazırlama';
      default: return '';
    }
  };

  if (showHistory) {
    return (
      <div className="flex flex-col h-screen bg-[#F7F2ED] max-w-2xl mx-auto border-x border-stone-200 shadow-2xl relative z-10">
        <header className="p-8 flex items-center gap-6 bg-[#2C1E16] text-[#F7F2ED]">
          <button onClick={() => setShowHistory(false)} className="hover:text-[#D97757] transition-colors">
            <i className="fa-solid fa-arrow-left text-xl"></i>
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Geçmiş Dersler</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          {savedSessions.length === 0 ? (
            <div className="text-center py-20 opacity-30">
              <i className="fa-solid fa-seedling text-6xl mb-6"></i>
              <p className="font-bold uppercase tracking-widest text-sm">Henüz bir iz bırakmadın</p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedSessions.map(session => (
                <div 
                  key={session.id}
                  onClick={() => loadSession(session)}
                  className="bg-white border-2 border-transparent hover:border-[#D97757] p-6 rounded-[2rem] cursor-pointer transition-all group relative shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black uppercase text-[#D97757] tracking-[0.2em]">
                      {getModeLabel(session.mode)}
                    </span>
                    <button 
                      onClick={(e) => deleteSession(e, session.id)}
                      className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <i className="fa-solid fa-circle-xmark"></i>
                    </button>
                  </div>
                  <p className="text-stone-700 font-bold line-clamp-2">
                    {session.messages[session.messages.length - 1]?.text || "Yeni Başlangıç"}
                  </p>
                  <div className="mt-4 pt-4 border-t border-stone-50 flex items-center gap-2 text-[10px] font-bold text-stone-400">
                    <i className="fa-regular fa-calendar"></i>
                    {new Date(session.lastTimestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  if (!mode) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F7F2ED] items-center p-8 max-w-2xl mx-auto border-x border-stone-200 shadow-2xl relative z-10">
        <header className="mt-12 mb-16 text-center w-full relative">
          <button 
            onClick={() => setShowHistory(true)}
            className="absolute right-0 top-0 w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#2C1E16] hover:text-[#D97757] shadow-sm transition-all"
          >
            <i className="fa-solid fa-clock-rotate-left text-xl"></i>
          </button>
          
          <div className="inline-block p-4 bg-[#2C1E16] rounded-full mb-6">
             <i className="fa-solid fa-paw text-2xl text-[#F7F2ED]"></i>
          </div>
          <h1 className="text-4xl font-black text-[#2C1E16] tracking-tighter mb-2">Horangom</h1>
          <p className="text-[#D97757] font-bold uppercase tracking-[0.3em] text-[10px]">Korece Rehberin</p>
        </header>

        <div className="grid grid-cols-1 gap-5 w-full">
          {[
            { id: 'sohbet', icon: 'fa-comments', label: 'Sohbet Pratiği', desc: 'Doğal Korece akışı' },
            { id: 'konu', icon: 'fa-book-open', label: 'Konu Öğrenme', desc: 'Adım adım gelişim' },
            { id: 'topik', icon: 'fa-graduation-cap', label: 'TOPIK Pratik', desc: 'Anlayarak hazırlık' },
            { id: 'hangul', icon: 'fa-pen-nib', label: 'Başlangıç Hangıl', desc: 'Harflerin dünyası' },
            { id: 'soru', icon: 'fa-lightbulb', label: 'Özel Soru', desc: 'İstediğin konuda pratik' }
          ].map(m => (
            <button key={m.id} onClick={() => startNewSession(m.id as AppMode)} className="flex items-center gap-6 p-6 bg-white rounded-[2.5rem] hover:bg-[#2C1E16] hover:translate-y-[-4px] transition-all text-left group shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-[#F7F2ED] flex items-center justify-center text-[#2C1E16] group-hover:bg-[#D97757] group-hover:text-white transition-all">
                <i className={`fa-solid ${m.icon} text-xl`}></i>
              </div>
              <div>
                <h3 className="font-black text-[#2C1E16] group-hover:text-white transition-colors text-lg tracking-tight">{m.label}</h3>
                <p className="text-xs text-stone-400 group-hover:text-stone-300 transition-colors mt-0.5">{m.desc}</p>
              </div>
              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                <i className="fa-solid fa-chevron-right text-white"></i>
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-16 flex items-center gap-3">
           <div className="h-[1px] w-8 bg-stone-300"></div>
           <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Sessizce öğren</p>
           <div className="h-[1px] w-8 bg-stone-300"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#F7F2ED] overflow-hidden max-w-2xl mx-auto border-x border-stone-200 shadow-2xl relative z-10">
      <header className="bg-[#2C1E16] p-6 flex items-center justify-between z-20 text-[#F7F2ED]">
        <div className="flex items-center gap-4">
          <button onClick={() => setMode(null)} className="hover:text-[#D97757] transition-colors">
            <i className="fa-solid fa-chevron-left text-xl"></i>
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tight leading-none mb-1">Horangom</h1>
            <span className="text-[9px] text-[#D97757] font-black uppercase tracking-[0.2em]">
              {getModeLabel(mode)}
            </span>
          </div>
        </div>
        <button onClick={() => setShowHistory(true)} className="w-10 h-10 rounded-full border border-stone-700 flex items-center justify-center hover:border-[#D97757] transition-colors">
          <i className="fa-solid fa-clock-rotate-left"></i>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pt-10 pb-4 relative">
        <div className="max-w-full mx-auto">
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
          {isLoading && (
            <div className="flex justify-start mb-8">
              <div className="bg-white px-6 py-4 rounded-tr-3xl rounded-br-3xl rounded-bl-lg shadow-sm border-l-4 border-[#D97757]">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-[#D97757] rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-[#D97757] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-[#D97757] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="p-8 bg-[#F7F2ED]">
        <div className="relative group max-w-full mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Cümleni buraya bırak..."
            className="w-full bg-white border-2 border-stone-100 rounded-[2rem] py-5 pl-8 pr-16 text-[15px] focus:outline-none focus:border-[#D97757] transition-all shadow-sm resize-none min-h-[64px] max-h-32 placeholder-stone-300 font-bold"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`absolute right-3 bottom-3 w-12 h-12 flex items-center justify-center rounded-full transition-all ${
              !input.trim() || isLoading
                ? 'text-stone-300 bg-stone-50'
                : 'text-[#F7F2ED] bg-[#2C1E16] hover:bg-[#D97757] shadow-lg active:scale-90'
            }`}
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;
