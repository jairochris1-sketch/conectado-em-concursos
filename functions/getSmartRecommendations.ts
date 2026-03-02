import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch user data (answers, flashcards, schedules)
        const [answers, flashcardReviews, schedules] = await Promise.all([
            base44.asServiceRole.entities.UserAnswer.filter({ created_by: user.email }, '-created_date', 100),
            base44.asServiceRole.entities.FlashcardReview.filter({ created_by: user.email }, '-created_date', 50),
            base44.asServiceRole.entities.StudySchedule.filter({ created_by: user.email, active: true }, '-created_date', 5)
        ]);

        // 2. Determine weak subjects based on user answers
        const subjectStats = {};
        answers.forEach(ans => {
            if (!subjectStats[ans.subject]) {
                subjectStats[ans.subject] = { total: 0, wrong: 0 };
            }
            subjectStats[ans.subject].total++;
            if (!ans.is_correct) {
                subjectStats[ans.subject].wrong++;
            }
        });

        const weakSubjects = Object.entries(subjectStats)
            .map(([subject, stats]) => ({
                subject,
                errorRate: stats.wrong / stats.total
            }))
            .filter(s => s.errorRate > 0.3) // More than 30% error rate
            .sort((a, b) => b.errorRate - a.errorRate)
            .map(s => s.subject);

        // 3. Current subjects in schedule
        const currentScheduleSubjects = new Set();
        schedules.forEach(schedule => {
            if (schedule.schedule_items) {
                schedule.schedule_items.forEach(item => {
                    if (item.subject) currentScheduleSubjects.add(item.subject);
                });
            }
        });

        // Combine all relevant subjects
        const targetSubjectsSet = new Set([...weakSubjects, ...Array.from(currentScheduleSubjects)]);
        const targetSubjects = Array.from(targetSubjectsSet);
        
        // If no target subjects, let's just pick some general ones or if empty just get general recommendations
        let queryFilter = {};
        if (targetSubjects.length > 0) {
             queryFilter = { subject: { $in: targetSubjects } };
        }

        // 4. Fetch available materials for these subjects
        const [videos, articles, materials] = await Promise.all([
             base44.asServiceRole.entities.YouTubeVideo.filter(queryFilter, '-created_date', 20),
             base44.asServiceRole.entities.Article.filter(queryFilter, '-created_date', 20),
             base44.asServiceRole.entities.StudyMaterial.filter(queryFilter, '-created_date', 20)
        ]);

        // 5. Use AI to pick the best ones and write a justification
        const prompt = `
        Você é um tutor inteligente. Analise o progresso do usuário e os materiais disponíveis e sugira o que ele deve estudar.
        
        PERFIL DO USUÁRIO:
        - Matérias com maior taxa de erro: ${weakSubjects.join(', ') || 'Nenhuma identificada'}
        - Matérias no cronograma atual: ${Array.from(currentScheduleSubjects).join(', ') || 'Nenhum cronograma ativo'}
        
        MATERIAIS DISPONÍVEIS:
        Vídeos: ${JSON.stringify(videos.map(v => ({id: v.id, title: v.title, subject: v.subject})))}
        Artigos: ${JSON.stringify(articles.map(a => ({id: a.id, title: a.title, subject: a.subject})))}
        Materiais em PDF/Docs: ${JSON.stringify(materials.map(m => ({id: m.id, title: m.title, subject: m.subjects?.[0] || m.type})))}
        
        Selecione exatamente os 2 melhores vídeos, 2 melhores artigos e 2 melhores materiais. Se não houver suficientes, retorne o que houver.
        Se os materiais não corresponderem às necessidades, apenas pegue os mais relevantes.
        Retorne um array para cada tipo de material com uma mensagem motivacional explicando POR QUÊ o usuário deve estudar aquilo.
        `;

        const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: prompt,
            response_json_schema: {
                type: "object",
                properties: {
                    mensagem_geral: { type: "string", description: "Mensagem motivacional baseada no desempenho do usuário" },
                    recomendacoes: {
                        type: "object",
                        properties: {
                            videos: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        id: { type: "string" },
                                        justificativa: { type: "string" }
                                    }
                                }
                            },
                            artigos: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        id: { type: "string" },
                                        justificativa: { type: "string" }
                                    }
                                }
                            },
                            materiais: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        id: { type: "string" },
                                        justificativa: { type: "string" }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        // Format the output by matching IDs with actual objects
        const formatItem = (recommendedItem, originalArray) => {
            const fullItem = originalArray.find(item => item.id === recommendedItem.id);
            if (!fullItem) return null;
            return {
                ...fullItem,
                justificativa: recommendedItem.justificativa
            };
        };

        const result = {
            mensagem: response.mensagem_geral,
            videos: (response.recomendacoes?.videos || []).map(r => formatItem(r, videos)).filter(Boolean),
            artigos: (response.recomendacoes?.artigos || []).map(r => formatItem(r, articles)).filter(Boolean),
            materiais: (response.recomendacoes?.materiais || []).map(r => formatItem(r, materials)).filter(Boolean)
        };

        return Response.json(result);
    } catch (error) {
        console.error('Smart Recommendation Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});