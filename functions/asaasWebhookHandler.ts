import { createClientFromRequest } from 'npm:@base44/sdk@0.7.0';

Deno.serve(async (req) => {
    // 1. Validação de Segurança do Webhook
    const asaasWebhookSecret = Deno.env.get("ASAAS_WEBHOOK_SECRET");
    const receivedToken = req.headers.get("asaas-webhook-token");

    if (!asaasWebhookSecret || receivedToken !== asaasWebhookSecret) {
        return Response.json({ error: "Acesso não autorizado" }, { status: 401 });
    }

    try {
        const base44 = createClientFromRequest(req);
        const webhookData = await req.json();
        const event = webhookData.event;
        const payment = webhookData.payment;
        const subscriptionId = payment.subscription;

        if (!subscriptionId) {
            return Response.json({ message: "Ignorando evento sem ID de assinatura" });
        }

        // 2. Buscar a assinatura no nosso banco de dados
        const subscriptions = await base44.asServiceRole.entities.Subscription.filter({
            asaas_subscription_id: subscriptionId,
        });

        if (subscriptions.length === 0) {
            console.warn(`Assinatura ${subscriptionId} não encontrada no banco de dados.`);
            return Response.json({ error: "Assinatura não encontrada" }, { status: 404 });
        }
        const internalSubscription = subscriptions[0];
        
        let newStatus = internalSubscription.status;
        let updateData = {};

        // 3. Lógica para cada tipo de evento
        switch (event) {
            case "PAYMENT_CONFIRMED":
            case "PAYMENT_RECEIVED":
                newStatus = "active";
                updateData = {
                    status: newStatus,
                    next_payment_date: payment.nextDueDate,
                };
                break;
            case "PAYMENT_OVERDUE":
                newStatus = "overdue";
                updateData = { status: newStatus };
                break;
            case "PAYMENT_DELETED":
            case "PAYMENT_RESTORED":
                // Pode ser usado para tratar chargebacks, etc.
                break;
        }

        // 4. Atualizar a assinatura e o usuário
        if (internalSubscription.status !== newStatus) {
            await base44.asServiceRole.entities.Subscription.update(
                internalSubscription.id,
                updateData
            );

            // ** NOVO: Atualizar o plano do usuário **
            const users = await base44.asServiceRole.entities.User.filter({ email: internalSubscription.user_email });
            if (users.length > 0) {
                const userToUpdate = users[0];
                await base44.asServiceRole.entities.User.update(userToUpdate.id, {
                    current_plan: newStatus === 'active' ? internalSubscription.plan : 'gratuito'
                });
            }
        }

        return Response.json({ message: "Webhook processado com sucesso" });

    } catch (error) {
        console.error("Erro ao processar webhook:", error);
        return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
    }
});