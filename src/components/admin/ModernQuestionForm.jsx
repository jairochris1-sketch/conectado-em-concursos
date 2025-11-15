
import React, { useState, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Question } from '@/entities/Question';
import { Topic } from '@/entities/Topic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, PlusCircle, Save, X } from 'lucide-react';
import { toast } from "sonner";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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

const cargoOptions = [
  { value: "advogado", label: "Advogado" },
  { value: "agente_de_limpeza", label: "Agente de Limpeza" },
  { value: "agente_policia", label: "Agente de Polícia" },
  { value: "agente_policia_federal", label: "Agente de Polícia Federal" },
  { value: "agente_penitenciario", label: "Agente Penitenciário" },
  { value: "analista_bancario", label: "Analista Bancário" },
  { value: "analista_receita_federal", label: "Analista da Receita Federal" },
  { value: "analista_sistemas", label: "Analista de Sistemas" },
  { value: "analista_judiciario", label: "Analista Judiciário" },
  { value: "assistente_administrativo", label: "Assistente Administrativo" },
  { value: "auditor_fiscal", label: "Auditor Fiscal" },
  { value: "contador", label: "Contador" },
  { value: "delegado_policia", label: "Delegado de Polícia" },
  { value: "delegado_policia_civil", label: "Delegado de Polícia Civil" },
  { value: "delegado_policia_civil_substituto", label: "Delegado de Polícia Civil Substituto" },
  { value: "delegado_policia_federal", label: "Delegado de Polícia Federal" },
  { value: "delegado_policia_substituto", label: "Delegado de Polícia Substituto" },
  { value: "enfermeiro", label: "Enfermeiro" },
  { value: "engenheiro", label: "Engenheiro" },
  { value: "escrivao_policia_civil", label: "Escrivão de Polícia Civil" },
  { value: "escriturario", label: "Escriturário" },
  { value: "gari", label: "Gari" },
  { value: "guarda_civil_municipal", label: "Guarda Civil Municipal" },
  { value: "guarda_municipal", label: "Guarda Municipal" },
  { value: "medico", label: "Médico" },
  { value: "policial_civil", label: "Policial Civil" },
  { value: "policial_federal", label: "Policial Federal" },
  { value: "professor_1_ao_5_ano", label: "Professor - 1 ao 5 Ano Ensino Fundamental" },
  { value: "professor_artes", label: "Professor (Artes)" },
  { value: "professor_biologia", label: "Professor (Biologia)" },
  { value: "professor_ciencias", label: "Professor (Ciências)" },
  { value: "professor_educacao_basica", label: "Professor (Educação Básica)" },
  { value: "professor_educacao_fisica", label: "Professor (Educação Física)" },
  { value: "professor_fisica", label: "Professor (Física)" },
  { value: "professor_geografia", label: "Professor (Geografia)" },
  { value: "professor_historia", label: "Professor (História)" },
  { value: "professor_ingles", label: "Professor (Inglês)" },
  { value: "professor_matematica", label: "Professor (Matemática)" },
  { value: "professor_portugues", label: "Professor (Português)" },
  { value: "professor_quimica", label: "Professor (Química)" },
  { value: "professor_educacao_basica_anos_iniciais", label: "Professor de Educação Básica dos anos iniciais" },
  { value: "professor_educacao_basica_fundamental_medio", label: "Professor de Educação Básica - Ensino Fundamental e Médio" },
  { value: "tecnico_bancario", label: "Técnico Bancário" },
  { value: "tecnico_receita_federal", label: "Técnico da Receita Federal" },
  { value: "tecnico_informatica", label: "Técnico em Informática" },
  { value: "tecnico_judiciario", label: "Técnico Judiciário" }
];

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
  allSubjects,
  allInstitutions,
}) {
  const [topics, setTopics] = useState([]);
  const [examNames, setExamNames] = useState([]);

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
      gabarito_url: ''
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
      const finalData = { ...data };
      if (finalData.exam_name === '__new__') {
        if (!finalData.new_exam_name || finalData.new_exam_name.trim() === '') {
          toast.error("Por favor, digite o nome do novo concurso.");
          return;
        }
        finalData.exam_name = finalData.new_exam_name.trim();
      }
      delete finalData.new_exam_name; // Remove temporary field

      if (!finalData.subject || !finalData.institution || !finalData.correct_answer) {
        toast.error("Por favor, preencha todos os campos obrigatórios (Disciplina, Banca, Resposta Correta).");
        return;
      }

      const correctAnswerExists = finalData.options.some(opt => opt.letter === finalData.correct_answer);
      if (!correctAnswerExists) {
        toast.error("A resposta correta deve corresponder a uma das alternativas.");
        return;
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma disciplina" />
                        </SelectTrigger>
                        <SelectContent>
                          {allSubjects && allSubjects.map(subject => (
                            <SelectItem key={subject.id || subject.value} value={subject.id || subject.value}>
                              {subject.name || subject.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="institution">Banca *</Label>
                  <Controller
                    name="institution"
                    control={control}
                    rules={{ required: "Banca é obrigatória" }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma banca" />
                        </SelectTrigger>
                        <SelectContent>
                          {allInstitutions && allInstitutions.map(institution => (
                            <SelectItem key={institution.id || institution.value} value={institution.id || institution.value}>
                              {institution.name || institution.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
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
                          {cargoOptions.sort((a, b) => a.label.localeCompare(b.label)).map(cargo => (
                            <SelectItem key={cargo.value} value={cargo.value}>
                              {cargo.label}
                            </SelectItem>
                          ))}
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
              <CardTitle>Comentário / Explicação</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="explanation"
                control={control}
                render={({ field }) => (
                  <div style={{ minHeight: '250px' }}>
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
            </CardContent>
          </Card>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Arquivos para Download (Opcional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
