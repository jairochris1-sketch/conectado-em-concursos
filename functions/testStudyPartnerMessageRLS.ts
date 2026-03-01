import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Teste 1: Tentar ler mensagens como receptor
    console.log(`[TEST] Usuário autenticado: ${user.email}`);
    
    const messages = await base44.entities.StudyPartnerMessage.list();
    console.log(`[TEST] Mensagens lidas: ${messages.length}`);

    // Teste 2: Verificar se há uma conexão aceita
    const connections = await base44.entities.StudyPartnerConnection.filter({
      status: 'accepted'
    });
    console.log(`[TEST] Conexões aceitas: ${connections.length}`);

    return Response.json({
      success: true,
      user_email: user.email,
      messages_count: messages.length,
      connections_count: connections.length,
      rls_working: messages.length > 0 || connections.length === 0
    });
  } catch (error) {
    console.error('[TEST] Erro:', error.message);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});