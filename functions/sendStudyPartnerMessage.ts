import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receiver_email, content } = await req.json();

    if (!receiver_email || !content) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (user.email === receiver_email) {
      return Response.json({ error: 'Cannot message yourself' }, { status: 400 });
    }

    // Validar se existe conexão accepted
    const connections = await base44.entities.StudyPartner.filter({
      status: 'accepted'
    });

    const hasAcceptedConnection = connections.some(conn => 
      (conn.requester_email === user.email && conn.target_email === receiver_email) ||
      (conn.requester_email === receiver_email && conn.target_email === user.email)
    );

    if (!hasAcceptedConnection) {
      return Response.json({ 
        error: 'No accepted connection with this user' 
      }, { status: 403 });
    }

    const conversation_key = [user.email, receiver_email].sort().join("|");

    // Criar mensagem
    const message = await base44.entities.StudyPartnerMessage.create({
      sender_email: user.email,
      sender_name: user.full_name || 'Usuário',
      sender_photo: user.profile_photo_url || '',
      receiver_email,
      content,
      conversation_key,
      status: 'sent',
      is_read: false,
      timestamp: new Date().toISOString()
    });

    return Response.json({ success: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});