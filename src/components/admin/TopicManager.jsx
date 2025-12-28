import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Topic } from '@/entities/Topic';
import { Question } from '@/entities/Question';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Trash2, Edit, PlusCircle } from 'lucide-react';

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
  const [editingTopic, setEditingTopic] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const { register, handleSubmit, reset, setValue, watch } = useForm();
  const watchedLabel = watch('label');

  useEffect(() => {
    if (watchedLabel && !editingTopic) {
      setValue('value', slugify(watchedLabel));
    }
  }, [watchedLabel, setValue, editingTopic]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [topicsData, questionSchema] = await Promise.all([
        Topic.list(),
        Question.schema()
      ]);
      
      // CORREÇÃO: Remover duplicatas baseado em subject + value
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
      
      if (questionSchema?.properties?.subject?.enum) {
        setSubjects(questionSchema.properties.subject.enum);
      }
    } catch (error) {
      toast.error('Falha ao carregar dados.');
      console.error(error);
    }
    setIsLoading(false);
  };

  const onSubmit = async (data) => {
    try {
      // Verificar se já existe um assunto com o mesmo value na mesma disciplina
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
      reset();
      setEditingTopic(null);
      fetchData();
    } catch (error) {
      toast.error('Ocorreu um erro.');
      console.error(error);
    }
  };

  const handleEdit = (topic) => {
    setEditingTopic(topic);
    setValue('label', topic.label);
    setValue('value', topic.value);
    setValue('subject', topic.subject);
  };

  const handleDelete = async (topicId) => {
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

  const cancelEdit = () => {
    setEditingTopic(null);
    reset();
  };

  const topicsBySubject = topics.reduce((acc, topic) => {
    (acc[topic.subject] = acc[topic.subject] || []).push(topic);
    return acc;
  }, {});

  return (
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="subject">Disciplina</Label>
                <select
                  id="subject"
                  {...register('subject', { required: true })}
                  className="w-full mt-1 p-2 border rounded-md dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Selecione a Disciplina</option>
                  {subjects.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="label">Nome do Assunto (Label)</Label>
                <Input id="label" {...register('label', { required: true })} placeholder="Ex: Uso da Vírgula" />
              </div>
              <div>
                <Label htmlFor="value">Valor (Automático)</Label>
                <Input id="value" {...register('value', { required: true })} readOnly placeholder="ex: uso_da_virgula" />
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingTopic ? 'Salvar Alterações' : 'Criar Assunto'}</Button>
                {editingTopic && <Button variant="outline" onClick={cancelEdit}>Cancelar</Button>}
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
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(topic)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(topic.id)}>
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
  );
}