import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const INVITE_DAILY_LIMIT = 10;
const MSG_PER_MINUTE_LIMIT = 10;

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Não autenticado' }, { status: 401 });

  const { action, targetEmail, content } = await req.json();

  // ── SEND INVITE ──────────────────────────────────────────────────────────────
  if (action === 'check_invite') {
    // Block if target has blocked requester
    const blocked = await base44.entities.StudyPartner.filter({
      requester_email: targetEmail,
      target_email: user.email,
      status: 'blocked'
    });
    if (blocked.length > 0) {
      return Response.json({ allowed: false, reason: 'Você não pode enviar convite para este usuário.' });
    }

    // Block if requester blocked target
    const iBlocked = await base44.entities.StudyPartner.filter({
      requester_email: user.email,
      target_email: targetEmail,
      status: 'blocked'
    });
    if (iBlocked.length > 0) {
      return Response.json({ allowed: false, reason: 'Você bloqueou este usuário.' });
    }

    // Daily invite limit
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayInvites = await base44.entities.StudyPartner.filter({
      requester_email: user.email,
      status: 'pending'
    });
    // Filter created today (approximation via created_date)
    const sentToday = todayInvites.filter(i => new Date(i.created_date) >= todayStart);
    if (sentToday.length >= INVITE_DAILY_LIMIT) {
      return Response.json({ allowed: false, reason: `Limite de ${INVITE_DAILY_LIMIT} convites por dia atingido.` });
    }

    return Response.json({ allowed: true });
  }

  // ── SEND MESSAGE ─────────────────────────────────────────────────────────────
  if (action === 'check_message') {
    // Strict validation - no trust in frontend data
    if (!targetEmail || typeof targetEmail !== 'string' || !targetEmail.includes('@')) {
      return Response.json({ allowed: false, reason: 'Email de destino inválido.' });
    }

    if (!content || typeof content !== 'string' || !content.trim() || content.length > 5000) {
      return Response.json({ allowed: false, reason: 'Mensagem inválida ou muito longa.' });
    }

    // Prevent self-messaging
    if (user.email === targetEmail) {
      return Response.json({ allowed: false, reason: 'Não é possível enviar mensagem para si mesmo.' });
    }

    // Strict partnership validation - backend enforces "accepted" status
    const partnerships = await base44.entities.StudyPartner.filter();
    
    const validPartnership = partnerships.find(p => {
      const isRequester = p.requester_email === user.email && p.target_email === targetEmail;
      const isTarget = p.requester_email === targetEmail && p.target_email === user.email;
      return (isRequester || isTarget) && p.status === 'accepted';
    });
    
    // MUST be "accepted" - no other status allowed
    if (!validPartnership) {
      return Response.json({ 
        allowed: false, 
        reason: 'Sem parceria aceita para enviar mensagens.',
        debug: {
          userEmail: user.email,
          targetEmail,
          status: partnerships.find(p => 
            (p.requester_email === user.email && p.target_email === targetEmail) ||
            (p.requester_email === targetEmail && p.target_email === user.email)
          )?.status || 'none'
        }
      });
    }

    // Extra security: Verify neither party is blocked
    const isBlocked = partnerships.some(p => 
      ((p.requester_email === user.email && p.target_email === targetEmail) ||
       (p.requester_email === targetEmail && p.target_email === user.email)) &&
      p.status === 'blocked'
    );

    if (isBlocked) {
      return Response.json({ allowed: false, reason: 'Esta conexão foi bloqueada.' });
    }

    return Response.json({ allowed: true });
  }

  return Response.json({ error: 'Ação inválida' }, { status: 400 });
});