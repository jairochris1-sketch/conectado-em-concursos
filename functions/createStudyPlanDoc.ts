import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, subjects, start_date, end_date } = await req.json();

    if (!title) {
      return Response.json({ error: 'Título é obrigatório' }, { status: 400 });
    }

    // Get Google Docs access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googledocs');

    // Create Google Doc
    const createDocResponse = await fetch(
      'https://docs.googleapis.com/v1/documents?fields=documentId',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title
        })
      }
    );

    if (!createDocResponse.ok) {
      return Response.json(
        { error: 'Erro ao criar documento no Google Docs' },
        { status: createDocResponse.status }
      );
    }

    const docData = await createDocResponse.json();
    const documentId = docData.documentId;

    // Format initial content
    const initialContent = `# ${title}

## Informações
- **Criado por:** ${user.full_name}
- **Data de criação:** ${new Date().toLocaleDateString('pt-BR')}
${start_date ? `- **Período:** ${new Date(start_date).toLocaleDateString('pt-BR')} até ${new Date(end_date).toLocaleDateString('pt-BR')}` : ''}
${subjects && subjects.length > 0 ? `- **Disciplinas:** ${subjects.join(', ')}` : ''}

## Descrição
${description || '(Adicione uma descrição do seu plano de estudo)'}

## Estrutura do Plano

### Semana 1
- [ ] Tópico 1
- [ ] Tópico 2
- [ ] Tópico 3

### Semana 2
- [ ] Tópico 1
- [ ] Tópico 2
- [ ] Tópico 3

## Notas
Adicione suas notas e anotações aqui.

## Progresso
Atualize seu progresso conforme avança no plano.
`;

    // Update document with initial content
    const updateResponse = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                text: initialContent,
                location: { index: 1 }
              }
            }
          ]
        })
      }
    );

    if (!updateResponse.ok) {
      console.error('Erro ao atualizar documento');
    }

    const docUrl = `https://docs.google.com/document/d/${documentId}/edit`;

    // Save to database
    const planDoc = await base44.entities.StudyPlanDocument.create({
      title: title,
      description: description,
      google_doc_id: documentId,
      google_doc_url: docUrl,
      subjects: subjects || [],
      start_date: start_date,
      end_date: end_date,
      status: 'draft'
    });

    return Response.json({
      success: true,
      document: {
        id: planDoc.id,
        title: planDoc.title,
        doc_id: documentId,
        url: docUrl
      }
    });
  } catch (error) {
    console.error('Erro ao criar plano de estudo:', error);
    return Response.json(
      { error: 'Erro ao criar plano de estudo' },
      { status: 500 }
    );
  }
});