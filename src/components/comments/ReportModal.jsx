import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Flag, X } from 'lucide-react';
import { SendEmail } from '@/integrations/Core';

export default function ReportModal({ isOpen, onClose, comment, currentUser, onReportSuccess }) {
  const [justification, setJustification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!justification.trim()) {
      alert('Por favor, preencha a justificativa.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Enviar email de denúncia
      await SendEmail({
        to: 'conectadoemconcursos@gmail.com',
        subject: 'Denúncia de Comentário Abusivo',
        body: `
          <h2>Denúncia de Comentário</h2>
          <p><strong>Denunciante:</strong> ${currentUser?.full_name || currentUser?.email} (${currentUser?.email})</p>
          <p><strong>Comentário reportado por:</strong> ${comment.user_name} (${comment.user_email})</p>
          <p><strong>Cidade do autor:</strong> ${comment.user_city || 'Não informado'}</p>
          <p><strong>Data do comentário:</strong> ${new Date(comment.created_date).toLocaleDateString('pt-BR')}</p>
          <p><strong>Conteúdo do comentário:</strong></p>
          <div style="background-color: #f5f5f5; padding: 10px; border-left: 4px solid #ddd;">
            ${comment.comment_text}
          </div>
          <p><strong>Justificativa da denúncia:</strong></p>
          <p>${justification}</p>
          <hr>
          <p><em>Esta denúncia foi enviada automaticamente pelo sistema.</em></p>
        `
      });

      // Marcar comentário como reportado
      await onReportSuccess();

      // Mostrar mensagem de sucesso
      alert('Obrigado por avisar, mensagem enviada.');
      
      // Fechar modal e limpar
      setJustification('');
      onClose();
    } catch (error) {
      console.error('Erro ao enviar denúncia:', error);
      alert('Erro ao enviar denúncia. Tente novamente.');
    }
    setIsSubmitting(false);
  };

  const handleCancel = () => {
    setJustification('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Flag className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Reportar Abuso</h2>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="justification" className="text-sm font-medium text-gray-700">
              Justificativa (obrigatória)
            </Label>
            <Textarea
              id="justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Descreva o motivo da denúncia..."
              className="mt-1 h-32 resize-none"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              CANCELAR
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!justification.trim() || isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? 'ENVIANDO...' : 'ENVIAR'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}