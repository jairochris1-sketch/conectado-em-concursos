import { base44 } from '@/api/base44Client';

export const optimizeImageFile = async (file, options = {}) => {
  const { onProgress = null } = options;

  try {
    if (onProgress) onProgress('Enviando imagem...');

    // Upload direto usando a integração Core
    const response = await base44.integrations.Core.UploadFile({ file });

    if (onProgress) onProgress('Upload concluído!');

    return {
      file_url: response.file_url,
      original_size: file.size,
      optimized_size: file.size,
      compression_ratio: '0'
    };
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    throw error;
  }
};

export const getImageStats = (originalSize, optimizedSize) => {
  const original = (originalSize / 1024 / 1024).toFixed(2);
  const optimized = (optimizedSize / 1024 / 1024).toFixed(2);
  const saved = (originalSize - optimizedSize) / 1024;
  const percentage = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

  return {
    original: `${original} MB`,
    optimized: `${optimized} MB`,
    saved: `${saved.toFixed(2)} KB`,
    percentage: `${percentage}%`
  };
};