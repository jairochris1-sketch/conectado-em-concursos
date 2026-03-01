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

    // Verify accepted partnership exists - check both directions
    const convKey = [user.email, targetEmail].sort().join('|');
    const partnerships = await base44.entities.StudyPartner.filter({
      status: 'accepted'
    });
    
    const hasAcceptedPartnership = partnerships.some(p => 
      (p.requester_email === user.email && p.target_email === targetEmail) ||
      (p.requester_email === targetEmail && p.target_email === user.email)
    );
    
    if (!hasAcceptedPartnership) {
      return Response.json({ allowed: false, reason: 'Sem parceria aceita para enviar mensagens.' });
    }

    // Check if blocked
    const isBlocked = partnerships.some(p =>
      p.status === 'blocked' && (
        (p.requester_email === targetEmail && p.target_email === user.email) ||
        (p.requester_email === user.email && p.target_email === targetEmail)
      )
    );
    
    if (isBlocked) {
      return Response.json({ allowed: false, reason: 'Não é possível enviar mensagens para este usuário.' });
    }

    return Response.json({ allowed: true });
  }

  return Response.json({ error: 'Ação inválida' }, { status: 400 });
});