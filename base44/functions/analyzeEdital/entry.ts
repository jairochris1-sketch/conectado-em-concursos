import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { edital_id } = await req.json();

    if (!edital_id) {
      return Response.json({ error: 'ID do edital é obrigatório' }, { status: 400 });
    }

    // Buscar o edital
    const editais = await base44.entities.Edital.filter({ id: edital_id });
    if (editais.length === 0) {
      return Response.json({ error: 'Edital não encontrado' }, { status: 404 });
    }

    const edital = editais[0];

    // Preparar o contexto para a IA
    const context = `
EDITAL DO CONCURSO: ${edital.concurso_name}
ÓRGÃO: ${edital.orgao || 'Não especificado'}
CARGO: ${edital.cargo || 'Não especificado'}

MATÉRIAS E CONTEÚDO PROGRAMÁTICO:
${JSON.stringify(edital.subjects_content || {}, null, 2)}

REQUISITOS:
${JSON.stringify(edital.requisitos || {}, null, 2)}

FASES DO CONCURSO:
${JSON.stringify(edital.fases_concurso || [], null, 2)}
    `;

    // Chamar a IA para análise
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista em análise de editais de concursos públicos. Analise o edital abaixo e forneça uma análise detalhada e estruturada.

${context}

IMPORTANTE: Sua resposta deve ser em formato JSON seguindo exatamente esta estrutura:
{
  "resumo_geral": "Um resumo conciso e claro dos pontos mais importantes do edital (3-4 parágrafos)",
  "requisitos_principais": ["requisito 1", "requisito 2", "requisito 3", ...],
  "atribuicoes_cargo": ["atribuição 1", "atribuição 2", "atribuição 3", ...],
  "fases_e_datas": [
    {"fase": "nome da fase", "descricao": "descrição", "data_prevista": "data se disponível ou 'A definir'", "peso": "peso se disponível"}
  ],
  "materias_prioritarias": [
    {"materia": "nome da matéria", "justificativa": "por que é prioritária", "peso_estimado": "alto/médio/baixo"}
  ],
  "dicas_preparacao": ["dica 1", "dica 2", "dica 3", ...],
  "pontos_atencao": ["ponto de atenção 1", "ponto de atenção 2", ...]
}

Seja objetivo, claro e forneça informações práticas e acionáveis para o candidato.`,
      response_json_schema: {
        type: "object",
        properties: {
          resumo_geral: { type: "string" },
          requisitos_principais: { type: "array", items: { type: "string" } },
          atribuicoes_cargo: { type: "array", items: { type: "string" } },
          fases_e_datas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                fase: { type: "string" },
                descricao: { type: "string" },
                data_prevista: { type: "string" },
                peso: { type: "string" }
              }
            }
          },
          materias_prioritarias: {
            type: "array",
            items: {
              type: "object",
              properties: {
                materia: { type: "string" },
                justificativa: { type: "string" },
                peso_estimado: { type: "string" }
              }
            }
          },
          dicas_preparacao: { type: "array", items: { type: "string" } },
          pontos_atencao: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Erro ao analisar edital:', error);
    return Response.json({ 
      error: 'Erro ao processar análise',
      details: error.message 
    }, { status: 500 });
  }
});