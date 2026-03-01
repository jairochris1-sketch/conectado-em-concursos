import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { X, Send, Loader2, Circle, ChevronDown, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { studyPartnerSecurity } from "@/functions/studyPartnerSecurity";
import { notificationService } from "@/components/chat/notificationService";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

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

export default function StudyPartnerChat({ currentUser, partner, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [partnerPresence, setPartnerPresence] = useState(null);
  const [myStatus, setMyStatus] = useState("online");
  const [myPresenceId, setMyPresenceId] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);
  const [lastMessageId, setLastMessageId] = useState(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const messagesEnd = useRef(null);
  const messagesStart = useRef(null);
  const myStatusRef = useRef("online");
  const visibilityUnsubRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const loadingRef = useRef(false);
  const convKey = getConversationKey(currentUser.email, partner.email);

  // Initialize notifications
  useEffect(() => {
    const initNotifications = async () => {
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
    const container = document.querySelector('[data-chat-messages]');
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop < 100 && !loadingRef.current && hasMoreOlder) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          loadOlderMessages();
        }, 300);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeoutRef.current);
    };
  }, [hasMoreOlder]);

  // Load + subscribe to messages with notifications
  useEffect(() => {
    loadMessages();
    loadPresence();

    const unsub = base44.entities.StudyPartnerMessage.subscribe((event) => {
      if (event.data?.conversation_key === convKey && event.type === "create") {
        const isNewMessage = !messages.some(m => m.id === event.data.id);
        
        if (isNewMessage) {
          setMessages((prev) => [...prev, event.data]);
          setLastMessageId(event.data.id);

          // Handle notifications
          if (event.data.receiver_email === currentUser.email) {
            base44.entities.StudyPartnerMessage.update(event.data.id, { is_read: true }).catch(() => {});

            // Show notification if app is in background
            if (notificationsEnabled) {
              notificationService.showVisualNotification(
                event.data.content.substring(0, 50),
                event.data.sender_name
              );
            }

            // Show indicator if not scrolled to bottom
            if (!isScrolledToBottom()) {
              setShowNewMessageIndicator(true);
            }
          }
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
            unreadMsgs.map(m => base44.entities.StudyPartnerMessage.update(m.id, { is_read: true }).catch(() => {}))
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

  // Heartbeat
  useEffect(() => {
    initMyPresence();
    const interval = setInterval(() => {
      if (myPresenceId) {
        base44.entities.UserPresence.update(myPresenceId, {
          last_seen: new Date().toISOString(),
          status: myStatusRef.current
        }).catch(() => {});
      }
    }, HEARTBEAT_INTERVAL);
    return () => {
      clearInterval(interval);
      if (myPresenceId) {
        base44.entities.UserPresence.update(myPresenceId, { status: "offline" }).catch(() => {});
      }
    };
  }, [myPresenceId]);

  const initMyPresence = async () => {
    const existing = await base44.entities.UserPresence.filter({ user_email: currentUser.email });
    if (existing.length > 0) {
      const rec = existing[0];
      setMyPresenceId(rec.id);
      const savedStatus = rec.status === "invisible" ? "invisible" : "online";
      setMyStatus(savedStatus);
      myStatusRef.current = savedStatus;
      await base44.entities.UserPresence.update(rec.id, { last_seen: new Date().toISOString(), status: savedStatus });
    } else {
      const record = await base44.entities.UserPresence.create({
        user_email: currentUser.email, last_seen: new Date().toISOString(), status: "online"
      });
      setMyPresenceId(record.id);
    }
  };

  const loadMessages = async (skipCount = 0) => {
    const allMsgs = await base44.entities.StudyPartnerMessage.filter({ conversation_key: convKey });
    const sorted = allMsgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    const paginated = sorted.slice(Math.max(0, sorted.length - MESSAGES_PER_PAGE - skipCount), sorted.length - skipCount || undefined);
    
    setMessages(skipCount === 0 ? paginated : prev => [...paginated, ...prev]);
    setHasMoreOlder(sorted.length > MESSAGES_PER_PAGE + skipCount);
    
    const unreadMsgs = paginated.filter(m => m.receiver_email === currentUser.email && !m.is_read);
    if (unreadMsgs.length > 0) {
      await Promise.all(
        unreadMsgs.map(m => base44.entities.StudyPartnerMessage.update(m.id, { is_read: true }).catch(() => {}))
      );
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
    const records = await base44.entities.UserPresence.filter({ user_email: partner.email });
    if (records.length > 0) setPartnerPresence(resolvePresence(records[0]));
  };

  const changeMyStatus = async (newStatus) => {
    setMyStatus(newStatus);
    myStatusRef.current = newStatus;
    if (myPresenceId) {
      await base44.entities.UserPresence.update(myPresenceId, {
        status: newStatus, last_seen: new Date().toISOString()
      });
    }
    const label = STATUS_OPTIONS.find(s => s.value === newStatus)?.label;
    toast.success(`Status: ${label}`);
  };

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const content = text.trim();

    // Security check via backend
    const res = await studyPartnerSecurity({ action: "check_message", targetEmail: partner.email, content });
    if (!res.data?.allowed) {
      toast.error(res.data?.reason || "Não foi possível enviar a mensagem.");
      setSending(false);
      return;
    }

    setText("");
    await base44.entities.StudyPartnerMessage.create({
      sender_email: currentUser.email,
      sender_name: currentUser.full_name,
      sender_photo: currentUser.profile_photo_url || "",
      receiver_email: partner.email,
      content,
      conversation_key: convKey,
      is_read: false
    });
    setSending(false);
  };

  const currentStatusOption = STATUS_OPTIONS.find(s => s.value === myStatus) || STATUS_OPTIONS[0];

  const isScrolledToBottom = () => {
    if (!messagesEnd.current) return true;
    return messagesEnd.current.scrollIntoView ? true : false;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col w-full h-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-600 to-green-700 text-white flex-shrink-0">
        <div className="relative">
          <Avatar className="w-9 h-9">
            <AvatarImage src={partner.photo} />
            <AvatarFallback className="text-sm bg-green-800">{partner.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          {partnerPresence?.display === "online" && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{partner.name}</p>
          <PresenceDot presence={partnerPresence} />
        </div>

        {/* My status selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-white hover:bg-green-600 text-xs gap-1 px-2">
              {currentStatusOption.label} <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {STATUS_OPTIONS.map(opt => (
              <DropdownMenuItem key={opt.value} onClick={() => changeMyStatus(opt.value)} className={opt.color}>
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {notificationsEnabled && (
          <div className="flex items-center gap-1 text-green-100 text-xs px-2 py-1 rounded bg-green-700">
            <Bell className="w-3 h-3" /> Notificações ativas
          </div>
        )}
        
        <Button variant="ghost" size="icon" className="text-white hover:bg-green-600 w-8 h-8" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-gray-800 relative" data-chat-messages>
        {loadingOlder && (
          <div className="text-center text-gray-400 text-xs py-2">
            <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> Carregando mensagens antigas...
          </div>
        )}
        <div ref={messagesStart} />
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-8">Nenhuma mensagem ainda. Diga olá! 👋</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_email === currentUser.email;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              {!isMe && (
                <Avatar className="w-6 h-6 mr-1.5 mt-1 flex-shrink-0">
                  <AvatarImage src={msg.sender_photo} />
                  <AvatarFallback className="text-xs">{msg.sender_name?.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                isMe
                  ? "bg-green-600 text-white rounded-br-sm"
                  : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm shadow-sm"
              }`}>
                <p>{msg.content}</p>
                <p className={`text-xs mt-0.5 ${isMe ? "text-green-100" : "text-gray-400"}`}>
                  {new Date(msg.created_date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  {isMe && msg.is_read && " ✓✓"}
                </p>
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
              className="absolute bottom-16 left-0 right-0 flex justify-center"
            >
              <button
                onClick={() => messagesEnd.current?.scrollIntoView({ behavior: "smooth" })}
                className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg hover:bg-green-700 transition-colors flex items-center gap-1"
              >
                <Circle className="w-2 h-2 fill-white" /> Nova mensagem
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex gap-2 flex-shrink-0">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Digite uma mensagem..."
          className="flex-1 text-sm"
          disabled={sending}
        />
        <Button size="icon" onClick={sendMessage} disabled={sending || !text.trim()} className="bg-green-600 hover:bg-green-700 text-white w-9 h-9">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </motion.div>
  );
}