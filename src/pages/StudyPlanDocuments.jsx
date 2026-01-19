import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Trash2, ExternalLink, Calendar, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const subjectOptions = [
  'Português',
  'Matemática',
  'Direito Constitucional',
  'Direito Administrativo',
  'Direito Penal',
  'Direito Civil',
  'Informática',
  'Conhecimentos Gerais',
  'Raciocínio Lógico',
  'Contabilidade',
  'Pedagogia'
];

export default function StudyPlanDocumentsPage() {
  const [plans, setPlans] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjects: [],
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      const userPlans = await base44.entities.StudyPlanDocument.filter(
        { created_by: userData.email },
        '-created_date'
      );
      setPlans(userPlans);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast.error('Erro ao carregar planos');
    }
    setIsLoading(false);
  };

  const handleCreatePlan = async () => {
    if (!formData.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    setIsCreating(true);
    try {
      const response = await base44.functions.invoke('createStudyPlanDoc', formData);

      if (response.data.success) {
        toast.success('Plano de estudo criado com sucesso!');
        setFormData({
          title: '',
          description: '',
          subjects: [],
          start_date: '',
          end_date: ''
        });
        await loadData();
      } else {
        toast.error(response.data.error || 'Erro ao criar plano');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao criar plano de estudo');
    }
    setIsCreating(false);
  };

  const handleDeletePlan = async (plan) => {
    try {
      await base44.entities.StudyPlanDocument.delete(plan.id);
      setPlans(plans.filter(p => p.id !== plan.id));
      toast.success('Plano deletado');
      setSelectedForDelete(null);
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast.error('Erro ao deletar plano');
    }
  };

  const toggleSubject = (subject) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    active: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    archived: 'bg-yellow-100 text-yellow-800'
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10 bg-gradient-to-b from-[#14142a] via-[#161a33] to-[#101226] text-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Planos de Estudo</h1>
            <p className="text-gray-400">Crie e gerencie seus planos de estudo no Google Docs</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2" size="lg" style={{ backgroundColor: 'var(--primary-color)' }}>
                <Plus className="w-5 h-5" />
                Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md dark:bg-gray-900 dark:border-gray-800">
              <DialogHeader>
                <DialogTitle>Criar Novo Plano de Estudo</DialogTitle>
                <DialogDescription>Crie um novo documento de plano de estudo no Google Docs</DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Título *
                  </label>
                  <Input
                    placeholder="Ex: Plano de Estudo - Direito Administrativo"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Descrição
                  </label>
                  <Textarea
                    placeholder="Descreva o objetivo deste plano de estudo"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="dark:bg-gray-800 dark:border-gray-700 h-20"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Disciplinas
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700">
                    {subjectOptions.map(subject => (
                      <label key={subject} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.subjects.includes(subject)}
                          onChange={() => toggleSubject(subject)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">{subject}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Data Início
                    </label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Data Fim
                    </label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <DialogTrigger asChild>
                    <Button variant="outline" className="dark:border-gray-700 dark:hover:bg-gray-800">
                      Cancelar
                    </Button>
                  </DialogTrigger>
                  <Button
                    onClick={handleCreatePlan}
                    disabled={isCreating}
                    style={{ backgroundColor: 'var(--primary-color)' }}
                    className="flex-1"
                  >
                    {isCreating ? 'Criando...' : 'Criar Plano'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Plans Grid */}
        {plans.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 mx-auto text-gray-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-gray-300">Nenhum plano criado</h3>
            <p className="text-gray-400 mb-6">Crie seu primeiro plano de estudo para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all h-full flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-white truncate">
                          {plan.title}
                        </CardTitle>
                        <Badge className={`mt-2 ${statusColors[plan.status] || statusColors.draft}`}>
                          {plan.status}
                        </Badge>
                      </div>
                      <button
                        onClick={() => setSelectedForDelete(plan)}
                        className="text-gray-500 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {plan.description && (
                      <CardDescription className="text-gray-400 mt-2 line-clamp-2">
                        {plan.description}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="space-y-3">
                      {plan.subjects && plan.subjects.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" /> Disciplinas
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {plan.subjects.slice(0, 3).map(subject => (
                              <Badge key={subject} variant="outline" className="text-xs dark:border-gray-700">
                                {subject}
                              </Badge>
                            ))}
                            {plan.subjects.length > 3 && (
                              <Badge variant="outline" className="text-xs dark:border-gray-700">
                                +{plan.subjects.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {(plan.start_date || plan.end_date) && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Período
                          </p>
                          <p className="text-sm text-gray-300">
                            {plan.start_date && new Date(plan.start_date).toLocaleDateString('pt-BR')}
                            {plan.end_date && ` até ${new Date(plan.end_date).toLocaleDateString('pt-BR')}`}
                          </p>
                        </div>
                      )}

                      <p className="text-xs text-gray-500">
                        Criado em {new Date(plan.created_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </CardContent>

                  <div className="p-4 border-t border-gray-800">
                    <a
                      href={plan.google_doc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white transition-all"
                      style={{ backgroundColor: 'var(--primary-color)' }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Abrir no Google Docs
                    </a>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={selectedForDelete !== null} onOpenChange={(open) => !open && setSelectedForDelete(null)}>
          <AlertDialogContent className="dark:bg-gray-900 dark:border-gray-800">
            <AlertDialogHeader>
              <AlertDialogTitle>Deletar Plano?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja deletar o plano "{selectedForDelete?.title}"? Esta ação não pode ser desfeita.
                O documento no Google Docs não será deletado, apenas a referência neste app.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="dark:border-gray-700 dark:hover:bg-gray-800">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedForDelete && handleDeletePlan(selectedForDelete)}
                className="bg-red-600 hover:bg-red-700"
              >
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}