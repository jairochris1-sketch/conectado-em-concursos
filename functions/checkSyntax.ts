import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const text = await Deno.readTextFile('src/pages/Studies.jsx');
        // A simple check: count parentheses, braces, tags?
        return Response.json({ status: 'ok', length: text.length });
    } catch (e) {
        return Response.json({ error: e.message });
    }
});