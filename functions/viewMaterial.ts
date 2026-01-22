import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Parse da URL - a URL pode vir em diferentes formatos
    const urlObj = new URL(req.url);
    let materialId = urlObj.searchParams.get('id');

    console.log('[viewMaterial] URL:', req.url);
    console.log('[viewMaterial] materialId:', materialId);

    if (!materialId) {
      return new Response('Material ID não fornecido', { status: 400 });
    }

    // Buscar o material usando get direto ao invés de filter
    const material = await base44.asServiceRole.entities.StudyMaterial.get(materialId);

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