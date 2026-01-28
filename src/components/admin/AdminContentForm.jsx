import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, ImageIcon, Eye } from 'lucide-react';
import { UploadFile } from '@/integrations/Core';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createPageUrl } from '@/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { optimizeImageFile, getImageStats } from '@/components/imageOptimizer';

export default function AdminContentForm({ content, onSave }) {
  const [formData, setFormData] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingBg, setIsUploadingBg] = useState(false);
  const [optimizationStatus, setOptimizationStatus] = useState('');

  useEffect(() => {
    setFormData(content);
  }, [content]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBackgroundUpload = async (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploadingBg(true);
    setOptimizationStatus(`Enviando imagem ${type === 'desktop' ? 'desktop' : 'mobile'}...`);
    try {
      const result = await optimizeImageFile(file, {
        onProgress: setOptimizationStatus
      });

      if (type === 'desktop') {
        // Adicionar ao array de imagens desktop
        const currentImages = formData.background_images_desktop || [];
        if (currentImages.length < 7) {
          handleInputChange('background_images_desktop', [...currentImages, result.file_url]);
        }
      } else {
        handleInputChange('background_image_url_mobile', result.file_url);
      }
      
      setOptimizationStatus(`✓ Imagem ${type === 'desktop' ? 'desktop' : 'mobile'} enviada!`);
      
      // Limpar o input para permitir upload da mesma imagem
      event.target.value = '';
      
      setTimeout(() => setOptimizationStatus(''), 3000);
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      setOptimizationStatus(`Erro: ${error.message}`);
    }
    setIsUploadingBg(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
  };

  if (!formData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-4">Carregando conteúdo...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText />
            Editar Conteúdo da Página de Boas-vindas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 p-4 border rounded-lg">
            <Label className="flex items-center gap-2 font-semibold"><ImageIcon /> Imagens de Fundo</Label>
            
            {/* Desktop - Múltiplas imagens */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium mb-2">🖥️ Desktop / PC (até 7 imagens - rotação aleatória)</p>
              
              <div className="grid grid-cols-4 gap-3 mb-3">
                {[0, 1, 2, 3, 4, 5, 6].map((index) => {
                  const images = formData.background_images_desktop || [];
                  const imageUrl = images[index];
                  return (
                    <div key={index} className="relative">
                      <Avatar className="w-full h-20 rounded-md">
                        <AvatarImage src={imageUrl} className="object-cover" />
                        <AvatarFallback className="rounded-md bg-gray-100">
                          <span className="text-xs text-gray-400">Imagem {index + 1}</span>
                        </AvatarFallback>
                      </Avatar>
                      {imageUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = [...(formData.background_images_desktop || [])];
                            newImages.splice(index, 1);
                            handleInputChange('background_images_desktop', newImages);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="flex-1">
                <Input 
                  id="background-upload-desktop" 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleBackgroundUpload(e, 'desktop')} 
                  disabled={isUploadingBg || (formData.background_images_desktop?.length || 0) >= 7} 
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(formData.background_images_desktop?.length || 0) >= 7 
                    ? '✓ Máximo de 7 imagens atingido' 
                    : `Adicionar imagem (${formData.background_images_desktop?.length || 0}/7) - recomendado: 1920x1080`}
                </p>
              </div>
            </div>

            {/* Mobile */}
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm font-medium mb-2">📱 Celular / Mobile</p>
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20 rounded-md">
                  <AvatarImage src={formData.background_image_url_mobile} />
                  <AvatarFallback className="rounded-md">
                    <ImageIcon />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                   <Input id="background-upload-mobile" type="file" accept="image/*" onChange={(e) => handleBackgroundUpload(e, 'mobile')} disabled={isUploadingBg} />
                   <p className="text-xs text-gray-500 mt-1">Imagem para celulares (recomendado: 1080x1920 vertical)</p>
                </div>
              </div>
            </div>

            {isUploadingBg && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                {optimizationStatus || 'Enviando imagem...'}
              </div>
            )}

            {/* Desfoque */}
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm font-medium mb-2">🔍 Desfoque da Imagem de Fundo</p>
              <div className="flex items-center gap-3">
                <Input 
                  type="range" 
                  min="0" 
                  max="20" 
                  value={formData.background_blur || 0} 
                  onChange={e => handleInputChange('background_blur', parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm w-16 text-center">{formData.background_blur || 0}px</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">0 = sem desfoque, 20 = desfoque máximo</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" value={formData.title || ''} onChange={e => handleInputChange('title', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title_font">Fonte do Título</Label>
              <Select value={formData.title_font || 'sans-serif'} onValueChange={value => handleInputChange('title_font', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sans-serif">Sans-serif</SelectItem>
                  <SelectItem value="serif">Serif</SelectItem>
                  <SelectItem value="monospace">Monospace</SelectItem>
                  <SelectItem value="arial">Arial</SelectItem>
                  <SelectItem value="verdana">Verdana</SelectItem>
                  <SelectItem value="lato">Lato</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtítulo</Label>
              <Input id="subtitle" value={formData.subtitle || ''} onChange={e => handleInputChange('subtitle', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle_font">Fonte do Subtítulo</Label>
              <Select value={formData.subtitle_font || 'sans-serif'} onValueChange={value => handleInputChange('subtitle_font', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sans-serif">Sans-serif</SelectItem>
                  <SelectItem value="serif">Serif</SelectItem>
                  <SelectItem value="monospace">Monospace</SelectItem>
                  <SelectItem value="arial">Arial</SelectItem>
                  <SelectItem value="verdana">Verdana</SelectItem>
                  <SelectItem value="lato">Lato</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="main_text">Texto Principal</Label>
              <Textarea id="main_text" value={formData.main_text || ''} onChange={e => handleInputChange('main_text', e.target.value)} rows={4} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="main_text_font">Fonte do Texto Principal</Label>
              <Select value={formData.main_text_font || 'sans-serif'} onValueChange={value => handleInputChange('main_text_font', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sans-serif">Sans-serif</SelectItem>
                  <SelectItem value="serif">Serif</SelectItem>
                  <SelectItem value="monospace">Monospace</SelectItem>
                  <SelectItem value="arial">Arial</SelectItem>
                  <SelectItem value="verdana">Verdana</SelectItem>
                  <SelectItem value="lato">Lato</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="secondary_text">Texto Secundário</Label>
              <Textarea id="secondary_text" value={formData.secondary_text || ''} onChange={e => handleInputChange('secondary_text', e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary_text_font">Fonte do Texto Secundário</Label>
              <Select value={formData.secondary_text_font || 'sans-serif'} onValueChange={value => handleInputChange('secondary_text_font', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sans-serif">Sans-serif</SelectItem>
                  <SelectItem value="serif">Serif</SelectItem>
                  <SelectItem value="monospace">Monospace</SelectItem>
                  <SelectItem value="arial">Arial</SelectItem>
                  <SelectItem value="verdana">Verdana</SelectItem>
                  <SelectItem value="lato">Lato</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 p-4 border rounded-lg bg-purple-50">
            <h3 className="font-semibold text-sm">🎨 Cor do Bloco de Conteúdo</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="card_background_color">Cor de Fundo</Label>
                <Input 
                  id="card_background_color" 
                  type="color" 
                  value={(() => {
                    const color = formData.card_background_color || '#000000';
                    if (color.startsWith('#')) return color;
                    // Convert rgba to hex for color picker
                    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                    if (match) {
                      const r = parseInt(match[1]).toString(16).padStart(2, '0');
                      const g = parseInt(match[2]).toString(16).padStart(2, '0');
                      const b = parseInt(match[3]).toString(16).padStart(2, '0');
                      return `#${r}${g}${b}`;
                    }
                    return '#000000';
                  })()}
                  onChange={e => handleInputChange('card_background_color', e.target.value)}
                  className="h-10 w-16"
                />
                <Input 
                  type="text" 
                  value={formData.card_background_color || '#000000'} 
                  onChange={e => handleInputChange('card_background_color', e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="card_opacity">Opacidade</Label>
                <Input 
                  id="card_opacity" 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={formData.card_opacity ?? 100} 
                  onChange={e => handleInputChange('card_opacity', parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm w-12 text-center">{formData.card_opacity ?? 100}%</span>
              </div>
              <p className="text-xs text-gray-500">100% = cor sólida, 0% = totalmente transparente</p>
            </div>
          </div>

          <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
            <h3 className="font-semibold text-sm">Configurações do Botão</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="button_color">Cor do Botão</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="button_color" 
                    type="color" 
                    value={formData.button_color || '#ffffff'} 
                    onChange={e => handleInputChange('button_color', e.target.value)}
                    className="h-12 w-20"
                  />
                  <Input 
                    type="text" 
                    value={formData.button_color || '#ffffff'} 
                    onChange={e => handleInputChange('button_color', e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="button_text_color">Cor do Texto do Botão</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="button_text_color" 
                    type="color" 
                    value={formData.button_text_color || '#2563eb'} 
                    onChange={e => handleInputChange('button_text_color', e.target.value)}
                    className="h-12 w-20"
                  />
                  <Input 
                    type="text" 
                    value={formData.button_text_color || '#2563eb'} 
                    onChange={e => handleInputChange('button_text_color', e.target.value)}
                    placeholder="#2563eb"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
           <Button
             type="button"
             variant="outline"
             onClick={() => window.open(createPageUrl('Welcome'), '_blank')}
             className="gap-2"
           >
             <Eye className="w-4 h-4" />
             Testar/Visualizar
           </Button>
           <Button type="submit" disabled={isSaving}>
             {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
             Salvar Conteúdo
           </Button>
         </CardFooter>
      </form>
    </Card>
  );
}