import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { User } from '@/entities/User';

export function useNotifications() {
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      if (userData.notification_preferences) {
        setPreferences(userData.notification_preferences);
      }
      
      // Load unread counts
      await loadUnreadCounts(userData.email);
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUnreadCounts = async (userEmail) => {
    try {
      const [unreadMessages, pendingPartnerships, unreadReplies] = await Promise.all([
        base44.entities.StudyPartnerMessage.filter({
          receiver_email: userEmail,
          is_read: false
        }),
        base44.entities.StudyPartner.filter({
          target_email: userEmail,
          status: 'pending'
        }),
        base44.entities.ForumReply.filter({
          post_author_email: userEmail,
          is_read: false
        })
      ]);

      setUnreadCounts({
        messages: unreadMessages.length,
        partnerships: pendingPartnerships.length,
        replies: unreadReplies.length
      });
    } catch (error) {
      console.error('Erro ao carregar contagem de não lidos:', error);
    }
  };

  const updatePreferences = useCallback(async (newPreferences) => {
    try {
      setPreferences(newPreferences);
      if (user) {
        await User.update(user.id, {
          notification_preferences: newPreferences
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
      throw error;
    }
  }, [user]);

  const clearUnreadCount = useCallback((type) => {
    setUnreadCounts(prev => ({
      ...prev,
      [type]: 0
    }));
  }, []);

  const getTotalUnread = useCallback(() => {
    return Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  }, [unreadCounts]);

  return {
    user,
    unreadCounts,
    preferences,
    isLoading,
    updatePreferences,
    clearUnreadCount,
    getTotalUnread,
    loadUnreadCounts
  };
}