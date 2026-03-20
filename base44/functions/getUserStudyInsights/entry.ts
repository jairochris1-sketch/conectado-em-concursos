import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch all completed simulations for the user
    const completedSimulations = await base44.entities.Simulation.filter({
      created_by: user.email,
      status: 'finalizado'
    });

    const errorAnalysis = {}; // { subject: { topic: { correct: N, incorrect: M } } }

    completedSimulations.forEach(sim => {
      sim.answers?.forEach(answer => {
        if (!answer.is_correct) {
          const subject = answer.subject || 'Geral';
          const topic = answer.topic || 'Não Especificado';

          if (!errorAnalysis[subject]) {
            errorAnalysis[subject] = {};
          }
          if (!errorAnalysis[subject][topic]) {
            errorAnalysis[subject][topic] = { correct: 0, incorrect: 0 };
          }
          errorAnalysis[subject][topic].incorrect++;
        } else {
          const subject = answer.subject || 'Geral';
          const topic = answer.topic || 'Não Especificado';
          if (!errorAnalysis[subject]) {
            errorAnalysis[subject] = {};
          }
          if (!errorAnalysis[subject][topic]) {
            errorAnalysis[subject][topic] = { correct: 0, incorrect: 0 };
          }
          errorAnalysis[subject][topic].correct++;
        }
      });
    });

    // Convert to a more readable format and identify weakest topics
    const weaknesses = [];
    for (const subject in errorAnalysis) {
      for (const topic in errorAnalysis[subject]) {
        const stats = errorAnalysis[subject][topic];
        const total = stats.correct + stats.incorrect;
        if (total > 0) {
          const accuracy = (stats.correct / total) * 100;
          if (accuracy < 70 && stats.incorrect > 2) { // Consider as weakness if accuracy < 70% and at least 3 errors
            weaknesses.push({
              subject,
              topic,
              incorrect_count: stats.incorrect,
              total_count: total,
              accuracy: accuracy.toFixed(2)
            });
          }
        }
      }
    }

    // Sort weaknesses by incorrect count descending
    weaknesses.sort((a, b) => b.incorrect_count - a.incorrect_count);

    let studyPlanSuggestion = null;
    if (weaknesses.length > 0) {
      const topWeaknesses = weaknesses.slice(0, 3);
      const weakestTopicsText = topWeaknesses.map(w => `- ${w.subject} > ${w.topic} (Erros: ${w.incorrect_count}, Acertos: ${w.accuracy}%)`).join('\n');

      const llmPrompt = `
Com base nos seguintes pontos fracos identificados em simulados de concursos públicos de um aluno:
${weakestTopicsText}

Por favor, crie um plano de estudo personalizado e motivador, focado em superar essas dificuldades. Inclua:
1. Uma breve análise dos pontos fracos.
2. Sugestões de estudo específicas para cada tópico problemático (ex: revisar teoria, fazer mais questões, ler artigos).
3. Estratégias gerais para melhorar o desempenho.
4. Uma mensagem de incentivo.

Formate a resposta de forma clara e didática, como se fosse um tutor.
`;

      const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: llmPrompt,
        add_context_from_internet: false
      });

      studyPlanSuggestion = aiResponse.output || aiResponse;
    }

    // Suggest questions from the weakest topics for practice
    let focusedExercises = [];
    if (weaknesses.length > 0) {
      const weakestTopic = weaknesses[0]; // Take the absolute weakest topic
      const availableQuestions = await base44.entities.Question.filter({
        subject: weakestTopic.subject,
        topic: weakestTopic.topic
      });

      focusedExercises = availableQuestions
        .sort(() => Math.random() - 0.5) // Shuffle
        .slice(0, 5) // Take up to 5 questions
        .map(q => ({
          id: q.id,
          statement: q.statement?.substring(0, 150) + '...',
          subject: q.subject,
          topic: q.topic,
          institution: q.institution
        }));
    }

    return Response.json({
      success: true,
      weaknesses,
      study_plan: studyPlanSuggestion,
      focused_exercises: focusedExercises
    });

  } catch (error) {
    console.error('Error in getUserStudyInsights:', error);
    return Response.json({
      error: 'Failed to get study insights',
      details: error.message
    }, { status: 500 });
  }
});