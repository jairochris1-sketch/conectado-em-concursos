import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Mic, Play, Square, Volume2 } from "lucide-react";
import { toast } from "sonner";

const normalizeText = (value = "") =>
  value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/<[^>]*>/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const htmlToText = (html = "") => {
  if (typeof document === "undefined") return html;
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
};

const buildNarration = (question, number) => {
  const parts = [`Questão ${number}.`];
  if (question.associated_text) parts.push(`Texto de apoio. ${htmlToText(question.associated_text)}`);
  if (question.statement) parts.push(htmlToText(question.statement));
  if (question.command) parts.push(htmlToText(question.command));
  if (question.options?.length) {
    parts.push("Alternativas.");
    question.options.forEach((option) => {
      parts.push(`Alternativa ${option.letter}. ${htmlToText(option.text)}`);
    });
  }
  return parts.join(" ");
};

const findBestOption = (question, transcript) => {
  const normalizedTranscript = normalizeText(transcript);
  if (!normalizedTranscript) return null;

  if (question.type === "true_false") {
    if (normalizedTranscript.includes("certo")) return "C";
    if (normalizedTranscript.includes("errado")) return "E";
  }

  for (const option of question.options || []) {
    if (normalizedTranscript.includes(`alternativa ${option.letter.toLowerCase()}`) || normalizedTranscript.includes(`letra ${option.letter.toLowerCase()}`)) {
      return option.letter;
    }
  }

  const ranked = (question.options || []).map((option) => {
    const optionText = normalizeText(htmlToText(option.text));
    const optionWords = optionText.split(" ").filter((word) => word.length > 2);
    let score = 0;

    if (normalizedTranscript === optionText) score += 100;
    if (normalizedTranscript.includes(optionText) || optionText.includes(normalizedTranscript)) score += 60;
    score += optionWords.filter((word) => normalizedTranscript.includes(word)).length * 5;

    return { letter: option.letter, score };
  }).sort((a, b) => b.score - a.score);

  return ranked[0]?.score > 0 ? ranked[0].letter : null;
};

export default function VoiceSimulationPanel({
  questions,
  startNumber,
  userAnswers,
  submittedAnswers,
  onAnswerChange,
  onVoiceSubmit,
  isBlocked
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const recognitionRef = useRef(null);
  const sequenceActiveRef = useRef(false);

  useEffect(() => {
    setCurrentIndex(0);
    setLastTranscript("");
  }, [questions]);

  useEffect(() => {
    return () => {
      sequenceActiveRef.current = false;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      recognitionRef.current?.stop?.();
    };
  }, []);

  const currentQuestion = questions[currentIndex];
  const currentNumber = startNumber + currentIndex;
  const currentSelectedAnswer = currentQuestion ? userAnswers[currentQuestion.id] : null;
  const currentSubmitted = currentQuestion ? submittedAnswers[currentQuestion.id]?.submitted : false;

  const support = useMemo(() => ({
    speech: typeof window !== "undefined" && "speechSynthesis" in window,
    recognition: typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition)
  }), []);

  const stopAll = () => {
    sequenceActiveRef.current = false;
    if (support.speech) window.speechSynthesis.cancel();
    recognitionRef.current?.stop?.();
    setIsSpeaking(false);
    setIsListening(false);
  };

  const speakText = (text, onEnd) => {
    if (!support.speech) {
      toast.error("Seu navegador não suporta leitura por voz.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      sequenceActiveRef.current = false;
      toast.error("Não foi possível ler a questão em voz alta.");
    };
    window.speechSynthesis.speak(utterance);
  };

  const handleSpeakCurrent = () => {
    if (!currentQuestion) return;
    sequenceActiveRef.current = false;
    speakText(buildNarration(currentQuestion, currentNumber));
  };

  const handleSpeakAll = () => {
    if (!questions.length) return;
    sequenceActiveRef.current = true;

    const speakSequence = (index) => {
      if (!sequenceActiveRef.current || index >= questions.length) {
        sequenceActiveRef.current = false;
        setIsSpeaking(false);
        return;
      }

      setCurrentIndex(index);
      speakText(buildNarration(questions[index], startNumber + index), () => speakSequence(index + 1));
    };

    speakSequence(currentIndex);
  };

  const handleVoiceAnswer = () => {
    if (!currentQuestion) return;
    if (currentSubmitted) {
      toast.message("Essa questão já foi respondida.");
      return;
    }
    if (isBlocked) {
      toast.error("Você atingiu o limite diário de questões.");
      return;
    }
    if (!support.recognition) {
      toast.error("Seu navegador não suporta resposta por voz.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "pt-BR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      toast.error("Não consegui ouvir sua resposta. Tente novamente.");
    };
    recognition.onresult = async (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setLastTranscript(transcript);
      const detectedOption = findBestOption(currentQuestion, transcript);

      if (!detectedOption) {
        toast.error("Não consegui identificar a alternativa falada.");
        return;
      }

      onAnswerChange(currentQuestion.id, detectedOption);
      await onVoiceSubmit(currentQuestion, detectedOption);
      toast.success(`Resposta identificada: ${detectedOption}`);
    };

    recognition.start();
  };

  if (!questions.length) return null;

  return (
    <Card className="border-purple-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-purple-600" />
          Simulado por Voz
        </CardTitle>
        <CardDescription>
          Ouça a questão atual ou a página inteira e responda falando a alternativa completa.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Questão {currentNumber} de {startNumber + questions.length - 1}</Badge>
          {currentSelectedAnswer && <Badge className="bg-blue-100 text-blue-700">Marcada: {currentSelectedAnswer}</Badge>}
          {currentSubmitted && <Badge className="bg-green-100 text-green-700">Respondida</Badge>}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-medium text-slate-900 mb-1">Como usar</p>
            <p>Escolha a questão, toque em ouvir e depois use “Responder por voz” para falar a alternativa completa.</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-medium text-slate-900 mb-1">Compatibilidade</p>
            <p>É preciso liberar o microfone no navegador para o modo de resposta por voz funcionar.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))} disabled={currentIndex === 0 || isSpeaking}>
            <ChevronLeft className="w-4 h-4 mr-2" />Anterior
          </Button>
          <Button variant="outline" onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))} disabled={currentIndex === questions.length - 1 || isSpeaking}>
            <ChevronRight className="w-4 h-4 mr-2" />Próxima
          </Button>
          <Button onClick={handleSpeakCurrent} disabled={isListening} className="bg-purple-600 hover:bg-purple-700">
            <Play className="w-4 h-4 mr-2" />Ouvir atual
          </Button>
          <Button variant="outline" onClick={handleSpeakAll} disabled={isListening}>
            <Volume2 className="w-4 h-4 mr-2" />Ouvir página
          </Button>
          <Button variant="outline" onClick={handleVoiceAnswer} disabled={isSpeaking || isListening || currentSubmitted || isBlocked}>
            <Mic className="w-4 h-4 mr-2" />{isListening ? "Ouvindo..." : "Responder por voz"}
          </Button>
          <Button variant="outline" onClick={stopAll} disabled={!isSpeaking && !isListening}>
            <Square className="w-4 h-4 mr-2" />Parar
          </Button>
        </div>

        {lastTranscript && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <span className="font-medium">Última resposta ouvida:</span> {lastTranscript}
          </div>
        )}
      </CardContent>
    </Card>
  );
}