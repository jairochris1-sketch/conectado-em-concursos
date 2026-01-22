import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Shield, 
  Search, 
  Eye, 
  Filter,
  Calendar,
  User,
  FileText,
  Trash2,
  Edit,
  PlusCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const actionTypeLabels = {
  question_created: { label: 'Questão Criada', icon: PlusCircle, color: 'bg-green-100 text-green-800' },
  question_updated: { label: 'Questão Editada', icon: Edit, color: 'bg-blue-100 text-blue-800' },
  question_deleted: { label: 'Questão Excluída', icon: Trash2, color: 'bg-red-100 text-red-800' },
  user_updated: { label: 'Usuário Editado', icon: User, color: 'bg-blue-100 text-blue-800' },
  user_deleted: { label: 'Usuário Excluído', icon: Trash2, color: 'bg-red-100 text-red-800' },
  subscription_created: { label: 'Assinatura Criada', icon: PlusCircle, color: 'bg-green-100 text-green-800' },
  subscription_updated: { label: 'Assinatura Editada', icon: Edit, color: 'bg-blue-100 text-blue-800' },
  subscription_deleted: { label: 'Assinatura Excluída', icon: Trash2, color: 'bg-red-100 text-red-800' },
  special_user_created: { label: 'Usuário Especial Criado', icon: PlusCircle, color: 'bg-green-100 text-green-800' },
  special_user_updated: { label: 'Usuário Especial Editado', icon: Edit, color: 'bg-blue-100 text-blue-800' },
  special_user_deleted: { label: 'Usuário Especial Excluído', icon: Trash2, color: 'bg-red-100 text-red-800' },
  content_updated: { label: 'Conteúdo Atualizado', icon: FileText, color: 'bg-purple-100 text-purple-800' },
  faq_created: { label: 'FAQ Criado', icon: PlusCircle, color: 'bg-green-100 text-green-800' },
  faq_updated: { label: 'FAQ Editado', icon: Edit, color: 'bg-blue-100 text-blue-800' },
  faq_deleted: { label: 'FAQ Excluído', icon: Trash2, color: 'bg-red-100 text-red-800' },
  video_created: { label: 'Vídeo Criado', icon: PlusCircle, color: 'bg-green-100 text-green-800' },
  video_updated: { label: 'Vídeo Editado', icon: Edit, color: 'bg-blue-100 text-blue-800' },
  video_deleted: { label: 'Vídeo Excluído', icon: Trash2, color: 'bg-red-100 text-red-800' },
  article_created: { label: 'Artigo Criado', icon: PlusCircle, color: 'bg-green-100 text-green-800' },
  article_updated: { label: 'Artigo Editado', icon: Edit, color: 'bg-blue-100 text-blue-800' },
  article_deleted: { label: 'Artigo Excluído', icon: Trash2, color: 'bg-red-100 text-red-800' },
  prova_processed: { label: 'Prova Processada', icon: FileText, color: 'bg-green-100 text-green-800' },
  prova_rejected: { label: 'Prova Rejeitada', icon: Trash2, color: 'bg-red-100 text-red-800' },
  institution_created: { label: 'Instituição Criada', icon: PlusCircle, color: 'bg-green-100 text-green-800' },
  institution_updated: { label: 'Instituição Editada', icon: Edit, color: 'bg-blue-100 text-blue-800' },
  institution_deleted: { label: 'Instituição Excluída', icon: Trash2, color: 'bg-red-100 text-red-800' },
  other: { label: 'Outra Ação', icon: Shield, color: 'bg-gray-100 text-gray-800' }
};

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [filterActionType, setFilterActionType] = useState('all');
  const [filterEntityType, setFilterEntityType] = useState('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const auditLogs = await base44.asServiceRole.entities.AuditLog.list('-created_date', 500);
      setLogs(auditLogs);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      toast.error('Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.admin_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.admin_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesActionType = filterActionType === 'all' || log.action_type === filterActionType;
    const matchesEntityType = filterEntityType === 'all' || log.entity_type === filterEntityType;

    return matchesSearch && matchesActionType && matchesEntityType;
  });

  const uniqueEntityTypes = [...new Set(logs.map(log => log.entity_type))];

  const stats = {
    total: logs.length,
    today: logs.filter(log => {
      const logDate = new Date(log.created_date);
      const today = new Date();
      return logDate.toDateString() === today.toDateString();
    }).length,
    thisWeek: logs.filter(log => {
      const logDate = new Date(log.created_date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return logDate >= weekAgo;
    }).length
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowDetailsDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Logs de Auditoria</h2>
        <p className="text-gray-600 mb-6">Rastreamento completo de ações administrativas no sistema</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Logs</p>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <Shield className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hoje</p>
                <p className="text-3xl font-bold text-green-600">{stats.today}</p>
              </div>
              <Calendar className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Última Semana</p>
                <p className="text-3xl font-bold text-purple-600">{stats.thisWeek}</p>
              </div>
              <Calendar className="w-10 h-10 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex gap-2 items-center">
              <Search className="w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por admin ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <Select value={filterActionType} onValueChange={setFilterActionType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Ações</SelectItem>
                {Object.entries(actionTypeLabels).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterEntityType} onValueChange={setFilterEntityType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Entidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Entidades</SelectItem>
                {uniqueEntityTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Ações ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Nenhum log encontrado</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Data/Hora</th>
                    <th className="text-left py-3 px-4 font-semibold">Administrador</th>
                    <th className="text-left py-3 px-4 font-semibold">Ação</th>
                    <th className="text-left py-3 px-4 font-semibold">Entidade</th>
                    <th className="text-left py-3 px-4 font-semibold">Descrição</th>
                    <th className="text-left py-3 px-4 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    const actionConfig = actionTypeLabels[log.action_type] || actionTypeLabels.other;
                    const ActionIcon = actionConfig.icon;
                    
                    return (
                      <tr key={log.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-xs">
                          {format(new Date(log.created_date), 'dd/MM/yyyy HH:mm:ss')}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-sm">{log.admin_name || '-'}</p>
                            <p className="text-xs text-gray-500">{log.admin_email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={actionConfig.color}>
                            <ActionIcon className="w-3 h-3 mr-1" />
                            {actionConfig.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                            {log.entity_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate">
                          {log.entity_description || log.entity_id || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(log)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Log de Auditoria</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Data e Hora</p>
                  <p className="font-semibold">
                    {format(new Date(selectedLog.created_date), 'dd/MM/yyyy HH:mm:ss')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Administrador</p>
                  <p className="font-semibold">{selectedLog.admin_name}</p>
                  <p className="text-xs text-gray-500">{selectedLog.admin_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo de Ação</p>
                  <Badge className={actionTypeLabels[selectedLog.action_type]?.color}>
                    {actionTypeLabels[selectedLog.action_type]?.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo de Entidade</p>
                  <p className="font-mono text-sm">{selectedLog.entity_type}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">ID da Entidade</p>
                  <p className="font-mono text-xs bg-gray-100 p-2 rounded">
                    {selectedLog.entity_id || '-'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Descrição</p>
                  <p className="text-sm">{selectedLog.entity_description || '-'}</p>
                </div>
                {selectedLog.ip_address && (
                  <div>
                    <p className="text-sm text-gray-600">Endereço IP</p>
                    <p className="font-mono text-sm">{selectedLog.ip_address}</p>
                  </div>
                )}
                {selectedLog.user_agent && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">User Agent</p>
                    <p className="text-xs text-gray-500 break-all">{selectedLog.user_agent}</p>
                  </div>
                )}
              </div>

              {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Alterações Realizadas</p>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2 max-h-96 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.changes, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedLog.notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Notas</p>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedLog.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}