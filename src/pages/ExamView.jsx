
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Question } from "@/entities/Question";
import { UserAnswer } from "@/entities/UserAnswer";
import { User } from "@/entities/User";
import QuestionList from "../components/questions/QuestionList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BookCopy, Printer, Download, FileText, ClipboardList, CheckSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const institutionNames = {
  fcc: "FCC - Fundação Carlos Chagas",
  cespe: "CESPE/CEBRASPE",
  vunesp: "VUNESP",
  fgv: "FGV - Fundação Getúlio Vargas",
  cesgranrio: "CESGRANRIO",
  esaf: "ESAF",
  idecan: "IDECAN",
  fundatec: "FUNDATEC",
  consulplan: "CONSULPLAN",
  instituto_aocp: "Instituto AOCP",
  ibade: "IBADE",
  quadrix: "QUADRIX",
  ibfc: "IBFC",
  objetiva: "Objetiva Concursos",
  iades: "IADES",
  itame: "ITAME"
};

export default function ExamView() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [examInfo, setExamInfo] = useState({
    name: "",
    institution: "",
    year: "",
    cargo: "",
    edital_url: "",
    prova_url: "",
    gabarito_url: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Estados para responder questões
  const [userAnswers, setUserAnswers] = useState({});
  const [submittedAnswers, setSubmittedAnswers] = useState({});
  const [responseHistory, setResponseHistory] = useState({});

  const institution = searchParams.get("institution");
  const year = searchParams.get("year");
  const exam_name = searchParams.get("exam_name");
  const cargo = searchParams.get("cargo");

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        
        if (!institution || !year || !exam_name) {
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        
        // Construir filtro dinamicamente
        const filter = {
          institution,
          year: parseInt(year),
          exam_name
        };
        
        // Só adicionar cargo se não for 'null' ou vazio
        if (cargo && cargo !== 'null') {
          filter.cargo = cargo;
        }
        
        console.log('Filtro aplicado:', filter);
        const fetchedQuestions = await Question.filter(filter);
        console.log('Questões encontradas:', fetchedQuestions.length);
        
        setQuestions(fetchedQuestions);
        
        // Pegar informações da primeira questão para downloads
        if (fetchedQuestions.length > 0) {
          const firstQuestion = fetchedQuestions[0];
          setExamInfo({
            name: exam_name,
            institution: institution,
            year: year,
            cargo: cargo === 'null' ? 'Não especificado' : cargo,
            edital_url: firstQuestion.edital_url || "",
            prova_url: firstQuestion.prova_url || "",
            gabarito_url: firstQuestion.gabarito_url || ""
          });
        }

        // Carregar respostas anteriores do usuário
        if (user) {
          const userAnswersData = await UserAnswer.filter({ created_by: user.email });
          const answersMap = {};
          const submittedMap = {};
          const historyMap = {};

          userAnswersData.forEach(answer => {
            if (fetchedQuestions.some(q => q.id === answer.question_id)) {
              answersMap[answer.question_id] = answer.user_answer;
              submittedMap[answer.question_id] = {
                submitted: true,
                isCorrect: answer.is_correct
              };
              historyMap[answer.question_id] = answer;
            }
          });

          setUserAnswers(answersMap);
          setSubmittedAnswers(submittedMap);
          setResponseHistory(historyMap);
        }
      } catch (error) {
        console.error("Erro ao carregar prova:", error);
      }
      setIsLoading(false);
    };

    loadData();
  }, [institution, year, exam_name, cargo]);

  const handleAnswerChange = (questionId, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitAnswer = async (question) => {
    if (!currentUser) return;
    
    const userAnswer = userAnswers[question.id];
    if (!userAnswer) return;

    try {
      const isCorrect = userAnswer === question.correct_answer;
      
      // Salvar resposta
      await UserAnswer.create({
        question_id: question.id,
        user_answer: userAnswer,
        is_correct: isCorrect,
        subject: question.subject,
        institution: question.institution
      });

      // Atualizar estado local
      setSubmittedAnswers(prev => ({
        ...prev,
        [question.id]: {
          submitted: true,
          isCorrect: isCorrect
        }
      }));

      setResponseHistory(prev => ({
        ...prev,
        [question.id]: {
          is_correct: isCorrect,
          user_answer: userAnswer
        }
      }));

    } catch (error) {
      console.error("Erro ao salvar resposta:", error);
    }
  };
  
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = (url, filename) => {
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/4" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 text-center">
        <BookCopy className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Prova não encontrada</h2>
        <p className="text-gray-600">Não foi possível encontrar questões para esta prova.</p>
         <Button onClick={() => navigate(createPageUrl('Exams'))} className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a lista de provas
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <style>
        {`
          @media print {
            .print-hide {
              display: none !important;
            }
            #printable-exam-area {
              padding: 0;
              margin: 0;
            }
            body {
              background-color: white !important;
            }
            .question-card-print {
              page-break-inside: avoid;
              border: 1px solid #eee !important;
              box-shadow: none !important;
              padding: 0.5rem 1rem !important;
            }
            #printable-exam-area .space-y-6 {
                row-gap: 0.5rem !important;
            }
            .question-card-print .py-8, .question-card-print .py-6 {
                padding-top: 0.5rem !important;
                padding-bottom: 0.5rem !important;
            }
            .question-card-print .mb-6 {
                margin-bottom: 0.75rem !important;
            }
          }
        `}
      </style>
      <div id="printable-exam-area">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 print-hide">
          <Button onClick={() => navigate(createPageUrl('Exams'))} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            {examInfo.edital_url && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleDownload(examInfo.edital_url, `Edital-${examInfo.name}.pdf`)}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                Edital
              </Button>
            )}
            {examInfo.prova_url && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleDownload(examInfo.prova_url, `Prova-${examInfo.name}.pdf`)}
                className="flex items-center gap-2"
              >
                <ClipboardList className="w-4 h-4 text-green-600" />
                Prova
              </Button>
            )}
            {examInfo.gabarito_url && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleDownload(examInfo.gabarito_url, `Gabarito-${examInfo.name}.pdf`)}
                className="flex items-center gap-2"
              >
                <CheckSquare className="w-4 h-4 text-purple-600" />
                Gabarito
              </Button>
            )}
            <Button onClick={handlePrint} variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Prova
            </Button>
          </div>
        </div>
  
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{examInfo.name}</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
            {institutionNames[examInfo.institution] || examInfo.institution.toUpperCase()} - {examInfo.year}
          </p>
          <p className="text-md text-gray-500 dark:text-gray-500">
            Cargo: {examInfo.cargo}
          </p>
        </div>
  
        <div className="space-y-6">
          <QuestionList
            questions={questions}
            userAnswers={userAnswers}
            submittedAnswers={submittedAnswers}
            responseHistory={responseHistory}
            onAnswerChange={handleAnswerChange}
            onSubmitAnswer={handleSubmitAnswer}
            currentPage={1}
            questionsPerPage={questions.length}
            layoutMode="classic"
          />
        </div>
      </div>
    </div>
  );
}
