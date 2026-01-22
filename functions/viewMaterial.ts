import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const materialId = url.searchParams.get('id');

    if (!materialId) {
      return new Response('Material ID não fornecido', { status: 400 });
    }

    // Buscar o material
    const material = await base44.entities.StudyMaterial.get(materialId);

    if (!material || !material.file_url) {
      return new Response('Material não encontrado', { status: 404 });
    }

    // Redirecionar para o arquivo
    return Response.redirect(material.file_url, 302);
  } catch (error) {
    console.error('Erro ao buscar material:', error);
    return new Response('Erro ao buscar material', { status: 500 });
  }
});