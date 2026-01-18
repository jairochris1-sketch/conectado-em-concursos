import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Maximize2, Type, LineChart } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export default function ReadingControls({ settings, onSettingsChange, onToggleFocusMode }) {
  const fontFamilies = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Verdana', label: 'Verdana' },
    { value: 'Courier New', label: 'Courier New' }
  ];

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="text-gray-900 dark:text-white">
            <Settings className="w-4 h-4 mr-2" />
            Personalizar
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                <Type className="w-4 h-4" />
                Fonte
              </Label>
              <Select value={settings.fontFamily} onValueChange={(value) => onSettingsChange({ ...settings, fontFamily: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontFamilies.map(font => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2">
                Tamanho da Fonte: {settings.fontSize}px
              </Label>
              <Slider
                value={[settings.fontSize]}
                onValueChange={(value) => onSettingsChange({ ...settings, fontSize: value[0] })}
                min={14}
                max={24}
                step={1}
                className="w-full"
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                <LineChart className="w-4 h-4" />
                Espaçamento de Linha: {settings.lineHeight}
              </Label>
              <Slider
                value={[settings.lineHeight]}
                onValueChange={(value) => onSettingsChange({ ...settings, lineHeight: value[0] })}
                min={1.4}
                max={2.2}
                step={0.1}
                className="w-full"
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2">
                Largura Máxima: {settings.maxWidth}
              </Label>
              <Select value={settings.maxWidth} onValueChange={(value) => onSettingsChange({ ...settings, maxWidth: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Largura Total</SelectItem>
                  <SelectItem value="4xl">Extra Largo</SelectItem>
                  <SelectItem value="3xl">Largo</SelectItem>
                  <SelectItem value="2xl">Médio</SelectItem>
                  <SelectItem value="xl">Compacto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button variant="outline" size="sm" onClick={onToggleFocusMode} className="text-gray-900 dark:text-white">
        <Maximize2 className="w-4 h-4 mr-2" />
        Modo Foco
      </Button>
    </div>
  );
}