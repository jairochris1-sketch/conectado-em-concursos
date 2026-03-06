import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { encryptEmail } from "@/components/security/emailCrypto";

export default function OnlineUsersSidebar() {
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    let active = true;

    const fetchOnlineUsers = async () => {
      try {
        // Fetch recently active users
        const records = await base44.entities.UserPresence.list('-last_seen', 100);
        
        if (active) {
            const now = new Date();
            const activeUsers = records.filter(record => {
                if (record.status === 'invisible') return false;
                if (!record.last_seen) return false;
                const lastSeen = new Date(record.last_seen);
                return (now - lastSeen) < 3 * 60 * 1000; // 3 minutes threshold
            });
            setOnlineUsers(activeUsers);
        }
      } catch (err) {
        console.error("Failed to fetch online users", err);
      }
    };

    fetchOnlineUsers();
    
    // Subscribe to presence changes
    const unsubscribe = base44.entities.UserPresence.subscribe((event) => {
        fetchOnlineUsers();
    });

    const interval = setInterval(fetchOnlineUsers, 30000);

    return () => {
      active = false;
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 sticky top-24 shadow-sm">
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        Usuários Online ({onlineUsers.length})
      </h3>
      
      {onlineUsers.length === 0 ? (
        <p className="text-sm text-gray-400">Nenhum usuário online.</p>
      ) : (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
          {onlineUsers.map(user => (
            <div key={user.id} className="flex items-center gap-3 hover:bg-slate-700/50 p-2 -mx-2 rounded-lg transition-colors">
              <div className="relative flex-shrink-0">
                  <Avatar className="w-8 h-8 ring-2 ring-slate-800">
                  <AvatarImage src={user.user_photo} />
                  <AvatarFallback className="bg-slate-700 text-slate-300">{user.user_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-800 rounded-full"></div>
              </div>
              <Link 
                  to={createPageUrl("UserProfile") + `?u=${encryptEmail(user.user_email)}`} 
                  className="text-sm font-medium text-slate-200 hover:text-blue-400 truncate flex-1"
              >
                {user.user_name || 'Usuário'}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}