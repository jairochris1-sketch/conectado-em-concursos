import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

export default async function getFeedActivities(req) {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Get Following
        const following = await base44.entities.UserFollow.filter({ follower_email: user.email });
        const followingEmails = following.map(f => f.following_email);

        // 2. Get Study Partners
        const partnersA = await base44.entities.StudyPartner.filter({ user_a: user.email, status: 'accepted' });
        const partnersB = await base44.entities.StudyPartner.filter({ user_b: user.email, status: 'accepted' });
        
        const partnerEmails = [
            ...partnersA.map(p => p.user_b),
            ...partnersB.map(p => p.user_a)
        ];

        const watchedEmails = [...new Set([...followingEmails, ...partnerEmails])];

        if (watchedEmails.length === 0) {
            return Response.json({ activities: [], watchedCount: 0 });
        }

        // Fetch Activities
        // We use serviceRole to easily get bulk data and filter, or just regular calls since we only need public data
        
        const [posts, replies, answers, myConnections] = await Promise.all([
            base44.asServiceRole.entities.ForumPost.list('-created_date', 100),
            base44.asServiceRole.entities.ForumReply.list('-created_date', 100),
            base44.asServiceRole.entities.UserAnswer.list('-created_date', 150),
            // Fetch recent connections of the current user
            base44.asServiceRole.entities.StudyPartner.list('-created_date', 50)
        ]);

        let activities = [];

        // Posts
        posts.filter(p => watchedEmails.includes(p.author_email)).forEach(p => {
            activities.push({
                id: `post_${p.id}`,
                type: 'post',
                date: p.created_date,
                user_email: p.author_email,
                user_name: p.author_name,
                user_photo: p.author_photo_url,
                data: p
            });
        });

        // Replies
        replies.filter(r => watchedEmails.includes(r.author_email)).forEach(r => {
            activities.push({
                id: `reply_${r.id}`,
                type: 'reply',
                date: r.created_date,
                user_email: r.author_email,
                user_name: r.author_name,
                user_photo: r.author_photo_url,
                data: r
            });
        });

        // Answers
        answers.filter(a => watchedEmails.includes(a.created_by)).forEach(a => {
            // We need user name/photo. It might not be in UserAnswer.
            // But we can match with following/partner data if we had it, or we'll fetch users later
            activities.push({
                id: `answer_${a.id}`,
                type: 'answer',
                date: a.created_date,
                user_email: a.created_by,
                data: a
            });
        });

        // Connections involving my watched users AND the current user
        myConnections.filter(c => c.status === 'accepted' && (c.user_a === user.email || c.user_b === user.email)).forEach(c => {
            const partnerEmail = c.user_a === user.email ? c.user_b : c.user_a;
            activities.push({
                id: `connection_${c.id}`,
                type: 'connection',
                date: c.created_date,
                user_email: partnerEmail,
                data: c
            });
        });

        activities.sort((a, b) => new Date(b.date) - new Date(a.date));
        activities = activities.slice(0, 50);

        // Enrich with user info for answers/connections
        const neededEmails = [...new Set(activities.map(a => a.user_email))];
        // Fetch users
        const users = await base44.asServiceRole.entities.User.filter({});
        const userMap = {};
        users.forEach(u => {
            userMap[u.email] = { name: u.full_name, photo: u.profile_photo_url };
        });

        activities = activities.map(a => {
            if (!a.user_name) {
                a.user_name = userMap[a.user_email]?.name || 'Usuário';
                a.user_photo = userMap[a.user_email]?.photo;
            }
            return a;
        });

        return Response.json({ 
            activities, 
            watchedCount: watchedEmails.length 
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}

Deno.serve(getFeedActivities);