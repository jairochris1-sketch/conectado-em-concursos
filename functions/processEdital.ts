import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { edital_id } = await req.json();

    if (!edital_id) {
      return Response.json({ error: 'edital_id é obrigatório' }, { status: 400 });
    }

    // Buscar o edital
    const editais = await base44.entities.Edital.filter({ id: edital_id });
    if (!editais || editais.length === 0) {
      return Response.json({ error: 'Edital não encontrado' }, { status: 404 });
    }

    const edital = editais[0];

    // Atualizar status para processing
    await base44.entities.Edital.update(edital_id, {
      processing_status: 'processing'
    });

    // Extrair texto do PDF usando IA
    const llmPrompt = `
Analise este edital de concurso público e extraia as informações estruturadas:

1. Liste TODAS as disciplinas/matérias mencionadas
2. Para cada disciplina, liste os tópicos/conteúdos programáticos
3. Identifique palavras-chave relevantes para buscar questões

Formate a resposta EXATAMENTE neste JSON (sem texto adicional):
{
  "disciplinas": [
    {
      "nome": "Nome da Disciplina",
      "topicos": ["Tópico 1", "Tópico 2", ...],
      "palavras_chave": ["palavra1", "palavra2", ...]
    }
  ],
  "informacoes_gerais": {
    "vagas": "número de vagas se mencionado",
    "nivel": "fundamental/médio/superior",
    "banca": "nome da banca se mencionado"
  }
}
`;

    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: llmPrompt,
      file_urls: [edital.file_url],
      response_json_schema: {
        type: "object",
        properties: {
          disciplinas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                nome: { type: "string" },
                topicos: { type: "array", items: { type: "string" } },
                palavras_chave: { type: "array", items: { type: "string" } }
              }
            }
          },
          informacoes_gerais: {
            type: "object",
            properties: {
              vagas: { type: "string" },
              nivel: { type: "string" },
              banca: { type: "string" }
            }
          }
        }
      }
    });

    const extractedData = aiResponse;

    // Contar tópicos totais
    let totalTopics = 0;
    if (extractedData.disciplinas) {
      extractedData.disciplinas.forEach(disc => {
        totalTopics += disc.topicos?.length || 0;
      });
    }

    // Buscar questões compatíveis
    const allQuestions = await base44.entities.Question.list();
    let compatibleCount = 0;

    if (extractedData.disciplinas) {
      extractedData.disciplinas.forEach(disc => {
        const subjectName = disc.nome.toLowerCase();
        const keywords = disc.palavras_chave || [];
        
        allQuestions.forEach(q => {
          const qSubject = (q.subject || '').toLowerCase();
          const qTopic = (q.topic || '').toLowerCase();
          
          // Check if question matches subject or keywords
          if (qSubject.includes(subjectName) || 
              keywords.some(kw => qTopic.includes(kw.toLowerCase()))) {
            compatibleCount++;
          }
        });
      });
    }

    // Atualizar edital com dados processados
    await base44.entities.Edital.update(edital_id, {
      subjects_content: extractedData,
      processed: true,
      processing_status: 'completed',
      total_topics: totalTopics,
      compatible_questions_count: compatibleCount
    });

    return Response.json({
      success: true,
      data: extractedData,
      total_topics: totalTopics,
      compatible_questions_count: compatibleCount
    });

  } catch (error) {
    console.error('Erro ao processar edital:', error);
    
    // Atualizar status para failed se tiver edital_id
    try {
      const { edital_id } = await req.json();
      if (edital_id) {
        await base44.entities.Edital.update(edital_id, {
          processing_status: 'failed'
        });
      }
    } catch (e) {
      console.error('Erro ao atualizar status:', e);
    }

    return Response.json({
      error: 'Erro ao processar edital',
      details: error.message
    }, { status: 500 });
  }
});