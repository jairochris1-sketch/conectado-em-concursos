import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Usuário não autenticado' }, { status: 401 });
        }

        let requestData;
        try {
            requestData = await req.json();
        } catch (e) {
            return Response.json({ error: 'Dados inválidos' }, { status: 400 });
        }
        const { subscription_id } = requestData;
        const asaasApiKey = Deno.env.get("ASAAS_API_KEY");

        if (!asaasApiKey) {
            return Response.json({ error: 'API Key não configurada' }, { status: 500 });
        }

        const subscription = await base44.entities.Subscription.get(subscription_id);

        if (!subscription || subscription.user_email !== user.email) {
            return Response.json({ error: 'Assinatura não encontrada ou não pertence a este usuário' }, { status: 404 });
        }

        if (!subscription.asaas_subscription_id) {
            await base44.entities.Subscription.update(subscription_id, { status: 'cancelled' });
            return Response.json({ success: true, message: 'Assinatura local cancelada.' });
        }

        try {
            const asaasResponse = await fetch(`https://www.asaas.com/api/v3/subscriptions/${subscription.asaas_subscription_id}`, {
                method: 'DELETE',
                headers: {
                    'access_token': asaasApiKey,
                }
            });

            if (!asaasResponse.ok) {
                const asaasData = await asaasResponse.json();
                console.warn(`Asaas: ${asaasData?.errors?.[0]?.description}. Prosseguindo com cancelamento local.`);
            }
        } catch (e) {
            console.warn('Erro ao chamar Asaas:', e?.message);
        }

        await base44.entities.Subscription.update(subscription_id, { status: 'cancelled' });

        return Response.json({ success: true, message: 'Assinatura cancelada com sucesso.' });

    } catch (error) {
        console.error("Erro ao cancelar assinatura:", error);
        return Response.json({ error: 'Erro interno do servidor ao cancelar assinatura.', details: String(error?.message || error) }, { status: 500 });
    }
});