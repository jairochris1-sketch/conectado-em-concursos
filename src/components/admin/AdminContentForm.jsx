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
import { optimizeImageFile, getImageStats } from '@/utils/imageOptimizer';

export default function AdminContentForm({ content, onSave }) {
  const [formData, setFormData] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingBg, setIsUploadingBg] = useState(false);

  useEffect(() => {
    setFormData(content);
  }, [content]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBackgroundUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploadingBg(true);
    try {
      // Ensure UploadFile returns an object with file_url
      const { file_url } = await UploadFile({ file });
      handleInputChange('background_image_url', file_url);
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error);
      alert("Erro ao fazer upload da imagem. Tente novamente.");
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
            <Label className="flex items-center gap-2 font-semibold"><ImageIcon /> Imagem de Fundo</Label>
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 rounded-md">
                <AvatarImage src={formData.background_image_url} />
                <AvatarFallback className="rounded-md">
                  <ImageIcon />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                 <Input id="background-upload" type="file" accept="image/*" onChange={handleBackgroundUpload} disabled={isUploadingBg} />
                 <p className="text-xs text-gray-500 mt-2">Escolha uma imagem para o fundo da tela de boas-vindas. Recomendamos imagens com boa resolução.</p>
              </div>
               {isUploadingBg && <Loader2 className="w-5 h-5 animate-spin" />}
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