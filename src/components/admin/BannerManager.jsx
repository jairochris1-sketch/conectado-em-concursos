import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function BannerManager() {
  const [settings, setSettings] = useState({
    is_active: true,
    tag_text: 'Planos',
    title: 'Planos Premium: conheça todas as vantagens',
    description: 'Questões ilimitadas, área de estudos completa, provas, resumos e muito mais. Acelere sua aprovação!',
    button_text: 'Conhecer Planos',
    button_link: 'Subscription',
    bg_color: 'bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700'
  });
  
  const [recordId, setRecordId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await base44.entities.BannerSettings.filter({});
      if (data && data.length > 0) {
        setSettings(data[0]);
        setRecordId(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do banner:', error);
      toast.error('Erro ao carregar configurações do banner');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (recordId) {
        await base44.entities.BannerSettings.update(recordId, settings);
      } else {
        const result = await base44.entities.BannerSettings.create(settings);
        setRecordId(result.id);
      }
      toast.success('Configurações do banner salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações do banner:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Carregando configurações...</div>;
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Configurações do Banner Superior</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Switch 
            checked={settings.is_active} 
            onCheckedChange={(val) => handleChange('is_active', val)} 
            id="is-active"
          />
          <Label htmlFor="is-active">Ativar Banner Superior</Label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Tag (ex: Planos)</Label>
            <Input 
              value={settings.tag_text || ''} 
              onChange={(e) => handleChange('tag_text', e.target.value)} 
            />
          </div>
          
          <div className="space-y-2">
            <Label>Cor de Fundo (Classes Tailwind)</Label>
            <Input 
              value={settings.bg_color || ''} 
              onChange={(e) => handleChange('bg_color', e.target.value)} 
              placeholder="ex: bg-blue-600 ou bg-gradient-to-r..."
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Título Principal</Label>
            <Input 
              value={settings.title || ''} 
              onChange={(e) => handleChange('title', e.target.value)} 
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Descrição</Label>
            <Input 
              value={settings.description || ''} 
              onChange={(e) => handleChange('description', e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <Label>Texto do Botão</Label>
            <Input 
              value={settings.button_text || ''} 
              onChange={(e) => handleChange('button_text', e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <Label>Link do Botão (Nome da Rota)</Label>
            <Input 
              value={settings.button_link || ''} 
              onChange={(e) => handleChange('button_link', e.target.value)} 
              placeholder="ex: Subscription ou Questions"
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full md:w-auto">
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </CardContent>
    </Card>
  );
}