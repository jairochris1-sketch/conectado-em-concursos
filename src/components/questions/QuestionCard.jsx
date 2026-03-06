import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, MessageSquare, Building, Calendar, Briefcase, Pencil, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

import CommentSection from '../comments/CommentSection';

const subjectNames = {
  portugues: "Português",
  matematica: "Matemática", 
  direito_constitucional: "D. Constitucional",
  direito_administrativo: "D. Administrativo",
  direito_penal: "D. Penal",
  direito_civil: "D. Civil",
  direito_tributario: "D. Tributário",
  informatica: "Informática",
  conhecimentos_gerais: "Conhecimentos Gerais",
  raciocinio_logico: "Raciocínio Lógico",
  contabilidade: "Contabilidade",
  pedagogia: "Pedagogia"
};

const institutionNames = {
  fcc: "FCC",
  cespe: "CESPE/CEBRASPE",
  vunesp: "VUNESP",
  fgv: "FGV",
  cesgranrio: "CESGRANRIO",
  esaf: "ESAF",
  fundatec: "FUNDATEC",
  consulplan: "CONSULPLAN",
  idecan: "IDECAN",
  aocp: "Instituto AOCP",
  quadrix: "QUADRIX"
};

const cargoNames = {
  analista_judiciario: "Analista Judiciário",
  tecnico_judiciario: "Técnico Judiciário",
  juiz: "Juiz",
  promotor: "Promotor de Justiça",
  delegado: "Delegado de Polícia",
  auditor_fiscal: "Auditor Fiscal",
  agente_administrativo: "Agente Administrativo",
  professor: "Professor",
  medico: "Médico",
  enfermeiro: "Enfermeiro",
  policial: "Policial",
  escrivao: "Escrivão",
  perito: "Perito",
  analista_tributario: "Analista Tributário",
  outros: "Outros"
};

