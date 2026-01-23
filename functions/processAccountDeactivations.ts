import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar se é admin (para execução manual) ou se é execução automática
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (isAuthenticated) {
      const user = await base44.auth.me();
      if (user.role !== 'admin') {
        return Response.json({ error: 'Acesso negado' }, { status: 403 });
      }
    }

    const deactivated = [];
    const notified = [];
    
    // Buscar todos os usuários com desativação solicitada
    const usersToDeactivate = await base44.asServiceRole.entities.User.filter({ 
      deactivation_requested: true 
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const user of usersToDeactivate) {
      if (!user.deactivation_request_date) continue;

      const requestDate = new Date(user.deactivation_request_date);
      requestDate.setHours(0, 0, 0, 0);
      
      const daysSinceRequest = Math.floor((today - requestDate) / (1000 * 60 * 60 * 24));
      const daysRemaining = 20 - daysSinceRequest;

      // Notificar usuário 5 dias antes da desativação
      if (daysRemaining === 5) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: user.email,
          title: '⚠️ Conta será desativada em 5 dias',
          message: 'Sua conta será desativada em 5 dias. Acesse seu perfil se quiser cancelar a solicitação.',
          type: 'warning',
          action_url: '/Profile'
        });
        notified.push(`Notificação 5 dias: ${user.email}`);

        // Enviar email
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject: 'Sua conta será desativada em breve - Conectado em Concursos',
            body: `
              Olá ${user.full_name || 'usuário'},
              
              Sua conta será desativada em 5 dias.
              
              Se você mudou de ideia, acesse seu perfil e cancele a solicitação de desativação.
              
              Após a desativação, seus dados serão mantidos por 90 dias.
              
              Atenciosamente,
              Equipe Conectado em Concursos
            `
          });
        } catch (e) {
          console.error('Erro ao enviar email:', e);
        }
      }

      // Notificar usuário 1 dia antes da desativação
      if (daysRemaining === 1) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: user.email,
          title: '❌ Última chance - Conta será desativada amanhã',
          message: 'Sua conta será desativada amanhã. Esta é sua última chance de cancelar a solicitação.',
          type: 'error',
          action_url: '/Profile'
        });
        notified.push(`Notificação 1 dia: ${user.email}`);
      }

      // Desativar conta após 20 dias
      if (daysSinceRequest >= 20) {
        // Cancelar assinatura se houver
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
          user_email: user.email,
          status: 'active'
        });

        for (const subscription of subscriptions) {
          await base44.asServiceRole.entities.Subscription.update(subscription.id, {
            status: 'cancelled'
          });
        }

        // Atualizar status do usuário para banned (desativado)
        await base44.asServiceRole.entities.User.update(user.id, {
          status: 'banned',
          ban_reason: 'Conta desativada por solicitação do usuário',
          current_plan: 'gratuito',
          deactivation_requested: false
        });

        // Notificar o usuário
        await base44.asServiceRole.entities.Notification.create({
          user_email: user.email,
          title: '🔒 Conta Desativada',
          message: 'Sua conta foi desativada. Seus dados serão mantidos por 90 dias. Entre em contato com o suporte se precisar reativar.',
          type: 'info'
        });

        deactivated.push(user.email);

        // Enviar email de confirmação
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: user.email,
            subject: 'Sua conta foi desativada - Conectado em Concursos',
            body: `
              Olá ${user.full_name || 'usuário'},
              
              Sua conta foi desativada conforme solicitado.
              
              Seus dados serão mantidos por 90 dias. Se quiser reativar sua conta durante este período, entre em contato com nosso suporte em conectadoemconcursos@gmail.com.
              
              Agradecemos por ter utilizado nossa plataforma.
              
              Atenciosamente,
              Equipe Conectado em Concursos
            `
          });
        } catch (e) {
          console.error('Erro ao enviar email:', e);
        }

        // Notificar admin
        await base44.asServiceRole.entities.Notification.create({
          user_email: 'conectadoemconcursos@gmail.com',
          title: '🔒 Conta Desativada',
          message: `Conta de ${user.email} foi desativada por solicitação do usuário`,
          type: 'info',
          action_url: '/Admin'
        });
      }
    }

    return Response.json({
      success: true,
      message: 'Processamento concluído',
      accountsDeactivated: deactivated.length,
      notificationsSent: notified.length,
      deactivated,
      notified
    });

  } catch (error) {
    console.error('Erro ao processar desativações:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});