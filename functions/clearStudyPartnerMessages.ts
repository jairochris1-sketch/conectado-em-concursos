import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { partner_email } = await req.json();

    if (!partner_email) {
      return Response.json({ error: 'Missing partner_email' }, { status: 400 });
    }

    const conversation_key = [user.email, partner_email].sort().join("|");

    // Retrieve all messages of this conversation
    const messages = await base44.asServiceRole.entities.StudyPartnerMessage.filter({ conversation_key });

    // Delete them physically
    const deletePromises = messages.map(msg => 
      base44.asServiceRole.entities.StudyPartnerMessage.delete(msg.id).catch(e => console.error(e))
    );
    
    await Promise.all(deletePromises);

    return Response.json({ success: true, deleted_count: messages.length });
  } catch (error) {
    console.error('Error clearing messages:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});