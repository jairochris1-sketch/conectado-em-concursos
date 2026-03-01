import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { X, Send, Loader2, Circle, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const HEARTBEAT_INTERVAL = 30_000; // 30s
const ONLINE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes

function getConversationKey(emailA, emailB) {
  return [emailA, emailB].sort().join("|");
}

function PresenceDot({ status, lastSeen }) {
  if (status === "online") {
    return (
      <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
        <Circle className="w-2 h-2 fill-green-500 text-green-500" /> Online
      </span>
    );
  }
  if (status === "invisible") {
    return (
      <span className="flex items-center gap-1 text-xs text-gray-400">
        <Circle className="w-2 h-2 fill-gray-300 text-gray-300" /> Offline
      </span>
    );
  }
  // offline
  if (lastSeen) {
    const ago = formatDistanceToNow(new Date(lastSeen), { addSuffix: true, locale: ptBR });
    return (
      <span className="flex items-center gap-1 text-xs text-gray-400">
        <Circle className="w-2 h-2 fill-gray-300 text-gray-300" /> Visto {ago}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-gray-400">
      <Circle className="w-2 h-2 fill-gray-300 text-gray-300" /> Offline
    </span>
  );
}

export default function StudyPartnerChat({ currentUser, partner, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [partnerPresence, setPartnerPresence] = useState(null);
  const [myStatus, setMyStatus] = useState("online"); // online | invisible
  const [myPresenceId, setMyPresenceId] = useState(null);
  const messagesEnd = useRef(null);
  const convKey = getConversationKey(currentUser.email, partner.email);

  // scroll to bottom on new messages
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load messages and subscribe
  useEffect(() => {
    loadMessages();
    loadPresence();

    const unsub = base44.entities.StudyPartnerMessage.subscribe((event) => {
      if (event.data?.conversation_key === convKey) {
        if (event.type === "create") {
          setMessages((prev) => {
            if (prev.some(m => m.id === event.data.id)) return prev;
            return [...prev, event.data];
          });
          // Mark as read if we're the receiver
          if (event.data.receiver_email === currentUser.email) {
            base44.entities.StudyPartnerMessage.update(event.data.id, { is_read: true }).catch(() => {});
          }
        }
      }
    });

    // Presence subscription
    const unsubPresence = base44.entities.UserPresence.subscribe((event) => {
      if (event.data?.user_email === partner.email) {
        setPartnerPresence(event.data);
      }
    });

    return () => { unsub(); unsubPresence(); };
  }, [convKey, partner.email]);

  // Heartbeat - update my presence
  useEffect(() => {
    initMyPresence();
    const interval = setInterval(updateMyPresence, HEARTBEAT_INTERVAL);
    return () => {
      clearInterval(interval);
      // Set offline on unmount
      if (myPresenceId) {
        base44.entities.UserPresence.update(myPresenceId, { status: "offline" }).catch(() => {});
      }
    };
  }, [myPresenceId]);

  const initMyPresence = async () => {
    const existing = await base44.entities.UserPresence.filter({ user_email: currentUser.email });
    if (existing.length > 0) {
      setMyPresenceId(existing[0].id);
      setMyStatus(existing[0].status === "invisible" ? "invisible" : "online");
      await base44.entities.UserPresence.update(existing[0].id, {
        last_seen: new Date().toISOString(),
        status: existing[0].status === "invisible" ? "invisible" : "online"
      });
    } else {
      const record = await base44.entities.UserPresence.create({
        user_email: currentUser.email,
        last_seen: new Date().toISOString(),
        status: "online"
      });
      setMyPresenceId(record.id);
    }
  };

  const updateMyPresence = async () => {
    if (!myPresenceId) return;
    await base44.entities.UserPresence.update(myPresenceId, {
      last_seen: new Date().toISOString(),
      status: myStatus
    }).catch(() => {});
  };

  const loadMessages = async () => {
    const msgs = await base44.entities.StudyPartnerMessage.filter({ conversation_key: convKey });
    setMessages(msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
    // Mark unread ones as read
    msgs.filter(m => m.receiver_email === currentUser.email && !m.is_read).forEach(m => {
      base44.entities.StudyPartnerMessage.update(m.id, { is_read: true }).catch(() => {});
    });
  };

  const loadPresence = async () => {
    const records = await base44.entities.UserPresence.filter({ user_email: partner.email });
    if (records.length > 0) {
      const p = records[0];
      // Check if really online (within 3 min) or treat as offline
      const lastSeenMs = p.last_seen ? Date.now() - new Date(p.last_seen).getTime() : Infinity;
      if (p.status === "invisible") {
        setPartnerPresence({ ...p, status: "offline" }); // show as offline
      } else if (p.status === "online" && lastSeenMs < ONLINE_THRESHOLD_MS) {
        setPartnerPresence({ ...p, status: "online" });
      } else {
        setPartnerPresence({ ...p, status: "offline" });
      }
    }
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    setSending(true);
    const content = text.trim();
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

  const toggleInvisible = async () => {
    const newStatus = myStatus === "invisible" ? "online" : "invisible";
    setMyStatus(newStatus);
    if (myPresenceId) {
      await base44.entities.UserPresence.update(myPresenceId, {
        status: newStatus,
        last_seen: new Date().toISOString()
      });
    }
    toast.success(newStatus === "invisible" ? "Você está invisível" : "Você está visível");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col w-full h-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="relative">
          <Avatar className="w-9 h-9">
            <AvatarImage src={partner.photo} />
            <AvatarFallback className="text-sm bg-green-800">{partner.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          {partnerPresence?.status === "online" && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{partner.name}</p>
          {partnerPresence && (
            <PresenceDot status={partnerPresence.status} lastSeen={partnerPresence.last_seen} />
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          title={myStatus === "invisible" ? "Ficar visível" : "Ficar invisível"}
          className="text-white hover:bg-green-600 w-8 h-8"
          onClick={toggleInvisible}
        >
          {myStatus === "invisible" ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="text-white hover:bg-green-600 w-8 h-8" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-gray-800">
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
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex gap-2">
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