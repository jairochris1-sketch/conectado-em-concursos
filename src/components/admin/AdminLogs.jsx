import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, Info, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [filterLevel, setFilterLevel] = useState('all');

  // Simulação de logs - em produção, isso viria de um backend
  useEffect(() => {
    const mockLogs = [
      {
        id: 1,
        level: 'info',
        message: 'Usuário conectado',
        timestamp: new Date(Date.now() - 5 * 60000),
        metadata: { email: 'user@example.com' }
      },
      {
        id: 2,
        level: 'success',
        message: 'Assinatura criada com sucesso',
        timestamp: new Date(Date.now() - 15 * 60000),
        metadata: { plan: 'padrao', subscription_id: 'sub_123' }
      },
      {
        id: 3,
        level: 'error',
        message: 'Falha ao processar pagamento',
        timestamp: new Date(Date.now() - 30 * 60000),
        metadata: { error: 'timeout', user: 'user@example.com' }
      },
      {
        id: 4,
        level: 'warning',
        message: 'Taxa de conversão baixa',
        timestamp: new Date(Date.now() - 60 * 60000),
        metadata: { conversion_rate: '2.5%' }
      },
      {
        id: 5,
        level: 'success',
        message: 'Backup realizado com sucesso',
        timestamp: new Date(Date.now() - 120 * 60000),
        metadata: { size: '2.5GB', duration: '15min' }
      }
    ];
    setLogs(mockLogs);
  }, []);

  const filteredLogs = filterLevel === 'all' 
    ? logs 
    : logs.filter(log => log.level === filterLevel);

  const getLevelIcon = (level) => {
    const icons = {
      error: <AlertCircle className="w-4 h-4" />,
      warning: <AlertCircle className="w-4 h-4" />,
      success: <CheckCircle className="w-4 h-4" />,
      info: <Info className="w-4 h-4" />
    };
    return icons[level] || icons.info;
  };

  const getLevelColor = (level) => {
    const colors = {
      error: 'bg-red-900 text-red-200',
      warning: 'bg-yellow-900 text-yellow-200',
      success: 'bg-green-900 text-green-200',
      info: 'bg-blue-900 text-blue-200'
    };
    return colors[level] || 'bg-gray-900 text-gray-200';
  };

  const handleClearLogs = () => {
    if (confirm('Tem certeza que deseja limpar todos os logs?')) {
      setLogs([]);
      toast.success('Logs limpos com sucesso');
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Logs de Eventos</CardTitle>
          <div className="flex gap-3">
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="error">Erros</SelectItem>
                <SelectItem value="warning">Avisos</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearLogs}
              className="text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Limpar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Nenhum log encontrado
              </div>
            ) : (
              filteredLogs.map(log => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-4 bg-gray-700 rounded-lg hover:bg-gray-650 transition"
                >
                  <div className={`mt-1 ${getLevelColor(log.level)} p-2 rounded`}>
                    {getLevelIcon(log.level)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-white">{log.message}</p>
                      <Badge className={getLevelColor(log.level)} className="text-xs">
                        {log.level.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{formatTime(log.timestamp)}</p>
                    {log.metadata && (
                      <div className="text-xs bg-gray-800 rounded p-2 font-mono text-gray-300">
                        {JSON.stringify(log.metadata, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}