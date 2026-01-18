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

        // Buscar o usuário pelo email usando service role
        const users = await base44.asServiceRole.entities.User.filter({ email: email });

        if (!users || users.length === 0) {
            return Response.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        const targetUser = users[0];

        // Atualizar o role do usuário
        await base44.asServiceRole.entities.User.update(targetUser.id, { role: role });

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