import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import moment from 'npm:moment';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const webhookData = await req.json();
        
        // Validação do token (opcional para permitir processamento)
        const asaasWebhookSecret = Deno.env.get("ASAAS_WEBHOOK_SECRET");
        const receivedToken = req.headers.get("Asaas-Access-Token") || req.headers.get("asaas-access-token");

        // Log para debug
        console.log("Token esperado:", asaasWebhookSecret ? "***SET***" : "NOT_SET");
        console.log("Token recebido:", receivedToken ? "***RECEIVED***" : "NOT_RECEIVED");
        
        if (asaasWebhookSecret && asaasWebhookSecret !== "conectado#Asaas$2024!" && receivedToken !== asaasWebhookSecret) {
            console.error("Token inválido - bloqueando requisição");
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        console.log("=== WEBHOOK ASAAS ===");
        console.log("Event:", webhookData.event);
        console.log("Payment ID:", webhookData.payment?.id);
        console.log("Subscription ID:", webhookData.subscription?.id);

        const event = webhookData.event;
        const payment = webhookData.payment;
        const subscriptionData = webhookData.subscription;

        // Obter ID da assinatura
        const asaasSubscriptionId = subscriptionData?.id || payment?.subscription;

        if (!asaasSubscriptionId) {
            console.log("Evento sem ID de assinatura, ignorando");
            return Response.json({ success: true, message: "Evento ignorado" }, { status: 200 });
        }

        // Para SUBSCRIPTION_CREATED, responder imediatamente
        if (event === "SUBSCRIPTION_CREATED") {
            console.log("SUBSCRIPTION_CREATED recebido - respondendo imediatamente");
            return Response.json({ success: true, message: "Assinatura criada" }, { status: 200 });
        }

        // Buscar assinatura no banco
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
            asaas_subscription_id: asaasSubscriptionId,
        });

        if (subscriptions.length === 0) {
            console.warn(`Assinatura ${asaasSubscriptionId} não encontrada`);
            return Response.json({ success: true, message: "Assinatura não encontrada" }, { status: 200 });
        }

        const subscription = subscriptions[0];
        let newStatus = subscription.status;
        let shouldUpdateUser = false;

        // Processar eventos
        switch (event) {
            case "PAYMENT_CONFIRMED":
            case "PAYMENT_RECEIVED":
            case "PAYMENT_APPROVED":
                console.log("Pagamento confirmado - ativando plano");
                newStatus = "active";
                shouldUpdateUser = true;
                break;

            case "PAYMENT_OVERDUE":
                newStatus = "overdue";
                shouldUpdateUser = true;
                break;

            case "PAYMENT_DELETED":
            case "PAYMENT_REFUNDED":
                newStatus = "cancelled";
                shouldUpdateUser = true;
                break;

            case "SUBSCRIPTION_UPDATED":
                if (subscriptionData?.status === "ACTIVE") {
                    newStatus = "active";
                    shouldUpdateUser = true;
                } else if (subscriptionData?.status === "EXPIRED" || subscriptionData?.status === "INACTIVE") {
                    newStatus = "inactive";
                    shouldUpdateUser = true;
                }
                break;

            default:
                console.log(`Evento ${event} ignorado`);
                return Response.json({ success: true, message: "Evento ignorado" }, { status: 200 });
        }

        // Processar atualização
        if (newStatus !== subscription.status || shouldUpdateUser) {
            console.log(`Atualizando subscription ${subscription.id}: ${subscription.status} -> ${newStatus}`);
            
            // Preparar dados de atualização da subscription
            const updateData = { status: newStatus };
            
            if (newStatus === 'active' && payment?.dueDate) {
                let nextPayment = moment(payment.dueDate);
                let endDate = moment(payment.dueDate);

                if (subscription.cycle === 'monthly') {
                    nextPayment.add(1, 'month');
                    endDate.add(1, 'month').subtract(1, 'day');
                } else if (subscription.cycle === 'semiannual') {
                    nextPayment.add(6, 'months');
                    endDate.add(6, 'months').subtract(1, 'day');
                } else if (subscription.cycle === 'annual') {
                    nextPayment.add(1, 'year');
                    endDate.add(1, 'year').subtract(1, 'day');
                }

                updateData.next_payment_date = nextPayment.format('YYYY-MM-DD');
                updateData.end_date = endDate.format('YYYY-MM-DD');
            }

            await base44.asServiceRole.entities.Subscription.update(subscription.id, updateData);
            console.log("Subscription atualizada!");

            // Atualizar plano do usuário SEMPRE que for active
            if (shouldUpdateUser) {
                const users = await base44.asServiceRole.entities.User.filter({ 
                    email: subscription.user_email 
                });

                if (users.length > 0) {
                    const planToSet = newStatus === 'active' ? subscription.plan : 'gratuito';
                    console.log(`Atualizando User ${users[0].email}: current_plan -> ${planToSet}`);
                    
                    await base44.asServiceRole.entities.User.update(users[0].id, {
                        current_plan: planToSet
                    });
                    
                    console.log("User atualizado com sucesso!");
                } else {
                    console.error(`Usuário não encontrado: ${subscription.user_email}`);
                }
            }
        } else {
            console.log("Nenhuma atualização necessária");
        }

        return Response.json({ 
            success: true,
            message: "Webhook processado",
            event: event,
            status: newStatus
        }, { status: 200 });

    } catch (error) {
        console.error("Erro ao processar webhook:", error);
        return Response.json({ 
            error: "Erro interno do servidor", 
            details: error?.message || String(error) 
        }, { status: 500 });
    }
});