import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { 
  RefreshCcw, Plus, Search, Filter, AlertTriangle, 
  Calendar, CheckCircle2, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Edit, Trash2, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function Reviews() {
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Modal states
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStudyDialog, setShowStudyDialog] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  
  // Form State
  const [form, setForm] = useState({
    subject: "",
    content: "",
    description: "",
    due_date: new Date().toISOString().split('T')[0],
    review_type: "-",
    status: "pending"
  });

  const [studyForm, setStudyForm] = useState({
    study_date: new Date().toISOString().split('T')[0],
    subject: "",
    content: "",
    description: "",
    study_type: "Teoria",
    time_spent: "",
    questions_count: "",
    errors_count: "",
    completed_content: false,
    schedule_revisions: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      const data = await base44.entities.StudyReview.filter({ user_email: userData.email });
      
      // Auto-update status for overdue items
      let updatedData = [];
      let needsUpdate = false;
      const today = new Date().toISOString().split('T')[0];

      for (const item of data) {
        let currentStatus = item.status;
        if (currentStatus === 'pending' && item.due_date < today) {
          currentStatus = 'overdue';
          await base44.entities.StudyReview.update(item.id, { status: 'overdue' });
          needsUpdate = true;
        }
        updatedData.push({ ...item, status: currentStatus });
      }

      setReviews(updatedData);
    } catch (error) {
      console.error("Erro ao carregar revisões:", error);
      toast.error("Erro ao carregar revisões");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.subject || !form.content || !form.due_date) {
      toast.error("Preencha matéria, conteúdo e data de vencimento.");
      return;
    }

    try {
      let finalStatus = form.status;
      const today = new Date().toISOString().split('T')[0];
      if (finalStatus === 'pending' && form.due_date < today) {
        finalStatus = 'overdue';
      } else if (finalStatus === 'overdue' && form.due_date >= today) {
        finalStatus = 'pending';
      }

      if (editingReview) {
        await base44.entities.StudyReview.update(editingReview.id, {
          ...form,
          status: finalStatus
        });
        toast.success("Revisão atualizada!");
      } else {
        await base44.entities.StudyReview.create({
          user_email: user.email,
          ...form,
          status: finalStatus
        });
        toast.success("Revisão criada!");
      }
      setShowDialog(false);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar revisão");
    }
  };

  const handleDelete = async () => {
    try {
      await base44.entities.StudyReview.delete(reviewToDelete.id);
      toast.success("Revisão excluída!");
      setShowDeleteDialog(false);
      loadData();
    } catch (error) {
      toast.error("Erro ao excluir");
    }
  };

  const handleStatusToggle = async (review, newStatus) => {
    try {
      await base44.entities.StudyReview.update(review.id, { status: newStatus });
      toast.success("Status atualizado!");
      loadData();
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const openNewStudy = () => {
    setStudyForm({
      study_date: new Date().toISOString().split('T')[0],
      subject: "",
      content: "",
      description: "",
      study_type: "Teoria",
      time_spent: "",
      questions_count: "",
      errors_count: "",
      completed_content: false,
      schedule_revisions: false
    });
    setShowStudyDialog(true);
  };

  const handleSaveStudy = async () => {
    if (!studyForm.subject || !studyForm.content) {
      toast.error("Preencha a matéria e o conteúdo.");
      return;
    }
    try {
      await base44.entities.StudyRecord.create({
        user_email: user.email,
        ...studyForm,
        questions_count: Number(studyForm.questions_count) || 0,
        errors_count: Number(studyForm.errors_count) || 0
      });
      toast.success("Estudo registrado!");
      setShowStudyDialog(false);
    } catch (error) {
      console.error("Erro ao salvar estudo:", error);
      toast.error("Erro ao salvar estudo");
    }
  };

  const openNewReview = () => {
    setEditingReview(null);
    setForm({
      subject: "",
      content: "",
      description: "",
      due_date: new Date().toISOString().split('T')[0],
      review_type: "-",
      status: "pending"
    });
    setShowDialog(true);
  };

  const openEditReview = (review) => {
    setEditingReview(review);
    setForm({
      subject: review.subject,
      content: review.content,
      description: review.description || "",
      due_date: review.due_date,
      review_type: review.review_type || "-",
      status: review.status
    });
    setShowDialog(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const [year, month, day] = dateStr.split('-');
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'overdue':
        return (
          <Badge className="bg-red-50 text-red-600 hover:bg-red-50 border-red-200 gap-1 font-medium">
            <AlertTriangle className="w-3 h-3" /> Atrasada
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-50 text-green-600 hover:bg-green-50 border-green-200 gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" /> Concluída
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 border-blue-200 gap-1 font-medium">
            <Calendar className="w-3 h-3" /> Pendente
          </Badge>
        );
    }
  };

  // Extract unique subjects for filter
  const subjects = [...new Set(reviews.map(r => r.subject))].filter(Boolean);

  // Filtering
  const todayStr = new Date().toISOString().split('T')[0];
  
  const filteredReviews = reviews.filter(r => {
    // Search Term
    const searchMatch = (r.content || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (r.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status Filter
    let statusMatch = true;
    if (statusFilter === 'overdue') statusMatch = r.status === 'overdue';
    else if (statusFilter === 'today') statusMatch = r.due_date === todayStr && r.status !== 'completed';
    else if (statusFilter === 'pending') statusMatch = r.status === 'pending';
    else if (statusFilter === 'completed') statusMatch = r.status === 'completed';
    
    // Subject Filter
    const subjectMatch = subjectFilter === 'all' || r.subject === subjectFilter;
    
    return searchMatch && statusMatch && subjectMatch;
  }).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  // Pagination
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage) || 1;
  const currentItems = filteredReviews.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
          <div className="flex items-center gap-3">
            <RefreshCcw className="w-8 h-8 text-gray-900 dark:text-white" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Revisões</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2 bg-white text-gray-700 hover:bg-gray-50 border-gray-200" onClick={openNewReview}>
              <Plus className="w-4 h-4" /> Revisão
            </Button>
            <Button className="gap-2 bg-red-500 hover:bg-red-600 text-white" onClick={openNewStudy}>
              <Plus className="w-4 h-4" /> Registrar estudo
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Pesquise pelo Conteúdo..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          
          <div className="flex flex-wrap gap-2 lg:gap-4 items-center">
            <div className="flex items-center gap-2 border rounded-md p-1 bg-white">
              <Filter className="w-4 h-4 text-gray-500 ml-2" />
              <span className="text-sm text-gray-600 font-medium">Situação</span>
              
              <Button 
                variant={statusFilter === 'overdue' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => { setStatusFilter(statusFilter === 'overdue' ? 'all' : 'overdue'); setPage(1); }}
                className={`h-8 gap-1 ${statusFilter === 'overdue' ? 'bg-gray-100' : ''}`}
              >
                <AlertTriangle className="w-3 h-3 text-red-500" />
                Atrasada
              </Button>
              <Button 
                variant={statusFilter === 'today' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => { setStatusFilter(statusFilter === 'today' ? 'all' : 'today'); setPage(1); }}
                className={`h-8 gap-1 ${statusFilter === 'today' ? 'bg-gray-100' : ''}`}
              >
                <Calendar className="w-3 h-3 text-orange-500" />
                Para hoje
              </Button>
            </div>

            <Select value={subjectFilter} onValueChange={(val) => { setSubjectFilter(val); setPage(1); }}>
              <SelectTrigger className="w-[200px] bg-white">
                <Filter className="w-4 h-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Todas as Matérias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Matérias</SelectItem>
                {subjects.map(subj => (
                  <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="w-[140px] font-medium text-gray-500">Situação</TableHead>
                <TableHead className="w-[140px] font-medium text-gray-500">Vencimento</TableHead>
                <TableHead className="w-[120px] font-medium text-gray-500">Revisão de</TableHead>
                <TableHead className="w-[220px] font-medium text-gray-500">Matéria</TableHead>
                <TableHead className="font-medium text-gray-500 min-w-[200px]">Conteúdo</TableHead>
                <TableHead className="font-medium text-gray-500 min-w-[150px]">Descrição</TableHead>
                <TableHead className="w-[100px] text-right font-medium text-gray-500">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                    Nenhuma revisão encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((review) => (
                  <TableRow key={review.id} className={review.status === 'completed' ? 'opacity-60 bg-gray-50/30' : ''}>
                    <TableCell>
                      {getStatusBadge(review.status)}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-700">
                      {formatDate(review.due_date)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {review.review_type || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-teal-50 text-teal-700 hover:bg-teal-50 border-teal-200">
                        {review.subject}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-800 font-medium">
                      {review.content}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {review.description}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {review.status !== 'completed' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Marcar como concluída"
                            onClick={() => handleStatusToggle(review, 'completed')}
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditReview(review)}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setReviewToDelete(review);
                            setShowDeleteDialog(true);
                          }}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-600 pt-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800">Exibir</span>
            <Select 
              value={itemsPerPage.toString()} 
              onValueChange={(val) => {
                setItemsPerPage(Number(val));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[70px] bg-white border-gray-200 font-medium text-gray-800">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="font-bold text-gray-800">
            Pag. {totalPages === 0 ? 0 : page} de {totalPages}
          </div>

          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9 bg-white" 
              onClick={() => setPage(1)}
              disabled={page <= 1}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9 bg-white"
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9 bg-white"
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages || totalPages === 0}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9 bg-white"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages || totalPages === 0}
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

      </div>

      {/* Form Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl bg-white border-0 shadow-lg">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-bold text-gray-900">
              {editingReview ? "Editar Revisão Programada" : "Criar Revisão Programada"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900">Data agendada</label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="bg-white border-gray-200 focus:border-red-500 focus:ring-red-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900">Matéria</label>
              <Input
                placeholder="Matéria..."
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="bg-white border-gray-200 focus:border-red-500 focus:ring-red-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900">Conteúdo</label>
              <Input
                placeholder="Conteúdo..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="bg-white border-gray-200 focus:border-red-500 focus:ring-red-500"
              />
            </div>
            
            <div className="space-y-2 md:col-span-3">
              <label className="text-sm font-semibold text-gray-900">Assunto abordado</label>
              <Textarea
                placeholder="Direitos fundamentais..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="min-h-[100px] resize-none bg-white border-gray-200 focus:border-red-500 focus:ring-red-500"
              />
            </div>

            <div className="space-y-2 md:col-span-3 flex items-center pt-2">
              <label className="text-sm font-semibold text-gray-900 cursor-pointer flex items-center gap-3">
                Concluída
                <Checkbox 
                  checked={form.status === 'completed'}
                  onCheckedChange={(checked) => setForm({...form, status: checked ? 'completed' : 'pending'})}
                  className="border-red-500 data-[state=checked]:bg-[#de4b40] data-[state=checked]:border-[#de4b40] w-5 h-5"
                />
              </label>
            </div>
          </div>
          <div className="flex justify-between pt-4 mt-2">
            <Button variant="outline" onClick={() => setShowDialog(false)} className="px-6 border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-[#de4b40] hover:bg-[#c94137] text-white px-8 font-semibold">
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Study Form Dialog */}
      <Dialog open={showStudyDialog} onOpenChange={setShowStudyDialog}>
        <DialogContent className="max-w-3xl bg-white border-0 shadow-lg">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-bold text-gray-900">
              Registrar Estudo
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900">Data do estudo</label>
              <Input
                type="date"
                value={studyForm.study_date}
                onChange={(e) => setStudyForm({ ...studyForm, study_date: e.target.value })}
                className="bg-white border-gray-200 focus:border-red-500 focus:ring-red-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900">Matéria</label>
              <Select value={studyForm.subject} onValueChange={(val) => setStudyForm({ ...studyForm, subject: val })}>
                <SelectTrigger className="w-full bg-white border-gray-200">
                  <SelectValue placeholder="Matéria..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portugues">Português</SelectItem>
                  <SelectItem value="matematica">Matemática</SelectItem>
                  <SelectItem value="direito_constitucional">Direito Constitucional</SelectItem>
                  <SelectItem value="direito_administrativo">Direito Administrativo</SelectItem>
                  <SelectItem value="informatica">Informática</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900">Conteúdo</label>
              <Select value={studyForm.content} onValueChange={(val) => setStudyForm({ ...studyForm, content: val })}>
                <SelectTrigger className="w-full bg-white border-gray-200">
                  <SelectValue placeholder="Conteúdo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teoria_geral">Teoria Geral</SelectItem>
                  <SelectItem value="exercicios">Exercícios</SelectItem>
                  <SelectItem value="revisao">Revisão</SelectItem>
                  <SelectItem value="leitura_lei">Leitura de Lei Seca</SelectItem>
                  <SelectItem value="simulado">Simulado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 md:col-span-3">
              <label className="text-sm font-semibold text-gray-900">Assunto abordado</label>
              <Textarea
                value={studyForm.description}
                onChange={(e) => setStudyForm({ ...studyForm, description: e.target.value })}
                className="min-h-[100px] resize-none bg-white border-gray-200 focus:border-red-500 focus:ring-red-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900">Tipo do estudo</label>
              <Select value={studyForm.study_type} onValueChange={(val) => setStudyForm({ ...studyForm, study_type: val })}>
                <SelectTrigger className="w-full bg-white border-gray-200">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Teoria">Teoria</SelectItem>
                  <SelectItem value="Questões">Questões</SelectItem>
                  <SelectItem value="Revisão">Revisão</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-900">Tempo líquido</label>
              <Input
                placeholder="HH:MM:SS"
                value={studyForm.time_spent}
                onChange={(e) => setStudyForm({ ...studyForm, time_spent: e.target.value })}
                className="bg-white border-gray-200 focus:border-red-500 focus:ring-red-500"
              />
            </div>

            <div className="space-y-2 flex gap-4 md:col-span-1">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-semibold text-gray-900">Questões</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={studyForm.questions_count}
                  onChange={(e) => setStudyForm({ ...studyForm, questions_count: e.target.value })}
                  className="bg-white border-gray-200 focus:border-red-500 focus:ring-red-500"
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-sm font-semibold text-gray-900">Erros</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={studyForm.errors_count}
                  onChange={(e) => setStudyForm({ ...studyForm, errors_count: e.target.value })}
                  className="bg-white border-gray-200 focus:border-red-500 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="md:col-span-3 border border-gray-200 rounded-lg p-4 flex items-center justify-between mt-2">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-gray-900">Concluir conteúdo</h4>
                <p className="text-sm text-gray-500">Marque o conteúdo como concluído, caso você tenha estudado toda a teoria.</p>
              </div>
              <Switch 
                checked={studyForm.completed_content} 
                onCheckedChange={(checked) => setStudyForm({...studyForm, completed_content: checked})} 
                className="data-[state=checked]:bg-[#de4b40]"
              />
            </div>

            <div className="md:col-span-3 border border-gray-200 rounded-lg p-4 flex items-center justify-between mt-2">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-gray-900">Programar revisões</h4>
                <p className="text-sm text-gray-500">Programe revisões de forma automática. Contagem em dias, a partir da data do estudo.</p>
              </div>
              <Switch 
                checked={studyForm.schedule_revisions} 
                onCheckedChange={(checked) => setStudyForm({...studyForm, schedule_revisions: checked})} 
                className="data-[state=checked]:bg-[#de4b40]"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 mt-2 border-t">
            <Button variant="outline" onClick={() => setShowStudyDialog(false)} className="px-6 border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold">
              Cancelar
            </Button>
            <Button onClick={handleSaveStudy} className="bg-[#de4b40] hover:bg-[#c94137] text-white px-8 font-semibold">
              Salvar estudo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta revisão? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}