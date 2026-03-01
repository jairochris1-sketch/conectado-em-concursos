import { createClientFromRequest } from 'npm:@base44/sdk@0.8.11';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // This function might be called by frontend users or by other backend processes
        // If it's a frontend user, we can verify their auth
        const currentUser = await base44.auth.me().catch(() => null);

        const payload = await req.json();
        const { targetEmail, title, message, type, actionUrl, relatedUserName, relatedUserPhoto, entityId } = payload;

        if (!targetEmail || !title || !message) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fetch target user's preferences to check if they want emails
        const targetUsers = await base44.asServiceRole.entities.User.filter({ email: targetEmail });
        const targetUser = targetUsers.length > 0 ? targetUsers[0] : null;

        // Determine if we should send based on preferences
        let shouldSendEmail = true;
        
        if (targetUser) {
            if (targetUser.notify_by_email === false) {
                shouldSendEmail = false;
            } else {
                if (type === 'reply' && targetUser.notify_forum_replies === false) shouldSendEmail = false;
                if (type === 'invite' && targetUser.notify_study_invites === false) shouldSendEmail = false;
                if (type === 'mention' && targetUser.notify_mentions === false) shouldSendEmail = false;
                if (type === 'system' && targetUser.notify_system_updates === false) shouldSendEmail = false;
            }
        }

        // Create in-app notification always
        await base44.asServiceRole.entities.Notification.create({
            user_email: targetEmail,
            title,
            message,
            type: type || 'general',
            action_url: actionUrl || '',
            related_user_name: relatedUserName || '',
            related_user_photo: relatedUserPhoto || '',
            entity_id: entityId || '',
            is_read: false
        });

        // Send Email if allowed
        if (shouldSendEmail) {
            await base44.asServiceRole.integrations.Core.SendEmail({
                to: targetEmail,
                subject: title,
                body: `${message}\n\nAcesse o app para ver mais detalhes: https://conectadoemconcursos.com${actionUrl || ''}`
            });
        }

        return Response.json({ success: true, emailSent: shouldSendEmail });

    } catch (error) {
        console.error('Error sending notification:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});