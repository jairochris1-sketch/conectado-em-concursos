import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

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

    // --- Block and Spam Checks ---
    const blocks = await base44.asServiceRole.entities.ChatBlock.filter({ user_email: user.email });
    if (blocks.length > 0) {
      const block = blocks[0];
      if (new Date(block.blocked_until) > new Date()) {
        return Response.json({ error: `Você está temporariamente bloqueado(a) do chat. Liberado em: ${new Date(block.blocked_until).toLocaleString('pt-BR')}. Motivo: ${block.reason}` }, { status: 403 });
      }
    }

    const badWordsRegex = /(porra|caralho|buceta|puta|merda|fuder|foder|arrombado|cu|viado|corno|piranha|prostituta|putaria|xoxota|cacete)/i;
    if (badWordsRegex.test(content)) {
        return Response.json({ error: 'Sua mensagem contém palavras impróprias que violam nossas diretrizes.' }, { status: 400 });
    }

    const userRecentMsgs = await base44.asServiceRole.entities.StudyPartnerMessage.filter({ sender_email: user.email }, '-created_date', 15);
    const tenSecondsAgo = new Date(Date.now() - 10000); // 10 seconds
    const floodCount = userRecentMsgs.filter(m => new Date(m.created_date) > tenSecondsAgo).length;

    if (floodCount >= 4) { // 5th message in 10s will block
      const blockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      if (blocks.length > 0) {
        await base44.asServiceRole.entities.ChatBlock.update(blocks[0].id, { blocked_until: blockedUntil, reason: "Flooding (Spam)" });
      } else {
        await base44.asServiceRole.entities.ChatBlock.create({ user_email: user.email, blocked_until: blockedUntil, reason: "Flooding (Spam)" });
      }
      return Response.json({ error: 'Você foi bloqueado do chat por 24 horas por uso excessivo (flooding/spam).' }, { status: 403 });
    }
    // -----------------------------

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

    // Notificar o destinatário no app
    await base44.asServiceRole.entities.Notification.create({
      user_email: receiver_email,
      title: `Nova mensagem de ${user.full_name || 'Usuário'}`,
      message: content.length > 50 ? content.substring(0, 50) + '...' : content,
      type: "chat_message",
      action_url: `/UserProfile?email=${encodeURIComponent(user.email)}&openChat=true`,
      related_user_name: user.full_name,
      related_user_photo: user.profile_photo_url,
      entity_id: message.id,
      is_read: false
    }).catch(err => console.error("Error creating notification:", err));

    return Response.json({ success: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});