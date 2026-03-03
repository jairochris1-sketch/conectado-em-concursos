import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Lock, 
  Globe, 
  Trash2, 
  Edit, 
  Copy,
  Play,
  Clock,
  CheckCircle2,
  FileText,
  BarChart3,
  HelpCircle,
  Maximize,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Notebooks() {
  const navigate = useNavigate();
  const [notebooks, setNotebooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [notebookToDelete, setNotebookToDelete] = useState(null);
  
  const [activeTab, setActiveTab] = useState("cadernos");
  
  // Caderno de Erros states
  const [errorRecords, setErrorRecords] = useState([]);
  const [errorSearchTerm, setErrorSearchTerm] = useState("");
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [editingError, setEditingError] = useState(null);
  const [errorForm, setErrorForm] = useState({ subject: "", content: "", note: "" });
  const [errorPage, setErrorPage] = useState(1);
  const [errorItemsPerPage, setErrorItemsPerPage] = useState(10);
  const [showDeleteErrorDialog, setShowDeleteErrorDialog] = useState(false);
  const [errorToDelete, setErrorToDelete] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const [myNotebooks, attempts, errors] = await Promise.all([
        base44.entities.Notebook.filter({ created_by: userData.email }),
        base44.entities.NotebookAttempt.filter({ created_by: userData.email }),
        base44.entities.ErrorRecord.filter({ user_email: userData.email })
      ]);
      setErrorRecords(errors || []);

      // Adiciona informações de tentativas aos cadernos
      const notebooksWithAttempts = myNotebooks.map(notebook => {
        const notebookAttempts = attempts.filter(a => a.notebook_id === notebook.id);
        const lastAttempt = notebookAttempts.sort((a, b) => 
          new Date(b.created_date) - new Date(a.created_date)
        )[0];
        
        return {
          ...notebook,
          attempts_count: notebookAttempts.length,
          last_attempt: lastAttempt
        };
      });

      setNotebooks(notebooksWithAttempts);
    } catch (error) {
      console.error("Erro ao carregar cadernos:", error);
      toast.error("Erro ao carregar cadernos");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await base44.entities.Notebook.delete(notebookToDelete.id);
      
      // Deletar questões e tentativas relacionadas
      const [notebookQuestions, attempts] = await Promise.all([
        base44.entities.NotebookQuestion.filter({ notebook_id: notebookToDelete.id }),
        base44.entities.NotebookAttempt.filter({ notebook_id: notebookToDelete.id })
      ]);

      await Promise.all([
        ...notebookQuestions.map(q => base44.entities.NotebookQuestion.delete(q.id)),
        ...attempts.map(a => base44.entities.NotebookAttempt.delete(a.id))
      ]);

      toast.success("Caderno excluído com sucesso");
      setShowDeleteDialog(false);
      setNotebookToDelete(null);
      loadData();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir caderno");
    }
  };

  const handleDuplicate = async (notebook) => {
    try {
      const questions = await base44.entities.NotebookQuestion.filter({ 
        notebook_id: notebook.id 
      });

      const newNotebook = await base44.entities.Notebook.create({
        name: `${notebook.name} (Cópia)`,
        description: notebook.description,
        type: notebook.type,
        filters: notebook.filters,
        question_count: notebook.question_count
      });

      await Promise.all(
        questions.map(q => 
          base44.entities.NotebookQuestion.create({
            notebook_id: newNotebook.id,
            question_id: q.question_id,
            order: q.order
          })
        )
      );

      toast.success("Caderno duplicado com sucesso");
      loadData();
    } catch (error) {
      console.error("Erro ao duplicar:", error);
      toast.error("Erro ao duplicar caderno");
    }
  };

  const handleSaveError = async () => {
    if (!errorForm.subject || !errorForm.content) {
      toast.error("Preencha matéria e conteúdo");
      return;
    }
    
    try {
      if (editingError) {
        await base44.entities.ErrorRecord.update(editingError.id, {
          subject: errorForm.subject,
          content: errorForm.content,
          note: errorForm.note
        });
        toast.success("Erro atualizado com sucesso");
      } else {
        await base44.entities.ErrorRecord.create({
          user_email: user.email,
          subject: errorForm.subject,
          content: errorForm.content,
          note: errorForm.note
        });
        toast.success("Erro registrado com sucesso");
      }
      setShowErrorDialog(false);
      setEditingError(null);
      setErrorForm({ subject: "", content: "", note: "" });
      loadData();
    } catch (error) {
      console.error("Erro ao salvar registro de erro:", error);
      toast.error("Erro ao salvar");
    }
  };

  const handleDeleteError = async () => {
    try {
      await base44.entities.ErrorRecord.delete(errorToDelete.id);
      toast.success("Erro excluído com sucesso");
      setShowDeleteErrorDialog(false);
      setErrorToDelete(null);
      loadData();
    } catch (error) {
      console.error("Erro ao excluir erro:", error);
      toast.error("Erro ao excluir");
    }
  };

  const openEditError = (err) => {
    setEditingError(err);
    setErrorForm({ subject: err.subject, content: err.content, note: err.note || "" });
    setShowErrorDialog(true);
  };

  const filteredNotebooks = notebooks.filter(n => 
    n.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredErrors = errorRecords.filter(e => 
    (e.subject || "").toLowerCase().includes(errorSearchTerm.toLowerCase()) ||
    (e.content || "").toLowerCase().includes(errorSearchTerm.toLowerCase()) ||
    (e.note || "").toLowerCase().includes(errorSearchTerm.toLowerCase())
  );
  
  const totalErrorPages = Math.ceil(filteredErrors.length / errorItemsPerPage);
  const currentErrorItems = filteredErrors.slice((errorPage - 1) * errorItemsPerPage, errorPage * errorItemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-blue-600" />
                {activeTab === "cadernos" ? "Meus Cadernos de Questões" : "Caderno de Erros"}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {activeTab === "cadernos" 
                  ? "Organize e resolva suas questões de forma personalizada" 
                  : "Registre seus erros para revisão e aprimoramento"}
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
              <TabsList className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-1 shadow-sm">
                <TabsTrigger value="cadernos" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 dark:data-[state=active]:bg-gray-700">
                  Cadernos
                </TabsTrigger>
                <TabsTrigger value="erros" className="data-[state=active]:bg-white data-[state=active]:text-blue-600 dark:data-[state=active]:bg-gray-700">
                  Caderno de Erros
                </TabsTrigger>
              </TabsList>
              
              {activeTab === "cadernos" ? (
                <Button
                  onClick={() => navigate(createPageUrl("CreateNotebook"))}
                  className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Criar Caderno
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setEditingError(null);
                    setErrorForm({ subject: "", content: "", note: "" });
                    setShowErrorDialog(true);
                  }}
                  variant="outline"
                  className="bg-white hover:bg-gray-50 text-gray-800 border-gray-300 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Erro
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="cadernos" className="mt-0 outline-none">
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar cadernos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-800"
                />
              </div>
            </div>

            {filteredNotebooks.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {searchTerm ? "Nenhum caderno encontrado" : "Nenhum caderno criado"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? "Tente buscar com outros termos" 
                  : "Crie seu primeiro caderno de questões"}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => navigate(createPageUrl("CreateNotebook"))}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Criar Caderno
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotebooks.map((notebook) => (
              <Card 
                key={notebook.id} 
                className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800"
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {notebook.type === 'public' ? (
                        <Globe className="w-5 h-5 text-green-600" />
                      ) : (
                        <Lock className="w-5 h-5 text-gray-600" />
                      )}
                      <Badge variant={notebook.type === 'public' ? 'default' : 'secondary'}>
                        {notebook.type === 'public' ? 'Público' : 'Privado'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg">{notebook.name}</CardTitle>
                    {notebook.difficulty && notebook.difficulty !== 'misto' && (
                      <Badge className={
                        notebook.difficulty === 'facil' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900' 
                          : notebook.difficulty === 'medio'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900'
                          : 'bg-red-100 text-red-700 dark:bg-red-900'
                      }>
                        {notebook.difficulty === 'facil' ? 'Fácil' : notebook.difficulty === 'medio' ? 'Médio' : 'Difícil'}
                      </Badge>
                    )}
                  </div>
                  {notebook.description && (
                    <CardDescription className="text-sm">
                      {notebook.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Questões
                      </span>
                      <span className="font-semibold">{notebook.question_count || 0}</span>
                    </div>

                    {notebook.last_attempt && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                          {notebook.last_attempt.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-yellow-600" />
                          )}
                          Última tentativa
                        </span>
                        <span className="font-semibold">
                          {notebook.last_attempt.status === 'completed' 
                            ? `${notebook.last_attempt.score?.toFixed(0)}%`
                            : 'Em andamento'}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Tentativas</span>
                      <span className="font-semibold">{notebook.attempts_count || 0}</span>
                    </div>

                    <div className="pt-4 space-y-2">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => navigate(createPageUrl("SolveNotebook") + `?id=${notebook.id}`)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          disabled={!notebook.question_count}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Resolver
                        </Button>
                        <Button
                          onClick={() => navigate(createPageUrl("NotebookStats") + `?id=${notebook.id}`)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          disabled={notebook.attempts_count === 0}
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Estatísticas
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => navigate(createPageUrl("CreateNotebook") + `?id=${notebook.id}`)}
                          variant="outline"
                          size="icon"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDuplicate(notebook)}
                          variant="outline"
                          size="icon"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            setNotebookToDelete(notebook);
                            setShowDeleteDialog(true);
                          }}
                          variant="outline"
                          size="icon"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o caderno "{notebookToDelete?.name}"? 
                Esta ação não pode ser desfeita e todas as tentativas serão perdidas.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                Excluir
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}