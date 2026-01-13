
import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isModel = message.role === 'model';

  return (
    <div className={`flex w-full mb-8 ${isModel ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`relative max-w-[88%] md:max-w-[80%] px-6 py-5 shadow-sm transition-all ${
          isModel
            ? 'bg-white text-[#2C1E16] rounded-tr-3xl rounded-br-3xl rounded-bl-lg border-l-4 border-[#D97757]'
            : 'bg-[#2C1E16] text-[#F7F2ED] rounded-tl-3xl rounded-bl-3xl rounded-br-lg'
        }`}
      >
        {isModel && (
          <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#F7F2ED] rounded-full flex items-center justify-center border border-stone-200">
             <i className="fa-solid fa-paw text-[8px] text-[#D97757]"></i>
          </div>
        )}
        <div className="whitespace-pre-wrap font-medium tracking-wide leading-relaxed">
          {message.text}
        </div>
        <div className={`text-[10px] mt-3 font-bold uppercase tracking-widest opacity-40 ${isModel ? 'text-stone-500' : 'text-stone-300 text-right'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
