import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Usuário não autenticado.' }, { status: 401 });
    }

    const { location = 'Brasil' } = await req.json().catch(() => ({}));

    const json_schema = {
      type: "object",
      properties: {
        contests: {
          type: "array",
          description: "Lista de concursos públicos com inscrições abertas encontrados.",
          items: {
            type: "object",
            properties: {
              name: { "type": "string", "description": "Nome completo do concurso." },
              institution: { "type": "string", "description": "Instituição ou órgão responsável." },
              positions: { "type": "string", "description": "Principais cargos oferecidos." },
              registration_deadline: { "type": "string", "description": "Data final para inscrição no formato DD/MM/YYYY." },
              salary: { "type": "string", "description": "Faixa salarial ou salário inicial." },
              link: { "type": "string", "description": "URL para o edital ou página com mais informações." }
            },
            required: ["name", "institution", "positions", "registration_deadline", "link"]
          }
        }
      },
      required: ["contests"]
    };

    const prompt = `
      Pesquise na internet por concursos públicos que estejam com inscrições abertas, com foco especial na região de "${location}".
      Se a localização for "Brasil", busque por concursos de âmbito nacional ou de grande relevância.
      
      Para cada concurso encontrado, extraia:
      - Nome: nome completo do concurso
      - Instituição: órgão ou empresa responsável
      - Cargos: principais cargos oferecidos
      - Prazo: data limite de inscrição no formato DD/MM/YYYY
      - Salário: valor quando disponível
      - Link: URL do edital ou página oficial
      
      Retorne no formato JSON especificado.
    `;

    let searchResult;
    try {
      searchResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true,
        response_json_schema: json_schema
      });
    } catch (llmError) {
      console.error('Erro na integração InvokeLLM:', llmError);
      return Response.json({ 
        success: false, 
        error: "Falha ao comunicar com a IA. Tente novamente." 
      }, { status: 500 });
    }

    if (!searchResult || !Array.isArray(searchResult.contests)) {
      return Response.json({ success: true, contests: [] });
    }
    
    const validContests = searchResult.contests.filter(c => c.name && c.link);

    // Salvar novos concursos no banco de dados, evitando duplicatas
    if (validContests.length > 0) {
      const existingContests = await base44.asServiceRole.entities.SavedContest.list();
      const existingLinks = new Set(existingContests.map(c => c.link));
      
      const newContestsToSave = validContests.filter(c => !existingLinks.has(c.link));

      if (newContestsToSave.length > 0) {
        await base44.asServiceRole.entities.SavedContest.bulkCreate(newContestsToSave);
      }
    }

    return Response.json({ success: true, contests: validContests });

  } catch (error) {
    console.error('Erro na função findOpenContests:', error);
    return Response.json({ 
        success: false, 
        error: `Erro interno no servidor: ${error.message}` 
    }, { status: 500 });
  }
});