
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Notification } from '@/entities/Notification';
import { User } from '@/entities/User';
import { motion, AnimatePresence } from 'framer-motion'; // AnimatePresence and motion are not used in new rendering, but kept as imports if there are other usages.
import { createPageUrl } from '@/utils'; // Not used in this component, but kept as existing import.

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false); // Added for dropdown state

  // Removed `readNotifications` state and its associated `useEffect` logic
  // as the new approach focuses on `notification.read_by` stored in the database.

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      const allNotifications = await Notification.list('-created_date', 50);
      
      // Filtrar notificações relevantes para o usuário
      const userNotifications = allNotifications.filter(notif => {
        // Se não expirou
        if (notif.expires_at && new Date(notif.expires_at) < new Date()) {
          return false;
        }
        
        // Se é global ou direcionada especificamente para o usuário
        return notif.is_global || 
               (notif.target_users && notif.target_users.includes(userData.email));
      });

      setNotifications(userNotifications);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
    setIsLoading(false);
  };

  // Replaced old `markAsRead` and `handleNotificationClick` with the new combined function.
  const handleNotificationClick = async (notification) => {
    if (!user) return; // Ensure user is loaded

    try {
      let updatedReadBy = [...(notification.read_by || [])];
      // Only add user.email if it's not already in the read_by list
      if (!updatedReadBy.includes(user.email)) {
        updatedReadBy.push(user.email);
        await Notification.update(notification.id, { read_by: updatedReadBy });
      }
      
      // Update local state to reflect the change
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id 
            ? { ...n, read_by: updatedReadBy }
            : n
        )
      );
      
      // Fechar dropdown
      setIsOpen(false);
      
      // Redirecionar se houver URL
      if (notification.action_url) {
        window.location.href = notification.action_url;
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      // Filter for notifications not yet marked as read by the current user
      const unreadNotifications = notifications.filter(n => 
        !(n.read_by || []).includes(user.email)
      );

      // Prepare and execute all updates concurrently
      const updatePromises = unreadNotifications.map(async (notification) => {
        let readBy = notification.read_by || [];
        if (!readBy.includes(user.email)) { // Prevent adding duplicate emails
          readBy.push(user.email);
          return Notification.update(notification.id, { read_by: readBy });
        }
        return Promise.resolve(); // If already read, no backend update is needed
      });
      await Promise.all(updatePromises); // Wait for all database updates to complete

      // Update local state for all notifications
      setNotifications(prev => prev.map(n => {
        let currentReadBy = n.read_by || [];
        if (!currentReadBy.includes(user.email)) {
          return {
            ...n,
            read_by: [...currentReadBy, user.email]
          };
        }
        return n; // Notification was already marked as read by this user
      }));
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  // Simplified `isNotificationRead` to only check `read_by` array
  const isNotificationRead = (notification) => {
    return (notification.read_by || []).includes(user?.email);
  };

  const getUnreadCount = () => {
    if (!user) return 0;
    return notifications.filter(n => 
      !isNotificationRead(n)
    ).length;
  };

  // Removed `getNotificationIcon` and `getNotificationStyle` as they are no longer used in the new rendering.

  const unreadCount = getUnreadCount();
  const unreadNotifications = notifications.filter(n => !isNotificationRead(n));

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-white hover:bg-black/10">
          <Bell className="w-5 h-5" />
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
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Notificações</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs dark:text-blue-400 dark:hover:bg-gray-800"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>

        {/* Removed isLoading check as per outline; directly check unreadNotifications length */}
        {unreadNotifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma notificação nova</p>
          </div>
        ) : (
          <div className="space-y-1">
            {unreadNotifications.map(notification => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className="w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                    notification.type === 'error' ? 'bg-red-500' :
                    notification.type === 'warning' ? 'bg-yellow-500' :
                    notification.type === 'success' ? 'bg-green-500' :
                    notification.type === 'new_material' ? 'bg-blue-500' :
                    'bg-blue-500' // Default color
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(notification.created_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
