import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    let isAutomation = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch {
      isAutomation = true;
    }

    const now = new Date();
    const in15Min = new Date(now.getTime() + 15 * 60000);
    
    const sessions = await base44.asServiceRole.entities.StudySession.filter({ status: 'scheduled', reminder_sent: false });
    
    let sentCount = 0;
    const updatePromises = [];
    
    for (const session of sessions) {
      const sessionStart = new Date(session.start_time);
      if (sessionStart > now && sessionStart <= in15Min) {
        updatePromises.push((async () => {
          try {
            await base44.asServiceRole.entities.Notification.create({
              user_email: session.user_email,
              title: "📚 Sessão de Estudo em breve!",
              message: `Sua sessão "${session.title}" começará em breve. Prepare-se!`,
              type: "info",
              is_read: false,
              action_url: "/Calendar"
            });
            await base44.asServiceRole.entities.StudySession.update(session.id, { reminder_sent: true });
          } catch (error) {
            console.error(`Erro ao processar sessão ${session.id}:`, error);
          }
        })());
        sentCount++;
      }
    }
    
    // Process in smaller batches with delay to avoid timeouts
    for (let i = 0; i < updatePromises.length; i += 5) {
      await Promise.all(updatePromises.slice(i, i + 5));
      if (i + 5 < updatePromises.length) {
        await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay between batches
      }
    }
    
    return Response.json({ success: true, reminders_sent: sentCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});