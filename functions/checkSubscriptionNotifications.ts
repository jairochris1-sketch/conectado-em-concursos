import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // No-op: Asaas notifications disabled
    return Response.json({ success: true, disabled: true, message: 'Asaas notifications disabled' }, { status: 200 });
  } catch (error) {
    return Response.json({ success: false, disabled: true, message: 'Asaas notifications disabled', details: error?.message }, { status: 200 });
  }
});