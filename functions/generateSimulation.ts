import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Authenticate user
        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { editalFileUrl, filters, numQuestions } = await req.json();

        if (!editalFileUrl && !filters) {
            return Response.json({ 
                error: 'Parâmetros inválidos. Forneça editalFileUrl ou filters.' 
            }, { status: 400 });
        }

        // IA-based generation
        if (editalFileUrl) {
            try {
                const pdfResponse = await fetch(editalFileUrl);
                if (!pdfResponse.ok) {
                    throw new Error('Falha ao baixar o edital');
                }
                
                const pdfBuffer = await pdfResponse.arrayBuffer();
                const textContent = extractTextFromPDF(pdfBuffer);
                
                const analysisPrompt = `
Analise este edital de concurso público e extraia as seguintes informações:
1. Disciplinas cobradas
2. Número de questões por disciplina
3. Peso de cada disciplina
4. Cargo do concurso
5. Banca organizadora (se mencionada)

Edital:
${textContent.substring(0, 8000)}

Responda em formato JSON com a estrutura:
{
  "disciplines": [{"name": "...", "questions": number, "weight": number}],
  "position": "...",
  "institution": "..."
}
`;

                const analysisResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
                    prompt: analysisPrompt,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            disciplines: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        name: { type: "string" },
                                        questions: { type: "number" },
                                        weight: { type: "number" }
                                    }
                                }
                            },
                            position: { type: "string" },
                            institution: { type: "string" }
                        }
                    }
                });

                const editalData = analysisResult;
                const questionIds = [];
                
                for (const disc of editalData.disciplines) {
                    const questions = await base44.asServiceRole.entities.Question.filter({
                        subject: disc.name.toLowerCase().replace(/\s+/g, '_')
                    });
                    
                    const shuffled = questions.sort(() => 0.5 - Math.random());
                    const selected = shuffled.slice(0, disc.questions);
                    questionIds.push(...selected.map(q => q.id));
                }

                return Response.json({
                    success: true,
                    question_ids: questionIds,
                    name: `Simulado - ${editalData.position || 'IA'}`
                });

            } catch (error) {
                console.error('Erro na geração por IA:', error);
                return Response.json({ 
                    error: 'Erro ao processar edital: ' + error.message 
                }, { status: 500 });
            }
        }

        // Manual generation with filters
        if (filters) {
            try {
                const { subjects, institutions, cargos, years, educationLevels } = filters;
                
                console.log('Filtros recebidos:', { subjects, institutions, cargos, years, educationLevels });
                
                // Build filter object
                const questionFilter = {};
                
                // Get ALL questions first
                const allQuestions = await base44.asServiceRole.entities.Question.list();
                console.log(`Total de questões no banco: ${allQuestions.length}`);
                
                // Apply filters manually
                let filteredQuestions = [...allQuestions];
                
                if (subjects && subjects.length > 0) {
                    filteredQuestions = filteredQuestions.filter(q => 
                        subjects.includes(q.subject)
                    );
                    console.log(`Após filtro de disciplinas: ${filteredQuestions.length}`);
                }
                
                if (institutions && institutions.length > 0) {
                    filteredQuestions = filteredQuestions.filter(q => 
                        institutions.includes(q.institution)
                    );
                    console.log(`Após filtro de bancas: ${filteredQuestions.length}`);
                }
                
                if (cargos && cargos.length > 0) {
                    filteredQuestions = filteredQuestions.filter(q => 
                        cargos.includes(q.cargo)
                    );
                    console.log(`Após filtro de cargos: ${filteredQuestions.length}`);
                }
                
                if (years && years.length > 0) {
                    filteredQuestions = filteredQuestions.filter(q => 
                        years.includes(String(q.year))
                    );
                    console.log(`Após filtro de anos: ${filteredQuestions.length}`);
                }
                
                if (educationLevels && educationLevels.length > 0) {
                    filteredQuestions = filteredQuestions.filter(q => 
                        educationLevels.includes(q.education_level)
                    );
                    console.log(`Após filtro de escolaridade: ${filteredQuestions.length}`);
                }

                if (filteredQuestions.length === 0) {
                    return Response.json({
                        error: 'Nenhuma questão encontrada com os filtros selecionados. Tente selecionar filtros mais abrangentes.'
                    }, { status: 404 });
                }

                // Shuffle and select questions
                const shuffled = filteredQuestions.sort(() => 0.5 - Math.random());
                const questionsToUse = numQuestions && numQuestions < shuffled.length 
                    ? shuffled.slice(0, numQuestions)
                    : shuffled;

                const questionIds = questionsToUse.map(q => q.id);

                const simulationName = `Simulado - ${subjects?.join(', ') || 'Múltiplas Disciplinas'}`;

                return Response.json({
                    success: true,
                    question_ids: questionIds,
                    name: simulationName
                });

            } catch (error) {
                console.error('Erro na geração manual:', error);
                return Response.json({ 
                    error: 'Erro ao gerar simulado: ' + error.message,
                    details: error.toString()
                }, { status: 500 });
            }
        }

        return Response.json({ 
            error: 'Parâmetros inválidos' 
        }, { status: 400 });

    } catch (error) {
        console.error('Erro geral:', error);
        return Response.json({ 
            error: 'Erro interno do servidor: ' + error.message,
            stack: error.stack
        }, { status: 500 });
    }
});

function extractTextFromPDF(pdfBuffer) {
    try {
        const uint8Array = new Uint8Array(pdfBuffer);
        const text = new TextDecoder('utf-8').decode(uint8Array);
        
        const textMatch = text.match(/\/Contents\s*\[([^\]]+)\]/g);
        if (textMatch) {
            return textMatch.join(' ');
        }
        
        return text;
    } catch (error) {
        console.error('Erro ao extrair texto do PDF:', error);
        return '';
    }
}