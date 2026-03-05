import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Users, ChevronUp, ChevronDown, X } from 'lucide-react';

export default function ForumOnlineUsers({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadOnlineUsers();
      const interval = setInterval(loadOnlineUsers, 30000); // refresh every 30s
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const loadOnlineUsers = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('getPeople', {});
      const people = res.data?.users || [];
      
      const presences = await base44.entities.UserPresence.list('-last_seen', 100);
      
      const now = new Date();
      // Consider online if seen in the last 15 minutes
      const onlineEmails = new Set(
        presences
          .filter(p => p.status === 'online' && (now - new Date(p.last_seen)) < 15 * 60 * 1000)
          .map(p => p.user_email)
      );

      // Filter people who are online
      const online = people.filter(p => onlineEmails.has(p.email) && p.email !== currentUser?.email);
      setOnlineUsers(online);
    } catch (error) {
      console.error("Error loading online users:", error);
    }
    setLoading(false);
  };

  const openChat = (user) => {
    window.dispatchEvent(
      new CustomEvent('open-study-chat', {
        detail: { partner: user },
      })
    );
  };

  if (!currentUser) return null;

  return (
    <div className="fixed bottom-0 right-4 md:right-10 z-[60] flex flex-col items-end">
      {isOpen && (
        <div className="w-64 bg-white border border-gray-300 shadow-xl rounded-t-md flex flex-col h-[400px]">
          <div 
            className="bg-[#3b5998] text-white p-2 rounded-t-md flex items-center justify-between cursor-pointer"
            onClick={() => setIsOpen(false)}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              <Users className="w-4 h-4" />
              Chat ({onlineUsers.length})
            </div>
            <X className="w-4 h-4 opacity-80 hover:opacity-100" />
          </div>
          
          <div className="flex-1 overflow-y-auto bg-white">
            {loading && onlineUsers.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500">Carregando...</div>
            ) : onlineUsers.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500">Nenhum usuário online</div>
            ) : (
              <div className="py-1">
                {onlineUsers.map(u => (
                  <div 
                    key={u.email}
                    onClick={() => openChat(u)}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={u.photo} />
                      <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">{u.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <span className="text-sm text-gray-800 truncate">{u.name}</span>
                      <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-gray-100 border-t border-gray-300 p-2 text-xs text-gray-600 flex items-center justify-center">
            Procurar usuários...
          </div>
        </div>
      )}
      
      {!isOpen && (
        <div 
          onClick={() => setIsOpen(true)}
          className="bg-[#3b5998] hover:bg-[#2d4373] text-white px-3 py-2 rounded-t-md shadow-md cursor-pointer flex items-center gap-2 font-bold text-sm w-48 transition-colors"
        >
          <div className="flex items-center gap-2 flex-1">
            <Users className="w-4 h-4" />
            Chat
          </div>
          <div className="flex items-center gap-1">
            {/* Show a fake online count or real if we fetch it even when closed */}
            <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-sm leading-none">
              Online
            </span>
          </div>
        </div>
      )}
    </div>
  );
}