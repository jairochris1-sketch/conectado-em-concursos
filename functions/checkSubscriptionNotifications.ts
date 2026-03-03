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

    const notifications = [];
    const emailsSent = [];
    
    // Buscar todas as assinaturas ativas
    const activeSubscriptions = await base44.asServiceRole.entities.Subscription.filter({ 
      status: 'active' 
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const subscription of activeSubscriptions) {
      if (!subscription.next_payment_date) continue;

      const nextPaymentDate = new Date(subscription.next_payment_date);
      nextPaymentDate.setHours(0, 0, 0, 0);
      
      const daysUntilPayment = Math.floor((nextPaymentDate - today) / (1000 * 60 * 60 * 24));

      // Notificar usuário 3 dias antes do pagamento
      if (daysUntilPayment === 3) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: subscription.user_email,
          title: '💳 Pagamento Próximo',
          message: `Seu pagamento de R$ ${subscription.price.toFixed(2)} será processado em 3 dias (${nextPaymentDate.toLocaleDateString('pt-BR')}).`,
          type: 'info',
          action_url: '/Subscription'
        });
        notifications.push(`Notificação enviada para ${subscription.user_email} - 3 dias antes`);

        // Enviar email
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: subscription.user_email,
            subject: 'Pagamento Próximo - Conectado em Concursos',
            body: `
              Olá!
              
              Seu pagamento de R$ ${subscription.price.toFixed(2)} para o Plano ${subscription.plan === 'padrao' ? 'Padrão' : 'Premium'} será processado em 3 dias (${nextPaymentDate.toLocaleDateString('pt-BR')}).
              
              Certifique-se de que há saldo disponível no seu método de pagamento.
              
              Atenciosamente,
              Equipe Conectado em Concursos
            `
          });
          emailsSent.push(subscription.user_email);
        } catch (e) {
          console.error('Erro ao enviar email:', e);
        }
      }

      // Notificar usuário 1 dia antes do pagamento
      if (daysUntilPayment === 1) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: subscription.user_email,
          title: '⚠️ Pagamento Amanhã',
          message: `Seu pagamento de R$ ${subscription.price.toFixed(2)} será processado amanhã.`,
          type: 'warning',
          action_url: '/Subscription'
        });
        notifications.push(`Notificação enviada para ${subscription.user_email} - 1 dia antes`);
      }

      // Alertar admin sobre assinaturas próximas de renovar (7 dias)
      if (daysUntilPayment === 7) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: 'conectadoemconcursos@gmail.com',
          title: '📊 Renovação em 7 dias',
          message: `Assinatura de ${subscription.user_email} (${subscription.plan}) renovará em 7 dias - R$ ${subscription.price.toFixed(2)}`,
          type: 'info',
          action_url: '/Admin'
        });
        notifications.push(`Notificação admin - Renovação em 7 dias: ${subscription.user_email}`);
      }
    }

    // Buscar assinaturas vencidas (overdue)
    const overdueSubscriptions = await base44.asServiceRole.entities.Subscription.filter({ 
      status: 'overdue' 
    });

    for (const subscription of overdueSubscriptions) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: subscription.user_email,
        title: '❌ Pagamento Vencido',
        message: `Seu pagamento está vencido. Atualize seu método de pagamento para continuar usando o serviço.`,
        type: 'error',
        action_url: '/Subscription'
      });
      notifications.push(`Notificação enviada para ${subscription.user_email} - pagamento vencido`);

      // Alertar admin sobre pagamento vencido
      await base44.asServiceRole.entities.Notification.create({
        user_email: 'conectadoemconcursos@gmail.com',
        title: '⚠️ Pagamento Vencido',
        message: `Assinatura de ${subscription.user_email} (${subscription.plan}) está vencida`,
        type: 'warning',
        action_url: '/Admin'
      });
    }

    return Response.json({
      success: true,
      message: 'Verificação concluída',
      notificationsSent: notifications.length,
      emailsSent: emailsSent.length,
      details: notifications
    });

  } catch (error) {
    console.error('Erro ao verificar notificações:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});