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
    const allQuestions = await base44.entities.Question.list();
    
    // Filtrar questões compatíveis com o edital
    const compatibleQuestions = [];
    const disciplinas = edital.subjects_content.disciplinas || [];

    disciplinas.forEach(disc => {
      const subjectName = disc.nome.toLowerCase();
      const keywords = disc.palavras_chave || [];
      const topicos = disc.topicos || [];
      
      allQuestions.forEach(q => {
        const qSubject = (q.subject || '').toLowerCase();
        const qTopic = (q.topic || '').toLowerCase();
        const qStatement = (q.statement || '').toLowerCase();
        
        // Verificar compatibilidade
        const isCompatible = 
          qSubject.includes(subjectName) ||
          keywords.some(kw => qTopic.includes(kw.toLowerCase()) || qStatement.includes(kw.toLowerCase())) ||
          topicos.some(top => qTopic.includes(top.toLowerCase()));
        
        if (isCompatible && !compatibleQuestions.find(cq => cq.id === q.id)) {
          compatibleQuestions.push(q);
        }
      });
    });

    if (compatibleQuestions.length === 0) {
      return Response.json({
        error: 'Nenhuma questão compatível encontrada no banco de dados para este edital'
      }, { status: 404 });
    }

    // Selecionar questões aleatórias
    const shuffled = compatibleQuestions.sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, Math.min(question_count, shuffled.length));

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