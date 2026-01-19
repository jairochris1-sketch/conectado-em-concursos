
// Update SDK version and keep logic
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Usuário não autenticado' }, { status: 401 });
        }

        const { subscriptionId } = await req.json();
        const asaasApiKey = Deno.env.get("ASAAS_API_KEY");

        if (!asaasApiKey) {
            return Response.json({ error: 'API Key não configurada' }, { status: 500 });
        }

        const subscription = await base44.entities.Subscription.get(subscriptionId);

        if (!subscription || subscription.created_by !== user.email) {
            return Response.json({ error: 'Assinatura não encontrada ou não pertence a este usuário' }, { status: 404 });
        }

        if (!subscription.asaas_subscription_id) {
            await base44.entities.Subscription.update(subscriptionId, { status: 'cancelled' });
            return Response.json({ success: true, message: 'Assinatura local cancelada.' });
        }

        const asaasResponse = await fetch(`https://www.asaas.com/api/v3/subscriptions/${subscription.asaas_subscription_id}`, {
            method: 'DELETE',
            headers: {
                'access_token': asaasApiKey,
            }
        });

        let asaasData = {};
        try {
            asaasData = await asaasResponse.json();
        } catch (e) {
            console.warn('Asaas JSON parse failed:', e?.message || e);
        }

        if (!asaasResponse.ok && asaasData?.errors) {
            console.warn(`Asaas: ${asaasData.errors[0]?.description}. Prosseguindo com o cancelamento local.`);
        }

        await base44.entities.Subscription.update(subscriptionId, { status: 'cancelled' });

        return Response.json({ success: true, message: 'Assinatura cancelada com sucesso.' });

    } catch (error) {
        console.error("Erro ao cancelar assinatura:", error);
        return Response.json({ error: 'Erro interno do servidor ao cancelar assinatura.', details: String(error?.message || error) }, { status: 500 });
    }
});
