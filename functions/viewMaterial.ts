import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // Parse da URL base44 que vem como /api/functions/viewMaterial?id=...
    const urlObj = new URL(req.url);
    const materialId = urlObj.searchParams.get('id');

    if (!materialId) {
      return new Response('Material ID não fornecido', { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Buscar o material usando service role
    const materials = await base44.asServiceRole.entities.StudyMaterial.filter({ id: materialId });

    if (!materials || materials.length === 0 || !materials[0].file_url) {
      return new Response('Material não encontrado', { status: 404 });
    }

    // Redirecionar para o arquivo
    return Response.redirect(materials[0].file_url, 302);
  } catch (error) {
    console.error('Erro ao buscar material:', error);
    return new Response(`Erro ao buscar material: ${error.message}`, { status: 500 });
  }
});