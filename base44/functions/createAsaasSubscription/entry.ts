import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    // Keep endpoint stable but disabled
    const base44 = createClientFromRequest(req);
    await base44.auth.isAuthenticated();
    return Response.json({ success: false, disabled: true, message: 'Asaas integration disabled: createAsaasSubscription' }, { status: 410 });
  } catch (error) {
    return Response.json({ success: false, disabled: true, message: 'Asaas integration disabled', details: error?.message }, { status: 410 });
  }
});