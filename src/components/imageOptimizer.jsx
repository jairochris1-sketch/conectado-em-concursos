import { base44 } from '@/api/base44Client';

export const optimizeImageFile = async (file, options = {}) => {
  const {
    maxWidth = 1920,
    quality = 80,
    onProgress = null
  } = options;

  try {
    if (onProgress) onProgress('Lendo imagem...');

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          if (onProgress) onProgress('Otimizando imagem...');

          const response = await base44.functions.invoke('optimizeImage', {
            file_base64: reader.result,
            max_width: maxWidth,
            quality
          });

          if (!response.success) {
            throw new Error(response.error || 'Falha ao otimizar imagem');
          }

          if (onProgress) {
            onProgress(`Compressão: ${response.compression_ratio}%`);
          }

          resolve({
            file_url: response.file_url,
            original_size: response.original_size,
            optimized_size: response.optimized_size,
            compression_ratio: response.compression_ratio
          });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Falha ao ler arquivo'));
      };

      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('Erro ao otimizar imagem:', error);
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