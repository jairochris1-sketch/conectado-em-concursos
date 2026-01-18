import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Não autorizado' }, { status: 401 });
        }

        // Verificar se quem está chamando é admin
        const adminEmails = ['conectadoemconcursos@gmail.com', 'jairochris1@gmail.com', 'juniorgmj2016@gmail.com'];
        if (!adminEmails.includes(user.email)) {
            return Response.json({ error: 'Acesso negado. Apenas administradores podem alterar roles.' }, { status: 403 });
        }

        const { email, role } = await req.json();

        if (!email || !role) {
            return Response.json({ error: 'Email e role são obrigatórios' }, { status: 400 });
        }

        if (!['user', 'admin'].includes(role)) {
            return Response.json({ error: 'Role inválido. Use "user" ou "admin"' }, { status: 400 });
        }

        // Buscar o usuário pelo email
        const users = await base44.asServiceRole.entities.User.filter({ email: email });

        if (!users || users.length === 0) {
            return Response.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        const targetUser = users[0];

        // Fazer requisição HTTP direta para atualizar o role
        const BASE44_APP_ID = Deno.env.get('BASE44_APP_ID');
        const BASE44_SERVICE_ROLE_KEY = Deno.env.get('BASE44_SERVICE_ROLE_KEY');
        
        const updateResponse = await fetch(`https://api.base44.com/apps/${BASE44_APP_ID}/users/${targetUser.id}/role`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${BASE44_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role: role })
        });

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json().catch(() => ({}));
            throw new Error(errorData.message || 'Falha ao atualizar role');
        }

        return Response.json({ 
            success: true, 
            message: `Role do usuário ${email} alterado para ${role} com sucesso`,
            user: {
                email: targetUser.email,
                name: targetUser.full_name,
                role: role
            }
        });

    } catch (error) {
        console.error('Erro ao atualizar role:', error);
        return Response.json({ 
            error: 'Erro ao atualizar role do usuário',
            details: error.message 
        }, { status: 500 });
    }
});