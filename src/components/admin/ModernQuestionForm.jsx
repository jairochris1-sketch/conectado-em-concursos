import React, { useState, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Question } from '@/entities/Question';
import { Topic } from '@/entities/Topic';
import { Subject } from '@/entities/Subject';
import { Cargo } from '@/entities/Cargo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, PlusCircle, Save, X } from 'lucide-react';
import { toast } from "sonner";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { base44 } from '@/api/base44Client';

// Helper function to format snake_case strings into readable labels
const formatTopicLabel = (value) => {
  if (!value) return '';
  const parts = value.split('_');
  const result = parts.map(part => {
    if (part.length === 0) return '';
    const lower = part.toLowerCase();
    if (['de', 'da', 'do', 'dos', 'das', 'e', 'em'].includes(lower)) {
      return lower;
    }
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join(' ');

  return result
    .replace(/Interpretacao Texto/g, 'Interpretação de Texto')
    .replace(/Acentuacao Grafica/g, 'Acentuação Gráfica')
    .replace(/Colocacao Pronominal/g, 'Colocação Pronominal')
    .replace(/Figuras Linguagem/g, 'Figuras de Linguagem')
    .replace(/Funcoes Linguagem/g, 'Funções da Linguagem')
    .replace(/Variacao Linguistica/g, 'Variação Linguística')
    .replace(/Tipologia Textual/g, 'Tipologia Textual')
    .replace(/Coesao Coerencia/g, 'Coesão e Coerência')
    .replace(/Generos Textuais/g, 'Gêneros Textuais')
    .replace(/Redacao Oficial/g, 'Redação Oficial')
    .replace(/Nova Ortografia/g, 'Nova Ortografia')
    .replace(/Classes Palavras/g, 'Classes de Palavras')
    .replace(/Formacao Palavras/g, 'Formação de Palavras')
    .replace(/Analise Sintatica/g, 'Análise Sintática')
    .replace(/Conotacao Denotacao/g, 'Conotação e Denotação')
    .trim();
};



// Configuração da barra de ferramentas do editor
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'align': [] }],
    ['link', 'image'],
    ['clean']
  ]
};

