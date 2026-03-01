import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { User } from '@/entities/User';
import { toast } from 'sonner';

export default function NotificationCenter({ children }) {
  const [user, setUser] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({
    messages: 0,
    partnerships: 0,
    replies: 0
  });
  const [preferences, setPreferences] = useState({
    messages: true,
    partnerships: true,
    replies: true,
    likes: true,
    activities: true
  });

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      // Load user preferences from profile
      if (userData.notification_preferences) {
        setPreferences(userData.notification_preferences);
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    }
  };

  // Subscribe to study partner messages
  useEffect(() => {
    if (!user?.email) return;

    const unsubscribe = base44.entities.StudyPartnerMessage.subscribe((event) => {
      if (event.type === 'create' && event.data.receiver_email === user.email && preferences.messages) {
        setUnreadCounts(prev => ({
          ...prev,
          messages: prev.messages + 1
        }));
        
        showNotification({
          title: `💬 Nova mensagem de ${event.data.sender_name}`,
          message: event.data.content.substring(0, 60) + (event.data.content.length > 60 ? '...' : ''),
          duration: 4
        });
      }
    });

    return unsubscribe;
  }, [user?.email, preferences.messages]);

  // Subscribe to study partner requests
  useEffect(() => {
    if (!user?.email) return;

    const unsubscribe = base44.entities.StudyPartner.subscribe((event) => {
      if (event.type === 'create' && event.data.target_email === user.email && preferences.partnerships) {
        setUnreadCounts(prev => ({
          ...prev,
          partnerships: prev.partnerships + 1
        }));
        
        showNotification({
          title: `👥 ${event.data.requester_name} quer ser seu parceiro`,
          message: 'Clique para aceitar ou recusar o convite',
          duration: 5
        });
      }
    });

    return unsubscribe;
  }, [user?.email, preferences.partnerships]);

  // Subscribe to forum replies
  useEffect(() => {
    if (!user?.email) return;

    const unsubscribe = base44.entities.ForumReply.subscribe((event) => {
      if (event.type === 'create' && event.data.post_author_email === user.email && preferences.replies) {
        setUnreadCounts(prev => ({
          ...prev,
          replies: prev.replies + 1
        }));
        
        showNotification({
          title: `💬 Novo comentário no seu post`,
          message: `${event.data.user_name}: ${event.data.reply_text.substring(0, 50)}...`,
          duration: 4
        });
      }
    });

    return unsubscribe;
  }, [user?.email, preferences.replies]);

  const showNotification = ({ title, message, duration = 4 }) => {
    toast.custom((t) => (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 w-96 max-w-full animate-in fade-in slide-in-from-right-5">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{title}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{message}</p>
          </div>
        </div>
      </div>
    ), { duration: duration * 1000 });
  };

  const updatePreferences = async (newPreferences) => {
    try {
      setPreferences(newPreferences);
      await User.update(user.id, {
        notification_preferences: newPreferences
      });
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
      toast.error('Erro ao salvar preferências');
    }
  };

  const clearUnreadCount = (type) => {
    setUnreadCounts(prev => ({
      ...prev,
      [type]: 0
    }));
  };

  return children({
    user,
    unreadCounts,
    preferences,
    updatePreferences,
    clearUnreadCount
  });
}