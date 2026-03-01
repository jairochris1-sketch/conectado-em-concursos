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
Analise este edital de concurso público e extraia as informações estruturadas de forma DETALHADA:

1. Liste TODAS as disciplinas/matérias mencionadas
2. Para cada disciplina, liste os tópicos E SUB-TÓPICOS de forma granular e hierárquica
3. Identifique palavras-chave relevantes para buscar questões
4. Extraia os REQUISITOS de formação e experiência profissional para o cargo
5. Identifique as FASES do concurso (provas objetivas, discursivas, TAF, títulos, etc.)

Formate a resposta EXATAMENTE neste JSON (sem texto adicional):
{
  "disciplinas": [
    {
      "nome": "Nome da Disciplina",
      "topicos": [
        {
          "nome": "Tópico Principal",
          "subtopicos": ["Sub-tópico 1", "Sub-tópico 2", ...]
        }
      ],
      "palavras_chave": ["palavra1", "palavra2", ...]
    }
  ],
  "requisitos": {
    "formacao": "Descrição da formação exigida (ex: Ensino médio completo, Graduação em X, etc.)",
    "experiencia": "Descrição da experiência exigida (ex: 2 anos na área, não exige experiência, etc.)",
    "outros": ["Outros requisitos como CNH, registro profissional, etc."]
  },
  "fases": [
    {
      "nome": "Nome da fase (ex: Prova Objetiva, Prova Discursiva, etc.)",
      "tipo": "objetiva/discursiva/pratica/taf/titulos/investigacao",
      "carater": "eliminatoria/classificatoria/eliminatoria_e_classificatoria",
      "peso": "peso ou pontuação se mencionado"
    }
  ],
  "informacoes_gerais": {
    "vagas": "número de vagas se mencionado",
    "nivel": "fundamental/médio/superior",
    "banca": "nome da banca se mencionado",
    "salario": "salário se mencionado",
    "inscricoes": "período de inscrições se mencionado",
    "data_prova": "data da prova se mencionado (formato DD/MM/AAAA)",
    "tipo_questoes": "tipo das questões: múltipla escolha, certo/errado, misto, ou não especificado",
    "numero_questoes": "número total de questões da prova se mencionado"
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
    });

    const extractedData = aiResponse;

    // Contar tópicos e sub-tópicos totais
    let totalTopics = 0;
    let totalSubtopics = 0;
    if (extractedData.disciplinas) {
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
    }

    // Buscar questões compatíveis (limit alto para pegar todas)
    const allQuestions = await base44.entities.Question.list('created_date', 5000);
    const questionsArray = Array.isArray(allQuestions) ? allQuestions : (allQuestions?.items || allQuestions?.data || []);
    let compatibleCount = 0;
    const seenIds = new Set();

    if (extractedData.disciplinas) {
      extractedData.disciplinas.forEach(disc => {
        const subjectName = disc.nome.toLowerCase();
        const keywords = disc.palavras_chave || [];
        
        questionsArray.forEach(q => {
          if (seenIds.has(q.id)) return;
          const qSubject = (q.subject || '').toLowerCase();
          const qTopic = (q.topic || '').toLowerCase();
          
          if (qSubject.includes(subjectName) || 
              keywords.some(kw => qTopic.includes(kw.toLowerCase()))) {
            compatibleCount++;
            seenIds.add(q.id);
          }
        });
      });
    }

    // Atualizar edital com dados processados
    await base44.entities.Edital.update(edital_id, {
      subjects_content: extractedData,
      requisitos: extractedData.requisitos || {},
      fases_concurso: extractedData.fases || [],
      processed: true,
      processing_status: 'completed',
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
    return Response.json({
      error: 'Erro ao processar edital',
      details: error.message
    }, { status: 500 });
  }
});