export default function QuestionCard({ 
  question, 
  userAnswer, 
  submittedAnswer, 
  onAnswerChange, 
  onSubmitAnswer,
  questionNumber, // Changed from index
  fontSize, // Added fontSize prop
  isBlocked // Added isBlocked prop
}) {
  const [showComments, setShowComments] = useState(false);
  const [generatingFlashcard, setGeneratingFlashcard] = useState(false);

  const handleGenerateFlashcard = async () => {
    setGeneratingFlashcard(true);
    try {
      const prompt = `Você é um tutor de concursos públicos. Crie UM flashcard didático baseado nesta questão que o aluno errou, focando no conceito chave que justifica a resposta correta.
Use HTML básico se necessário (<b>, <i>) para destacar termos importantes. Seja super direto e didático.

Questão: ${question.statement?.replace(/<[^>]*>/g, '').substring(0, 400)}
Resposta correta: ${question.correct_answer?.toUpperCase()}
Explicação: ${question.explanation?.replace(/<[^>]*>/g, '').substring(0, 300) || 'N/A'}
Disciplina: ${question.subject}
Assunto: ${question.topic || 'Geral'}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            front: { type: "string" },
            back: { type: "string" }
          },
          required: ["front", "back"]
        }
      });

      const validSubjects = [
        "portugues", "matematica", "direito_constitucional", "direito_administrativo",
        "direito_penal", "direito_civil", "informatica", "conhecimentos_gerais",
        "raciocinio_logico", "contabilidade", "pedagogia", "lei_8112", "lei_8666",
        "lei_14133", "constituicao_federal"
      ];
      const subject = validSubjects.includes(question.subject) ? question.subject : "conhecimentos_gerais";

      await base44.entities.Flashcard.create({
        front: response.front,
        back: response.back,
        subject,
        topic: question.topic || "Revisão",
        deck_name: "Erros de Questões",
        difficulty: "medio",
        is_active: true,
        tags: ["revisao_erros"]
      });

      toast.success("Flashcard criado com sucesso! Acesse Meus Flashcards para revisar.");
    } catch (error) {
      toast.error("Erro ao gerar flashcard.");
    } finally {
      setGeneratingFlashcard(false);
    }
  };

  const handleAnswerSelect = (value) => { // Renamed and adjusted for RadioGroup
    if (submittedAnswer) return;
    onAnswerChange(question.id, value);
  };

  const handleSubmit = () => {
    onSubmitAnswer(question);
  };

  const isSubmitted = submittedAnswer && submittedAnswer.submitted;
  const isCorrect = submittedAnswer && submittedAnswer.isCorrect;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <Card className={cn(
        "shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden",
        "bg-white dark:bg-gray-800",
        fontSize && `text-[${fontSize}rem]`
      )}>
        <CardHeader className="space-y-3 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-700 dark:to-gray-800">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-indigo-600 text-white">
                  Questão {questionNumber}
                </Badge>
                <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                  {subjectNames[question.subject] || question.subject}
                </Badge>
                {question.topic && (
                  <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">
                    {question.topic}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Building className="w-3 h-3" />
                  {institutionNames[question.institution] || question.institution}
                </span>
                {question.year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {question.year}
                  </span>
                )}
                {question.cargo && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    {cargoNames[question.cargo] || question.cargo}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              {/* Optional: Add buttons for favorite/report here if needed */}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {question.associated_text && (
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <AlertDescription 
                className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed [&_b]:!font-medium [&_strong]:!font-medium"
                dangerouslySetInnerHTML={{ __html: question.associated_text }}
              />
            </Alert>
          )}

          {question.statement && (
            <div 
              className="font-medium text-gray-900 dark:text-gray-100 mb-2 whitespace-pre-wrap [&_b]:!font-medium [&_strong]:!font-medium"
              dangerouslySetInnerHTML={{ __html: question.statement }}
            />
          )}

          {question.command && (
            <div 
              className="font-medium text-indigo-700 dark:text-indigo-400 mb-4 whitespace-pre-wrap [&_b]:!font-medium [&_strong]:!font-medium"
              dangerouslySetInnerHTML={{ __html: question.command }}
            />
          )}

          <RadioGroup
            value={userAnswer}
            onValueChange={handleAnswerSelect}
            disabled={isSubmitted}
            className="space-y-3"
          >
            {question.options?.map((option, index) => (
              <div
                key={index}
                onClick={() => !isSubmitted && handleAnswerSelect(option.letter)}
                className={cn(
                  "flex items-start space-x-3 p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer",
                  "bg-white dark:bg-gray-800",
                  userAnswer === option.letter && !isSubmitted && "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20",
                  isSubmitted && option.letter === question.correct_answer && "border-green-500 bg-green-50 dark:bg-green-900/20",
                  isSubmitted && option.letter === userAnswer && option.letter !== question.correct_answer && "border-red-500 bg-red-50 dark:bg-red-900/20",
                  !userAnswer && !isSubmitted && "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
              >
                <RadioGroupItem value={option.letter} id={`q${question.id}-${option.letter}`} onClick={(e) => e.stopPropagation()} />
                <div className="flex-1 cursor-pointer text-gray-800 dark:text-gray-200 flex items-start">
                  <span className="font-medium mr-2">{option.letter})</span>
                  <span 
                    className="[&_b]:!font-medium [&_strong]:!font-medium"
                    dangerouslySetInnerHTML={{ __html: option.text }}
                  />
                </div>
                {isSubmitted && option.letter === question.correct_answer && (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                )}
                {isSubmitted && option.letter === userAnswer && option.letter !== question.correct_answer && (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                )}
              </div>
            ))}
          </RadioGroup>

          {/* Botão de responder */}
          {!isSubmitted && (
            <Button
              onClick={handleSubmit}
              disabled={!userAnswer}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 mt-6"
            >
              Confirmar Resposta
            </Button>
          )}

          {/* Gabarito e explicação após submissão */}
          {isSubmitted && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4"
              style={{ borderLeftColor: isCorrect ? '#10b981' : '#ef4444' }}
            >
              <div className="flex items-center gap-2 mb-3">
                {isCorrect ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {isCorrect ? 'Parabéns! Resposta correta!' : 'Ops! Resposta incorreta'}
                </span>
              </div>
              
              <div className="text-sm space-y-2">
                <p className="text-gray-900 dark:text-gray-100">
                  <span className="font-medium">Sua resposta:</span> {userAnswer}
                  {!isCorrect && (
                    <>
                      {' | '}
                      <span className="font-medium">Resposta correta:</span> {question.correct_answer}
                    </>
                  )}
                </p>
                
                {question.explanation && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-start gap-2">
                      <Pencil className="w-4 h-4 text-yellow-500 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium mb-2 text-gray-900 dark:text-white">Gabarito Comentado:</p>
                        {isBlocked ? (
                          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                              🔒 Você atingiu o limite de 20 questões diárias gratuitas. Assine um plano para continuar estudando com gabarito comentado ilimitado!
                            </p>
                          </div>
                        ) : (
                          <div 
                            className="text-sm leading-relaxed prose prose-sm max-w-none text-gray-900 dark:text-gray-100 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg"
                            dangerouslySetInnerHTML={{ __html: question.explanation }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Botão gerar flashcard em caso de erro */}
          {isSubmitted && !isCorrect && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateFlashcard}
                disabled={generatingFlashcard}
                className="border-yellow-400 text-yellow-700 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
              >
                {generatingFlashcard ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                Gerar Flashcard deste Erro
              </Button>
            </div>
          )}

          {/* Seção de comentários */}
          {isSubmitted && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setShowComments(!showComments)}
                className="mb-4 bg-white dark:bg-gray-700 dark:text-white"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                {showComments ? 'Ocultar' : 'Ver'} Comentários
              </Button>
              
              {showComments && (
                <CommentSection questionId={question.id} />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}