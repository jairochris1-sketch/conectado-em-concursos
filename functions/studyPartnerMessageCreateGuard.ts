import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * CRITICAL: Backend guard that runs BEFORE message creation
 * This prevents frontend manipulation and enforces strict security
 * 
 * Use as entity automation on StudyPartnerMessage.create event
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return Response.json({ 
        error: 'Invalid JSON',
        allowed: false 
      }, { status: 400 });
    }

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ 
        error: 'Unauthorized',
        allowed: false 
      }, { status: 401 });
    }

    const messageData = body;

    // ── STRICT VALIDATION ──
    if (!messageData) {
      return Response.json({ 
        error: 'No message data provided',
        allowed: false 
      }, { status: 400 });
    }

    // 1. Verify sender is the authenticated user (prevent impersonation)
    if (messageData.sender_email !== user.email) {
      console.error(`SECURITY: User ${user.email} tried to send message as ${messageData.sender_email}`);
      return Response.json({ 
        error: 'Sender mismatch - impersonation attempt',
        allowed: false 
      }, { status: 403 });
    }

    // 2. Verify receiver email is valid
    if (!messageData.receiver_email || !messageData.receiver_email.includes('@')) {
      return Response.json({ 
        error: 'Invalid receiver email',
        allowed: false 
      }, { status: 400 });
    }

    // 3. Prevent self-messaging
    if (user.email === messageData.receiver_email) {
      return Response.json({ 
        error: 'Cannot send message to self',
        allowed: false 
      }, { status: 400 });
    }

    // 4. Validate content
    if (!messageData.content || !messageData.content.trim()) {
      return Response.json({ 
        error: 'Message content is empty',
        allowed: false 
      }, { status: 400 });
    }

    if (messageData.content.length > 5000) {
      return Response.json({ 
        error: 'Message is too long (max 5000 chars)',
        allowed: false 
      }, { status: 400 });
    }

    // 5. CRITICAL: Verify accepted partnership EXISTS
    const partnerships = await base44.entities.StudyPartner.filter();
    
    const hasAcceptedPartnership = partnerships.some(p => 
      ((p.requester_email === user.email && p.target_email === messageData.receiver_email) ||
       (p.requester_email === messageData.receiver_email && p.target_email === user.email)) &&
      p.status === 'accepted'
    );

    if (!hasAcceptedPartnership) {
      console.warn(`SECURITY: ${user.email} tried to send message to ${messageData.receiver_email} without accepted partnership`);
      return Response.json({ 
        error: 'No accepted partnership found',
        allowed: false 
      }, { status: 403 });
    }

    // 6. CRITICAL: Verify NOT blocked
    const isBlocked = partnerships.some(p => 
      ((p.requester_email === user.email && p.target_email === messageData.receiver_email) ||
       (p.requester_email === messageData.receiver_email && p.target_email === user.email)) &&
      p.status === 'blocked'
    );

    if (isBlocked) {
      console.warn(`SECURITY: ${user.email} tried to send message to blocked user ${messageData.receiver_email}`);
      return Response.json({ 
        error: 'This connection is blocked',
        allowed: false 
      }, { status: 403 });
    }

    // 7. Validate conversation_key format
    const expectedConvKey = [user.email, messageData.receiver_email].sort().join('|');
    if (messageData.conversation_key !== expectedConvKey) {
      console.warn(`SECURITY: Invalid conversation_key. Expected: ${expectedConvKey}, Got: ${messageData.conversation_key}`);
      return Response.json({ 
        error: 'Invalid conversation key',
        allowed: false 
      }, { status: 400 });
    }

    // 8. Ensure is_read defaults to false
    const sanitizedMessage = {
      ...messageData,
      sender_email: user.email, // Force to authenticated user
      is_read: false, // Always false on creation
      sender_name: user.full_name, // Use actual user name
      sender_photo: user.profile_photo_url || "" // Use actual user photo
    };

    // All checks passed
    return Response.json({ 
      allowed: true,
      sanitizedMessage 
    });

  } catch (error) {
    console.error('Message guard error:', error);
    return Response.json({ 
      error: 'Server error',
      allowed: false 
    }, { status: 500 });
  }
});