import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CreditCard, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LastDayModal({ isOpen, onClose, daysRemaining }) {
  if (!isOpen || daysRemaining !== 1) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-red-100 to-orange-100 rounded-full">
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            ⏰ Último Dia de Teste Gratuito!
          </DialogTitle>
          <DialogDescription className="text-center space-y-3 pt-4">
            <p className="text-base text-gray-700">
              Seu período de teste do <strong>Plano Avançado</strong> termina{' '}
              <strong className="text-red-600">hoje</strong>!
            </p>
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-lg p-4">
              <p className="text-sm text-gray-800 font-medium mb-2">
                🎯 Você já explorou:
              </p>
              <ul className="text-xs text-gray-700 space-y-1 text-left list-disc list-inside">
                <li>Questões ilimitadas</li>
                <li>Resumos de disciplinas</li>
                <li>Área de Estudos completa</li>
                <li>Provas e simulados</li>
                <li>E muito mais!</li>
              </ul>
            </div>
            <p className="text-sm text-gray-600">
              Continue com todos os recursos e{' '}
              <strong className="text-red-600">
                não perca seu progresso
              </strong>
              !
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Link to={createPageUrl('Subscription')} className="w-full">
            <Button className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700">
              <CreditCard className="w-4 h-4 mr-2" />
              Assinar Agora e Continuar
            </Button>
          </Link>
          <Button variant="ghost" onClick={onClose} className="w-full">
            <X className="w-4 h-4 mr-2" />
            Lembrar Depois
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}