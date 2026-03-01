import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, MessageSquare, Users, Reply, Heart, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationPreferences({ preferences, onPreferencesChange }) {
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (key) => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onPreferencesChange(localPreferences);
      toast.success('Preferências salvas com sucesso');
    } catch (error) {
      toast.error('Erro ao salvar preferências');
      setLocalPreferences(preferences);
    } finally {
      setIsSaving(false);
    }
  };

  const notificationTypes = [
    {
      key: 'messages',
      label: 'Mensagens de Parceiros',
      description: 'Notificações ao receber mensagens de parceiros de estudo',
      icon: MessageSquare
    },
    {
      key: 'partnerships',
      label: 'Solicitações de Parceria',
      description: 'Notificações quando alguém solicita parceria contigo',
      icon: Users
    },
    {
      key: 'replies',
      label: 'Respostas em Posts',
      description: 'Notificações quando alguém responde seus posts',
      icon: Reply
    },
    {
      key: 'likes',
      label: 'Curtidas',
      description: 'Notificações quando seus posts/comentários recebem curtidas',
      icon: Heart
    },
    {
      key: 'activities',
      label: 'Atividades Gerais',
      description: 'Outras atividades na comunidade que envolvam você',
      icon: Zap
    }
  ];

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Preferências de Notificações
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
          Configure quais tipos de notificações você deseja receber
        </p>
      </div>

      <div className="space-y-3">
        {notificationTypes.map(({ key, label, description, icon: Icon }) => (
          <Card key={key} className="border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <Label className="font-semibold text-gray-900 dark:text-white cursor-pointer">
                      {label}
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {description}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={localPreferences[key]}
                  onCheckedChange={() => handleToggle(key)}
                  disabled={isSaving}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSaving ? 'Salvando...' : 'Salvar Preferências'}
        </Button>
      </div>
    </div>
  );
}