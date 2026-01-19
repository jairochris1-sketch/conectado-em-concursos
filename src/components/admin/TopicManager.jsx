import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Topic } from '@/entities/Topic';
import { Subject } from '@/entities/Subject';
import { Cargo } from '@/entities/Cargo';
import { Question } from '@/entities/Question';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Trash2, Edit, PlusCircle, BookOpen, FileText, Briefcase } from 'lucide-react';

const slugify = (text) =>
  text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '_');

export default function TopicManager() {
  const [topics, setTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [customSubjects, setCustomSubjects] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [editingTopic, setEditingTopic] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);
  const [editingCargo, setEditingCargo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('topics');

  const { register: registerTopic, handleSubmit: handleSubmitTopic, reset: resetTopic, setValue: setValueTopic, watch: watchTopic } = useForm();
  const { register: registerSubject, handleSubmit: handleSubmitSubject, reset: resetSubject, setValue: setValueSubject, watch: watchSubject } = useForm();
  const { register: registerCargo, handleSubmit: handleSubmitCargo, reset: resetCargo, setValue: setValueCargo, watch: watchCargo } = useForm();
  
  const watchedTopicLabel = watchTopic('label');
  const watchedSubjectLabel = watchSubject('label');
  const watchedCargoLabel = watchCargo('label');

  useEffect(() => {
    if (watchedTopicLabel && !editingTopic) {
      setValueTopic('value', slugify(watchedTopicLabel));
    }
  }, [watchedTopicLabel, setValueTopic, editingTopic]);

  useEffect(() => {
    if (watchedSubjectLabel && !editingSubject) {
      setValueSubject('value', slugify(watchedSubjectLabel));
    }
  }, [watchedSubjectLabel, setValueSubject, editingSubject]);

  useEffect(() => {
    if (watchedCargoLabel && !editingCargo) {
      setValueCargo('value', slugify(watchedCargoLabel));
    }
  }, [watchedCargoLabel, setValueCargo, editingCargo]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [topicsData, customSubjectsData, cargosData] = await Promise.all([
        Topic.list(),
        Subject.list('order'),
        Cargo.list('order')
      ]);
      
      // Remover duplicatas de topics
      const uniqueTopics = {};
      topicsData.forEach(topic => {
        if (topic && topic.value && topic.label && topic.subject) {
          const key = `${topic.subject}-${topic.value}`;
          if (!uniqueTopics[key]) {
            uniqueTopics[key] = topic;
          }
        }
      });
      
      const uniqueTopicsArray = Object.values(uniqueTopics).sort((a, b) => 
        (a.label || '').localeCompare(b.label || '')
      );
      
      setTopics(uniqueTopicsArray);
      setCustomSubjects(customSubjectsData || []);
      setCargos(cargosData || []);
    } catch (error) {
      toast.error('Falha ao carregar dados.');
      console.error(error);
    }
    setIsLoading(false);
  };

  const onSubmitTopic = async (data) => {
    try {
      const existingTopic = topics.find(t => 
        t.value === data.value && 
        t.subject === data.subject && 
        (!editingTopic || t.id !== editingTopic.id)
      );
      
      if (existingTopic) {
        toast.error('Já existe um assunto com este valor nesta disciplina.');
        return;
      }

      if (editingTopic) {
        await Topic.update(editingTopic.id, data);
        toast.success('Assunto atualizado com sucesso!');
      } else {
        await Topic.create(data);
        toast.success('Assunto criado com sucesso!');
      }
      resetTopic();
      setEditingTopic(null);
      fetchData();
    } catch (error) {
      toast.error('Ocorreu um erro.');
      console.error(error);
    }
  };

  const onSubmitSubject = async (data) => {
    try {
      const existingSubject = customSubjects.find(s => 
        s.value === data.value && 
        (!editingSubject || s.id !== editingSubject.id)
      );
      
      if (existingSubject) {
        toast.error('Já existe uma disciplina com este valor.');
        return;
      }

      if (editingSubject) {
        await Subject.update(editingSubject.id, data);
        toast.success('Disciplina atualizada com sucesso!');
      } else {
        await Subject.create({
          ...data,
          order: customSubjects.length
        });
        toast.success('Disciplina criada com sucesso!');
      }
      resetSubject();
      setEditingSubject(null);
      fetchData();
    } catch (error) {
      toast.error('Ocorreu um erro.');
      console.error(error);
    }
  };

  const onSubmitCargo = async (data) => {
    try {
      const existingCargo = cargos.find(c => 
        c.value === data.value && 
        (!editingCargo || c.id !== editingCargo.id)
      );
      
      if (existingCargo) {
        toast.error('Já existe um cargo com este valor.');
        return;
      }

      if (editingCargo) {
        await Cargo.update(editingCargo.id, data);
        toast.success('Cargo atualizado com sucesso!');
      } else {
        await Cargo.create({
          ...data,
          order: cargos.length
        });
        toast.success('Cargo criado com sucesso!');
      }
      resetCargo();
      setEditingCargo(null);
      fetchData();
    } catch (error) {
      toast.error('Ocorreu um erro.');
      console.error(error);
    }
  };

  const handleEditTopic = (topic) => {
    setEditingTopic(topic);
    setValueTopic('label', topic.label);
    setValueTopic('value', topic.value);
    setValueTopic('subject', topic.subject);
  };

  const handleEditSubject = (subject) => {
    setEditingSubject(subject);
    setValueSubject('label', subject.label);
    setValueSubject('value', subject.value);
    setValueSubject('order', subject.order || 0);
  };

  const handleEditCargo = (cargo) => {
    setEditingCargo(cargo);
    setValueCargo('label', cargo.label);
    setValueCargo('value', cargo.value);
    setValueCargo('order', cargo.order || 0);
  };

  const handleDeleteTopic = async (topicId) => {
    if (window.confirm('Tem certeza que deseja excluir este assunto?')) {
      try {
        await Topic.delete(topicId);
        toast.success('Assunto excluído.');
        fetchData();
      } catch (error) {
        toast.error('Falha ao excluir o assunto.');
        console.error(error);
      }
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    if (window.confirm('Tem certeza que deseja excluir esta disciplina? Isso não afetará as questões já cadastradas.')) {
      try {
        await Subject.delete(subjectId);
        toast.success('Disciplina excluída.');
        fetchData();
      } catch (error) {
        toast.error('Falha ao excluir a disciplina.');
        console.error(error);
      }
    }
  };

  const handleDeleteCargo = async (cargoId) => {
    if (window.confirm('Tem certeza que deseja excluir este cargo? Isso não afetará as questões já cadastradas.')) {
      try {
        await Cargo.delete(cargoId);
        toast.success('Cargo excluído.');
        fetchData();
      } catch (error) {
        toast.error('Falha ao excluir o cargo.');
        console.error(error);
      }
    }
  };

  const cancelEditTopic = () => {
    setEditingTopic(null);
    resetTopic();
  };

  const cancelEditSubject = () => {
    setEditingSubject(null);
    resetSubject();
  };

  const cancelEditCargo = () => {
    setEditingCargo(null);
    resetCargo();
  };

  const topicsBySubject = topics.reduce((acc, topic) => {
    (acc[topic.subject] = acc[topic.subject] || []).push(topic);
    return acc;
  }, {});

  // Combinar disciplinas customizadas para seletor de tópicos
  const allSubjectsForTopics = customSubjects.filter(cs => cs.is_active).map(cs => cs.value);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="topics">
          <FileText className="w-4 h-4 mr-2" />
          Assuntos
        </TabsTrigger>
        <TabsTrigger value="subjects">
          <BookOpen className="w-4 h-4 mr-2" />
          Disciplinas
        </TabsTrigger>
        <TabsTrigger value="cargos">
          <Briefcase className="w-4 h-4 mr-2" />
          Cargos
        </TabsTrigger>
      </TabsList>

      <TabsContent value="topics">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlusCircle className="w-5 h-5" />
                  {editingTopic ? 'Editar Assunto' : 'Novo Assunto'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitTopic(onSubmitTopic)} className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Disciplina</Label>
                    <select
                      id="subject"
                      {...registerTopic('subject', { required: true })}
                      className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Selecione a Disciplina</option>
                      {allSubjectsForTopics.map(s => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="label">Nome do Assunto</Label>
                    <Input id="label" {...registerTopic('label', { required: true })} placeholder="Ex: Uso da Vírgula" />
                  </div>
                  <div>
                    <Label htmlFor="value">Valor (Automático)</Label>
                    <Input id="value" {...registerTopic('value', { required: true })} readOnly placeholder="ex: uso_da_virgula" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">{editingTopic ? 'Salvar' : 'Criar'}</Button>
                    {editingTopic && <Button type="button" variant="outline" onClick={cancelEditTopic}>Cancelar</Button>}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Assuntos Cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? <p>Carregando...</p> : (
                  <div className="space-y-6 max-h-[600px] overflow-y-auto">
                    {Object.keys(topicsBySubject).sort().map(subject => (
                      <div key={subject}>
                        <h3 className="font-bold text-lg capitalize mb-2 border-b pb-1">{subject.replace(/_/g, ' ')}</h3>
                        <ul className="space-y-2">
                          {topicsBySubject[subject].map(topic => (
                            <li key={topic.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                              <div>
                                <p className="font-medium text-gray-800 dark:text-gray-200">{topic.label}</p>
                                <p className="text-xs text-gray-500">{topic.value}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEditTopic(topic)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteTopic(topic.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="subjects">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlusCircle className="w-5 h-5" />
                  {editingSubject ? 'Editar Disciplina' : 'Nova Disciplina'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitSubject(onSubmitSubject)} className="space-y-4">
                  <div>
                    <Label htmlFor="subject-label">Nome da Disciplina</Label>
                    <Input 
                      id="subject-label" 
                      {...registerSubject('label', { required: true })} 
                      placeholder="Ex: Direito Empresarial" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject-value">Valor (Automático)</Label>
                    <Input 
                      id="subject-value" 
                      {...registerSubject('value', { required: true })} 
                      readOnly 
                      placeholder="ex: direito_empresarial" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject-order">Ordem de Exibição</Label>
                    <Input 
                      id="subject-order" 
                      type="number" 
                      {...registerSubject('order')} 
                      placeholder="0" 
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">{editingSubject ? 'Salvar' : 'Criar'}</Button>
                    {editingSubject && <Button type="button" variant="outline" onClick={cancelEditSubject}>Cancelar</Button>}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Disciplinas Personalizadas</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? <p>Carregando...</p> : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {customSubjects.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Nenhuma disciplina personalizada ainda.</p>
                    ) : (
                      <ul className="space-y-2">
                        {customSubjects.map(subject => (
                          <li key={subject.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                            <div className="flex-1">
                              <p className="font-medium text-gray-800 dark:text-gray-200">{subject.label}</p>
                              <p className="text-xs text-gray-500">{subject.value}</p>
                              <p className="text-xs text-gray-400">Ordem: {subject.order || 0}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEditSubject(subject)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-red-500 hover:text-red-600" 
                                onClick={() => handleDeleteSubject(subject.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="cargos">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlusCircle className="w-5 h-5" />
                  {editingCargo ? 'Editar Cargo' : 'Novo Cargo'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitCargo(onSubmitCargo)} className="space-y-4">
                  <div>
                    <Label htmlFor="cargo-label">Nome do Cargo</Label>
                    <Input 
                      id="cargo-label" 
                      {...registerCargo('label', { required: true })} 
                      placeholder="Ex: Analista Judiciário" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="cargo-value">Valor (Automático)</Label>
                    <Input 
                      id="cargo-value" 
                      {...registerCargo('value', { required: true })} 
                      readOnly 
                      placeholder="ex: analista_judiciario" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="cargo-order">Ordem de Exibição</Label>
                    <Input 
                      id="cargo-order" 
                      type="number" 
                      {...registerCargo('order')} 
                      placeholder="0" 
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">{editingCargo ? 'Salvar' : 'Criar'}</Button>
                    {editingCargo && <Button type="button" variant="outline" onClick={cancelEditCargo}>Cancelar</Button>}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Cargos Cadastrados</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? <p>Carregando...</p> : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {cargos.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Nenhum cargo cadastrado ainda.</p>
                    ) : (
                      <ul className="space-y-2">
                        {cargos.map(cargo => (
                          <li key={cargo.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                            <div className="flex-1">
                              <p className="font-medium text-gray-800 dark:text-gray-200">{cargo.label}</p>
                              <p className="text-xs text-gray-500">{cargo.value}</p>
                              <p className="text-xs text-gray-400">Ordem: {cargo.order || 0}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEditCargo(cargo)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-red-500 hover:text-red-600" 
                                onClick={() => handleDeleteCargo(cargo.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}