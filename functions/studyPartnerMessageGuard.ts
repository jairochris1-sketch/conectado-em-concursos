import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      sender_email,
      sender_name,
      sender_photo,
      receiver_email,
      content,
      conversation_key
    } = body;

    // Validate input
    if (!sender_email || !receiver_email || !content || !conversation_key) {
      return Response.json({ 
        allowed: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Verify sender is authenticated user
    if (sender_email !== user.email) {
      return Response.json({ 
        allowed: false, 
        error: 'Sender email does not match authenticated user' 
      }, { status: 403 });
    }

    // Check if connection exists and is accepted
    const connections = await base44.asServiceRole.entities.StudyPartnerConnection.filter({
      status: 'accepted'
    });

    const hasValidConnection = connections.some(conn => 
      (conn.user_a === sender_email && conn.user_b === receiver_email) ||
      (conn.user_a === receiver_email && conn.user_b === sender_email)
    );

    if (!hasValidConnection) {
      return Response.json({ 
        allowed: false, 
        error: 'No accepted study partner connection exists' 
      }, { status: 403 });
    }

    // Validate content
    const sanitizedContent = content.trim().substring(0, 5000);
    if (!sanitizedContent) {
      return Response.json({ 
        allowed: false, 
        error: 'Message content cannot be empty' 
      }, { status: 400 });
    }

    // Return sanitized message
    return Response.json({ 
      allowed: true,
      message: {
        sender_email,
        sender_name: sender_name || 'Anonymous',
        sender_photo: sender_photo || '',
        receiver_email,
        content: sanitizedContent,
        conversation_key,
        is_read: false,
        status: 'sent',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Message guard error:', error);
    return Response.json({ 
      allowed: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
});