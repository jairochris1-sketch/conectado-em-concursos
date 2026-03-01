import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

export default async function getPeople(req) {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { search = '' } = await req.json().catch(() => ({}));
        
        const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 500);
        
        let users = allUsers;
        if (search) {
            const q = search.toLowerCase();
            users = users.filter(u => u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
        }

        // We can also fetch rankings to merge points
        const rankings = await base44.asServiceRole.entities.UserRanking.list('-total_points', 500);
        const rankMap = {};
        rankings.forEach(r => {
            rankMap[r.user_email || r.id] = r; // Try email or id
        });

        const mapped = users
            .filter(u => u.email !== user.email) // exclude self
            .slice(0, 100)
            .map(u => {
                // Find ranking by name or email
                const rank = rankMap[u.email] || rankings.find(r => r.user_name === u.full_name) || {};
                return {
                    email: u.email,
                    name: u.full_name,
                    photo: u.profile_photo_url,
                    job_title: u.job_title,
                    location: u.location,
                    level: rank.level || 1,
                    points: rank.total_points || 0
                };
            });

        // Sort by points
        mapped.sort((a, b) => b.points - a.points);

        return Response.json({ users: mapped });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

Deno.serve(getPeople);