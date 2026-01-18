import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PERIOD_OPTIONS = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
  { value: '365', label: 'Último ano' },
  { value: 'all', label: 'Todo o período' },
];

export default function PeriodFilter({ selectedPeriod, onPeriodChange }) {
  return (
    <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      <Select value={selectedPeriod} onValueChange={onPeriodChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Selecione o período" />
        </SelectTrigger>
        <SelectContent>
          {PERIOD_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}