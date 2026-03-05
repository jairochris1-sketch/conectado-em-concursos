import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { simulation_id } = await req.json();

        if (!simulation_id) {
            return Response.json({ error: 'Missing simulation_id' }, { status: 400 });
        }

        const sim = await base44.entities.Simulation.filter({ id: simulation_id });
        if (!sim || sim.length === 0) {
            return Response.json({ error: 'Simulado não encontrado' }, { status: 404 });
        }

        const simulation = sim[0];
        const wrongAnswers = simulation.answers?.filter(a => !a.is_correct && a.user_answer) || [];

        if (wrongAnswers.length === 0) {
            return Response.json({ error: 'Nenhum erro encontrado neste simulado para gerar flashcards.' }, { status: 400 });
        }

        const questionIds = wrongAnswers.map(a => a.question_id).slice(0, 10); // Limitar a 10 para evitar prompts imensos
        
        const questionPromises = questionIds.map(id => base44.entities.Question.filter({ id }));
        const questionsData = await Promise.all(questionPromises);
        const questions = questionsData.map(q => q[0]).filter(Boolean);

        const prompt = `Você é um tutor focado em concursos públicos. Gere flashcards didáticos baseados nas seguintes questões que o aluno errou. Crie apenas UM flashcard por questão, focando exatamente no conceito chave que justifica a resposta correta e que o aluno não soube.
        Use HTML básico se necessário (<b>, <i>) para destacar termos importantes.
        A disciplina ('subject') deve ser a mesma da questão original que eu fornecer no JSON.
        Seja super direto e didático.
        
        Questões originais:
        ${JSON.stringify(questions.map(q => ({
            statement: q.statement?.replace(/<[^>]*>/g, '').substring(0, 300),
            correct_answer_explanation: q.explanation?.replace(/<[^>]*>/g, '').substring(0, 300),
            subject: q.subject || 'conhecimentos_gerais',
            topic: q.topic || 'Geral'
        })))}`;

        const response = await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
                type: "object",
                properties: {
                    flashcards: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                front: { type: "string" },
                                back: { type: "string" },
                                subject: { type: "string" },
                                topic: { type: "string" }
                            },
                            required: ["front", "back", "subject"]
                        }
                    }
                }
            }
        });

        const flashcards = response.flashcards || [];
        
        const createdCards = [];
        for (const card of flashcards) {
            const validSubjects = [
                "portugues", "matematica", "direito_constitucional", "direito_administrativo",
                "direito_penal", "direito_civil", "informatica", "conhecimentos_gerais",
                "raciocinio_logico", "contabilidade", "pedagogia", "lei_8112", "lei_8666",
                "lei_14133", "constituicao_federal"
            ];
            
            const subject = validSubjects.includes(card.subject) ? card.subject : "conhecimentos_gerais";

            const created = await base44.entities.Flashcard.create({
                front: card.front,
                back: card.back,
                subject: subject,
                topic: card.topic || "Revisão",
                deck_name: `Erros: ${simulation.name}`,
                difficulty: "medio",
                is_active: true,
                tags: ["revisao_erros", `sim_${simulation_id}`]
            });
            createdCards.push(created);
        }

        return Response.json({ success: true, count: createdCards.length });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});