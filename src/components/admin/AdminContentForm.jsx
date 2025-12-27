import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ReactQuill from 'react-quill';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, ImageIcon } from 'lucide-react';
import { UploadFile } from '@/integrations/Core'; // Assuming this path and function signature
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
            Editar Conteúdo da Página de Boas-vindas (mantém formatação)
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

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" value={formData.title || ''} onChange={e => handleInputChange('title', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtítulo</Label>
            <Input id="subtitle" value={formData.subtitle || ''} onChange={e => handleInputChange('subtitle', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="main_text">Texto Principal (formatação preservada)</Label>
            <ReactQuill theme="snow" value={formData.main_text || ''} onChange={(value) => handleInputChange('main_text', value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondary_text">Texto Secundário</Label>
            <ReactQuill theme="snow" value={formData.secondary_text || ''} onChange={(value) => handleInputChange('secondary_text', value)} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Conteúdo
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}