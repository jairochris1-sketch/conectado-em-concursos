import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Validação do webhook token
        const asaasWebhookSecret = Deno.env.get("ASAAS_WEBHOOK_SECRET");
        const receivedToken = req.headers.get("asaas-access-token");

        if (asaasWebhookSecret && receivedToken !== asaasWebhookSecret) {
            console.error("Token de webhook inválido");
            return Response.json({ error: "Acesso não autorizado" }, { status: 401 });
        }

        const webhookData = await req.json();
        console.log("Webhook recebido:", JSON.stringify(webhookData, null, 2));

        const event = webhookData.event;
        const payment = webhookData.payment;
        const subscriptionData = webhookData.subscription;

        // Obter ID da assinatura (pode vir do payment ou do subscription)
        const asaasSubscriptionId = subscriptionData?.id || payment?.subscription;

        if (!asaasSubscriptionId) {
            console.log("Evento sem ID de assinatura, ignorando");
            return Response.json({ message: "Evento ignorado - sem ID de assinatura" });
        }

        // Buscar assinatura no banco de dados
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
            asaas_subscription_id: asaasSubscriptionId,
        });

        if (subscriptions.length === 0) {
            console.warn(`Assinatura ${asaasSubscriptionId} não encontrada no banco de dados`);
            return Response.json({ error: "Assinatura não encontrada" }, { status: 404 });
        }

        const internalSubscription = subscriptions[0];
        let newStatus = internalSubscription.status;
        let updateData = {};

        // Processar eventos
        switch (event) {
            case "PAYMENT_CONFIRMED":
            case "PAYMENT_RECEIVED":
                console.log("Pagamento confirmado/recebido");
                newStatus = "active";
                updateData = {
                    status: newStatus,
                    next_payment_date: payment?.dueDate || payment?.originalDueDate || internalSubscription.next_payment_date,
                };
                break;

            case "PAYMENT_OVERDUE":
                console.log("Pagamento atrasado");
                newStatus = "overdue";
                updateData = { status: newStatus };
                break;

            case "PAYMENT_DELETED":
            case "PAYMENT_REFUNDED":
                console.log("Pagamento deletado/reembolsado");
                newStatus = "cancelled";
                updateData = { status: newStatus };
                break;

            case "SUBSCRIPTION_CREATED":
                console.log("Assinatura criada no Asaas");
                break;

            case "SUBSCRIPTION_UPDATED":
                console.log("Assinatura atualizada no Asaas");
                if (subscriptionData?.status) {
                    const asaasStatus = subscriptionData.status;
                    if (asaasStatus === "ACTIVE") {
                        newStatus = "active";
                    } else if (asaasStatus === "EXPIRED" || asaasStatus === "INACTIVE") {
                        newStatus = "inactive";
                    }
                    updateData = { status: newStatus };
                }
                break;

            default:
                console.log(`Evento não tratado: ${event}`);
                return Response.json({ message: `Evento ${event} ignorado` });
        }

        // Atualizar assinatura se o status mudou
        if (Object.keys(updateData).length > 0 && internalSubscription.status !== newStatus) {
            console.log(`Atualizando assinatura de ${internalSubscription.status} para ${newStatus}`);
            
            await base44.asServiceRole.entities.Subscription.update(
                internalSubscription.id,
                updateData
            );

            // Atualizar plano do usuário
            const users = await base44.asServiceRole.entities.User.filter({ 
                email: internalSubscription.user_email 
            });

            if (users.length > 0) {
                const userToUpdate = users[0];
                const newPlan = newStatus === 'active' ? internalSubscription.plan : 'gratuito';
                
                console.log(`Atualizando plano do usuário ${userToUpdate.email} para ${newPlan}`);
                
                await base44.asServiceRole.entities.User.update(userToUpdate.id, {
                    current_plan: newPlan
                });
            }
        }

        return Response.json({ 
            message: "Webhook processado com sucesso",
            event: event,
            status: newStatus
        });

    } catch (error) {
        console.error("Erro ao processar webhook:", error);
        return Response.json({ 
            error: "Erro interno do servidor", 
            details: error?.message || String(error) 
        }, { status: 500 });
    }
});