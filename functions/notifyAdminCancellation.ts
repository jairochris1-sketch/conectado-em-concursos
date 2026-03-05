import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        if (req.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
                }
            });
        }

        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const { planName } = await req.json();
        
        const adminEmails = ['conectadoemconcursos@gmail.com', 'jairochris1@gmail.com', 'juniorgmj2016@gmail.com'];
        
        for (const email of adminEmails) {
            await base44.asServiceRole.entities.Notification.create({
                user_email: email,
                title: "Solicitação de Cancelamento",
                message: `O usuário ${user.full_name} (${user.email}) cancelou a assinatura do ${planName}.`,
                type: "warning",
                related_user_name: user.full_name,
                related_user_photo: user.profile_photo_url
            });
        }
        
        return Response.json({ success: true });
    } catch (error) {
        console.error('Error notifying admins:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});