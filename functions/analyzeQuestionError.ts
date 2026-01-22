import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { question_id, user_answer } = await req.json();

    if (!question_id || !user_answer) {
      return Response.json({ 
        error: 'question_id e user_answer são obrigatórios' 
      }, { status: 400 });
    }

    // Buscar a questão
    const questions = await base44.entities.Question.filter({ id: question_id });
    if (!questions || questions.length === 0) {
      return Response.json({ error: 'Questão não encontrada' }, { status: 404 });
    }

    const question = questions[0];
    const correctAnswer = question.correct_answer?.toLowerCase();

    // Construir o prompt para a IA
    const optionsText = question.options?.map((opt, i) => {
      const letter = opt.letter || ['a', 'b', 'c', 'd', 'e'][i];
      return `${letter.toUpperCase()}) ${opt.text}`;
    }).join('\n');

    const prompt = `
Você é um tutor especializado em concursos públicos. Um aluno respondeu incorretamente uma questão.

**Questão:**
${question.statement}

**Alternativas:**
${optionsText}

**Resposta do aluno:** ${user_answer.toUpperCase()}
**Resposta correta:** ${correctAnswer.toUpperCase()}

**Disciplina:** ${question.subject || 'Não especificada'}
**Assunto:** ${question.topic || 'Não especificado'}

Forneça uma explicação personalizada e didática que:
1. Explique por que a resposta do aluno está incorreta
2. Esclareça por que a resposta correta é a certa
3. Destaque conceitos importantes relacionados
4. Seja motivadora e incentive o aluno a continuar estudando

Seja claro, objetivo e use uma linguagem acessível.
`;

    // Chamar a IA
    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: prompt,
      add_context_from_internet: false
    });

    const explanation = aiResponse.output || aiResponse;

    // Buscar questões similares (mesma disciplina e assunto)
    let similarQuestions = [];
    try {
      const allQuestions = await base44.entities.Question.list();
      similarQuestions = allQuestions
        .filter(q => 
          q.id !== question_id &&
          q.subject === question.subject &&
          q.topic === question.topic
        )
        .slice(0, 5)
        .map(q => ({
          id: q.id,
          statement: q.statement?.substring(0, 150) + '...',
          subject: q.subject,
          topic: q.topic,
          institution: q.institution
        }));
    } catch (error) {
      console.error('Erro ao buscar questões similares:', error);
    }

    // Salvar dúvida
    try {
      await base44.entities.QuestionDoubt.create({
        question_id,
        user_answer,
        correct_answer: correctAnswer,
        ai_explanation: explanation,
        subject: question.subject,
        topic: question.topic,
        status: 'pendente'
      });
    } catch (error) {
      console.error('Erro ao salvar dúvida:', error);
    }

    return Response.json({
      success: true,
      explanation,
      similar_questions: similarQuestions,
      concepts: [question.subject, question.topic].filter(Boolean)
    });

  } catch (error) {
    console.error('Erro ao analisar erro:', error);
    return Response.json({ 
      error: 'Erro ao processar análise',
      details: error.message 
    }, { status: 500 });
  }
});