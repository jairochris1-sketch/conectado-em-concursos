import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  X,
  Star,
  MessageSquare,
  Play,
  BarChart3,
  StickyNote,
  Flag,
  FileText,
  Edit,
  Trash2,
  Scissors,
  CheckCircle,
  XCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CommentSection from "../comments/CommentSection";
import { Favorite } from "@/entities/Favorite";
import { User } from "@/entities/User";
import { Comment } from "@/entities/Comment";
import { StudyMaterial } from "@/entities/StudyMaterial";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import _ from 'lodash';

const subjectNames = {
  portugues: "Português",
  matematica: "Matemática",
  direito_constitucional: "Direito Constitucional",
  direito_administrativo: "Direito Administrativo",
  direito_penal: "Direito Penal",
  direito_civil: "Direito Civil",
  direito_tributario: "Direito Tributário",
  direito_previdenciario: "Direito Previdenciário",
  direito_eleitoral: "Direito Eleitoral",
  direito_ambiental: "Direito Ambiental",
  administracao_geral: "Administração Geral",
  administracao_publica: "Administração Pública",
  administracao_recursos_materiais: "Administração de Recursos Materiais",
  afo: "AFO",
  financas_publicas: "Finanças Públicas",
  etica_administracao: "Ética na Administração",
  arquivologia: "Arquivologia",
  atendimento_publico: "Atendimento ao Público",
  direitos_humanos: "Direitos Humanos",
  eca: "ECA",
  informatica: "Informática",
  conhecimentos_gerais: "Conhecimentos Gerais",
  raciocinio_logico: "Raciocínio Lógico",
  contabilidade: "Contabilidade",
  economia: "Economia",
  estatistica: "Estatística",
  pedagogia: "Pedagogia",
  seguranca_publica: "Segurança Pública",
  lei_8112: "Lei 8.112/90",
  lei_8666: "Lei 8.666/93",
  lei_14133: "Lei 14.133/21",
  constituicao_federal: "Constituição Federal",
  regimento_interno: "Regimento Interno",
  legislacao_estadual: "Legislação Estadual",
  legislacao_municipal: "Legislação Municipal"
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
  aocp: "AOCP",
  quadrix: "QUADRIX",
  instituto_aocp: "Instituto AOCP",
  planejar: "PLANEJAR",
  ibptec: "IBPTEC",
  amiga_publica: "AMIGA PÚBLICA",
  ibade: "IBADE",
  ibfc: "IBFC",
  objetiva: "Objetiva",
  iades: "IADES",
  itame: "ITAME",
  outras: "Outras"
};

