import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_INSTITUTIONS = {
  fcc: "FCC",
  cespe: "CESPE/CEBRASPE",
  vunesp: "VUNESP",
  fgv: "FGV",
  cesgranrio: "CESGRANRIO",
  esaf: "ESAF",
  fundatec: "FUNDATEC",
  consulplan: "CONSULPLAN",
  idecan: "IDECAN",
  aocp: "AOCP",
  quadrix: "QUADRIX",
  instituto_aocp: "Instituto AOCP",
  planejar: "PLANEJAR",
  ibptec: "IBPTEC",
  amiga_publica: "AMIGA PÚBLICA",
  ibade: "IBADE",
  ibfc: "IBFC",
  objetiva: "Objetiva",
  iades: "IADES",
  itame: "ITAME",
  consep: "CONSEP",
  outras: "Outras"
};

export default function InstitutionManager() {
  const [institutions, setInstitutions] = useState([]);
  const [newInstitution, setNewInstitution] = useState({ key: '', name: '' });

  useEffect(() => {
    loadInstitutions();
  }, []);

  const loadInstitutions = () => {
    const savedInstitutions = localStorage.getItem('custom_institutions');
    const customInstitutions = savedInstitutions ? JSON.parse(savedInstitutions) : {};
    
    const allInstitutions = { ...DEFAULT_INSTITUTIONS, ...customInstitutions };
    
    const institutionsList = Object.entries(allInstitutions).map(([key, name]) => ({
      key,
      name,
      isDefault: !!DEFAULT_INSTITUTIONS[key]
    }));
    
    institutionsList.sort((a, b) => a.name.localeCompare(b.name));
    setInstitutions(institutionsList);
  };

  const handleAddInstitution = () => {
    if (!newInstitution.key.trim() || !newInstitution.name.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    const key = newInstitution.key.toLowerCase().replace(/\s+/g, '_');
    
    if (DEFAULT_INSTITUTIONS[key]) {
      toast.error('Esta banca já existe no sistema');
      return;
    }

    const savedInstitutions = localStorage.getItem('custom_institutions');
    const customInstitutions = savedInstitutions ? JSON.parse(savedInstitutions) : {};
    
    if (customInstitutions[key]) {
      toast.error('Esta banca personalizada já existe');
      return;
    }

    customInstitutions[key] = newInstitution.name;
    localStorage.setItem('custom_institutions', JSON.stringify(customInstitutions));
    
    toast.success('Banca adicionada com sucesso!');
    toast.info('⚠️ Atenção: Para usar esta banca nas questões, você precisa adicioná-la ao enum da entidade Question.');
    
    setNewInstitution({ key: '', name: '' });
    loadInstitutions();
    
    // Disparar evento para atualizar outras partes do sistema
    window.dispatchEvent(new Event('institutionsUpdated'));
  };

  const handleDeleteInstitution = (key) => {
    if (DEFAULT_INSTITUTIONS[key]) {
      toast.error('Não é possível remover bancas padrão do sistema');
      return;
    }

    if (window.confirm('Tem certeza que deseja remover esta banca?')) {
      const savedInstitutions = localStorage.getItem('custom_institutions');
      const customInstitutions = savedInstitutions ? JSON.parse(savedInstitutions) : {};
      
      delete customInstitutions[key];
      localStorage.setItem('custom_institutions', JSON.stringify(customInstitutions));
      
      toast.success('Banca removida com sucesso!');
      loadInstitutions();
      
      // Disparar evento para atualizar outras partes do sistema
      window.dispatchEvent(new Event('institutionsUpdated'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Gerenciar Bancas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Como funciona:</strong> As bancas padrão não podem ser removidas. 
            Você pode adicionar bancas personalizadas aqui para referência, mas para usá-las nas questões, 
            é necessário adicionar a chave ao enum "institution" na entidade Question.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <Label htmlFor="institution-key">Chave (identificador único)</Label>
            <Input
              id="institution-key"
              placeholder="ex: consep"
              value={newInstitution.key}
              onChange={(e) => setNewInstitution({ ...newInstitution, key: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="institution-name">Nome de Exibição</Label>
            <Input
              id="institution-name"
              placeholder="ex: CONSEP"
              value={newInstitution.name}
              onChange={(e) => setNewInstitution({ ...newInstitution, name: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <Button onClick={handleAddInstitution} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Banca
            </Button>
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chave</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {institutions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">
                    Nenhuma banca encontrada
                  </TableCell>
                </TableRow>
              ) : (
                institutions.map((institution) => (
                  <TableRow key={institution.key}>
                    <TableCell className="font-mono text-sm">{institution.key}</TableCell>
                    <TableCell className="font-semibold">{institution.name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        institution.isDefault 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {institution.isDefault ? 'Padrão' : 'Personalizada'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {!institution.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteInstitution(institution.key)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>⚠️ Importante:</strong> Para usar uma nova banca nas questões, você precisa:
            <br />
            1. Adicionar a chave aqui para referência
            <br />
            2. Editar a entidade Question e adicionar a chave ao enum "institution"
            <br />
            3. Atualizar a lista STATIC_INSTITUTIONS no arquivo Admin.jsx
          </p>
        </div>
      </CardContent>
    </Card>
  );
}