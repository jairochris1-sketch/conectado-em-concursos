import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const MAX_RETRIES = 2;

async function invokeWithRetry(fn, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt > retries) throw err;
      console.warn(`Tentativa ${attempt} falhou, tentando novamente...`, err.message);
      await new Promise(r => setTimeout(r, 1500 * attempt));
    }
  }
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  let edital_id = null;

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    edital_id = body.edital_id;

    if (!edital_id) {
      return Response.json({ error: 'edital_id é obrigatório' }, { status: 400 });
    }

    // Buscar o edital
    const editais = await base44.entities.Edital.filter({ id: edital_id });
    if (!editais || editais.length === 0) {
      return Response.json({ error: 'Edital não encontrado' }, { status: 404 });
    }

    const edital = editais[0];

    // Atualizar status para processing e limpar erro anterior
    await base44.entities.Edital.update(edital_id, {
      processing_status: 'processing',
      error_message: null,
      retry_count: (edital.retry_count || 0) + 1
    });

    // Extrair dados do edital via IA com retry automático
    const llmPrompt = `
Analise este edital de concurso público e extraia as informações estruturadas de forma DETALHADA:

1. Liste TODAS as disciplinas/matérias mencionadas
2. Para cada disciplina, liste os tópicos E SUB-TÓPICOS de forma granular e hierárquica
3. Identifique palavras-chave relevantes para buscar questões
4. Extraia os REQUISITOS de formação e experiência profissional para o cargo
5. Identifique as FASES do concurso (provas objetivas, discursivas, TAF, títulos, etc.)
`;

    const aiResponse = await invokeWithRetry(() =>
      base44.asServiceRole.integrations.Core.InvokeLLM({
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
                  topicos: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        nome: { type: "string" },
                        subtopicos: { type: "array", items: { type: "string" } }
                      }
                    }
                  },
                  palavras_chave: { type: "array", items: { type: "string" } }
                }
              }
            },
            requisitos: {
              type: "object",
              properties: {
                formacao: { type: "string" },
                experiencia: { type: "string" },
                outros: { type: "array", items: { type: "string" } }
              }
            },
            fases: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  nome: { type: "string" },
                  tipo: { type: "string" },
                  carater: { type: "string" },
                  peso: { type: "string" }
                }
              }
            },
            informacoes_gerais: {
              type: "object",
              properties: {
                vagas: { type: "string" },
                nivel: { type: "string" },
                banca: { type: "string" },
                salario: { type: "string" },
                inscricoes: { type: "string" },
                data_prova: { type: "string" },
                tipo_questoes: { type: "string" },
                numero_questoes: { type: "string" }
              }
            }
          }
        }
      })
    );

    // Validar que a IA retornou dados úteis
    if (!aiResponse || !aiResponse.disciplinas || aiResponse.disciplinas.length === 0) {
      throw new Error('A IA não conseguiu identificar disciplinas no arquivo enviado. Verifique se o arquivo é um edital válido com conteúdo programático.');
    }

    const extractedData = aiResponse;

    // Contar tópicos e sub-tópicos totais
    let totalTopics = 0;
    let totalSubtopics = 0;
    extractedData.disciplinas.forEach(disc => {
      if (disc.topicos && Array.isArray(disc.topicos)) {
        totalTopics += disc.topicos.length;
        disc.topicos.forEach(top => {
          if (top.subtopicos && Array.isArray(top.subtopicos)) {
            totalSubtopics += top.subtopicos.length;
          }
        });
      }
    });

    // Buscar questões compatíveis
    const allQuestions = await base44.entities.Question.list();
    let compatibleCount = 0;

    extractedData.disciplinas.forEach(disc => {
      const subjectName = disc.nome.toLowerCase();
      const keywords = disc.palavras_chave || [];

      allQuestions.forEach(q => {
        const qSubject = (q.subject || '').toLowerCase();
        const qTopic = (q.topic || '').toLowerCase();

        if (qSubject.includes(subjectName) ||
            keywords.some(kw => qTopic.includes(kw.toLowerCase()))) {
          compatibleCount++;
        }
      });
    });

    // Atualizar edital com dados processados
    await base44.entities.Edital.update(edital_id, {
      subjects_content: extractedData,
      requisitos: extractedData.requisitos || {},
      fases_concurso: extractedData.fases || [],
      processed: true,
      processing_status: 'completed',
      error_message: null,
      total_topics: totalTopics,
      total_subtopics: totalSubtopics,
      compatible_questions_count: compatibleCount
    });

    return Response.json({
      success: true,
      data: extractedData,
      total_topics: totalTopics,
      total_subtopics: totalSubtopics,
      compatible_questions_count: compatibleCount
    });

  } catch (error) {
    console.error('Erro ao processar edital:', error);

    // Garantir que o status seja atualizado para failed com mensagem de erro clara
    if (edital_id) {
      try {
        await base44.asServiceRole.entities.Edital.update(edital_id, {
          processing_status: 'failed',
          error_message: error.message || 'Erro desconhecido ao processar o edital.'
        });
      } catch (updateErr) {
        console.error('Erro ao atualizar status para failed:', updateErr);
      }
    }

    return Response.json({
      success: false,
      error: error.message || 'Erro ao processar edital'
    }, { status: 500 });
  }
});