import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_base64 } = await req.json();

    if (!file_base64) {
      return Response.json({ error: 'No image provided' }, { status: 400 });
    }

    // Extrair apenas os dados base64 (remover prefixo data:image/...)
    const base64Data = file_base64.includes(',') ? file_base64.split(',')[1] : file_base64;
    
    // Detectar tipo de imagem do prefixo ou assumir jpeg
    let mimeType = 'image/jpeg';
    if (file_base64.startsWith('data:')) {
      const match = file_base64.match(/data:([^;]+);/);
      if (match) mimeType = match[1];
    }

    // Converter base64 para Blob/File para upload
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    
    // Criar File object
    const file = new File([blob], `image_${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`, { type: mimeType });

    // Upload da imagem
    const uploadResponse = await base44.integrations.Core.UploadFile({
      file: file
    });

    return Response.json({
      success: true,
      file_url: uploadResponse.file_url,
      original_size: base64Data.length
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return Response.json(
      { error: `Image upload failed: ${error.message}` },
      { status: 500 }
    );
  }
});