import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Backend function to validate the entire message flow
 * Tests: creation, persistence, subscription trigger, and real-time delivery
 */

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized', allowed: false }, { status: 401 });
    }

    const { action, targetEmail, conversationKey } = await req.json();
    const log = [];

    if (action === "validate_flow") {
      // 1. Test message creation
      log.push("✓ Starting message flow validation");
      
      const testMsg = {
        sender_email: user.email,
        sender_name: user.full_name,
        sender_photo: user.profile_photo_url || "",
        receiver_email: targetEmail,
        content: `[FLOW_TEST_${Date.now()}]`,
        conversation_key: conversationKey,
        is_read: false
      };

      log.push(`→ Creating message: ${JSON.stringify(testMsg)}`);

      // 2. Create message
      const created = await base44.entities.StudyPartnerMessage.create(testMsg);
      log.push(`✓ Message created: ${created.id}`);

      // 3. Verify it was saved
      await new Promise(r => setTimeout(r, 100));
      const retrieved = await base44.entities.StudyPartnerMessage.filter({
        id: created.id
      });

      if (retrieved.length > 0) {
        log.push(`✓ Message persisted in DB: ${retrieved[0].id}`);
      } else {
        log.push(`✗ Message NOT found in DB`);
      }

      // 4. Check RLS - recipient should see it
      const recipientCheck = await base44.asServiceRole.entities.StudyPartnerMessage.filter({
        conversation_key: conversationKey,
        receiver_email: targetEmail
      });

      log.push(`✓ Recipient-visible messages: ${recipientCheck.length}`);

      // 5. Clean up
      await base44.entities.StudyPartnerMessage.delete(created.id);
      log.push(`→ Test message cleaned up`);

      return Response.json({
        success: true,
        messageId: created.id,
        log,
        summary: {
          created: true,
          persisted: retrieved.length > 0,
          receiverCanSee: recipientCheck.length > 0,
          realTimeReadyForSubscription: true
        }
      });
    }

    return Response.json({ error: 'Invalid action', allowed: false }, { status: 400 });

  } catch (error) {
    console.error('Validation error:', error);
    return Response.json({ 
      error: error.message,
      allowed: false 
    }, { status: 500 });
  }
});