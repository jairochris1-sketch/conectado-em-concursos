import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import StudyPartnerChat from './StudyPartnerChat';

export default function GlobalStudyPartnerChat({ currentUser }) {
  const [activeChats, setActiveChats] = useState([]);

  useEffect(() => {
    const handleOpenChat = (e) => {
      const { partner } = e.detail;
      if (!partner || !partner.email) return;
      
      setActiveChats(prev => {
        if (prev.find(p => p.email === partner.email)) {
          return prev;
        }
        return [...prev, partner];
      });
    };

    window.addEventListener('open-study-chat', handleOpenChat);
    return () => window.removeEventListener('open-study-chat', handleOpenChat);
  }, []);

  const handleClose = (email) => {
    setActiveChats(prev => prev.filter(p => p.email !== email));
  };

  if (!currentUser || activeChats.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-[70px] md:right-28 z-[110] flex flex-row-reverse items-end gap-2 md:gap-4 p-0 max-w-full overflow-x-auto print-hide" style={{ maxWidth: 'calc(100vw - 70px)' }}>
      <AnimatePresence>
        {activeChats.map(partner => (
          <div key={partner.email} className="shrink-0">
            <ChatWindow 
              currentUser={currentUser} 
              partner={partner} 
              onClose={() => handleClose(partner.email)} 
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ChatWindow({ currentUser, partner, onClose }) {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className={`
      flex flex-col bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-200 ease-in-out
      ${isMinimized 
        ? 'h-12 w-64 rounded-t-xl' 
        : 'fixed inset-0 z-[100] md:relative md:inset-auto md:z-auto h-[100dvh] w-screen md:h-[450px] md:w-[320px] md:rounded-t-xl'}
    `}>
      <StudyPartnerChat 
        currentUser={currentUser} 
        partner={partner} 
        onClose={onClose} 
        isMinimized={isMinimized}
        onToggleMinimize={() => setIsMinimized(!isMinimized)}
      />
    </div>
  );
}