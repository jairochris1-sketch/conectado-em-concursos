import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    // Webhook endpoint intentionally disabled
    return Response.json({ success: false, disabled: true, message: 'Asaas webhook disabled' }, { status: 410 });
  } catch (error) {
    return Response.json({ success: false, disabled: true, message: 'Asaas webhook disabled', details: error?.message }, { status: 410 });
  }
});