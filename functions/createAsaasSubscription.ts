import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Usuário não autenticado' }, { status: 401 });
        }

        const { plan, cycle = 'monthly', customerData } = await req.json();
        const asaasApiKey = Deno.env.get("ASAAS_API_KEY");

        if (!asaasApiKey) {
            console.error('ASAAS_API_KEY não encontrada');
            return Response.json({ error: 'Configuração do sistema incompleta' }, { status: 500 });
        }

        // Remover assinaturas pendentes antigas para evitar duplicatas
        try {
            const oldPendingSubscriptions = await base44.entities.Subscription.filter({ 
                user_email: user.email, 
                status: 'pending' 
            });
            for (const sub of oldPendingSubscriptions) {
                await base44.entities.Subscription.delete(sub.id);
            }
        } catch (cleanupError) {
            console.warn('Aviso: Erro ao limpar assinaturas pendentes:', cleanupError);
        }

        // Definir valores dos planos
        const planPrices = {
            padrao: {
                monthly: 39.90,
                semiannual: 199.00,
                annual: 399.00
            },
            avancado: {
                monthly: 79.80,
                semiannual: 399.00,
                annual: 798.00
            }
        };

        if (!planPrices[plan] || !planPrices[plan][cycle]) {
            return Response.json({ error: 'Plano ou ciclo de cobrança inválido' }, { status: 400 });
        }

        const price = planPrices[plan][cycle];
        
        // Mapear ciclos corretamente
        let asaasCycle;
        switch(cycle) {
            case 'annual': 
                asaasCycle = 'YEARLY';
                break;
            case 'semiannual':
                asaasCycle = 'SEMIANNUALLY'; 
                break;
            default:
                asaasCycle = 'MONTHLY';
        }

        console.log(`Criando assinatura: ${plan} - ${cycle} - R$${price} - Ciclo Asaas: ${asaasCycle}`);

        // 1. Criar ou buscar cliente no Asaas
        let customer;
        try {
            const existingCustomerResponse = await fetch(`https://www.asaas.com/api/v3/customers?email=${encodeURIComponent(user.email)}`, {
                headers: { 
                    'access_token': asaasApiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!existingCustomerResponse.ok) {
                throw new Error(`Erro ao buscar cliente: ${existingCustomerResponse.status}`);
            }

            const existingCustomerData = await existingCustomerResponse.json();

            if (existingCustomerData.data && existingCustomerData.data.length > 0) {
                customer = existingCustomerData.data[0];
                console.log('Cliente existente encontrado:', customer.id);
            } else {
                // Criar novo cliente
                const newCustomerData = {
                    name: customerData.name || user.full_name || 'Cliente',
                    email: user.email
                };

                if (customerData.cpf) {
                    newCustomerData.cpfCnpj = customerData.cpf.replace(/\D/g, '');
                }
                if (customerData.phone) {
                    newCustomerData.phone = customerData.phone.replace(/\D/g, '');
                }

                const customerResponse = await fetch('https://www.asaas.com/api/v3/customers', {
                    method: 'POST',
                    headers: {
                        'access_token': asaasApiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newCustomerData)
                });

                if (!customerResponse.ok) {
                    const errorData = await customerResponse.json();
                    console.error('Erro ao criar cliente:', errorData);
                    throw new Error('Falha ao registrar dados do cliente');
                }

                customer = await customerResponse.json();
                console.log('Novo cliente criado:', customer.id);
            }
        } catch (customerError) {
            console.error('Erro no processamento do cliente:', customerError);
            return Response.json({ error: 'Erro ao processar dados do cliente' }, { status: 400 });
        }

        // 2. Criar assinatura recorrente
        try {
            const subscriptionData = {
                customer: customer.id,
                billingType: 'UNDEFINED',
                value: price,
                nextDueDate: new Date().toISOString().split('T')[0],
                cycle: asaasCycle,
                description: `Conectado em Concursos - ${plan.charAt(0).toUpperCase() + plan.slice(1)} ${cycle === 'annual' ? 'Anual' : cycle === 'semiannual' ? 'Semestral' : 'Mensal'}`
            };

            console.log('Dados da assinatura para Asaas:', JSON.stringify(subscriptionData, null, 2));

            const subscriptionResponse = await fetch('https://www.asaas.com/api/v3/subscriptions', {
                method: 'POST',
                headers: {
                    'access_token': asaasApiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscriptionData)
            });

            if (!subscriptionResponse.ok) {
                const errorText = await subscriptionResponse.text();
                console.error('Erro detalhado do Asaas (status ' + subscriptionResponse.status + '):', errorText);
                
                let errorMessage = `Erro HTTP ${subscriptionResponse.status}`;
                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.errors && errorData.errors.length > 0) {
                        errorMessage += ': ' + errorData.errors.map(e => e.description || e.message || JSON.stringify(e)).join(', ');
                    } else {
                        errorMessage += ': ' + errorText;
                    }
                } catch (jsonError) {
                    errorMessage += ': ' + errorText;
                }
                
                throw new Error(errorMessage);
            }

            const subscription = await subscriptionResponse.json();
            console.log('Assinatura criada com sucesso:', subscription.id);
            
            // 3. Buscar a cobrança inicial
            const paymentsResponse = await fetch(`https://www.asaas.com/api/v3/payments?subscription=${subscription.id}`, {
                headers: { 
                    'access_token': asaasApiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!paymentsResponse.ok) {
                throw new Error('Erro ao buscar cobrança inicial');
            }

            const paymentsData = await paymentsResponse.json();
            
            if (!paymentsData.data || paymentsData.data.length === 0) {
                throw new Error('Nenhuma cobrança encontrada para a assinatura');
            }
            
            const firstPayment = paymentsData.data[0];
            console.log('Cobrança inicial encontrada:', firstPayment.id);

            // 4. Salvar assinatura no banco de dados
            const subscriptionRecord = {
                user_email: user.email,
                plan: plan,
                status: 'pending',
                asaas_customer_id: customer.id,
                asaas_subscription_id: subscription.id,
                price: price,
                cycle: cycle,
                start_date: new Date().toISOString().split('T')[0],
                trial_used: false
            };

            await base44.entities.Subscription.create(subscriptionRecord);
            console.log('Assinatura salva no banco de dados');

            return Response.json({
                success: true,
                subscription_id: subscription.id,
                payment_url: firstPayment.invoiceUrl
            });

        } catch (subscriptionError) {
            console.error('Erro na criação da assinatura:', subscriptionError);
            return Response.json({ 
                error: subscriptionError.message || 'Falha ao processar assinatura. Verifique seus dados e tente novamente.' 
            }, { status: 400 });
        }

    } catch (error) {
        console.error("Erro geral:", error);
        return Response.json({ 
            error: error.message || 'Erro interno do servidor. Tente novamente em alguns minutos.' 
        }, { status: 500 });
    }
});