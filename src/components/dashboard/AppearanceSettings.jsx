import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Palette, Ruler } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mapeamento de tamanhos para valores rem (P: 14px, M: 16px, G: 20px)
const iconSizes = {
  sm: '0.875rem',
  md: '1rem',
  lg: '1.25rem',
};

export default function AppearanceSettings() {
  const [primaryColor, setPrimaryColor] = useState('#0464fc');
  const [iconSize, setIconSize] = useState('md');

  // Carrega as configurações salvas na primeira renderização
  useEffect(() => {
    const savedColor = localStorage.getItem('primaryColor');
    const savedIconSize = localStorage.getItem('iconSizeKey'); // Usar 'md' como padrão

    if (savedColor) {
      setPrimaryColor(savedColor);
      document.documentElement.style.setProperty('--primary-color', savedColor);
    }
    if (savedIconSize && iconSizes[savedIconSize]) {
      setIconSize(savedIconSize);
      document.documentElement.style.setProperty('--icon-size', iconSizes[savedIconSize]);
    }
  }, []);

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setPrimaryColor(newColor);
    localStorage.setItem('primaryColor', newColor);
    document.documentElement.style.setProperty('--primary-color', newColor);
  };

  const handleIconSizeChange = (sizeKey) => {
    setIconSize(sizeKey);
    localStorage.setItem('iconSizeKey', sizeKey);
    document.documentElement.style.setProperty('--icon-size', iconSizes[sizeKey]);
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-gray-900">
          <Palette className="w-5 h-5" />
          Personalizar Aparência
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seletor de Cor */}
        <div className="space-y-2">
          <Label htmlFor="color-picker" className="font-medium text-gray-700">Cor Principal do Menu</Label>
          <div className="flex items-center gap-2 p-2 border rounded-lg">
            <Input
              id="color-picker"
              type="color"
              value={primaryColor}
              onChange={handleColorChange}
              className="w-10 h-10 p-0 border-none cursor-pointer"
            />
            <span className="font-mono text-sm text-gray-600">{primaryColor}</span>
          </div>
        </div>

        {/* Seletor de Tamanho de Ícone */}
        <div className="space-y-2">
          <Label className="font-medium text-gray-700">Tamanho dos Ícones do Menu</Label>
          <div className="flex gap-2">
            <Button
              variant={iconSize === 'sm' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleIconSizeChange('sm')}
              className={cn(iconSize === 'sm' && 'bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90')}
            >
              P
            </Button>
            <Button
              variant={iconSize === 'md' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleIconSizeChange('md')}
               className={cn(iconSize === 'md' && 'bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90')}
            >
              M
            </Button>
            <Button
              variant={iconSize === 'lg' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleIconSizeChange('lg')}
               className={cn(iconSize === 'lg' && 'bg-[var(--primary-color)] hover:bg-[var(--primary-color)]/90')}
            >
              G
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}