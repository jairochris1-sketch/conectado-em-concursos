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
      className="flex flex-col w-full h-full bg-white dark:bg-gray-900 overflow-hidden font-sans"
    >
      {/* Header */}
      <div 
        className={`flex items-center gap-1.5 px-2 py-1.5 bg-[#405a93] hover:bg-[#4b67a1] text-white flex-shrink-0 cursor-pointer ${isMinimized ? 'h-full relative border-b border-[#2d4373]' : ''}`}
        onClick={(e) => {
          if (onToggleMinimize && !e.target.closest('button') && !e.target.closest('[role="menuitem"]')) {
            onToggleMinimize();
          }
        }}
      >
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          <p className="font-bold text-[13px] truncate" style={{ textShadow: "0 1px 0 rgba(0,0,0,0.2)" }}>{partner.name}</p>
          {partnerPresence?.display === "online" ? (
             <span className="w-2 h-2 rounded-full bg-[#54c042] flex-shrink-0 shadow-[0_1px_1px_rgba(0,0,0,0.3)]" title="Online" />
          ) : (
             partnerPresence?.last_seen && (
               <span className="text-[10px] text-[#c1d0f0] truncate whitespace-nowrap">
                 visto {formatDistanceToNow(new Date(partnerPresence.last_seen), { addSuffix: true, locale: ptBR })}
               </span>
             )
          )}
          {unreadCount > 0 && isMinimized && (
            <div className="absolute -top-1.5 -left-1.5 bg-[#d92c2c] text-white text-[11px] font-bold px-[5px] py-[2px] rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.3)] leading-none z-50 border border-[#b22020]">
              {unreadCount}
            </div>
          )}
        </div>

        {/* Settings inside header for Facebook feel */}
        {!isMinimized && (
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="text-[#c1d0f0] hover:text-white hover:bg-transparent h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); setIsSearching(!isSearching); if(isSearching) setSearchQuery(""); }}>
              <Search className="w-[14px] h-[14px]" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-[#c1d0f0] hover:text-white hover:bg-transparent h-5 w-5 p-0">
                  <Settings className="w-[14px] h-[14px]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 text-[12px]">
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); togglePref('push'); }} className="flex items-center justify-between cursor-pointer py-2">
                  <span>Notificações Push</span>
                  {prefs.push ? <span className="text-[#54c042]">Ativo</span> : <span className="text-gray-400">Inativo</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); togglePref('sound'); }} className="flex items-center justify-between cursor-pointer py-2">
                  <span>Som no Chat</span>
                  {prefs.sound ? <span className="text-[#54c042]">Ativo</span> : <span className="text-gray-400">Inativo</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleClearMessages} className="flex items-center text-red-500 cursor-pointer py-2 mt-1 border-t">
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  <span>Limpar Histórico</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="ghost" size="icon" className="text-[#c1d0f0] hover:text-white hover:bg-transparent h-5 w-5 ml-0.5 p-0" onClick={(e) => { e.stopPropagation(); if(onToggleMinimize) onToggleMinimize(); }}>
              <Minus className="w-[14px] h-[14px]" />
            </Button>

            <Button variant="ghost" size="icon" className="text-[#c1d0f0] hover:text-white hover:bg-transparent w-5 h-5 ml-0.5 p-0" onClick={(e) => { e.stopPropagation(); onClose(); }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        {isMinimized && (
          <Button variant="ghost" size="icon" className="text-[#c1d0f0] hover:text-white hover:bg-transparent w-4 h-4 p-0" onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {!isMinimized && (
        <>
      {isSearching && (
        <div className="bg-[#f0f2f5] p-1.5 flex items-center border-b border-[#ddd]" onClick={(e) => e.stopPropagation()}>
          <Search className="w-3.5 h-3.5 text-gray-500 ml-1 mr-1.5" />
          <input
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar nas mensagens..."
            className="flex-1 bg-transparent text-[11px] outline-none px-1 text-gray-700"
          />
          <Button variant="ghost" size="icon" className="h-5 w-5 text-gray-500 hover:text-gray-700" onClick={() => { setIsSearching(false); setSearchQuery(""); }}>
            <X className="w-3 h-3" />
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
      <div className="flex-1 overflow-y-auto p-2 bg-white text-[12px] relative" ref={containerRef}>
        {loadingOlder && (
          <div className="text-center text-gray-400 text-[10px] py-1">
            <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> Carregando...
          </div>
        )}
        <div ref={messagesStart} />
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-xs mt-4">Nenhuma mensagem ainda.</p>
        )}
        {messages.filter(msg => !searchQuery || msg.content.toLowerCase().includes(searchQuery.toLowerCase())).map((msg, i, arr) => {
          const isMe = msg.sender_email === currentUser.email;
          const senderName = isMe ? currentUser.full_name?.split(' ')[0] : partner.name?.split(' ')[0];
          const timeObj = msg.timestamp ? new Date(msg.timestamp) : new Date(msg.created_date);
          const time = timeObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

          // Determine if we should show the header (if previous message is from someone else or > 5 mins ago)
          const prevMsg = arr[i - 1];
          const prevTimeObj = prevMsg ? (prevMsg.timestamp ? new Date(prevMsg.timestamp) : new Date(prevMsg.created_date)) : null;
          const showHeader = !prevMsg || prevMsg.sender_email !== msg.sender_email || 
                             (timeObj - prevTimeObj) > 5 * 60 * 1000;

          return (
            <div key={msg.id} className="mb-[2px] leading-snug">
              {showHeader && (
                <div className="flex items-end gap-1.5 mb-0.5 mt-[6px]">
                  <span className="font-bold text-[#3b5998]">{senderName}</span>
                  <span className="text-[10px] text-gray-400 mb-[1px]">{time}</span>
                </div>
              )}
              <div className="text-[#333333] pl-0 whitespace-pre-wrap break-words flex gap-1 items-end">
                <span>{msg.content}</span>
                {isMe && (
                  <span className="text-[10px] mb-0.5 shrink-0">
                    {msg.status === 'read' || msg.is_read ? (
                      <span className="text-blue-500 font-bold ml-1">✓✓</span>
                    ) : msg.status === 'delivered' ? (
                      <span className="text-gray-400 font-bold ml-1">✓✓</span>
                    ) : (
                      <span className="text-gray-400 font-bold ml-1">✓</span>
                    )}
                  </span>
                )}
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
              className="absolute bottom-1 left-0 right-0 flex justify-center"
            >
              <button
                onClick={() => messagesEnd.current?.scrollIntoView({ behavior: "smooth" })}
                className="bg-[#e9ebee] text-[#3b5998] border border-[#d3d6db] text-[10px] px-2 py-1 rounded shadow-sm hover:bg-[#d8dce6] transition-colors flex items-center gap-1 font-bold"
              >
                Novas mensagens
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-1 border-t border-[#b3c1df] bg-white flex flex-shrink-0 items-end z-10">
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
          placeholder="Digite uma mensagem..."
          className="flex-1 text-[12px] h-7 min-h-[28px] border-none shadow-none rounded-none focus-visible:outline-none px-1.5 py-1 bg-transparent"
          disabled={sending}
        />
        <div className="flex items-center px-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-[#c1d0f0] hover:bg-[#e9ebee] hover:text-[#3b5998] shadow-none flex-shrink-0 rounded-sm p-0">
                <Smile className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="end" className="w-64 p-2 z-[150]" onOpenAutoFocus={(e) => e.preventDefault()}>
              <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                {EMOJIS.map(emoji => (
                  <button 
                    key={emoji} 
                    onClick={() => setText(prev => prev + emoji)}
                    className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-base cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          {text.trim() && (
            <Button size="icon" onClick={sendMessage} disabled={sending} className="h-7 w-7 bg-transparent hover:bg-[#e9ebee] text-[#3b5998] shadow-none flex-shrink-0 rounded-sm ml-0.5 p-0">
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" /> : <Send className="w-3.5 h-3.5" />}
            </Button>
          )}
        </div>
      </div>
        </>
      )}
    </motion.div>
  );
}