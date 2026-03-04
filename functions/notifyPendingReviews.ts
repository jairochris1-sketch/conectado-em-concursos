import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Get today's date in YYYY-MM-DD for comparison
        // We use UTC to avoid timezone shifts since due_date is stored as YYYY-MM-DD
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const day = String(now.getUTCDate()).padStart(2, '0');
        const today = `${year}-${month}-${day}`;
        
        // Fetch pending reviews
        // Note: the base44 SDK filter might not support $lte natively if it's strictly exact match.
        // To be safe, we fetch all pending and filter in memory since we don't know the exact syntax of $lte for sure.
        // Actually, we can fetch all pending and filter.
        
        const allPending = await base44.asServiceRole.entities.StudyReview.filter({
            status: 'pending'
        });
        
        const pendingReviews = allPending.filter(r => r.due_date <= today);
        
        // Group by user_email
        const userReviews = {};
        for (const review of pendingReviews) {
            if (!userReviews[review.user_email]) {
                userReviews[review.user_email] = 0;
            }
            userReviews[review.user_email]++;
        }
        
        // Send notifications
        let notifiedCount = 0;
        for (const [user_email, count] of Object.entries(userReviews)) {
            // First check if a notification was already sent today to avoid spamming
            const existing = await base44.asServiceRole.entities.Notification.filter({
                user_email,
                title: "Revisões Pendentes!"
            });
            
            // Just a basic check to prevent multiple per day
            const alreadyNotifiedToday = existing.some(n => n.created_date && n.created_date.startsWith(today));
            
            if (!alreadyNotifiedToday) {
                await base44.asServiceRole.entities.Notification.create({
                    user_email,
                    title: "Revisões Pendentes!",
                    message: `Você tem ${count} revisão(ões) pendentes para fazer hoje. Não deixe acumular!`,
                    type: "info",
                    action_url: "/reviews"
                });
                notifiedCount++;
            }
        }
        
        return Response.json({ success: true, notified_users: notifiedCount, total_pending_reviews: pendingReviews.length });
    } catch (error) {
        console.error("Error in notifyPendingReviews:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});