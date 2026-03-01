import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { edital_id, question_count = 20 } = await req.json();

    if (!edital_id) {
      return Response.json({ error: 'edital_id é obrigatório' }, { status: 400 });
    }

    // Buscar o edital
    const editais = await base44.entities.Edital.filter({ id: edital_id });
    if (!editais || editais.length === 0) {
      return Response.json({ error: 'Edital não encontrado' }, { status: 404 });
    }

    const edital = editais[0];

    if (!edital.processed || !edital.subjects_content) {
      return Response.json({ 
        error: 'Edital ainda não foi processado' 
      }, { status: 400 });
    }

    // Buscar todas as questões
    const rawQuestions = await base44.entities.Question.list('created_date', 5000);
    const allQuestions = Array.isArray(rawQuestions) ? rawQuestions : (rawQuestions?.items || rawQuestions?.data || []);
    
    const disciplinas = edital.subjects_content.disciplinas || [];

    // Verificar se o edital tem distribuição de questões por disciplina
    const totalQuestoesEdital = disciplinas.reduce((acc, d) => acc + (d.numero_questoes || 0), 0);
    const hasDistribution = totalQuestoesEdital > 0;

    // Mapear questões compatíveis por disciplina
    const questionsByDiscipline = {};
    disciplinas.forEach(disc => {
      const subjectName = disc.nome.toLowerCase();
      const keywords = disc.palavras_chave || [];
      const topicos = disc.topicos || [];
      questionsByDiscipline[disc.nome] = { disc, questions: [] };

      allQuestions.forEach(q => {
        const qSubject = (q.subject || '').toLowerCase();
        const qTopic = (q.topic || '').toLowerCase();
        const qStatement = (q.statement || '').toLowerCase();

        let isCompatible = qSubject.includes(subjectName) ||
          keywords.some(kw => qTopic.includes(kw.toLowerCase()) || qStatement.includes(kw.toLowerCase()));

        if (!isCompatible && Array.isArray(topicos)) {
          topicos.forEach(top => {
            if (typeof top === 'string') {
              if (qTopic.includes(top.toLowerCase())) isCompatible = true;
            } else if (top.nome) {
              if (qTopic.includes(top.nome.toLowerCase())) isCompatible = true;
              if (top.subtopicos && Array.isArray(top.subtopicos)) {
                top.subtopicos.forEach(sub => {
                  if (qTopic.includes(sub.toLowerCase()) || qStatement.includes(sub.toLowerCase())) {
                    isCompatible = true;
                  }
                });
              }
            }
          });
        }

        if (isCompatible && !questionsByDiscipline[disc.nome].questions.find(cq => cq.id === q.id)) {
          questionsByDiscipline[disc.nome].questions.push(q);
        }
      });
    });

    // Calcular quantas questões por disciplina
    const selectedQuestions = [];
    const usedIds = new Set();

    if (hasDistribution) {
      // Distribuição proporcional baseada nos pesos/número de questões do edital
      const totalPeso = disciplinas.reduce((acc, d) => acc + (d.peso || d.numero_questoes || 1), 0);
      disciplinas.forEach(disc => {
        const grupo = questionsByDiscipline[disc.nome];
        if (!grupo || grupo.questions.length === 0) return;
        const proporcao = (disc.peso || disc.numero_questoes || 1) / totalPeso;
        const qtd = Math.max(1, Math.round(question_count * proporcao));
        const shuffled = grupo.questions.filter(q => !usedIds.has(q.id)).sort(() => Math.random() - 0.5);
        shuffled.slice(0, Math.min(qtd, shuffled.length)).forEach(q => {
          if (!usedIds.has(q.id)) {
            selectedQuestions.push(q);
            usedIds.add(q.id);
          }
        });
      });
    } else {
      // Sem distribuição definida: pegar igualmente de cada disciplina
      const perDisc = Math.ceil(question_count / disciplinas.length);
      disciplinas.forEach(disc => {
        const grupo = questionsByDiscipline[disc.nome];
        if (!grupo || grupo.questions.length === 0) return;
        const shuffled = grupo.questions.filter(q => !usedIds.has(q.id)).sort(() => Math.random() - 0.5);
        shuffled.slice(0, Math.min(perDisc, shuffled.length)).forEach(q => {
          if (!usedIds.has(q.id)) {
            selectedQuestions.push(q);
            usedIds.add(q.id);
          }
        });
      });
    }

    // Completar com questões restantes se não atingiu o total
    if (selectedQuestions.length < question_count) {
      const allCompatible = Object.values(questionsByDiscipline).flatMap(g => g.questions);
      const remaining = allCompatible.filter(q => !usedIds.has(q.id)).sort(() => Math.random() - 0.5);
      remaining.slice(0, question_count - selectedQuestions.length).forEach(q => {
        selectedQuestions.push(q);
        usedIds.add(q.id);
      });
    }

    const allCompatibleCount = new Set(Object.values(questionsByDiscipline).flatMap(g => g.questions.map(q => q.id))).size;

    if (selectedQuestions.length === 0) {
      return Response.json({
        error: 'Nenhuma questão compatível encontrada no banco de dados para este edital'
      }, { status: 404 });
    }

    // Embaralhar resultado final
    selectedQuestions.sort(() => Math.random() - 0.5);

    // Criar simulado
    const simulation = await base44.entities.Simulation.create({
      name: `Simulado - ${edital.concurso_name}`,
      subjects: [...new Set(selectedQuestions.map(q => q.subject).filter(Boolean))],
      institutions: [...new Set(selectedQuestions.map(q => q.institution).filter(Boolean))],
      question_count: selectedQuestions.length,
      question_ids: selectedQuestions.map(q => q.id),
      status: 'nao_iniciado'
    });

    // Atualizar edital com o ID do simulado
    const updatedSimulationIds = [...(edital.simulation_ids || []), simulation.id];
    await base44.entities.Edital.update(edital_id, {
      simulation_ids: updatedSimulationIds
    });

    return Response.json({
      success: true,
      simulation_id: simulation.id,
      questions_count: selectedQuestions.length,
      available_questions: compatibleQuestions.length
    });

  } catch (error) {
    console.error('Erro ao gerar simulado:', error);
    return Response.json({
      error: 'Erro ao gerar simulado',
      details: error.message
    }, { status: 500 });
  }
});