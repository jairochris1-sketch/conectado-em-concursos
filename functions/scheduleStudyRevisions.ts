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
            } else if (revisionType === 'adaptive') {
                const studyDateParts = data.study_date.split('-');
                const studyDate = new Date(Date.UTC(studyDateParts[0], studyDateParts[1] - 1, studyDateParts[2], 12, 0, 0));
                
                // Calculate performance percentage
                const questions = Number(data.questions_count) || 0;
                const errors = Number(data.errors_count) || 0;
                let accuracy = 0;
                
                if (questions > 0) {
                    accuracy = ((questions - errors) / questions) * 100;
                }

                const intervals = [];
                
                if (questions === 0 || accuracy < 50) {
                    // Ruim (Abaixo de 50%) ou sem questões para medir
                    intervals.push({ type: "24h", days: 1 });
                    intervals.push({ type: "3 dias", days: 3 });
                    intervals.push({ type: "7 dias", days: 7 });
                    intervals.push({ type: "15 dias", days: 15 });
                    intervals.push({ type: "30 dias", days: 30 });
                } else if (accuracy >= 50 && accuracy < 80) {
                    // Médio (50% a 79%)
                    intervals.push({ type: "24h", days: 1 });
                    intervals.push({ type: "7 dias", days: 7 });
                    intervals.push({ type: "30 dias", days: 30 });
                } else {
                    // Bom (80% ou mais)
                    intervals.push({ type: "7 dias", days: 7 });
                    intervals.push({ type: "30 dias", days: 30 });
                }

                const reviewsToCreate = intervals.map(interval => {
                    const revDate = new Date(studyDate);
                    revDate.setUTCDate(revDate.getUTCDate() + interval.days);
                    return {
                        ...reviewData,
                        review_type: `Adaptativa (${interval.type}) - ${accuracy.toFixed(0)}% de acertos`,
                        due_date: revDate.toISOString().split('T')[0]
                    };
                });

                await Promise.all(reviewsToCreate.map(r => base44.asServiceRole.entities.StudyReview.create(r)));
                
                return Response.json({ success: true, message: "Revisões adaptativas criadas baseadas no desempenho" });

            } else if (revisionType === 'weekend') {
                const studyDateParts = data.study_date.split('-');
                const studyDate = new Date(Date.UTC(studyDateParts[0], studyDateParts[1] - 1, studyDateParts[2], 12, 0, 0));
                
                // Find next Saturday (6) or Sunday (0)
                // If study day is Thu/Fri, schedule for this weekend. If earlier, maybe also this weekend.
                let nextWeekendDay = new Date(studyDate);
                let daysToAdd = 0;
                const currentDayOfWeek = nextWeekendDay.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat

                if (currentDayOfWeek === 6 || currentDayOfWeek === 0) {
                     // If studied on weekend, schedule for next weekend
                     daysToAdd = currentDayOfWeek === 6 ? 7 : 6; 
                } else {
                     // Schedule for the upcoming Saturday
                     daysToAdd = 6 - currentDayOfWeek;
                }

                nextWeekendDay.setUTCDate(nextWeekendDay.getUTCDate() + daysToAdd);

                // Also schedule a 30 day review just to keep it fresh
                const date30d = new Date(studyDate);
                date30d.setUTCDate(date30d.getUTCDate() + 30);

                await Promise.all([
                    base44.asServiceRole.entities.StudyReview.create({ 
                        ...reviewData, 
                        review_type: "Revisão de Fim de Semana", 
                        due_date: nextWeekendDay.toISOString().split('T')[0] 
                    }),
                    base44.asServiceRole.entities.StudyReview.create({ 
                        ...reviewData, 
                        review_type: "30 dias", 
                        due_date: date30d.toISOString().split('T')[0] 
                    })
                ]);
                
                return Response.json({ success: true, message: "Revisão de fim de semana criada" });

            } else if (revisionType === 'custom' && data.custom_start_date) {
                // Determine recurrence
                const startDate = new Date(data.custom_start_date);
                const recurrence = data.recurrence || 'none';
                const reviewsToCreate = [];
                
                // Max iterations to prevent infinite loop
                const MAX_REVIEWS = 50;
                
                const selectedTime = startDate.toISOString().substring(11, 16);
                const hasTime = data.custom_start_date.includes('T');
                const timeStr = hasTime ? ` às ${selectedTime}` : '';

                if (recurrence === 'none') {
                    reviewsToCreate.push({
                        ...reviewData,
                        review_type: `Personalizada${timeStr}`,
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
                            review_type: `Personalizada (${recurrence === 'daily' ? 'Diária' : recurrence === 'weekly' ? 'Semanal' : 'Mensal'})${timeStr}`,
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