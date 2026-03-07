import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { X, Send, Loader2, Circle, ChevronDown, Bell, Settings, Volume2, VolumeX, BellRing, BellOff, Minus, Smile, Search, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { notificationService } from "@/components/chat/notificationService";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Popover, PopoverContent, PopoverTrigger
} from "@/components/ui/popover";
import ChatDebugValidator from "@/components/chat/ChatDebugValidator";

const EMOJIS = ["😀","😂","🤣","😊","😍","🥰","😘","😜","😎","🤩",
  "😏","😒","😔","😕","😣","😫","🥺","😢","😭","😤","😠","😡",
  "🤯","😳","😱","😨","😰","😓","🤗","🤔","🤭","🤫","😶","😐",
  "🙄","😯","🥱","😴","🤤","😪","😵","🤐","🥴","🤢","🤮","🤧",
  "👍","👎","👏","🙌","👐","🤲","🤝","🙏","✌️","🤞","🤟","🤘",
  "🤙","👈","👉","👆","👇","❤️","💔","💕","💞","💓","💗","💖"];

const HEARTBEAT_INTERVAL = 30_000;
const ONLINE_THRESHOLD_MS = 3 * 60 * 1000;

function getConversationKey(emailA, emailB) {
  return [emailA, emailB].sort().join("|");
}

const STATUS_OPTIONS = [
  { value: "online",    label: "🟢 Online",    color: "text-green-500" },
  { value: "offline",   label: "⚪ Offline",   color: "text-gray-400" },
  { value: "invisible", label: "👁 Invisível", color: "text-gray-400" },
];

function resolvePresence(p) {
  if (!p) return null;
  if (p.status === "invisible") return { ...p, display: "offline" };
  const lastSeenMs = p.last_seen ? Date.now() - new Date(p.last_seen).getTime() : Infinity;
  if (p.status === "online" && lastSeenMs < ONLINE_THRESHOLD_MS) return { ...p, display: "online" };
  return { ...p, display: "offline" };
}

function PresenceDot({ presence }) {
  if (!presence) return null;
  if (presence.display === "online") {
    return <span className="flex items-center gap-1 text-xs text-green-400 font-medium"><Circle className="w-2 h-2 fill-green-400" /> Online</span>;
  }
  const ago = presence.last_seen
    ? formatDistanceToNow(new Date(presence.last_seen), { addSuffix: true, locale: ptBR })
    : null;
  return (
    <span className="flex items-center gap-1 text-xs text-gray-300">
      <Circle className="w-2 h-2 fill-gray-400" />
      {ago ? `Visto ${ago}` : "Offline"}
    </span>
  );
}

const MESSAGES_PER_PAGE = 30;

