import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function UserPresenceUpdater({ user }) {
  useEffect(() => {
    if (!user || !user.email) return;

    let currentRecordId = null;

    const updatePresence = async (status = 'online') => {
      try {
        const presenceRecords = await base44.entities.UserPresence.filter({ user_email: user.email });
        const data = {
          user_email: user.email,
          user_name: user.full_name || '',
          user_photo: user.profile_photo_url || '',
          last_seen: new Date().toISOString(),
          status: status
        };

        if (presenceRecords.length > 0) {
          currentRecordId = presenceRecords[0].id;
          await base44.entities.UserPresence.update(currentRecordId, data);
        } else {
          const newRecord = await base44.entities.UserPresence.create(data);
          currentRecordId = newRecord.id;
        }
      } catch (err) {
        console.error("Failed to update presence", err);
      }
    };

    // Update immediately on mount
    updatePresence();
    
    // Then update every 30 seconds
    const interval = setInterval(() => updatePresence(), 30000);

    const handleUnload = () => {
      if (currentRecordId) {
        base44.entities.UserPresence.update(currentRecordId, { status: 'offline' });
      }
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
    };
  }, [user]);

  return null;
}