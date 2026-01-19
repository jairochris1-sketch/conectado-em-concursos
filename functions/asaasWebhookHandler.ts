// Update SDK version and keep logic
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
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
        const subscriptionId = payment?.subscription;

        if (!subscriptionId) {
            return Response.json({ message: "Ignorando evento sem ID de assinatura" });
        }

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

        switch (event) {
            case "PAYMENT_CONFIRMED":
            case "PAYMENT_RECEIVED":
                newStatus = "active";
                updateData = {
                    status: newStatus,
                    next_payment_date: payment?.nextDueDate || internalSubscription.next_payment_date,
                };
                break;
            case "PAYMENT_OVERDUE":
                newStatus = "overdue";
                updateData = { status: newStatus };
                break;
            default:
                // outros eventos ignorados
                break;
        }

        if (internalSubscription.status !== newStatus) {
            await base44.asServiceRole.entities.Subscription.update(
                internalSubscription.id,
                updateData
            );

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
        return Response.json({ error: "Erro interno do servidor", details: String(error?.message || error) }, { status: 500 });
    }
});