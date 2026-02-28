import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Play, Trash2, Loader2, Volume2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationSoundManager() {
  const [currentSoundUrl, setCurrentSoundUrl] = useState(null);
  const [settingsId, setSettingsId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await base44.entities.SiteSettings.filter({ key: 'notification_sound' });
      if (settings.length > 0) {
        setCurrentSoundUrl(settings[0].notification_sound_url);
        setSettingsId(settings[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('audio')) {
      toast.error('Por favor, selecione um arquivo de áudio (MP3)');
      return;
    }

    setIsUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      const soundUrl = result.file_url;

      if (settingsId) {
        await base44.entities.SiteSettings.update(settingsId, {
          notification_sound_url: soundUrl
        });
      } else {
        const created = await base44.entities.SiteSettings.create({
          key: 'notification_sound',
          notification_sound_url: soundUrl
        });
        setSettingsId(created.id);
      }

      setCurrentSoundUrl(soundUrl);
      toast.success('Som de notificação atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload do arquivo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePlayPreview = () => {
    if (!currentSoundUrl) return;
    const audio = new Audio(currentSoundUrl);
    audio.play().catch(e => toast.error('Erro ao reproduzir: ' + e.message));
  };

  const handleRemoveSound = async () => {
    if (!settingsId) return;
    try {
      await base44.entities.SiteSettings.update(settingsId, { notification_sound_url: null });
      setCurrentSoundUrl(null);
      toast.success('Som removido com sucesso!');
    } catch (error) {
      toast.error('Erro ao remover som');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-blue-600" />
          Som de Notificação do Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure o som que será tocado para os usuários quando receberem uma nova mensagem no chat de suporte.
        </p>

        {currentSoundUrl ? (
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-800 dark:text-green-300">Som configurado</p>
              <p className="text-xs text-green-600 dark:text-green-400 truncate">{currentSoundUrl}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handlePlayPreview} className="gap-1">
                <Play className="w-3 h-3" /> Testar
              </Button>
              <Button size="sm" variant="outline" onClick={handleRemoveSound} className="text-red-600 hover:text-red-700 gap-1">
                <Trash2 className="w-3 h-3" /> Remover
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
            <Volume2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Nenhum som configurado</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.ogg"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-2"
          >
            {isUploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
            ) : (
              <><Upload className="w-4 h-4" /> {currentSoundUrl ? 'Trocar arquivo MP3' : 'Enviar arquivo MP3'}</>
            )}
          </Button>
          <p className="text-xs text-gray-500">Formatos aceitos: MP3, WAV, OGG</p>
        </div>
      </CardContent>
    </Card>
  );
}