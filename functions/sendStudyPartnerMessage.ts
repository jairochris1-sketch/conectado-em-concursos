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
    const connections = await base44.entities.StudyPartnerConnection.filter({
      status: 'accepted'
    });

    const hasAcceptedConnection = connections.some(conn => 
      (conn.user_a === user.email && conn.user_b === receiver_email) ||
      (conn.user_a === receiver_email && conn.user_b === user.email)
    );

    if (!hasAcceptedConnection) {
      return Response.json({ 
        error: 'No accepted connection with this user' 
      }, { status: 403 });
    }

    // Criar mensagem
    const message = await base44.entities.StudyPartnerMessage.create({
      sender_email: user.email,
      receiver_email,
      content,
      status: 'sent',
      is_read: false
    });

    return Response.json({ success: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});