export default function StudyPartnerChat({ currentUser, partner, onClose, isMinimized, onToggleMinimize }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [partnerPresence, setPartnerPresence] = useState(null);

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);
  const [lastMessageId, setLastMessageId] = useState(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [prefs, setPrefs] = useState(notificationService.getPreferences());
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [now, setNow] = useState(Date.now());
  const containerRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);
  const messagesEnd = useRef(null);
  const messagesStart = useRef(null);
  const inputRef = useRef(null);
  const visibilityUnsubRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const loadingRef = useRef(false);
  const convKey = getConversationKey(currentUser.email, partner.email);
  const isMinimizedRef = useRef(isMinimized);

  useEffect(() => {
    isMinimizedRef.current = isMinimized;
  }, [isMinimized]);

  // Initialize notifications
  useEffect(() => {
    const initNotifications = async () => {
      await notificationService.initSound();
      const hasPermission = await notificationService.requestNotificationPermission();
      setNotificationsEnabled(hasPermission);
      if (hasPermission) {
        await notificationService.registerServiceWorker();
      }
    };
    initNotifications();
  }, []);

  // Scroll to latest message
  useEffect(() => { 
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
    setShowNewMessageIndicator(false);
  }, [messages]);

  // Infinite scroll - load older messages with debounce
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop < 100 && !loadingRef.current && hasMoreOlder) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          loadOlderMessages();
        }, 300);
      }
      
      // Check if scrolled to bottom to clear unread indicator
      if (container.scrollHeight - container.scrollTop - container.clientHeight < 50) {
         if (showNewMessageIndicator || unreadCount > 0) {
             setShowNewMessageIndicator(false);
             setUnreadCount(0);
             
             // Mark pending unread messages as read
             const unreadMsgs = messages.filter(m => m.receiver_email === currentUser.email && !m.is_read);
             if (unreadMsgs.length > 0) {
               Promise.all(
                 unreadMsgs.map(m => base44.entities.StudyPartnerMessage.update(m.id, { is_read: true, status: 'read' }).catch(() => {}))
               );
               setMessages(prev => prev.map(m => unreadMsgs.find(u => u.id === m.id) ? { ...m, is_read: true, status: 'read' } : m));
             }
         }
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeoutRef.current);
    };
  }, [hasMoreOlder, showNewMessageIndicator, unreadCount, messages, currentUser.email]);

  // Load + subscribe to messages with notifications
  useEffect(() => {
    loadMessages();
    loadPresence();

    // Subscribe to ALL messages in conversation
    const unsub = base44.entities.StudyPartnerMessage.subscribe((event) => {
      if (event.type === "create") {
        const msg = event.data;
        
        // CRITICAL: Verify message belongs to THIS conversation
        if (!msg || !msg.conversation_key) {
          console.warn("Invalid message structure:", msg);
          return;
        }
        
        if (msg.conversation_key !== convKey) {
          console.log(`Message for different conversation: ${msg.conversation_key} vs ${convKey}`);
          return;
        }
        
        // Avoid duplicates (message might be added optimistically)
        if (messages.some(m => m.id === msg.id)) {
          console.log(`Duplicate message ignored: ${msg.id}`);
          return;
        }
        
        console.log(`New message received: ${msg.id} from ${msg.sender_email}`);
        
        // If I'm receiving this message, mark as read and update status
        if (msg.receiver_email === currentUser.email && !msg.is_read) {
          // Tocar som em todas as novas mensagens
          if (notificationService.getPreferences().sound) {
            notificationService.playNotificationSound();
          }

          setMessages((prev) => {
            const isFirstMessage = prev.length === 0;
            // Exibir notificação apenas se for a primeira mensagem da conversa
            if (isFirstMessage && !document.hidden) {
              setTimeout(() => {
                toast.info(`Nova conversa com ${msg.sender_name}`, {
                  description: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : '')
                });
              }, 100);
            }
            return [...prev, msg];
          });

          if (!isMinimizedRef.current && isScrolledToBottom() && !document.hidden) {
            base44.entities.StudyPartnerMessage.update(msg.id, { is_read: true, status: 'read' }).catch((err) => {
              console.warn("Failed to mark message as read:", err);
            });
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true, status: 'read' } : m));
          } else {
            setShowNewMessageIndicator(true);
            setUnreadCount(prevCount => prevCount + 1);
          }

          // Show push notification if app in background
          if (notificationsEnabled && document.hidden) {
            notificationService.sendPushNotification(`Nova mensagem de ${msg.sender_name}`, { body: msg.content.substring(0, 50) });
          }
        } else {
          // It's my own message or already read
          setMessages((prev) => [...prev, msg]);
        }
        setLastMessageId(msg.id);
      } else if (event.type === "update") {
        const msg = event.data;
        if (msg.conversation_key === convKey) {
          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, ...msg } : m));
        }
      }
    });

    const unsubPresence = base44.entities.UserPresence.subscribe((event) => {
      if (event.data?.user_email === partner.email) {
        setPartnerPresence(resolvePresence(event.data));
      }
    });

    // Listen for visibility changes
    visibilityUnsubRef.current = notificationService.onVisibilityChange(() => {
      // App came back to foreground - mark all messages as read
      if (!document.hidden) {
        const unreadMsgs = messages.filter(m => m.receiver_email === currentUser.email && !m.is_read);
        if (unreadMsgs.length > 0) {
          Promise.all(
            unreadMsgs.map(m => base44.entities.StudyPartnerMessage.update(m.id, { is_read: true, status: 'read' }).catch(() => {}))
          );
        }
      }
    });

    return () => { 
      unsub(); 
      unsubPresence();
      visibilityUnsubRef.current?.();
    };
  }, [convKey, partner.email, notificationsEnabled]);

  // A presença já é atualizada globalmente pelo UserPresenceUpdater no Layout.

  const loadMessages = async (skipCount = 0) => {
    try {
      const allMsgs = await base44.entities.StudyPartnerMessage.filter({ conversation_key: convKey });
      
      if (!allMsgs || allMsgs.length === 0) {
        console.log("No messages found for conversation:", convKey);
        setMessages([]);
        setHasMoreOlder(false);
        return;
      }
      
      const sorted = allMsgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      const paginated = sorted.slice(Math.max(0, sorted.length - MESSAGES_PER_PAGE - skipCount), sorted.length - skipCount || undefined);
      
      console.log(`Loaded ${paginated.length} messages for conversation ${convKey}`);
      setMessages(skipCount === 0 ? paginated : prev => [...paginated, ...prev]);
      setHasMoreOlder(sorted.length > MESSAGES_PER_PAGE + skipCount);
      
      // Mark unread messages as read with status update
      const unreadMsgs = paginated.filter(m => m.receiver_email === currentUser.email && !m.is_read);
      if (unreadMsgs.length > 0) {
        console.log(`Marking ${unreadMsgs.length} messages as read`);
        await Promise.all(
          unreadMsgs.map(m => base44.entities.StudyPartnerMessage.update(m.id, { is_read: true, status: 'read' }).catch(err => {
            console.warn("Failed to mark message as read:", m.id, err);
          }))
        );
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const loadOlderMessages = async () => {
    if (loadingRef.current || !hasMoreOlder) return;
    loadingRef.current = true;
    setLoadingOlder(true);
    await loadMessages(messages.length);
    setLoadingOlder(false);
    loadingRef.current = false;
  };

  const loadPresence = async () => {
    try {
      const records = await base44.entities.UserPresence.filter({ user_email: partner.email });
      if (records.length > 0) setPartnerPresence(resolvePresence(records[0]));
    } catch (error) {
      console.warn("Failed to load presence:", error);
    }
  };

  const togglePref = (key) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    notificationService.setPreferences(newPrefs);
    if (key === 'push' && newPrefs.push && !notificationsEnabled) {
      notificationService.requestNotificationPermission().then(granted => {
        setNotificationsEnabled(granted);
        if (!granted) {
          toast.error("Permissão para notificações negada pelo navegador.");
          const fallback = { ...newPrefs, push: false };
          setPrefs(fallback);
          notificationService.setPreferences(fallback);
        }
      });
    }
  };



  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const content = text.trim();

    try {
      setText("");
      
      // Backend function handles connection validation + message creation
      await base44.functions.invoke('sendStudyPartnerMessage', {
        receiver_email: partner.email,
        content
      });

      toast.success("Mensagem enviada!");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error(error.response?.data?.error || "Erro ao enviar mensagem. Tente novamente.");
      setText(content); // Restore text on error
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  };

  const handleClearMessages = async (e) => {
    e?.preventDefault();
    if (!window.confirm("Tem certeza que deseja limpar o histórico desta conversa?")) return;
    try {
      await base44.functions.invoke('clearStudyPartnerMessages', { partner_email: partner.email });
      setMessages([]);
      toast.success("Histórico apagado com sucesso.");
    } catch (err) {
      toast.error("Erro ao apagar histórico.");
    }
  };



  const isScrolledToBottom = () => {
    if (isMinimized) return false;
    if (!messagesEnd.current) return true;
    const container = containerRef.current;
    if (container) {
       return container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    }
    return true;
  };

  useEffect(() => {
    // When maximizing, scroll to bottom to mark messages as read
    if (!isMinimized && messagesEnd.current) {
      messagesEnd.current.scrollIntoView({ behavior: "smooth" });
      if (showNewMessageIndicator || unreadCount > 0) {
        setShowNewMessageIndicator(false);
        setUnreadCount(0);
        const unreadMsgs = messages.filter(m => m.receiver_email === currentUser.email && !m.is_read);
        if (unreadMsgs.length > 0) {
          Promise.all(
            unreadMsgs.map(m => base44.entities.StudyPartnerMessage.update(m.id, { is_read: true, status: 'read' }).catch(() => {}))
          );
          setMessages(prev => prev.map(m => unreadMsgs.find(u => u.id === m.id) ? { ...m, is_read: true, status: 'read' } : m));
        }
      }
    }
  }, [isMinimized]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col w-full h-full bg-gray-50 dark:bg-gray-900 overflow-hidden"
    >
      {/* Header */}
      <div 
        className={`flex items-center justify-between gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0 cursor-pointer ${isMinimized ? 'h-full relative' : ''}`}
        onClick={(e) => {
          if (onToggleMinimize && !e.target.closest('button') && !e.target.closest('[role="menuitem"]')) {
            onToggleMinimize();
          }
        }}
      >
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <Avatar className="w-8 h-8 border border-white/20">
            <AvatarImage src={partner.profile_photo_url} />
            <AvatarFallback className="bg-blue-800 text-xs">{partner.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{partner.name}</p>
            {partnerPresence?.display === "online" ? (
               <p className="text-xs text-blue-100 flex items-center gap-1">
                 <span className="w-2 h-2 rounded-full bg-green-400" /> Online
               </p>
            ) : (
               <p className="text-[10px] text-blue-200 truncate">
                 {partnerPresence?.last_seen ? `visto ${formatDistanceToNow(new Date(partnerPresence.last_seen), { addSuffix: true, locale: ptBR })}` : 'Offline'}
               </p>
            )}
          </div>
          {unreadCount > 0 && isMinimized && (
            <div className="absolute top-1/2 -translate-y-1/2 right-12 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
              {unreadCount}
            </div>
          )}
        </div>

        {/* Settings inside header */}
        {!isMinimized && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-7 w-7" onClick={(e) => { e.stopPropagation(); setIsSearching(!isSearching); if(isSearching) setSearchQuery(""); }}>
              <Search className="w-4 h-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-7 w-7">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 text-sm">
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); togglePref('push'); }} className="flex items-center justify-between cursor-pointer">
                  <span>Notificações Push</span>
                  {prefs.push ? <span className="text-green-500">Ativo</span> : <span className="text-gray-400">Inativo</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); togglePref('sound'); }} className="flex items-center justify-between cursor-pointer">
                  <span>Som no Chat</span>
                  {prefs.sound ? <span className="text-green-500">Ativo</span> : <span className="text-gray-400">Inativo</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleClearMessages} className="flex items-center text-red-500 cursor-pointer mt-1 border-t">
                  <Trash2 className="w-4 h-4 mr-2" />
                  <span>Limpar Histórico</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-7 w-7" onClick={(e) => { e.stopPropagation(); if(onToggleMinimize) onToggleMinimize(); }}>
              <Minus className="w-4 h-4" />
            </Button>

            <Button variant="ghost" size="icon" className="text-white hover:bg-red-500 hover:text-white h-7 w-7" onClick={(e) => { e.stopPropagation(); onClose(); }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        {isMinimized && (
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-7 w-7" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {!isMinimized && (
        <>
      {isSearching && (
        <div className="bg-white dark:bg-gray-800 p-2 flex items-center border-b dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
          <Search className="w-4 h-4 text-gray-500 mr-2" />
          <input
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar mensagens..."
            className="flex-1 bg-transparent text-sm outline-none text-gray-700 dark:text-gray-200"
          />
          <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-500" onClick={() => { setIsSearching(false); setSearchQuery(""); }}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Debug Panel */}
      {showDebug && (
        <div className="p-3 bg-gray-900 border-b border-gray-700 max-h-60 overflow-y-auto">
          <ChatDebugValidator 
            convKey={convKey}
            currentUserEmail={currentUser.email}
            partnerEmail={partner.email}
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 bg-[#e5ddd5] dark:bg-gray-900 relative" ref={containerRef}>
        {loadingOlder && (
          <div className="flex justify-center py-2">
            <span className="bg-white/80 dark:bg-gray-800 text-gray-500 text-xs px-3 py-1 rounded-full shadow-sm flex items-center">
              <Loader2 className="w-3 h-3 animate-spin mr-2" /> Carregando...
            </span>
          </div>
        )}
        <div ref={messagesStart} />
        {messages.length === 0 && (
          <div className="flex justify-center mt-4">
            <span className="bg-[#fff3c4] text-[#856404] text-xs px-3 py-1.5 rounded-lg text-center shadow-sm">
              As mensagens são protegidas de ponta a ponta.
            </span>
          </div>
        )}
        {messages.filter(msg => !searchQuery || msg.content.toLowerCase().includes(searchQuery.toLowerCase())).map((msg, i, arr) => {
          const isMe = msg.sender_email === currentUser.email;
          const timeObj = msg.timestamp ? new Date(msg.timestamp) : new Date(msg.created_date);
          const time = timeObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

          return (
            <div key={msg.id} className={`flex flex-col mb-1.5 ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-1.5 shadow-sm relative ${isMe ? 'bg-[#dcf8c6] dark:bg-green-900 rounded-tr-none text-gray-800 dark:text-gray-100' : 'bg-white dark:bg-gray-800 rounded-tl-none text-gray-800 dark:text-gray-100'}`}>
                <div className="text-[14px] leading-snug whitespace-pre-wrap break-words">{msg.content}</div>
                <div className="flex items-center justify-end gap-1 mt-0.5 min-w-[40px]">
                  <span className="text-[10px] text-gray-500/80 dark:text-gray-400">{time}</span>
                  {isMe && (
                    <span className="text-[12px] flex items-center -mb-0.5">
                      {msg.status === 'read' || msg.is_read ? (
                        <span className="text-blue-500 font-bold tracking-tighter">✓✓</span>
                      ) : msg.status === 'delivered' ? (
                        <span className="text-gray-400 font-bold tracking-tighter">✓✓</span>
                      ) : (
                        <span className="text-gray-400 font-bold">✓</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEnd} />
        
        {/* New message indicator */}
        <AnimatePresence>
          {showNewMessageIndicator && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute bottom-2 left-0 right-0 flex justify-center"
            >
              <button
                onClick={() => messagesEnd.current?.scrollIntoView({ behavior: "smooth" })}
                className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 text-xs px-4 py-1.5 rounded-full shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1 font-semibold"
              >
                <ChevronDown className="w-4 h-4" /> Novas mensagens
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-2 bg-[#f0f0f0] dark:bg-gray-800 flex items-end gap-2 flex-shrink-0 z-10">
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" className="h-10 w-10 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 flex-shrink-0 rounded-full">
              <Smile className="w-6 h-6" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-64 p-2 z-[150] bg-white dark:bg-gray-800" onOpenAutoFocus={(e) => e.preventDefault()}>
            <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto custom-scrollbar">
              {EMOJIS.map(emoji => (
                <button 
                  key={emoji} 
                  onClick={() => setText(prev => prev + emoji)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-lg cursor-pointer transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        
        <div className="flex-1 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-transparent overflow-hidden">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Digite uma mensagem"
            className="w-full text-sm h-10 border-none shadow-none focus-visible:outline-none px-3 bg-transparent text-gray-800 dark:text-gray-100"
            disabled={sending}
          />
        </div>
        
        {text.trim() && (
          <Button 
            size="icon" 
            onClick={sendMessage} 
            disabled={sending} 
            className="h-10 w-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-sm flex-shrink-0 transition-transform active:scale-95"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
          </Button>
        )}
      </div>
        </>
      )}
    </motion.div>
  );
}