export default function ModernQuestionForm({
  questionToEdit,
  onQuestionSaved,
  onCancel,
  allSubjects = [],
  allInstitutions = [],
}) {
  const [topics, setTopics] = useState([]);
  const [examNames, setExamNames] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [cargos, setCargos] = useState([]);

  // Carregar disciplinas e cargos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectsData, cargosData] = await Promise.all([
          Subject.list('order'),
          Cargo.list('order')
        ]);
        setSubjects(subjectsData || []);
        setCargos(cargosData || []);
      } catch (error) {
        console.error("Erro ao carregar disciplinas e cargos:", error);
        toast.error("Falha ao carregar disciplinas e cargos.");
      }
    };
    fetchData();
  }, []);

  const getDefaultOptions = (type) => {
    if (type === 'true_false') {
      return [
        { letter: "C", text: "Certo" },
        { letter: "E", text: "Errado" }
      ];
    }
    return [
      { letter: "A", text: "" },
      { letter: "B", text: "" },
      { letter: "C", text: "" },
      { letter: "D", text: "" },
      { letter: "E", text: "" }
    ];
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: questionToEdit || {
      subject: '',
      institution: '',
      topic: '',
      year: new Date().getFullYear(),
      cargo: '',
      exam_name: '',
      education_level: "medio",
      type: "multiple_choice",
      statement: '',
      command: '',
      explanation: '',
      associated_text: '',
      options: getDefaultOptions('multiple_choice'),
      correct_answer: '',
      edital_url: '',
      prova_url: '',
      gabarito_url: '',
      exam_cover_image: ''
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "options",
  });

  const watchSubject = watch("subject");
  const watchType = watch("type");
  const watchExamName = watch("exam_name");

  useEffect(() => {
    if (watchType) {
      const newOptions = getDefaultOptions(watchType);
      replace(newOptions);
      setValue('correct_answer', '');
    }
  }, [watchType, replace, setValue]);

  useEffect(() => {
    const fetchTopics = async () => {
      if (watchSubject) {
        try {
          const fetchedTopics = await Topic.filter({ subject: watchSubject });

          const uniqueTopicsMap = new Map();
          fetchedTopics.forEach(topic => {
            if (topic && topic.value) {
                uniqueTopicsMap.set(topic.value, {
                  value: topic.value,
                  label: formatTopicLabel(topic.value)
                });
            }
          });

          const uniqueTopicsArray = Array.from(uniqueTopicsMap.values())
            .sort((a, b) => (a.label || '').localeCompare(b.label || '', 'pt-BR'));

          setTopics(uniqueTopicsArray);

        } catch (error) {
          console.error("Failed to fetch topics", error);
          toast.error("Falha ao carregar assuntos da disciplina.");
        }
      } else {
        setTopics([]);
        setValue('topic', '');
      }
    };
    fetchTopics();
  }, [watchSubject, setValue]);

  useEffect(() => {
    const fetchExamNames = async () => {
      try {
        const allQuestions = await Question.list();
        if (allQuestions) {
          const uniqueNames = [...new Set(allQuestions.map(q => q.exam_name).filter(Boolean))];
          setExamNames(uniqueNames);
        }
      } catch (error) {
        console.error("Erro ao carregar nomes de concursos:", error);
        toast.error("Falha ao carregar sugestões de concursos.");
      }
    };
    fetchExamNames();
  }, []);

  useEffect(() => {
    if (questionToEdit) {
      const initialOptions = questionToEdit.options || getDefaultOptions(questionToEdit.type || 'multiple_choice');
      reset({
        ...questionToEdit,
        options: initialOptions,
      });
    }
  }, [questionToEdit, reset]);

  const onSubmit = async (data) => {
    try {
      const user = await base44.auth.me();
      const finalData = { ...data };
      
      if (finalData.exam_name === '__new__') {
        if (!finalData.new_exam_name || finalData.new_exam_name.trim() === '') {
          toast.error("Por favor, digite o nome do novo concurso.");
          return;
        }
        finalData.exam_name = finalData.new_exam_name.trim();
      }
      delete finalData.new_exam_name;

      if (!finalData.subject || !finalData.institution || !finalData.correct_answer) {
        toast.error("Por favor, preencha todos os campos obrigatórios (Disciplina, Banca, Resposta Correta).");
        return;
      }

      const correctAnswerExists = finalData.options.some(opt => opt.letter === finalData.correct_answer);
      if (!correctAnswerExists) {
        toast.error("A resposta correta deve corresponder a uma das alternativas.");
        return;
      }

      // Atualiza a data do comentário se foi modificado
      if (finalData.explanation && finalData.explanation !== questionToEdit?.explanation) {
        finalData.explanation_date = new Date().toISOString().split('T')[0];
      }

      if (questionToEdit) {
        await Question.update(questionToEdit.id, finalData);
        onQuestionSaved("Questão atualizada com sucesso!");
      } else {
        await Question.create(finalData);
        onQuestionSaved("Questão criada com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao salvar questão:", error);
      toast.error("Erro ao salvar questão. Tente novamente.");
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardContent className="p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="subject">Disciplina *</Label>
                  <Controller
                    name="subject"
                    control={control}
                    rules={{ required: "Disciplina é obrigatória" }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma disciplina" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects && subjects.length > 0 ? (
                            subjects.map(subject => (
                              <SelectItem key={subject.id} value={subject.value}>
                                {subject.label}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="__loading__" disabled>Carregando...</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
                </div>

                <div>
                  <Label htmlFor="institution">Banca *</Label>
                  <Controller
                    name="institution"
                    control={control}
                    rules={{ required: "Banca é obrigatória" }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma banca" />
                        </SelectTrigger>
                        <SelectContent>
                          {allInstitutions && allInstitutions.length > 0 ? (
                            allInstitutions.map(institution => (
                              <SelectItem key={institution.id} value={institution.id}>
                                {institution.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="__loading__" disabled>Carregando...</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.institution && <p className="text-red-500 text-xs mt-1">{errors.institution.message}</p>}
                </div>

                <div>
                  <Label htmlFor="topic">Assunto</Label>
                  <Controller
                    name="topic"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um assunto" />
                        </SelectTrigger>
                        <SelectContent>
                          {topics.map(topic => (
                            <SelectItem key={topic.value} value={topic.value}>
                              {topic.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="year">Ano</Label>
                  <Input
                    id="year"
                    type="number"
                    min="2000"
                    max="2030"
                    {...register("year")}
                  />
                </div>

                <div>
                  <Label htmlFor="cargo">Cargo</Label>
                  <Controller
                    name="cargo"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cargo" />
                        </SelectTrigger>
                        <SelectContent>
                          {cargos && cargos.length > 0 ? (
                            cargos.map(cargo => (
                              <SelectItem key={cargo.id} value={cargo.value}>
                                {cargo.label}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="__loading__" disabled>Carregando...</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="exam_name">Nome do Concurso</Label>
                  <Controller
                    name="exam_name"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione ou crie um concurso" />
                        </SelectTrigger>
                        <SelectContent>
                          {examNames.sort().map(name => (
                            <SelectItem key={name} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                          <SelectItem value="__new__">Outro (digitar novo)...</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {watchExamName === '__new__' && (
                    <Input
                      {...register("new_exam_name", { required: "Nome do novo concurso é obrigatório" })}
                      placeholder="Digite o nome do novo concurso"
                      className="mt-2"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="education_level">Nível de Escolaridade</Label>
                  <Controller
                    name="education_level"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fundamental">Ensino Fundamental</SelectItem>
                          <SelectItem value="medio">Ensino Médio</SelectItem>
                          <SelectItem value="superior">Ensino Superior</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="type">Tipo de Questão *</Label>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
                          <SelectItem value="true_false">Certo/Errado</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enunciado da Questão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="associated_text">Texto de Apoio (opcional)</Label>
                <Controller
                  name="associated_text"
                  control={control}
                  render={({ field }) => (
                    <div className="mt-2" style={{ minHeight: '200px' }}>
                      <ReactQuill
                        theme="snow"
                        value={field.value || ''}
                        onChange={field.onChange}
                        modules={quillModules}
                        placeholder="Cole ou digite o texto de apoio aqui..."
                        style={{ height: '150px' }}
                      />
                    </div>
                  )}
                />
              </div>

              <div className="mt-16">
                <Label htmlFor="statement">Enunciado</Label>
                <Controller
                  name="statement"
                  control={control}
                  render={({ field }) => (
                    <div className="mt-2" style={{ minHeight: '200px' }}>
                      <ReactQuill
                        theme="snow"
                        value={field.value || ''}
                        onChange={field.onChange}
                        modules={quillModules}
                        placeholder="Digite o enunciado da questão..."
                        style={{ height: '150px' }}
                      />
                    </div>
                  )}
                />
              </div>

              <div className="mt-16">
                <Label htmlFor="command">Comando da Questão</Label>
                <Controller
                  name="command"
                  control={control}
                  render={({ field }) => (
                    <div className="mt-2" style={{ minHeight: '150px' }}>
                      <ReactQuill
                        theme="snow"
                        value={field.value || ''}
                        onChange={field.onChange}
                        modules={quillModules}
                        placeholder="Digite o comando (ex: Assinale a alternativa correta...)"
                        style={{ height: '100px' }}
                      />
                    </div>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Alternativas {watchType === 'multiple_choice' ? '(A-E)' : '(Certo/Errado)'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {fields.map((optionField, index) => (
                <div key={optionField.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 pt-2">
                    <span className="font-semibold text-gray-700 dark:text-gray-300 min-w-[24px]">
                      {optionField.letter})
                    </span>
                    <input
                      type="radio"
                      name="correct_answer"
                      checked={watch('correct_answer') === optionField.letter}
                      onChange={() => setValue('correct_answer', optionField.letter, { shouldValidate: true })}
                      className="w-4 h-4"
                      title="Marcar como correta"
                    />
                  </div>
                  <div className="flex-1" style={{ minHeight: '120px' }}>
                    <Controller
                      name={`options.${index}.text`}
                      control={control}
                      render={({ field: textField }) => (
                        <ReactQuill
                          theme="snow"
                          value={textField.value || ''}
                          onChange={textField.onChange}
                          modules={quillModules}
                          placeholder={watchType === 'true_false' ? (optionField.letter === 'C' ? 'Certo' : 'Errado') : `Digite a alternativa ${optionField.letter}...`}
                          style={{ height: '80px' }}
                          readOnly={watchType === 'true_false'}
                        />
                      )}
                    />
                  </div>
                  {watchType === 'multiple_choice' && fields.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="mt-3"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}

              {watchType === 'multiple_choice' && fields.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ letter: String.fromCharCode(65 + fields.length), text: "" })}
                  className="w-full"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Adicionar Alternativa
                </Button>
              )}
              {errors.correct_answer && <p className="text-red-500 text-sm mt-1">{errors.correct_answer.message}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gabarito Comentado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="explanation_author">Professor/Autor do Comentário</Label>
                  <Input
                    id="explanation_author"
                    {...register("explanation_author")}
                    placeholder="Ex: Prof. João Silva"
                  />
                </div>
                <div>
                  <Label htmlFor="explanation_author_subject">Disciplina de Especialização</Label>
                  <Input
                    id="explanation_author_subject"
                    {...register("explanation_author_subject")}
                    placeholder="Ex: Português, Matemática, Direito..."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="explanation">Comentário / Explicação</Label>
                <Controller
                  name="explanation"
                  control={control}
                  render={({ field }) => (
                    <div style={{ minHeight: '250px' }} className="mt-2">
                      <ReactQuill
                        theme="snow"
                        value={field.value || ''}
                        onChange={field.onChange}
                        modules={quillModules}
                        placeholder="Digite a explicação da resposta correta..."
                        style={{ height: '200px' }}
                      />
                    </div>
                  )}
                />
              </div>

              {questionToEdit?.explanation_date && (
                <p className="text-sm text-gray-500">
                  Última atualização: {new Date(questionToEdit.explanation_date).toLocaleDateString('pt-BR')}
                </p>
              )}
            </CardContent>
          </Card>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Arquivos para Download (Opcional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edital_url">URL do Edital</Label>
                <Input
                  {...register("edital_url")}
                  placeholder="https://exemplo.com/edital.pdf"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="prova_url">URL da Prova</Label>
                <Input
                  {...register("prova_url")}
                  placeholder="https://exemplo.com/prova.pdf"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="gabarito_url">URL do Gabarito</Label>
                <Input
                  {...register("gabarito_url")}
                  placeholder="https://exemplo.com/gabarito.pdf"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="exam_cover_image">URL da Capa/Logo da Prova</Label>
                <Input
                  {...register("exam_cover_image")}
                  placeholder="https://exemplo.com/logo.png"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Esta imagem aparecerá ao lado do nome da prova na lista</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              {questionToEdit ? "Atualizar Questão" : "Criar Questão"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}