import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verificar autenticação admin (para uso manual) ou aceitar chamada de automação sem auth
    let isAutomation = false;
    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch {
      // Chamada sem usuário = automação agendada, permitido
      isAutomation = true;
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const in30days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let notificationsCreated = 0;

    // 1. Buscar todos os editais com data de inscrição ou prova
    const editais = await base44.asServiceRole.entities.Edital.list('-created_date', 500);

    // Agrupar por created_by para notificar cada usuário
    const editalsByUser = {};
    for (const edital of editais) {
      if (!edital.created_by) continue;
      if (!editalsByUser[edital.created_by]) editalsByUser[edital.created_by] = [];
      editalsByUser[edital.created_by].push(edital);
    }

    // Notificar sobre editais processados sem simulado gerado ainda
    for (const [userEmail, userEditais] of Object.entries(editalsByUser)) {
      for (const edital of userEditais) {
        if (edital.processing_status === 'completed' && (!edital.simulation_ids || edital.simulation_ids.length === 0)) {
          // Verificar se já notificamos hoje
          const existing = await base44.asServiceRole.entities.Notification.filter({
            user_email: userEmail,
            entity_id: edital.id,
            type: 'info'
          });
          const alreadyNotifiedToday = existing.some(n => {
            return n.created_date && n.created_date.startsWith(todayStr);
          });
          if (alreadyNotifiedToday) continue;

          await base44.asServiceRole.entities.Notification.create({
            user_email: userEmail,
            title: '📄 Edital pronto para simulado!',
            message: `Seu edital "${edital.concurso_name}" está processado mas você ainda não gerou nenhum simulado. Que tal treinar agora?`,
            type: 'info',
            is_read: false,
            action_url: '/editalsimulator',
            entity_id: edital.id
          });
          notificationsCreated++;
        }
      }
    }

    // 2. Notificar sobre simulados em andamento ou não iniciados há mais de 3 dias
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const simulations = await base44.asServiceRole.entities.Simulation.filter({
      status: 'nao_iniciado'
    });

    const simsByUser = {};
    for (const sim of simulations) {
      if (!sim.created_by) continue;
      if (!sim.edital_id) continue; // Apenas simulados de edital
      if (sim.created_date > threeDaysAgo) continue; // Só notificar se > 3 dias
      if (!simsByUser[sim.created_by]) simsByUser[sim.created_by] = [];
      simsByUser[sim.created_by].push(sim);
    }

    for (const [userEmail, userSims] of Object.entries(simsByUser)) {
      if (userSims.length === 0) continue;

      const existing = await base44.asServiceRole.entities.Notification.filter({
        user_email: userEmail,
        type: 'simulation_incomplete'
      });
      const alreadyNotifiedToday = existing.some(n => n.created_date && n.created_date.startsWith(todayStr));
      if (alreadyNotifiedToday) continue;

      const sim = userSims[0];
      await base44.asServiceRole.entities.Notification.create({
        user_email: userEmail,
        title: '⏸️ Você tem um simulado não iniciado!',
        message: `O simulado "${sim.name}" com ${sim.question_count} questões está esperando por você. Retome seus estudos!`,
        type: 'simulation_incomplete',
        is_read: false,
        action_url: `/SolveSimulation?id=${sim.id}`,
        entity_id: sim.id
      });
      notificationsCreated++;
    }

    // 3. Simulados em andamento há mais de 2 dias
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const inProgressSims = await base44.asServiceRole.entities.Simulation.filter({ status: 'em_andamento' });

    const inProgressByUser = {};
    for (const sim of inProgressSims) {
      if (!sim.created_by || !sim.edital_id) continue;
      if ((sim.started_at || sim.created_date) > twoDaysAgo) continue;
      if (!inProgressByUser[sim.created_by]) inProgressByUser[sim.created_by] = [];
      inProgressByUser[sim.created_by].push(sim);
    }

    for (const [userEmail, userSims] of Object.entries(inProgressByUser)) {
      if (userSims.length === 0) continue;

      const existing = await base44.asServiceRole.entities.Notification.filter({
        user_email: userEmail,
        type: 'simulation_incomplete'
      });
      const alreadyToday = existing.some(n => n.created_date && n.created_date.startsWith(todayStr));
      if (alreadyToday) continue;

      const sim = userSims[0];
      await base44.asServiceRole.entities.Notification.create({
        user_email: userEmail,
        title: '▶️ Continue seu simulado!',
        message: `Você deixou o simulado "${sim.name}" pela metade. Finalize para ver seu resultado!`,
        type: 'simulation_incomplete',
        is_read: false,
        action_url: `/SolveSimulation?id=${sim.id}`,
        entity_id: sim.id
      });
      notificationsCreated++;
    }

    return Response.json({
      success: true,
      notifications_created: notificationsCreated,
      ran_at: now.toISOString()
    });

  } catch (error) {
    console.error('Erro em sendDailyReminders:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});