import { useState } from 'react';
import { User } from '@/entities/User';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DeactivateAccountModal({ isOpen, onOpenChange, user, onDeactivationRequested, onCancelDeactivation }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestDeactivation = async () => {
    if (!confirm('Você tem certeza que deseja desativar sua conta? Você terá 20 dias para mudar de ideia antes da desativação definitiva.')) {
      return;
    }

    setIsLoading(true);
    try {
      await User.updateMyUserData({
        deactivation_requested: true,
        deactivation_request_date: new Date().toISOString()
      });
      
      alert('Solicitação de desativação registrada. Você tem 20 dias para cancelar antes da desativação definitiva.');
      onDeactivationRequested();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao solicitar desativação:', error);
      alert('Erro ao processar solicitação. Tente novamente.');
    }
    setIsLoading(false);
  };

  const handleCancelDeactivation = async () => {
    if (!confirm('Deseja cancelar a solicitação de desativação da sua conta?')) {
      return;
    }

    setIsLoading(true);
    try {
      await User.updateMyUserData({
        deactivation_requested: false,
        deactivation_request_date: null
      });
      
      alert('Solicitação de desativação cancelada com sucesso!');
      onCancelDeactivation();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao cancelar desativação:', error);
      alert('Erro ao cancelar solicitação. Tente novamente.');
    }
    setIsLoading(false);
  };

  const getDaysRemaining = () => {
    if (!user?.deactivation_request_date) return 0;
    
    const requestDate = new Date(user.deactivation_request_date);
    const now = new Date();
    const diffTime = now.getTime() - requestDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, 20 - diffDays);
  };

  const daysRemaining = getDaysRemaining();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            {user?.deactivation_requested ? 'Desativação Agendada' : 'Desativar Conta'}
          </DialogTitle>
          <DialogDescription>
            {user?.deactivation_requested 
              ? 'Você tem uma solicitação de desativação pendente.'
              : 'Esta ação pode ser revertida dentro de 20 dias.'}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {user?.deactivation_requested ? (
            <motion.div
              key="deactivation-pending"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-orange-900 mb-1">
                      Sua conta será desativada em breve
                    </h4>
                    <p className="text-sm text-orange-800">
                      Você tem <strong>{daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}</strong> para cancelar 
                      esta solicitação antes que sua conta seja desativada permanentemente.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-gray-900">O que acontecerá:</h4>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Sua assinatura será cancelada automaticamente</li>
                  <li>Seus dados serão mantidos por 90 dias</li>
                  <li>Você não poderá mais acessar a plataforma</li>
                  <li>Seu progresso e estatísticas serão preservados durante este período</li>
                </ul>
              </div>

              <DialogFooter className="flex-col gap-2">
                <Button
                  onClick={handleCancelDeactivation}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Cancelar Desativação
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                  className="w-full"
                >
                  Fechar
                </Button>
              </DialogFooter>
            </motion.div>
          ) : (
            <motion.div
              key="deactivation-request"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2">Atenção!</h4>
                <p className="text-sm text-red-800 mb-3">
                  Ao solicitar a desativação da sua conta:
                </p>
                <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                  <li>Você terá 20 dias para mudar de ideia</li>
                  <li>Sua assinatura será cancelada automaticamente</li>
                  <li>Após 20 dias, você perderá acesso à plataforma</li>
                  <li>Seus dados serão mantidos por 90 dias após a desativação</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Quer apenas fazer uma pausa?</h4>
                <p className="text-sm text-blue-800">
                  Considere apenas cancelar sua assinatura em vez de desativar sua conta. 
                  Assim você mantém seu progresso e pode voltar quando quiser.
                </p>
              </div>

              <DialogFooter className="flex-col gap-2">
                <Button
                  onClick={handleRequestDeactivation}
                  disabled={isLoading}
                  variant="destructive"
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Solicitar Desativação
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                  className="w-full"
                >
                  Cancelar
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}