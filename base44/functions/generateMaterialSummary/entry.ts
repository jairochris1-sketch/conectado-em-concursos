import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { material_id, material_title } = await req.json();

    if (!material_id) {
      return Response.json({ error: 'material_id é obrigatório' }, { status: 400 });
    }

    // Criar ou atualizar o registro de resumo com status "processing"
    let summaryRecord = null;
    try {
      const existingSummaries = await base44.asServiceRole.entities.MaterialSummary.filter({ material_id });
      if (existingSummaries.length > 0) {
        summaryRecord = existingSummaries[0];
        await base44.asServiceRole.entities.MaterialSummary.update(summaryRecord.id, {
          status: 'processing'
        });
      } else {
        const created = await base44.asServiceRole.entities.MaterialSummary.create({
          material_id,
          status: 'processing'
        });
        summaryRecord = created;
      }
    } catch (error) {
      console.error('Erro ao criar/atualizar registro:', error);
    }

    // Gerar resumo com IA
    try {
      const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Gere um resumo educativo e bem estruturado para o material de estudo intitulado "${material_title}".
        
        O resumo deve:
        1. Ser conciso mas completo
        2. Destacar os conceitos principais
        3. Ser fácil de entender
        4. Ser formatado em paragráfos claros
        
        Também forneça uma lista de 5-7 pontos principais em formato de array JSON.
        
        Responda em JSON com a seguinte estrutura:
        {
          "summary": "texto do resumo",
          "key_points": ["ponto 1", "ponto 2", ...]
        }`,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            key_points: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['summary', 'key_points']
        }
      });

      // Atualizar resumo no banco de dados
      if (summaryRecord) {
        await base44.asServiceRole.entities.MaterialSummary.update(summaryRecord.id, {
          summary_text: llmResponse.summary,
          key_points: llmResponse.key_points,
          status: 'completed'
        });
      }

      return Response.json({
        success: true,
        summary: llmResponse.summary,
        key_points: llmResponse.key_points
      });
    } catch (error) {
      console.error('Erro ao gerar resumo com IA:', error);

      // Marcar como falho
      if (summaryRecord) {
        await base44.asServiceRole.entities.MaterialSummary.update(summaryRecord.id, {
          status: 'failed',
          error_message: 'Erro ao processar com IA'
        });
      }

      return Response.json({
        success: false,
        error: 'Erro ao gerar resumo'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});