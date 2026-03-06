import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { encryptEmail } from '@/components/security/emailCrypto';

export default function UserLink({ email, name, photo, className, children, onClick }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleClick = async (e) => {
    e.preventDefault();
    if (onClick) {
      onClick(e);
      if (e.isDefaultPrevented()) return;
    }
    
    if (loading) return;
    
    try {
      setLoading(true);
      const currentUser = await base44.auth.me();
      
      if (!currentUser || currentUser.email === email) {
        navigate(`${createPageUrl('UserProfile')}?u=${encryptEmail(email)}`);
        return;
      }

      // Check if they are accepted partners
      const [asSender, asReceiver] = await Promise.all([
        base44.entities.StudyPartner.filter({ 
          requester_email: currentUser.email, 
          target_email: email,
          status: 'accepted'
        }),
        base44.entities.StudyPartner.filter({ 
          requester_email: email, 
          target_email: currentUser.email,
          status: 'accepted'
        })
      ]);

      const isPartner = asSender.length > 0 || asReceiver.length > 0;

      if (isPartner) {
        // Open chat directly, don't navigate
        window.dispatchEvent(new CustomEvent('open-study-chat', { 
          detail: { 
            partner: { email, name, photo } 
          } 
        }));
      } else {
        // Navigate to profile
        navigate(`${createPageUrl('UserProfile')}?u=${encryptEmail(email)}`);
      }
    } catch (error) {
      console.error("Error checking partnership:", error);
      navigate(`${createPageUrl('UserProfile')}?u=${encryptEmail(email)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <a href="#" onClick={handleClick} className={`${className} ${loading ? 'opacity-70 pointer-events-none' : ''}`}>
      {children}
    </a>
  );
}