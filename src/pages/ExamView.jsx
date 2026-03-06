import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Question } from "@/entities/Question";
import { UserAnswer } from "@/entities/UserAnswer";
import { User } from "@/entities/User";
import QuestionList from "../components/questions/QuestionList";
import StudyTimer from "../components/questions/StudyTimer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BookCopy, FileText, ClipboardList, CheckSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuestionLimit } from "@/components/hooks/useQuestionLimit";
import DailyLimitBanner from "@/components/limits/DailyLimitBanner";

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
  
  const { isBlocked, questionsAnsweredToday, dailyLimit, incrementCount, remainingQuestions } = useQuestionLimit();

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
        const cargoParam = cargo && decodeURIComponent(cargo);
        const query = {
          institution,
          year: parseInt(year),
          exam_name,
        };
        if (
          cargoParam &&
          cargoParam !== 'Cargo não especificado' &&
          cargoParam !== 'N/A' &&
          cargoParam !== 'null' &&
          cargoParam !== 'undefined'
        ) {
          query.cargo = cargoParam;
        }
        let fetchedQuestions = await Question.filter(query, 'created_date');

        if (!fetchedQuestions || fetchedQuestions.length === 0) {
          const allByYear = await Question.filter({
            institution,
            year: parseInt(year)
          }, 'created_date');

          const norm = (s) => (s || '')
            .toString()
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ');

          const targetExam = norm(exam_name);
          const targetCargo = norm(cargoParam);

          let candidates = allByYear.filter(q => norm(q.exam_name) === targetExam);
          if (candidates.length === 0) {
            candidates = allByYear.filter(q => norm(q.exam_name).includes(targetExam));
          }
          if (
            candidates.length > 0 &&
            targetCargo &&
            targetCargo !== 'cargo não especificado' &&
            targetCargo !== 'n/a'
          ) {
            candidates = candidates.filter(q => norm(q.cargo) === targetCargo);
          }
          fetchedQuestions = candidates;
        }
        
        setQuestions([...fetchedQuestions].sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
        
        // Pegar informações da primeira questão para downloads
        if (fetchedQuestions.length > 0) {
          const firstQuestion = fetchedQuestions[0];
          const displayCargo = (!cargoParam || cargoParam === 'Cargo não especificado' || cargoParam === 'N/A' || cargoParam === 'null' || cargoParam === 'undefined')
            ? 'Não especificado'
            : cargoParam;
          setExamInfo({
            name: exam_name,
            institution: institution,
            year: year,
            cargo: displayCargo,
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

    if (isBlocked) {
      return;
    }

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

      incrementCount();

    } catch (error) {
      console.error("Erro ao salvar resposta:", error);
    }
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
    <div className="max-w-4xl mx-auto p-4 md:p-8 w-full overflow-hidden">
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6 print-hide">
          <Button onClick={() => navigate(createPageUrl('Exams'))} variant="outline" size="sm" className="w-full sm:w-auto">
            <ArrowLeft className="mr-1 h-3 w-3" />
            <span className="text-xs">Voltar</span>
          </Button>
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <StudyTimer defaultMinutes={240} />
            {examInfo.edital_url && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleDownload(examInfo.edital_url, `Edital-${examInfo.name}.pdf`)}
                className="flex items-center gap-1 flex-1 sm:flex-initial text-xs px-2 py-1 h-8"
              >
                <FileText className="w-3 h-3 text-blue-600" />
                <span className="hidden sm:inline">Edital</span>
              </Button>
            )}
            {examInfo.prova_url && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleDownload(examInfo.prova_url, `Prova-${examInfo.name}.pdf`)}
                className="flex items-center gap-1 flex-1 sm:flex-initial text-xs px-2 py-1 h-8"
              >
                <ClipboardList className="w-3 h-3 text-green-600" />
                <span className="hidden sm:inline">Prova</span>
              </Button>
            )}
            {examInfo.gabarito_url && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleDownload(examInfo.gabarito_url, `Gabarito-${examInfo.name}.pdf`)}
                className="flex items-center gap-1 flex-1 sm:flex-initial text-xs px-2 py-1 h-8"
              >
                <CheckSquare className="w-3 h-3 text-purple-600" />
                <span className="hidden sm:inline">Gabarito</span>
              </Button>
            )}

          </div>
        </div>
  
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{examInfo.name}</h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 mt-1">
            {institutionNames[examInfo.institution] || examInfo.institution.toUpperCase()} - {examInfo.year}
          </p>
          <p className="text-sm md:text-md text-gray-500 dark:text-gray-400">
            Cargo: {examInfo.cargo}
          </p>
        </div>

        <DailyLimitBanner 
          questionsAnsweredToday={questionsAnsweredToday}
          dailyLimit={dailyLimit}
          remainingQuestions={remainingQuestions}
        />
  
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
            isBlocked={isBlocked}
          />
        </div>
      </div>
    </div>
  );
}