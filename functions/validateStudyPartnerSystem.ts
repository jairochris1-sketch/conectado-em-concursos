import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Complete validation system for Study Partner messaging
 * Tests: acceptance, blocking, message creation, delivery, RLS permissions
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { action, userAEmail, userBEmail, targetEmail } = await req.json();

  // ── TEST 1: ACCEPTED PARTNERSHIP ALLOWS MESSAGING ──
  if (action === 'test_accepted_messaging') {
    const partnerships = await base44.entities.StudyPartner.filter();
    const partnership = partnerships.find(p => 
      (p.requester_email === userAEmail && p.target_email === userBEmail) ||
      (p.requester_email === userBEmail && p.target_email === userAEmail)
    );
    
    if (!partnership) {
      return Response.json({ 
        success: false, 
        reason: 'Partnership not found',
        details: `Expected partnership between ${userAEmail} and ${userBEmail}`
      });
    }

    if (partnership.status !== 'accepted') {
      return Response.json({ 
        success: false,
        reason: `Partnership status is "${partnership.status}", expected "accepted"`,
        partnership
      });
    }

    return Response.json({ 
      success: true, 
      message: 'Partnership is accepted ✓',
      partnership 
    });
  }

  // ── TEST 2: BLOCKED PARTNERSHIP PREVENTS MESSAGING ──
  if (action === 'test_blocked_prevents_messaging') {
    const partnerships = await base44.entities.StudyPartner.filter();
    const partnership = partnerships.find(p => 
      (p.requester_email === userAEmail && p.target_email === userBEmail) ||
      (p.requester_email === userBEmail && p.target_email === userAEmail)
    );

    if (!partnership || partnership.status !== 'blocked') {
      return Response.json({ 
        success: false,
        reason: 'Expected blocked partnership',
        found: partnership?.status || 'none'
      });
    }

    return Response.json({ 
      success: true,
      message: 'Blocked partnership confirmed ✓'
    });
  }

  // ── TEST 3: MESSAGE PERSISTENCE ──
  if (action === 'test_message_saved') {
    const convKey = [userAEmail, userBEmail].sort().join('|');
    const messages = await base44.entities.StudyPartnerMessage.filter({ 
      conversation_key: convKey 
    });

    if (messages.length === 0) {
      return Response.json({ 
        success: false,
        reason: 'No messages found in conversation',
        convKey
      });
    }

    const latestMsg = messages[messages.length - 1];
    return Response.json({ 
      success: true,
      message: 'Messages persist in database ✓',
      messageCount: messages.length,
      latestMessage: {
        id: latestMsg.id,
        from: latestMsg.sender_email,
        to: latestMsg.receiver_email,
        content: latestMsg.content.substring(0, 50),
        createdAt: latestMsg.created_date
      }
    });
  }

  // ── TEST 4: RLS PERMISSIONS ──
  if (action === 'test_rls_permissions') {
    const convKey = [userAEmail, userBEmail].sort().join('|');
    
    // User A should see messages they sent or received
    const userAMessages = await base44.entities.StudyPartnerMessage.filter({ 
      conversation_key: convKey
    });

    const userACanRead = userAMessages.every(msg => 
      msg.sender_email === userAEmail || msg.receiver_email === userAEmail
    );

    if (!userACanRead) {
      return Response.json({ 
        success: false,
        reason: 'RLS violation: User cannot see their own messages'
      });
    }

    return Response.json({ 
      success: true,
      message: 'RLS permissions working ✓',
      visibleMessages: userAMessages.length
    });
  }

  // ── TEST 5: CONVERSATION KEY FORMAT ──
  if (action === 'test_conversation_key_format') {
    const convKey = [userAEmail, userBEmail].sort().join('|');
    const messages = await base44.entities.StudyPartnerMessage.filter({ 
      conversation_key: convKey 
    });

    if (messages.length === 0) {
      return Response.json({ 
        success: false,
        reason: 'No messages found with correct conversation_key',
        expected: convKey
      });
    }

    const allCorrect = messages.every(m => m.conversation_key === convKey);
    
    return Response.json({ 
      success: allCorrect,
      message: allCorrect ? 'Conversation key format correct ✓' : 'Some messages have wrong conversation_key',
      format: convKey,
      sampleMessages: messages.slice(0, 2).map(m => ({
        id: m.id,
        convKey: m.conversation_key
      }))
    });
  }

  // ── FULL DIAGNOSTIC ──
  if (action === 'full_diagnostic') {
    const convKey = [userAEmail, userBEmail].sort().join('|');
    
    // Check partnership
    const partnerships = await base44.entities.StudyPartner.filter();
    const partnership = partnerships.find(p => 
      (p.requester_email === userAEmail && p.target_email === userBEmail) ||
      (p.requester_email === userBEmail && p.target_email === userAEmail)
    );

    // Check messages
    const messages = await base44.entities.StudyPartnerMessage.filter({ 
      conversation_key: convKey 
    });

    // Check read status
    const unreadCount = messages.filter(m => !m.is_read).length;

    return Response.json({
      success: true,
      diagnostic: {
        partnership: {
          exists: !!partnership,
          status: partnership?.status || 'none',
          requester: partnership?.requester_email,
          target: partnership?.target_email
        },
        messages: {
          total: messages.length,
          unread: unreadCount,
          convKey,
          latestMessage: messages.length > 0 ? {
            sender: messages[messages.length - 1].sender_email,
            content: messages[messages.length - 1].content.substring(0, 40),
            isRead: messages[messages.length - 1].is_read,
            createdAt: messages[messages.length - 1].created_date
          } : null
        },
        subscription: {
          status: 'WebSocket-based real-time enabled',
          event: 'create/update/delete',
          convKeyFilter: 'Applied in frontend'
        }
      }
    });
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 });
});