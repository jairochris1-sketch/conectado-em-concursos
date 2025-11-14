
import { useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2, Save, X } from "lucide-react";
import ReactQuill from "react-quill";
import 'react-quill/dist/quill.snow.css';
import { base44 } from "@/api/base44Client";

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["link", "image"],
    ["clean"],
  ],
};

const defaultMCOptions = [
  { letter: "A", text: "" },
  { letter: "B", text: "" },
  { letter: "C", text: "" },
  { letter: "D", text: "" },
  { letter: "E", text: "" },
];

const defaultTFOptions = [
  { letter: "C", text: "Certo" },
  { letter: "E", text: "Errado" },
];

export default function SDQuestionForm({ initial, onSaved, onCancel }) {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    register,
  } = useForm({
    defaultValues: initial || {
      statement: "",
      explanation: "",
      type: "multiple_choice",
      section: "conhecimentos_especificos", // Added new field
      subject: "",
      institution: "",
      year: new Date().getFullYear(),
      cargo: "",
      exam_name: "",
      options: defaultMCOptions,
      correct_answer: "",
    },
  });

  const type = watch("type");
  const correctAnswer = watch("correct_answer");

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "options",
  });

  useEffect(() => {
    if (type === "true_false") {
      replace(defaultTFOptions);
      setValue("correct_answer", "", { shouldDirty: true });
    } else {
      replace(defaultMCOptions);
      setValue("correct_answer", "", { shouldDirty: true });
    }
  }, [type, replace, setValue]);

  // Garante consistência de maiúsculas na resposta correta ao carregar/editar
  useEffect(() => {
    if (initial?.correct_answer) {
      setValue("correct_answer", String(initial.correct_answer).toUpperCase(), { shouldDirty: false });
    }
  }, [initial, setValue]);

  const onSubmit = async (data) => {
    if (!data.correct_answer) return;
    if (initial?.id) {
      await base44.entities.SDQuestion.update(initial.id, data);
    } else {
      await base44.entities.SDQuestion.create(data);
    }
    onSaved?.();
  };

  return (
    <Card className="max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle>{initial ? "Editar Questão (Simulados Digital)" : "Nova Questão (Simulados Digital)"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Disciplina</Label>
            <Controller
              name="subject"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {["portugues","matematica","raciocinio_logico","informatica","conhecimentos_gerais","direito_constitucional","direito_administrativo","direito_penal","direito_civil","direito_tributario","direito_previdenciario","administracao_publica","administracao_geral","afo","arquivologia","direitos_humanos","eca","contabilidade","economia","estatistica","pedagogia","seguranca_publica","lei_8112","lei_8666","lei_14133","constituicao_federal","legislacao_estadual","legislacao_municipal"].map(s => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g,' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label>Banca</Label>
            <Controller
              name="institution"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {["fgv","vunesp","cespe","fcc","cesgranrio","quadrix","iades","idecan","ibfc","ibade","aocp","outras"].map(b => (
                      <SelectItem key={b} value={b}>{b.toUpperCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label>Cargo</Label>
            <Controller
              name="cargo"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {["assistente_administrativo","tecnico_judiciario","tecnico_informatica","professor_matematica","professor_portugues","gari","contador","policial_civil","guarda_municipal","enfermeiro","analista_sistemas","analista_bancario","auditor_fiscal"].sort().map(c => (
                      <SelectItem key={c} value={c}>{c.replace(/_/g,' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4"> {/* Changed to md:grid-cols-4 */}
          <div>
            <Label>Tipo</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
                    <SelectItem value="true_false">Certo/Errado</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label>Ano</Label>
            <Input type="number" min="2000" max="2100" {...register("year")} />
          </div>
          <div>
            <Label>Nome do Concurso</Label>
            <Input placeholder="Ex: Prefeitura de ..." {...register("exam_name")} />
          </div>
          <div>
            <Label>Seção/Disciplina</Label>
            <Controller
              name="section"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Selecione a seção" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conhecimentos_locais">Conhecimentos Locais</SelectItem>
                    <SelectItem value="conhecimentos_especificos">Conhecimentos Específicos</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div>
          <Label>Enunciado</Label>
          <Controller
            name="statement"
            control={control}
            render={({ field }) => (
              <div className="mt-2" style={{ minHeight: 180 }}>
                <ReactQuill theme="snow" value={field.value || ""} onChange={field.onChange} modules={quillModules} style={{ height: 140 }} />
              </div>
            )}
          />
        </div>

        <input type="hidden" {...register("correct_answer")} />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Alternativas</Label>
            {type === "multiple_choice" && fields.length < 5 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ letter: String.fromCharCode(65 + fields.length), text: "" })
                }
              >
                <PlusCircle className="w-4 h-4 mr-1" /> Adicionar
              </Button>
            )}
          </div>

          {fields.map((f, i) => (
            <div key={f.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="pt-2 font-semibold w-6">{f.letter})</div>
              <div className="flex-1 relative">
                {/* Quill do texto da alternativa */}
                <Controller
                  name={`options.${i}.text`}
                  control={control}
                  render={({ field }) => (
                    <div className="relative z-0">
                      <ReactQuill
                        theme="snow"
                        value={field.value || ""}
                        onChange={field.onChange}
                        modules={quillModules}
                        style={{ height: 100 }}
                        readOnly={type === "true_false"}
                      />
                    </div>
                  )}
                />

                {/* Seletor de correta - torna toda a linha clicável e garante prioridade de clique */}
                <div
                  className="mt-2 flex items-center gap-2 text-xs cursor-pointer select-none relative z-10"
                  onClick={() =>
                    setValue("correct_answer", String(f.letter).toUpperCase(), {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      setValue("correct_answer", String(f.letter).toUpperCase(), {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                  }}
                >
                  <input
                    type="radio"
                    className="pointer-events-auto"
                    name="correct_answer_radio"
                    checked={String(correctAnswer || "").toUpperCase() === String(f.letter).toUpperCase()}
                    onChange={() =>
                      setValue("correct_answer", String(f.letter).toUpperCase(), {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                  <span>Marcar como correta</span>
                </div>
              </div>

              {type === "multiple_choice" && fields.length > 2 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div>
          <Label>Comentário/Explicação</Label>
          <Controller
            name="explanation"
            control={control}
            render={({ field }) => (
              <div className="mt-2" style={{ minHeight: 160 }}>
                <ReactQuill theme="snow" value={field.value || ""} onChange={field.onChange} modules={quillModules} style={{ height: 120 }} />
              </div>
            )}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}><X className="w-4 h-4 mr-1" /> Cancelar</Button>
          <Button onClick={handleSubmit(onSubmit)}><Save className="w-4 h-4 mr-1" /> Salvar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
