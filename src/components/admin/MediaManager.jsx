import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import { Upload, Image as ImageIcon, Search, X, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Função para comprimir e redimensionar imagem
const compressImage = async (file, maxWidth = 1200, quality = 0.8) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Redimensionar se necessário
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            }));
          },
          'image/jpeg',
          quality
        );
      };
    };
  });
};

export default function MediaManager({ isOpen, onClose, onSelectImage }) {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadUploadedImages();
    }
  }, [isOpen]);

  const loadUploadedImages = () => {
    // Carregar imagens do localStorage (histórico de uploads)
    const stored = localStorage.getItem('uploaded_images');
    if (stored) {
      try {
        setUploadedImages(JSON.parse(stored));
      } catch (error) {
        console.error('Erro ao carregar imagens:', error);
      }
    }
  };

  const saveImageToHistory = (imageUrl, fileName) => {
    const stored = localStorage.getItem('uploaded_images');
    let images = stored ? JSON.parse(stored) : [];
    
    const newImage = {
      url: imageUrl,
      fileName: fileName,
      uploadedAt: new Date().toISOString(),
      id: Date.now()
    };
    
    images = [newImage, ...images].slice(0, 100); // Manter apenas últimas 100 imagens
    localStorage.setItem('uploaded_images', JSON.stringify(images));
    setUploadedImages(images);
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem válido.');
      return;
    }

    setIsUploading(true);
    try {
      // Comprimir imagem antes de enviar
      toast.info('Comprimindo imagem...');
      const compressedFile = await compressImage(file);
      
      const originalSize = (file.size / 1024).toFixed(2);
      const compressedSize = (compressedFile.size / 1024).toFixed(2);
      
      toast.info(`Enviando imagem (${originalSize}KB → ${compressedSize}KB)...`);
      
      const { file_url } = await base44.integrations.Core.UploadFile({ 
        file: compressedFile 
      });
      
      saveImageToHistory(file_url, file.name);
      toast.success('Imagem enviada com sucesso!');
      
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      toast.error('Erro ao enviar imagem. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectImage = () => {
    if (selectedImage && onSelectImage) {
      onSelectImage(selectedImage);
      onClose();
    }
  };

  const handleDeleteImage = (imageId) => {
    const stored = localStorage.getItem('uploaded_images');
    if (stored) {
      let images = JSON.parse(stored);
      images = images.filter(img => img.id !== imageId);
      localStorage.setItem('uploaded_images', JSON.stringify(images));
      setUploadedImages(images);
      toast.success('Imagem removida do histórico');
    }
  };

  const filteredImages = uploadedImages.filter(img => 
    img.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Gerenciador de Mídia
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="gallery" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gallery">Galeria ({uploadedImages.length})</TabsTrigger>
            <TabsTrigger value="upload">Novo Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="gallery" className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nome do arquivo..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-1">
              {filteredImages.length === 0 ? (
                <div className="col-span-3 text-center py-12 text-gray-500">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma imagem encontrada</p>
                  <p className="text-sm mt-2">Faça upload de imagens para começar</p>
                </div>
              ) : (
                filteredImages.map((image) => (
                  <Card
                    key={image.id}
                    className={`relative group cursor-pointer transition-all hover:ring-2 hover:ring-blue-500 ${
                      selectedImage === image.url ? 'ring-2 ring-blue-600' : ''
                    }`}
                    onClick={() => setSelectedImage(image.url)}
                  >
                    <div className="aspect-square overflow-hidden rounded-lg">
                      <img
                        src={image.url}
                        alt={image.fileName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    {selectedImage === image.url && (
                      <div className="absolute top-2 right-2 bg-blue-600 rounded-full p-1">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage(image.id);
                      }}
                      className="absolute top-2 left-2 bg-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                    <div className="p-2">
                      <p className="text-xs truncate text-gray-600">{image.fileName}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(image.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {selectedImage && (
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedImage(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleSelectImage} className="bg-blue-600 hover:bg-blue-700">
                  Inserir Imagem
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                {isUploading ? (
                  <>
                    <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin" />
                    <p className="text-gray-600">Processando imagem...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-2">
                      Clique para selecionar uma imagem
                    </p>
                    <p className="text-sm text-gray-500">
                      PNG, JPG, GIF até 10MB
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      A imagem será automaticamente comprimida e redimensionada
                    </p>
                  </>
                )}
              </label>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">Otimização Automática:</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Redimensionamento máximo: 1200px de largura</li>
                <li>• Compressão de qualidade: 80%</li>
                <li>• Formato de saída: JPEG</li>
                <li>• Redução de tamanho: ~50-70% em média</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}