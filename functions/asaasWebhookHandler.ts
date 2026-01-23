import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const webhookData = await req.json();
        
        console.log("Webhook recebido - Event:", webhookData.event);

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

        // Atualizar apenas se o status mudou
        if (newStatus !== subscription.status) {
            console.log(`Atualizando status: ${subscription.status} -> ${newStatus}`);
            
            await base44.asServiceRole.entities.Subscription.update(subscription.id, {
                status: newStatus,
                next_payment_date: payment?.dueDate || subscription.next_payment_date,
            });

            // Atualizar plano do usuário
            if (shouldUpdateUser) {
                const users = await base44.asServiceRole.entities.User.filter({ 
                    email: subscription.user_email 
                });

                if (users.length > 0) {
                    const planToSet = newStatus === 'active' ? subscription.plan : 'gratuito';
                    console.log(`Atualizando plano do usuário para: ${planToSet}`);
                    
                    await base44.asServiceRole.entities.User.update(users[0].id, {
                        current_plan: planToSet
                    });
                }
            }
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