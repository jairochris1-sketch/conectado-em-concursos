import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Extract the automation payload
        const payload = await req.json();
        const { event, data } = payload;
        
        if (!data) {
            return Response.json({ message: "No data in payload" });
        }
        
        // We only care if schedule_revisions is true
        if (data.schedule_revisions === true) {
            const studyDateParts = data.study_date.split('-');
            const studyDate = new Date(Date.UTC(studyDateParts[0], studyDateParts[1] - 1, studyDateParts[2], 12, 0, 0));
            
            // Calculate revision dates
            const date24h = new Date(studyDate);
            date24h.setUTCDate(date24h.getUTCDate() + 1);
            
            const date7d = new Date(studyDate);
            date7d.setUTCDate(date7d.getUTCDate() + 7);
            
            const date30d = new Date(studyDate);
            date30d.setUTCDate(date30d.getUTCDate() + 30);
            
            const reviewData = {
                user_email: data.user_email,
                subject: data.subject || "Matéria não especificada",
                content: data.content || "Conteúdo não especificado",
                description: data.description || "Revisão agendada automaticamente",
                status: "pending"
            };
            
            // Create the StudyReview entries using the service role
            await Promise.all([
                base44.asServiceRole.entities.StudyReview.create({ 
                    ...reviewData, 
                    review_type: "24h", 
                    due_date: date24h.toISOString().split('T')[0] 
                }),
                base44.asServiceRole.entities.StudyReview.create({ 
                    ...reviewData, 
                    review_type: "7 dias", 
                    due_date: date7d.toISOString().split('T')[0] 
                }),
                base44.asServiceRole.entities.StudyReview.create({ 
                    ...reviewData, 
                    review_type: "30 dias", 
                    due_date: date30d.toISOString().split('T')[0] 
                })
            ]);
            
            return Response.json({ success: true, message: "Revisões programadas criadas" });
        }
        
        return Response.json({ success: true, message: "Revisões não agendadas" });
    } catch (error) {
        console.error("Error creating study revisions:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});