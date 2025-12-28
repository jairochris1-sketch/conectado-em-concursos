
import { createClientFromRequest } from 'npm:@base44/sdk@0.7.0';

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

        // 1. Obter a assinatura do nosso banco de dados para pegar o ID do Asaas
        const subscription = await base44.entities.Subscription.get(subscriptionId);

        if (!subscription || subscription.created_by !== user.email) {
            return Response.json({ error: 'Assinatura não encontrada ou não pertence a este usuário' }, { status: 404 });
        }

        if (!subscription.asaas_subscription_id) {
             // Se não houver ID do Asaas, apenas cancela localmente
            await base44.entities.Subscription.update(subscriptionId, { status: 'cancelled' });
            return Response.json({ success: true, message: 'Assinatura local cancelada.' });
        }

        // 2. Chamar a API do Asaas para cancelar a assinatura recorrente
        const asaasResponse = await fetch(`https://www.asaas.com/api/v3/subscriptions/${subscription.asaas_subscription_id}`, {
            method: 'DELETE',
            headers: {
                'access_token': asaasApiKey,
            }
        });

        const asaasData = await asaasResponse.json();

        // Mesmo que a API do Asaas falhe (ex: já cancelada), atualizamos nosso status
        if (!asaasResponse.ok && asaasData.errors) {
            console.warn(`Asaas: ${asaasData.errors[0].description}. Prosseguindo com o cancelamento local.`);
        }

        // 3. Atualizar o status da assinatura em nosso banco de dados para 'cancelled'
        await base44.entities.Subscription.update(subscriptionId, { status: 'cancelled' });

        return Response.json({ success: true, message: 'Assinatura cancelada com sucesso.' });

    } catch (error) {
        console.error("Erro ao cancelar assinatura:", error);
        return Response.json({ error: 'Erro interno do servidor ao cancelar assinatura.' }, { status: 500 });
    }
});
