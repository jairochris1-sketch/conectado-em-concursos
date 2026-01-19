import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Usuário não autenticado' }, { status: 401 });
        }

        const { plan, cycle, customerData } = await req.json();
        const asaasApiKey = Deno.env.get("ASAAS_API_KEY");

        if (!asaasApiKey) {
            console.error('ASAAS_API_KEY não configurada');
            return Response.json({ error: 'Chave de API não configurada. Contate o suporte.' }, { status: 500 });
        }

        console.log(`[ASAAS] Iniciando assinatura: plan=${plan}, cycle=${cycle}, user=${user.email}`);

        // Definir preços
        const planPrices = {
            padrao: { monthly: 39.90, semiannual: 199.00, annual: 399.00 },
            avancado: { monthly: 79.80, semiannual: 399.00, annual: 798.00 }
        };

        if (!planPrices[plan] || !planPrices[plan][cycle]) {
            return Response.json({ error: 'Plano ou ciclo inválido' }, { status: 400 });
        }

        const price = planPrices[plan][cycle];

        // Mapear ciclo
        const cycleMaps = { annual: 'YEARLY', semiannual: 'SEMIANNUALLY', monthly: 'MONTHLY' };
        const asaasCycle = cycleMaps[cycle] || 'MONTHLY';

        // 1. Criar/buscar cliente Asaas
        let customer;
        try {
            console.log(`[ASAAS] Buscando cliente com email: ${user.email}`);
            const searchResponse = await fetch(
                `https://www.asaas.com/api/v3/customers?email=${encodeURIComponent(user.email)}`,
                { headers: { 'access_token': asaasApiKey, 'Content-Type': 'application/json' } }
            );

            if (!searchResponse.ok) {
                throw new Error(`Status ${searchResponse.status} ao buscar cliente`);
            }

            const searchData = await searchResponse.json();

            if (searchData.data?.length > 0) {
                customer = searchData.data[0];
                console.log(`[ASAAS] Cliente encontrado: ${customer.id}`);
            } else {
                // Criar novo cliente
                console.log(`[ASAAS] Criando novo cliente`);
                const createResponse = await fetch('https://www.asaas.com/api/v3/customers', {
                    method: 'POST',
                    headers: { 'access_token': asaasApiKey, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: customerData.name || user.full_name || 'Cliente',
                        email: user.email,
                        cpfCnpj: customerData.cpf?.replace(/\D/g, ''),
                        phone: customerData.phone?.replace(/\D/g, '')
                    })
                });

                if (!createResponse.ok) {
                    const errorData = await createResponse.json();
                    console.error(`[ASAAS] Erro ao criar cliente:`, JSON.stringify(errorData));
                    throw new Error(`Erro ao criar cliente: ${JSON.stringify(errorData.errors)}`);
                }

                customer = await createResponse.json();
                console.log(`[ASAAS] Cliente criado: ${customer.id}`);
            }
        } catch (error) {
            console.error(`[ASAAS] Erro no cliente:`, error.message);
            return Response.json({ error: `Erro ao processar cliente: ${error.message}` }, { status: 400 });
        }

        // 2. Criar assinatura
        try {
            console.log(`[ASAAS] Criando assinatura - R$${price} ${asaasCycle}`);
            const subResponse = await fetch('https://www.asaas.com/api/v3/subscriptions', {
                method: 'POST',
                headers: { 'access_token': asaasApiKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer: customer.id,
                    billingType: 'UNDEFINED',
                    value: price,
                    nextDueDate: new Date().toISOString().split('T')[0],
                    cycle: asaasCycle,
                    description: `Conectado em Concursos - ${plan} ${cycle}`
                })
            });

            if (!subResponse.ok) {
                const errorData = await subResponse.json();
                console.error(`[ASAAS] Erro ao criar assinatura:`, JSON.stringify(errorData));
                throw new Error(`Erro ao criar assinatura: ${JSON.stringify(errorData.errors)}`);
            }

            const subscription = await subResponse.json();
            console.log(`[ASAAS] Assinatura criada: ${subscription.id}`);

            // 3. Buscar cobrança inicial
            const paymentsResponse = await fetch(
                `https://www.asaas.com/api/v3/payments?subscription=${subscription.id}`,
                { headers: { 'access_token': asaasApiKey, 'Content-Type': 'application/json' } }
            );

            if (!paymentsResponse.ok) {
                throw new Error('Erro ao buscar cobrança');
            }

            const paymentsData = await paymentsResponse.json();
            if (!paymentsData.data?.length) {
                throw new Error('Nenhuma cobrança gerada');
            }

            const firstPayment = paymentsData.data[0];
            console.log(`[ASAAS] Cobrança encontrada: ${firstPayment.id}`);

            // 4. Salvar no banco
            await base44.entities.Subscription.create({
                user_email: user.email,
                plan: plan,
                status: 'pending',
                asaas_customer_id: customer.id,
                asaas_subscription_id: subscription.id,
                price: price,
                cycle: cycle,
                start_date: new Date().toISOString().split('T')[0],
                trial_used: false
            });

            console.log(`[ASAAS] Assinatura salva no banco de dados`);

            return Response.json({
                success: true,
                payment_url: firstPayment.invoiceUrl || `https://www.asaas.com/subscribe/${subscription.id}`
            });

        } catch (error) {
            console.error(`[ASAAS] Erro na assinatura:`, error.message);
            return Response.json({ error: `Erro ao criar assinatura: ${error.message}` }, { status: 400 });
        }

    } catch (error) {
        console.error(`[ASAAS] Erro geral:`, error.message);
        return Response.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
});