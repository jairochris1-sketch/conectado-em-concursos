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
    if (!targetEmail || !content?.trim()) {
      return Response.json({ allowed: false, reason: 'Mensagem inválida.' });
    }

    // Check partnership - single efficient query
    const partnership = await base44.entities.StudyPartner.filter();
    
    const validPartnership = partnership.find(p => 
      (p.requester_email === user.email && p.target_email === targetEmail) ||
      (p.requester_email === targetEmail && p.target_email === user.email)
    );
    
    // Must exist and be accepted
    if (!validPartnership || validPartnership.status !== 'accepted') {
      return Response.json({ allowed: false, reason: 'Sem parceria aceita para enviar mensagens.' });
    }

    return Response.json({ allowed: true });
  }

  return Response.json({ error: 'Ação inválida' }, { status: 400 });
});