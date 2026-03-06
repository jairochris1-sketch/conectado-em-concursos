import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { base44 } from '@/api/base44Client';
import { User } from '@/entities/User';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ChatDropdown() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentChats, setRecentChats] = useState([]);
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await User.me();
      if (!userData) return;
      setUser(userData);
      
      fetchUnreadAndRecent(userData.email);
    } catch (error) {
      console.error("Erro ao carregar usuário no ChatDropdown:", error);
    }
  };

  const fetchUnreadAndRecent = async (email) => {
    try {
      // Fetch unread count
      const unreadMsgs = await base44.entities.StudyPartnerMessage.filter({
        receiver_email: email,
        is_read: false
      });
      setUnreadCount(unreadMsgs.length);

      // Fetch recent messages to group by sender
      const myMsgs = await base44.entities.StudyPartnerMessage.list('-created_date', 100);
      
      const chatsMap = {};
      
      myMsgs.forEach(msg => {
        if (msg.sender_email === email || msg.receiver_email === email) {
          const partnerEmail = msg.sender_email === email ? msg.receiver_email : msg.sender_email;
          if (!chatsMap[partnerEmail]) {
            chatsMap[partnerEmail] = {
              partner_email: partnerEmail,
              partner_name: msg.sender_email === email ? 'Usuário' : msg.sender_name, // Will update name later if possible
              partner_photo: msg.sender_email === email ? null : msg.sender_photo,
              last_message: msg.content,
              timestamp: msg.timestamp || msg.created_date,
              unread: 0
            };
          }
          if (msg.receiver_email === email && !msg.is_read) {
            chatsMap[partnerEmail].unread += 1;
          }
        }
      });
      
      // Update names for sent messages
      const partnerEmails = Object.keys(chatsMap);
      if (partnerEmails.length > 0) {
        // We do a simple fetch to get names if they are missing
        const users = await base44.entities.User.list();
        partnerEmails.forEach(pe => {
          if (chatsMap[pe].partner_name === 'Usuário') {
            const u = users.find(u => u.email === pe);
            if (u) {
              chatsMap[pe].partner_name = u.full_name;
              chatsMap[pe].partner_photo = u.profile_photo_url;
            }
          }
        });
      }

      const chatsArray = Object.values(chatsMap).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setRecentChats(chatsArray);
    } catch (error) {
      console.error("Erro ao buscar conversas recentes:", error);
    }
  };

  useEffect(() => {
    if (!user) return;

    const unsubscribe = base44.entities.StudyPartnerMessage.subscribe((event) => {
      if (event.type === 'create' || event.type === 'update') {
        const msg = event.data;
        if (msg.receiver_email === user.email || msg.sender_email === user.email) {
          fetchUnreadAndRecent(user.email);
        }
      } else if (event.type === 'delete') {
        fetchUnreadAndRecent(user.email);
      }
    });

    return unsubscribe;
  }, [user]);

  const openChat = (chat) => {
    setIsOpen(false);
    const partner = {
      email: chat.partner_email,
      name: chat.partner_name,
      photo: chat.partner_photo
    };
    window.dispatchEvent(new CustomEvent('open-study-chat', { detail: { partner } }));
  };

  const handleOpenChange = async (open) => {
    setIsOpen(open);
    if (open && unreadCount > 0) {
      setUnreadCount(0);
      try {
        const unreadMsgs = await base44.entities.StudyPartnerMessage.filter({
          receiver_email: user.email,
          is_read: false
        });
        await Promise.all(
          unreadMsgs.map(msg => base44.entities.StudyPartnerMessage.update(msg.id, { is_read: true }))
        );
        fetchUnreadAndRecent(user.email);
      } catch (error) {
        console.error('Erro ao marcar mensagens como lidas:', error);
      }
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-white hover:bg-black/10">
          <MessageCircle className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-600 text-white text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto p-0 dark:bg-gray-950 dark:border-gray-800">
        <div className="p-4 border-b bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Mensagens</h3>
        </div>

        {recentChats.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma conversa</p>
          </div>
        ) : (
          <div>
            {recentChats.map(chat => (
              <button
                key={chat.partner_email}
                onClick={() => openChat(chat)}
                className={`w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                  chat.unread > 0 ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={chat.partner_photo} />
                    <AvatarFallback>{chat.partner_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className={`text-sm truncate ${chat.unread > 0 ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-200'}`}>
                        {chat.partner_name}
                      </p>
                      <span className="text-[10px] text-gray-500 flex-shrink-0 ml-2">
                        {chat.timestamp ? formatDistanceToNow(new Date(chat.timestamp), { addSuffix: true, locale: ptBR }) : ''}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${chat.unread > 0 ? 'font-semibold text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                      {chat.last_message}
                    </p>
                  </div>
                  {chat.unread > 0 && (
                    <div className="w-5 h-5 flex-shrink-0 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                      {chat.unread}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}