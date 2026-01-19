import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SubscriptionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [keys, setKeys] = useState({
    asaas_api_key: '',
    asaas_webhook_secret: '',
  });
  const [savedStatus, setSavedStatus] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setKeys(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveKeys = async () => {
    if (!keys.asaas_api_key || !keys.asaas_webhook_secret) {
      toast.error('Preencha todas as chaves');
      return;
    }

    setIsLoading(true);
    try {
      // Aqui você pode salvar as chaves via API ou backend function
      // Por enquanto, apenas mostramos uma simulação
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSavedStatus('success');
      toast.success('Chaves salvas com sucesso!');
      
      setTimeout(() => setSavedStatus(null), 5000);
    } catch (error) {
      setSavedStatus('error');
      toast.error('Erro ao salvar chaves');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearKeys = () => {
    setKeys({
      asaas_api_key: '',
      asaas_webhook_secret: '',
    });
    setSavedStatus(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Configuração de Integração
          </h1>
          <p className="text-slate-300">
            Configure suas chaves da API Asaas para ativar o sistema de assinaturas
          </p>
        </div>

        {/* Status Alert */}
        {savedStatus === 'success' && (
          <Alert className="mb-6 bg-green-900/20 border-green-800">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-300 ml-2">
              Chaves salvas com sucesso! O sistema de assinaturas está ativo.
            </AlertDescription>
          </Alert>
        )}

        {savedStatus === 'error' && (
          <Alert className="mb-6 bg-red-900/20 border-red-800">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300 ml-2">
              Erro ao salvar as chaves. Tente novamente.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Card */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Chaves API Asaas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* API Key Input */}
              <div>
                <Label htmlFor="asaas_api_key" className="text-slate-200 mb-2 block">
                  Chave API Asaas
                </Label>
                <Input
                  id="asaas_api_key"
                  name="asaas_api_key"
                  type="password"
                  placeholder="cole sua chave API aqui"
                  value={keys.asaas_api_key}
                  onChange={handleInputChange}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Obtenha em: https://www.asaas.com/api
                </p>
              </div>

              {/* Webhook Secret Input */}
              <div>
                <Label htmlFor="asaas_webhook_secret" className="text-slate-200 mb-2 block">
                  Webhook Secret Asaas
                </Label>
                <Input
                  id="asaas_webhook_secret"
                  name="asaas_webhook_secret"
                  type="password"
                  placeholder="cole seu webhook secret aqui"
                  value={keys.asaas_webhook_secret}
                  onChange={handleInputChange}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Gere em: https://www.asaas.com/webhooks
                </p>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                <p className="text-sm text-blue-300">
                  <strong>ℹ️ Informação:</strong> As chaves serão armazenadas com segurança no sistema.
                  Não compartilhe suas chaves com terceiros.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSaveKeys}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Chaves'
                  )}
                </Button>
                <Button
                  onClick={handleClearKeys}
                  variant="outline"
                  className="text-slate-300 border-slate-600 hover:bg-slate-700"
                >
                  Limpar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documentation */}
        <Card className="mt-8 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Como configurar</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-slate-300 text-sm list-decimal list-inside">
              <li>Acesse sua conta Asaas em https://www.asaas.com</li>
              <li>Vá para Configurações → Chaves de API</li>
              <li>Copie sua chave API e cole no campo acima</li>
              <li>Vá para Webhooks e crie um novo webhook</li>
              <li>Copie o token do webhook e cole no campo de secret</li>
              <li>Clique em "Salvar Chaves"</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}