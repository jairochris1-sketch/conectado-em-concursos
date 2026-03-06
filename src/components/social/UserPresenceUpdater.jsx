import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function UserPresenceUpdater({ user }) {
  useEffect(() => {
    if (!user || !user.email) return;

    const updatePresence = async () => {
      try {
        const presenceRecords = await base44.entities.UserPresence.filter({ user_email: user.email });
        const data = {
          user_email: user.email,
          user_name: user.full_name || '',
          user_photo: user.profile_photo_url || '',
          last_seen: new Date().toISOString(),
          status: 'online'
        };

        if (presenceRecords.length > 0) {
          await base44.entities.UserPresence.update(presenceRecords[0].id, data);
        } else {
          await base44.entities.UserPresence.create(data);
        }
      } catch (err) {
        console.error("Failed to update presence", err);
      }
    };

    // Update immediately on mount
    updatePresence();
    
    // Then update every minute
    const interval = setInterval(updatePresence, 60000);

    return () => clearInterval(interval);
  }, [user]);

  return null;
}