import { useState, useEffect } from 'react';
import { Bell, CheckCheck, MessageSquare, Heart, UserPlus, Activity, Target, CalendarClock, BookOpenCheck, PlayCircle } from 'lucide-react';
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
// AnimatePresence and motion are not used in new rendering, but kept as imports if there are other usages.
// Not used in this component, but kept as existing import.

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

  useEffect(() => {
    if (!user) return;

    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.type === 'create' && event.data.user_email === user.email) {
        setNotifications(prev => [event.data, ...prev]);
      } else if (event.type === 'update') {
        setNotifications(prev => prev.map(n => n.id === event.id ? event.data : n));
      } else if (event.type === 'delete') {
        setNotifications(prev => prev.filter(n => n.id !== event.id));
      }
    });

    return unsubscribe;
  }, [user]);

  const loadNotifications = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      const userNotifications = await base44.entities.Notification.filter(
        { user_email: userData.email },
        '-created_date',
        50
      );

      setNotifications(userNotifications);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
    setIsLoading(false);
  };

  // Replaced old `markAsRead` and `handleNotificationClick` with the new combined function.
  const handleNotificationClick = async (notification) => {
    if (!user) return;

    try {
      if (!notification.is_read) {
        await base44.entities.Notification.update(notification.id, { is_read: true });
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        );
      }
      
      setIsOpen(false);
      
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
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      await Promise.all(
        unreadNotifications.map(n => 
          base44.entities.Notification.update(n.id, { is_read: true })
        )
      );

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.is_read).length;
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'reply': return <MessageSquare className="w-4 h-4" />;
      case 'like': return <Heart className="w-4 h-4" />;
      case 'follow': return <UserPlus className="w-4 h-4" />;
      case 'activity': return <Activity className="w-4 h-4" />;
      case 'simulation_ready': return <Target className="w-4 h-4" />;
      case 'simulation_incomplete': return <PlayCircle className="w-4 h-4" />;
      case 'contest_deadline': return <CalendarClock className="w-4 h-4" />;
      case 'new_questions': return <BookOpenCheck className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getIconColors = (type) => {
    switch(type) {
      case 'simulation_ready': return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300';
      case 'simulation_incomplete': return 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300';
      case 'contest_deadline': return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300';
      case 'new_questions': return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300';
      case 'reply': return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300';
      case 'like': return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300';
      case 'follow': return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Removed `getNotificationIcon` and `getNotificationStyle` as they are no longer used in the new rendering.

  const unreadCount = getUnreadCount();
  const recentNotifications = notifications.slice(0, 10);

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

        {recentNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma notificação</p>
          </div>
        ) : (
          <div>
            {recentNotifications.map(notification => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                  !notification.is_read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {notification.related_user_photo ? (
                    <Avatar className="w-8 h-8 mt-1">
                      <AvatarImage src={notification.related_user_photo} />
                      <AvatarFallback>{notification.related_user_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full mt-1 flex items-center justify-center ${getIconColors(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(notification.created_date).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: 'short'
                      })}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-2" />
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