import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
        const moderators = await base44.asServiceRole.entities.User.filter({ role: 'moderator' });
        
        const staffMap = {};
        admins.forEach(u => staffMap[u.email] = 'admin');
        moderators.forEach(u => staffMap[u.email] = 'moderator');
        
        return Response.json({ staff: staffMap });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});