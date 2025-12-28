import React, { useState, useEffect } from 'react';
import { ProvaEnviada } from '@/entities/ProvaEnviada';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, Loader2 } from 'lucide-react';
import { format } from "date-fns";
import { CreateFileSignedUrl } from '@/integrations/Core';
import { toast } from 'sonner';

export default function ProvasEnviadasList() {
  const [provas, setProvas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProvas();
  }, []);

  const loadProvas = async () => {
    setIsLoading(true);
    try {
      const provasData = await ProvaEnviada.list('-created_date');
      setProvas(provasData);
    } catch (error) {
      console.error('Erro ao carregar provas:', error);
      toast.error('Erro ao carregar provas.');
    }
    setIsLoading(false);
  };

  const handleDownload = async (prova) => {
    try {
      const { signed_url } = await CreateFileSignedUrl({ 
        file_uri: prova.file_uri,
        expires_in: 3600 
      });
      
      window.open(signed_url, '_blank');
    } catch (error) {
      console.error('Erro ao gerar URL de download:', error);
      toast.error('Erro ao fazer download do arquivo.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta prova?')) {
      try {
        await ProvaEnviada.delete(id);
        toast.success('Prova excluída com sucesso!');
        loadProvas();
      } catch (error) {
        console.error('Erro ao excluir prova:', error);
        toast.error('Erro ao excluir prova.');
      }
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'processado': return 'bg-green-100 text-green-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'rejeitado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'processado': return 'Processado';
      case 'pendente': return 'Pendente';
      case 'rejeitado': return 'Rejeitado';
      default: return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Provas Enviadas pelos Usuários</CardTitle>
          <Button onClick={loadProvas} variant="outline" size="sm">
            <Loader2 className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Arquivo</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Banca</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Instituição</TableHead>
                <TableHead>Data da Prova</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enviado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan="9" className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : provas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan="9" className="text-center py-8">
                    Nenhuma prova encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                provas.map(prova => (
                  <TableRow key={prova.id}>
                    <TableCell className="max-w-xs truncate" title={prova.file_name}>
                      {prova.file_name}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{prova.user_name}</div>
                        <div className="text-sm text-gray-500">{prova.user_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{prova.banca}</Badge>
                    </TableCell>
                    <TableCell>{prova.cargo}</TableCell>
                    <TableCell>{prova.instituicao}</TableCell>
                    <TableCell>
                      {prova.data_prova ? format(new Date(prova.data_prova), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(prova.status)}>
                        {getStatusText(prova.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {format(new Date(prova.created_date), 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(prova)}
                          title="Download"
                        >
                          <Download className="w-4 h-4 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(prova.id)}
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}