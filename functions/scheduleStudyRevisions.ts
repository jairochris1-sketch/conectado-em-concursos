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
            const reviewData = {
                user_email: data.user_email,
                subject: data.subject || "Matéria não especificada",
                content: data.content || "Conteúdo não especificado",
                description: data.description || "Revisão agendada automaticamente",
                status: "pending"
            };

            const revisionType = data.revision_type || 'automatic';

            if (revisionType === 'automatic') {
                const studyDateParts = data.study_date.split('-');
                const studyDate = new Date(Date.UTC(studyDateParts[0], studyDateParts[1] - 1, studyDateParts[2], 12, 0, 0));
                
                // Calculate revision dates
                const date24h = new Date(studyDate);
                date24h.setUTCDate(date24h.getUTCDate() + 1);
                
                const date7d = new Date(studyDate);
                date7d.setUTCDate(date7d.getUTCDate() + 7);
                
                const date30d = new Date(studyDate);
                date30d.setUTCDate(date30d.getUTCDate() + 30);
                
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
                
                return Response.json({ success: true, message: "Revisões automáticas criadas" });
            } else if (revisionType === 'custom' && data.custom_start_date) {
                // Determine recurrence
                const startDate = new Date(data.custom_start_date);
                const recurrence = data.recurrence || 'none';
                const reviewsToCreate = [];
                
                // Max iterations to prevent infinite loop
                const MAX_REVIEWS = 50;
                
                if (recurrence === 'none') {
                    reviewsToCreate.push({
                        ...reviewData,
                        review_type: "Personalizada",
                        due_date: startDate.toISOString().split('T')[0]
                    });
                } else {
                    const endDateStr = data.recurrence_end_date;
                    let endDate = null;
                    if (endDateStr) {
                        const parts = endDateStr.split('-');
                        // Set to end of day to be inclusive
                        endDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 23, 59, 59));
                    }
                    
                    let currentDate = new Date(startDate);
                    let count = 0;
                    
                    while (count < MAX_REVIEWS) {
                        if (endDate && currentDate > endDate) {
                            break;
                        }
                        
                        reviewsToCreate.push({
                            ...reviewData,
                            review_type: `Personalizada (${recurrence === 'daily' ? 'Diária' : recurrence === 'weekly' ? 'Semanal' : 'Mensal'})`,
                            due_date: currentDate.toISOString().split('T')[0]
                        });
                        
                        // Advance date based on recurrence
                        if (recurrence === 'daily') {
                            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
                        } else if (recurrence === 'weekly') {
                            currentDate.setUTCDate(currentDate.getUTCDate() + 7);
                        } else if (recurrence === 'monthly') {
                            currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
                        } else {
                            break;
                        }
                        
                        count++;
                    }
                }
                
                // Create in batches
                for (let i = 0; i < reviewsToCreate.length; i += 10) {
                    const chunk = reviewsToCreate.slice(i, i + 10);
                    await Promise.all(chunk.map(r => base44.asServiceRole.entities.StudyReview.create(r)));
                }
                
                return Response.json({ success: true, message: `Criadas ${reviewsToCreate.length} revisões personalizadas` });
            }
        }
        
        return Response.json({ success: true, message: "Revisões não agendadas" });
    } catch (error) {
        console.error("Error creating study revisions:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});