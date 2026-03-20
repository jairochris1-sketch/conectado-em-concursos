import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

export default async function globalSearch(req) {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { query = '', type = 'all', dateFrom, dateTo } = await req.json();
        
        let users = [];
        let messages = [];
        const qLower = query.toLowerCase().trim();

        // Search users
        if (type === 'all' || type === 'users') {
            // We fetch users from UserRankings or User
            // Since we have admin rights with serviceRole, we can get users
            // To avoid loading thousands of users, we'll fetch the latest 1000 and filter
            const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 1000);
            
            users = allUsers.filter(u => {
                if (!qLower) return true;
                return (u.full_name && u.full_name.toLowerCase().includes(qLower)) || 
                       (u.email && u.email.toLowerCase().includes(qLower));
            }).map(u => ({
                id: u.id,
                email: u.email,
                name: u.full_name,
                photo: u.profile_photo_url,
                role: u.role
            })).slice(0, 30);
        }

        // Search messages
        if (type === 'all' || type === 'messages') {
            // Fetch messages where user is sender or receiver
            const sent = await base44.asServiceRole.entities.StudyPartnerMessage.filter({ sender_email: user.email }, '-created_date', 500);
            const received = await base44.asServiceRole.entities.StudyPartnerMessage.filter({ receiver_email: user.email }, '-created_date', 500);
            
            const allMyMsgs = [...sent, ...received];
            const msgMap = new Map();
            allMyMsgs.forEach(m => msgMap.set(m.id, m));
            let uniqueMsgs = Array.from(msgMap.values());
            
            if (qLower) {
                uniqueMsgs = uniqueMsgs.filter(m => m.content && m.content.toLowerCase().includes(qLower));
            }
            
            if (dateFrom) {
                const df = new Date(dateFrom).getTime();
                uniqueMsgs = uniqueMsgs.filter(m => new Date(m.created_date).getTime() >= df);
            }
            if (dateTo) {
                const dt = new Date(dateTo).setHours(23, 59, 59, 999);
                uniqueMsgs = uniqueMsgs.filter(m => new Date(m.created_date).getTime() <= dt);
            }
            
            uniqueMsgs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
            messages = uniqueMsgs.slice(0, 50);
        }

        return Response.json({ users, messages });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

Deno.serve(globalSearch);