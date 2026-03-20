import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { partner_email } = await req.json();

    if (!partner_email) {
      return Response.json({ error: 'Missing partner_email' }, { status: 400 });
    }

    // Atualizar todas as mensagens do parceiro que ainda não foram lidas
    const messages = await base44.asServiceRole.entities.StudyPartnerMessage.filter({
      sender_email: partner_email,
      receiver_email: user.email,
      is_read: false
    });

    for (const msg of messages) {
      await base44.entities.StudyPartnerMessage.update(msg.id, {
        is_read: true,
        status: 'read'
      });
    }

    return Response.json({ success: true, updated: messages.length });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});