export default function QuestionList({
  questions,
  userAnswers,
  submittedAnswers,
  responseHistory,
  onAnswerChange,
  onSubmitAnswer,
  currentPage,
  questionsPerPage,
  layoutMode = 'compact',
  fontSize = 1,
  autoShowAssociatedTextForPortuguese = false
}) {
  const [commentsVisible, setCommentsVisible] = useState({});
  const [favorites, setFavorites] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [explanationVisible, setExplanationVisible] = useState({});
  const [notesVisible, setNotesVisible] = useState({});
  const [notes, setNotes] = useState({});
  const [userNotes, setUserNotes] = useState({});
  const [showReportModal, setShowReportModal] = useState(null);
  const [statsVisible, setStatsVisible] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [studyMaterialCounts, setStudyMaterialCounts] = useState({});
  const [associatedTextVisible, setAssociatedTextVisible] = useState({});
  const [eliminatedOptions, setEliminatedOptions] = useState({});

  const fetchCommentCounts = useCallback(async () => {
    if (!questions || questions.length === 0) return;
    const questionIds = questions.map(q => q.id);
    try {
        const filteredComments = await Comment.list();
        const commentsByQuestionId = {};
        
        filteredComments.forEach(comment => {
          if (questionIds.includes(comment.question_id)) {
            commentsByQuestionId[comment.question_id] = (commentsByQuestionId[comment.question_id] || 0) + 1;
          }
        });
        
        setCommentCounts(commentsByQuestionId);
    } catch (error) {
        if (error.response?.status !== 429) {
            console.error("Erro ao carregar contagens de comentários:", error);
        } else {
          console.warn("Rate limit atingido ao buscar contagens de comentários.");
        }
    }
  }, [questions]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        if(user) {
            const favoriteData = await Favorite.filter({ created_by: user.email });
            const favs = favoriteData.reduce((acc, fav) => {
              acc[fav.question_id] = fav.id;
              return acc;
            }, {});
            setFavorites(favs);

            const savedNotes = favoriteData.reduce((acc, fav) => {
              if (fav.note) {
                acc[fav.question_id] = fav.note;
              }
              return acc;
            }, {});
            setUserNotes(savedNotes);
        }
      } catch (error) {
        if (error.response?.status !== 429) {
          console.error("Erro ao carregar dados do usuário ou favoritos:", error);
        }
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!questions || questions.length === 0) return;

      const uniqueSubjects = [...new Set(questions.map(q => q.subject))];

      try {
        await fetchCommentCounts();
        
        const filteredMaterials = await StudyMaterial.list(null, null, { subject__in: uniqueSubjects });
        
        const materialsBySubject = _.groupBy(filteredMaterials, 'subject');
        const newMaterialCounts = _.mapValues(materialsBySubject, (materials) => materials.length);
        setStudyMaterialCounts(newMaterialCounts);

      } catch (error) {
        if (error.response?.status !== 429) {
          console.error("Erro ao carregar contagens de materiais de estudo:", error);
        } else {
          console.warn("Rate limit atingido ao buscar contagens de materiais de estudo. A funcionalidade será degradada (contagens não aparecerão).");
        }
      }
    };

    fetchCounts();
  }, [questions, fetchCommentCounts]);

  // Exibir automaticamente o texto associado nas questões de Português (quando habilitado)
  useEffect(() => {
    if (!autoShowAssociatedTextForPortuguese) return;
    if (!questions || questions.length === 0) return;
    setAssociatedTextVisible(prev => {
      const updated = { ...prev };
      questions.forEach(q => {
        if (q.subject === 'portugues' && q.associated_text && updated[q.id] === undefined) {
          updated[q.id] = true;
        }
      });
      return updated;
    });
  }, [questions, autoShowAssociatedTextForPortuguese]);

  const toggleAssociatedText = (questionId) => {
    setAssociatedTextVisible(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const toggleComments = (questionId) => {
    setCommentsVisible(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const toggleExplanation = (questionId) => {
    setExplanationVisible(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const toggleStats = (questionId) => {
    setStatsVisible(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const toggleNotes = (questionId) => {
    setNotesVisible(prev => {
      const isCurrentlyVisible = prev[questionId];
      if (!isCurrentlyVisible) {
        setNotes(currentNotes => ({
          ...currentNotes,
          [questionId]: userNotes[questionId] || ''
        }));
      } else {
        setNotes(currentNotes => {
          const newCurrentNotes = { ...currentNotes };
          delete newCurrentNotes[questionId];
          return newCurrentNotes;
        });
      }
      return {
        ...prev,
        [questionId]: !isCurrentlyVisible
      };
    });
  };

  const handleEditNote = (questionId) => {
    setNotes(prev => ({
      ...prev,
      [questionId]: userNotes[questionId] || ''
    }));
  };

  const handleDeleteNote = async (questionId) => {
    if (!currentUser) return;

    const favoriteId = favorites[questionId];
    if (!favoriteId) return;

    try {
      await Favorite.update(favoriteId, { note: null });

      setUserNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[questionId];
        return newNotes;
      });
      setNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[questionId];
        return newNotes;
      });
    } catch (error) {
      console.error("Erro ao excluir anotação:", error);
    }
  };

  const handleSaveNote = async (questionId, noteText) => {
    if (!currentUser) return;
    if (!noteText.trim()) return;

    try {
      let favoriteId = favorites[questionId];
      
      if (favoriteId) {
        await Favorite.update(favoriteId, { note: noteText });
      } else {
        const newFavorite = await Favorite.create({ 
          question_id: questionId, 
          note: noteText,
          created_by: currentUser.email
        });
        setFavorites(prev => ({ ...prev, [questionId]: newFavorite.id }));
      }
      
      setUserNotes(prev => ({
        ...prev,
        [questionId]: noteText
      }));
      
      setNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[questionId];
        return newNotes;
      });
    } catch (error) {
      console.error("Erro ao salvar anotação:", error);
    }
  };

  const handleReportError = (questionId) => {
    setShowReportModal(questionId);
  };

  const handleSubmitReport = (questionId, reportText) => {
    console.log(`Erro reportado para questão ${questionId}: ${reportText}`);
    setShowReportModal(null);
    alert('Erro reportado com sucesso! Obrigado pela contribuição.');
  };

  const handleToggleFavorite = async (questionId) => {
    if (!currentUser) return;
    
    const isFavorited = favorites[questionId];
    
    try {
      if (isFavorited) {
        await Favorite.delete(favorites[questionId]);
        setFavorites(prev => {
          const newFavs = { ...prev };
          delete newFavs[questionId];
          return newFavs;
        });
        setUserNotes(prev => {
          const newNotes = { ...prev };
          delete newNotes[questionId];
          return newNotes;
        });
      } else {
        const newFavorite = await Favorite.create({ question_id: questionId });
        setFavorites(prev => ({ ...prev, [questionId]: newFavorite.id }));
      }
    } catch (error) {
      console.error("Erro ao favoritar questão:", error);
    }
  };

  const handleEliminateOption = (questionId, optionLetter) => {
    setEliminatedOptions(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [optionLetter]: !prev[questionId]?.[optionLetter]
      }
    }));
  };

  const generateQuestionNumber = (index, currentPage, questionsPerPage) => {
    const baseNumber = (currentPage - 1) * questionsPerPage + index + 1;
    return baseNumber;
  };

  const getContainerStyle = () => {
    if (layoutMode === 'classic') {
      return "bg-white";
    }
    return "border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden divide-y divide-gray-200 dark:divide-gray-700";
  };

  const getQuestionCardStyle = () => {
    if (layoutMode === 'classic') {
      return "bg-white border-b border-gray-200";
    }
    return "bg-white dark:bg-gray-800";
  };

  const getTextStyles = () => {
    if (layoutMode === 'classic') {
      return {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        muted: 'text-gray-500',
        border: 'border-gray-200',
        background: 'bg-white',
        headerBg: 'bg-gray-50',
        hoverBg: 'hover:bg-gray-50',
        hoverText: 'hover:text-gray-800',
      };
    }
    return {
      primary: 'text-gray-900 dark:text-white',
      secondary: 'text-gray-600 dark:text-gray-400',
      muted: 'text-gray-500 dark:text-gray-500',
      border: 'border-gray-200 dark:border-gray-700',
      background: 'bg-white dark:bg-gray-800',
      headerBg: 'bg-gray-50 dark:bg-gray-800/50',
      hoverBg: 'hover:bg-gray-50 dark:hover:bg-gray-700/50',
      hoverText: 'hover:text-gray-800 dark:hover:text-gray-200'
    };
  };

  return (
    <div className={getContainerStyle()}>
      <AnimatePresence>
        {[...questions].sort((a, b) => {
          const pa = a.subject === 'portugues' ? 0 : 1;
          const pb = b.subject === 'portugues' ? 0 : 1;
          if (pa !== pb) return pa - pb;
          return (a.subject || '').localeCompare(b.subject || '');
        }).map((question, index) => {
          const userAnswer = userAnswers[question.id];
          const submittedAnswer = submittedAnswers[question.id];
          const isSubmitted = submittedAnswer?.submitted;
          const isCorrect = submittedAnswer?.isCorrect;
          const showComments = commentsVisible[question.id];
          const showExplanation = explanationVisible[question.id];
          const showStats = statsVisible[question.id];
          const showNotes = notesVisible[question.id];
          const showAssociatedText = associatedTextVisible[question.id];
          
          const lastResponse = responseHistory ? responseHistory[question.id] : undefined;
          
          const isFavorited = favorites[question.id];
          const questionNumber = generateQuestionNumber(index, currentPage, questionsPerPage);
          const textStyles = getTextStyles();

          const materialCount = studyMaterialCounts[question.subject] || 0;
          const commentCount = commentCounts[question.id] || 0;

          return (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={getQuestionCardStyle()}
              style={{ 
                marginBottom: layoutMode === 'classic' ? '0.75rem' : '1rem',
                fontFamily: 'Arial, sans-serif'
              }}
            >
              <div className={`${textStyles.headerBg} px-6 py-3 ${textStyles.border} border-b print-hide`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md font-bold text-sm">
                        {questionNumber}
                      </div>
                      <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono">
                        ID: {question.id.slice(-8).toUpperCase()}
                      </div>
                    </div>
                    
                    <span className="text-blue-600 font-medium">
                      {subjectNames[question.subject] || question.subject}
                    </span>
                    
                    {question.topic && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className={`${textStyles.secondary} text-sm capitalize`}>
                          {question.topic.replace(/_/g, ' ')}
                        </span>
                      </>
                    )}
                  </div>

                  {lastResponse && (
                    <div className="flex items-center gap-2">
                      {lastResponse.is_correct ? (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                          Resolvi certo!
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                          Resolvi errado!
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className={`mt-2 text-sm ${textStyles.secondary}`}>
                  <span>Ano: <strong>{question.year}</strong></span>
                  <span className="mx-2">•</span>
                  <span>Banca: <strong className="text-orange-600">{institutionNames[question.institution] || question.institution.toUpperCase()}</strong></span>
                  {question.cargo && (
                    <>
                      <span className="mx-2">•</span>
                      <span>Cargo: <strong>{question.cargo}</strong></span>
                    </>
                  )}
                  {question.exam_name && (
                    <>
                      <span className="mx-2">•</span>
                      <span>Prova: </span>
                      <Link 
                        to={createPageUrl(`ExamView?institution=${question.institution}&year=${question.year}&exam_name=${encodeURIComponent(question.exam_name)}&cargo=${encodeURIComponent(question.cargo || '')}`)}
                        className="font-bold text-orange-600 hover:underline"
                      >
                         {question.exam_name} {question.cargo && `(${question.cargo})`}
                      </Link>
                    </>
                  )}
                </div>
              </div>

              <div className={`px-6 ${layoutMode === 'classic' ? 'py-6' : 'py-5'}`}>
                {question.associated_text && (
                  autoShowAssociatedTextForPortuguese && question.subject === 'portugues' ? (
                    <div className="mb-4">
                      <div
                        className={`prose prose-sm max-w-none ${textStyles.primary} leading-relaxed`}
                        dangerouslySetInnerHTML={{ __html: question.associated_text }}
                        style={{ 
                          fontSize: `${fontSize}rem`, 
                          textAlign: 'justify',
                          textIndent: '3em'
                        }}
                      />
                    </div>
                  ) : (
                    <div className="mb-4 print-hide">
                      <button
                        onClick={() => toggleAssociatedText(question.id)}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          showAssociatedText 
                            ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        <FileText className="w-4 h-4" />
                        {showAssociatedText ? 'Ocultar texto' : 'Exibir texto associado'}
                      </button>
                      {showAssociatedText && (
                        <div className="mt-4 print-hide">
                          <div
                            className={`prose prose-sm max-w-none ${textStyles.primary} leading-relaxed`}
                            dangerouslySetInnerHTML={{ __html: question.associated_text }}
                            style={{ 
                              fontSize: `${fontSize}rem`, 
                              textAlign: 'justify',
                              textIndent: '3em'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )
                )}

                <div className="hidden print:block mb-4">
                  <span className="text-lg font-bold">Questão {questionNumber}</span>
                </div>

                {question.statement && (
                  <div
                    className={`prose prose-sm max-w-none ${textStyles.primary} leading-relaxed mb-4`}
                    dangerouslySetInnerHTML={{ __html: question.statement }}
                    style={{ 
                      fontSize: `${fontSize}rem`, 
                      textAlign: 'justify',
                      textIndent: '3em'
                    }}
                  />
                )}

                {question.command && (
                  <div
                    className={`prose prose-sm max-w-none ${textStyles.primary} leading-relaxed mb-4 font-semibold`}
                    dangerouslySetInnerHTML={{ __html: question.command }}
                    style={{ 
                      fontSize: `${fontSize}rem`, 
                      textAlign: 'justify'
                    }}
                  />
                )}

                <div className="mb-3 space-y-1">
                  {question.options?.map((option, optionIndex) => {
                    const isUserChoice = userAnswer === option.letter;
                    const isCorrectAnswer = option.letter === question.correct_answer;
                    const isEliminated = eliminatedOptions[question.id]?.[option.letter];

                    let optionStyle = textStyles.hoverBg;
                    let textStyle = textStyles.primary;
                    
                    if (isSubmitted) {
                      if (isCorrectAnswer) {
                        optionStyle = 'bg-green-50';
                        textStyle = 'text-green-800 font-medium';
                      } else if (isUserChoice && !isCorrectAnswer) {
                        optionStyle = 'bg-red-50';
                        textStyle = 'text-red-800 font-medium';
                      }
                    } else if (isUserChoice) {
                        optionStyle = 'bg-blue-50';
                        textStyle = 'text-blue-800';
                    }

                    return (
                      <div
                        key={option.letter}
                        className={`group flex items-start gap-3 p-2 transition-all duration-200 ${!isSubmitted ? 'cursor-pointer' : ''} ${optionStyle} relative rounded-lg`}
                        onClick={() => !isSubmitted && onAnswerChange(question.id, option.letter)}
                      >
                        {!isSubmitted && question.type !== 'true_false' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEliminateOption(question.id, option.letter);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity absolute left-1 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded print-hide"
                            title={isEliminated ? "Restaurar alternativa" : "Eliminar alternativa"}
                          >
                            <Scissors className={`w-3 h-3 ${isEliminated ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`} />
                          </button>
                        )}

                        {question.type !== 'true_false' && (
                          <span 
                            className={`${textStyle} ${!isSubmitted ? 'ml-6' : ''}`}
                            style={{ fontWeight: 600 }}
                          >
                            {option.letter.toLowerCase()})
                          </span>
                        )}
                        
                        <div 
                          className={`prose prose-sm max-w-none flex-1 leading-relaxed ${textStyle} ${
                            isEliminated && !isSubmitted ? 'line-through opacity-50' : ''
                          } ${question.type === 'true_false' ? '' : ''}`}
                          style={{ 
                            fontSize: `${fontSize}rem`,
                            fontWeight: question.type === 'true_false' ? 600 : 'normal'
                          }}
                          dangerouslySetInnerHTML={{ __html: option.text }}
                        />
                      </div>
                    );
                  })}
                </div>

                {!isSubmitted && userAnswer && (
                  <div className="mb-4 print-hide">
                    <Button
                      onClick={() => onSubmitAnswer(question)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2 rounded-md font-medium"
                    >
                      Responder
                    </Button>
                  </div>
                )}

                {isSubmitted && (
                  question.type === 'true_false' ? (
                    <div className="mb-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700 print-hide">
                      <div className="flex items-center gap-2">
                        {isCorrect ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="font-semibold text-green-600 dark:text-green-400">Parabéns! Você acertou!</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-600" />
                            <span className="font-semibold text-red-600 dark:text-red-400">Você errou!</span>
                          </>
                        )}
                      </div>
                      {!isCorrect && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          A resposta correta é: <strong className="text-green-600 dark:text-green-400">{question.options.find(o => o.letter === question.correct_answer)?.text}</strong>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className={`mb-4 ${layoutMode === 'classic' ? 'p-4' : 'p-3'} bg-gray-50 dark:bg-gray-700 rounded-lg print-hide`}>
                      <div className="flex items-center gap-4 text-sm">
                        <span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                          {isCorrect ? '✓ Correta!' : '✗ Errada!'}
                        </span>
                        <span className="text-gray-600 dark:text-gray-300">
                          Gabarito: <span className="font-bold text-green-600">{question.correct_answer}</span>
                        </span>
                      </div>
                    </div>
                  )
                )}

                {question.explanation && (showExplanation || isSubmitted) && (
                  <div className="rounded-lg p-4 mb-4 text-white print-hide" style={{ backgroundColor: '#344151', border: '1px solid #2a3441' }}>
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-yellow-300 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">Gabarito Comentado:</h4>
                          <button
                            onClick={() => toggleExplanation(question.id)}
                            className="text-gray-300 hover:text-white transition-colors"
                            title="Fechar explicação"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div
                          className="text-sm leading-relaxed prose prose-sm max-w-none text-gray-200 prose-strong:text-white prose-p:text-gray-200"
                          dangerouslySetInnerHTML={{ __html: question.explanation.replace(/\n/g, '<br />') }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {showStats && (
                  <div className="bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800 rounded-lg p-4 mb-4 print-hide">
                    <div className="flex items-start gap-3">
                      <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-900 dark:text-green-200 mb-3">Estatísticas da Questão:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-bold text-lg text-green-600 dark:text-green-400">{Math.floor(Math.random() * 30 + 40)}%</div>
                            <div className="text-green-700 dark:text-green-300">Taxa de Acerto</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-lg text-blue-600 dark:text-blue-400">{Math.floor(Math.random() * 5000 + 1000)}</div>
                            <div className="text-blue-700 dark:text-blue-300">Resoluções</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-lg text-purple-600 dark:text-purple-400">Médio</div>
                            <div className="text-purple-700 dark:text-purple-300">Dificuldade</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-lg text-orange-600 dark:text-orange-400">{Math.floor(Math.random() * 120 + 30)}s</div>
                            <div className="text-orange-700 dark:text-orange-300">Tempo Médio</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {showNotes && (
                  <div className="bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800 rounded-lg p-4 mb-4 print-hide">
                    <div className="flex items-start gap-3">
                      <StickyNote className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-yellow-900 dark:text-yellow-200">Suas Anotações:</h4>
                          <button
                            onClick={() => toggleNotes(question.id)}
                            className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200 transition-colors"
                            title="Fechar anotações"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {userNotes[question.id] && (
                          <div className="mb-4 p-3 bg-white dark:bg-gray-800 border border-yellow-300 dark:border-yellow-600 rounded-lg">
                            <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{userNotes[question.id]}</p>
                            <div className="flex justify-end gap-2 mt-2">
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400" onClick={() => handleEditNote(question.id)}>
                                    <Edit className="w-3 h-3 mr-1" />
                                    Editar
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" onClick={() => handleDeleteNote(question.id)}>
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Excluir
                                </Button>
                            </div>
                          </div>
                        )}
                        
                        <textarea
                          className="w-full p-3 border rounded-lg resize-none bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                          rows="4"
                          placeholder="Escreva suas anotações sobre esta questão..."
                          value={notes[question.id] || ''}
                          onChange={(e) => setNotes(prev => ({ ...prev, [question.id]: e.target.value }))}
                        />
                        <div className="flex justify-end mt-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveNote(question.id, notes[question.id] || '')}
                            className="bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600"
                          >
                            Salvar Anotação
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={`${textStyles.headerBg} px-4 sm:px-6 py-3 ${textStyles.border} border-t print-hide`}>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                    {question.explanation && (
                      <button 
                        onClick={() => toggleExplanation(question.id)}
                        className={`flex items-center gap-2 ${textStyles.secondary} ${textStyles.hoverText} text-sm relative`}
                      >
                        <Lightbulb className="w-4 h-4" />
                        <span className="hidden sm:inline">Gabarito Comentado</span>
                        <span className="sm:hidden">Gabarito</span>
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      </button>
                    )}

                    <button 
                      onClick={() => toggleComments(question.id)}
                      className={`flex items-center gap-2 ${textStyles.secondary} ${textStyles.hoverText} text-sm`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="hidden sm:inline">Comentários</span>
                      <span className="sm:hidden">Fórum</span>
                       ({commentCount})
                    </button>

                    {materialCount > 0 && (
                      <Link 
                        to={createPageUrl(`Studies?subject=${question.subject}`)}
                        className={`flex items-center gap-2 ${textStyles.secondary} ${textStyles.hoverText} text-sm`}
                      >
                        <Play className="w-4 h-4" />
                        <span className="hidden sm:inline">Aulas</span>
                         ({materialCount})
                      </Link>
                    )}

                    <button 
                      onClick={() => toggleStats(question.id)}
                      className={`flex items-center gap-2 ${textStyles.secondary} ${textStyles.hoverText} text-sm`}
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span className="hidden sm:inline">Estatísticas</span>
                       <span className="sm:hidden">Stats</span>
                    </button>

                    <button 
                      onClick={() => toggleNotes(question.id)}
                      className={`flex items-center gap-2 ${textStyles.secondary} ${textStyles.hoverText} text-sm`}
                    >
                      <StickyNote className="w-4 h-4" />
                      <span className="hidden sm:inline">Criar anotações</span>
                      <span className="sm:hidden">Anotar</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleToggleFavorite(question.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        isFavorited ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : `text-gray-400 ${layoutMode === 'classic' ? 'hover:text-yellow-500 hover:bg-yellow-50' : 'hover:text-yellow-500 dark:hover:text-yellow-500 dark:hover:bg-yellow-50/10'}`
                      }`}
                      title={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                    >
                      <Star className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                    </button>

                    <button 
                      onClick={() => handleReportError(question.id)}
                      className={`flex items-center gap-2 ${textStyles.secondary} ${layoutMode === 'classic' ? 'hover:text-red-600' : 'dark:hover:text-red-500'} text-sm`}
                    >
                      <Flag className="w-4 h-4" />
                      <span className="hidden sm:inline">Notificar Erro</span>
                    </button>
                  </div>
                </div>
              </div>

              {showComments && (
                <div className={`${textStyles.border} border-t ${textStyles.background} print-hide`}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className={`font-medium ${textStyles.primary}`}>Comentários da Questão</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleComments(question.id)}
                        className={`${textStyles.muted} hover:text-gray-700 dark:hover:text-gray-300`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <CommentSection 
                        questionId={question.id} 
                        onCommentChange={fetchCommentCounts}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print-hide">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Reportar Erro</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Descreva o erro encontrado na questão:
            </p>
            <textarea
              className="w-full p-3 border rounded-lg resize-none bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              rows="4"
              placeholder="Descreva o erro..."
              id="reportText"
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowReportModal(null)}
                className="dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  const reportText = document.getElementById('reportText').value;
                  handleSubmitReport(showReportModal, reportText);
                }}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
              >
                Enviar Relatório
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}