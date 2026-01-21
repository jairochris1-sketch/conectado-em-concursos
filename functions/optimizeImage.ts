import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_base64, max_width = 1920, quality = 80 } = await req.json();

    if (!file_base64) {
      return Response.json({ error: 'No image provided' }, { status: 400 });
    }

    // Importar sharp dinamicamente
    const sharp = (await import('npm:sharp@0.33.0')).default;

    // Converter base64 para buffer
    const buffer = Buffer.from(file_base64.split(',')[1] || file_base64, 'base64');

    // Otimizar imagem
    const optimized = await sharp(buffer)
      .resize(max_width, max_width, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality })
      .toBuffer();

    // Converter para base64
    const optimizedBase64 = optimized.toString('base64');
    const dataUrl = `data:image/webp;base64,${optimizedBase64}`;

    // Upload da imagem otimizada
    const uploadResponse = await base44.integrations.Core.UploadFile({
      file: optimizedBase64
    });

    return Response.json({
      success: true,
      file_url: uploadResponse.file_url,
      original_size: Buffer.byteLength(file_base64),
      optimized_size: optimized.length,
      compression_ratio: ((1 - optimized.length / Buffer.byteLength(file_base64)) * 100).toFixed(2)
    });
  } catch (error) {
    console.error('Image optimization error:', error);
    return Response.json(
      { error: `Image optimization failed: ${error.message}` },
      { status: 500 }
    );
  }
});