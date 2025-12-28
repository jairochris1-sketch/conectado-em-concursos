
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Youtube, Wand2, Loader2, AlertTriangle, FileText, Copy, Brain, HelpCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client'; // Replaced old import with new SDK import
import ReactMarkdown from 'react-markdown';

// Componente para exibir um flashcard individual
const Flashcard = ({ front, back }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    return (
        <div 
            className="p-4 border rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <p className="font-semibold text-gray-800 dark:text-gray-200">{isFlipped ? back : front}</p>
        </div>
    );
};

// Componente para exibir uma questão de múltipla escolha
const QuestionItem = ({ question, index }) => {
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const isSubmitted = selectedAnswer !== null;
    
    return (
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <p className="font-semibold mb-3 text-gray-900 dark:text-white">Questão {index + 1}: {question.statement}</p>
            <div className="space-y-2 mb-4">
                {question.options.map(opt => (
                    <Button
                        key={opt.letter}
                        variant="outline"
                        className={`w-full justify-start text-left h-auto py-2 px-3 whitespace-normal
                            ${isSubmitted && opt.letter === question.correct_answer ? 'bg-green-100 border-green-400 text-green-800 dark:bg-green-900/50 dark:border-green-700 dark:text-white' : ''}
                            ${isSubmitted && selectedAnswer === opt.letter && opt.letter !== question.correct_answer ? 'bg-red-100 border-red-400 text-red-800 dark:bg-red-900/50 dark:border-red-700 dark:text-white' : ''}
                            ${!isSubmitted ? 'hover:bg-gray-100 dark:hover:bg-gray-600' : ''}
                        `}
                        onClick={() => setSelectedAnswer(opt.letter)}
                        disabled={isSubmitted}
                    >
                        <span className="font-bold mr-2">{opt.letter})</span> {opt.text}
                    </Button>
                ))}
            </div>
            {isSubmitted && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/50 border-l-4 border-blue-400 rounded-r-lg">
                    <p><strong>Resposta Correta: {question.correct_answer}</strong></p>
                    <p className="text-sm mt-1">{question.explanation}</p>
                </div>
            )}
        </div>
    );
};


export default function VideoAnalysisPage() {
    const [videoUrl, setVideoUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        if (!videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) {
            setError('Por favor, insira uma URL válida do YouTube.');
            return;
        }
        setError('');
        setIsAnalyzing(true);
        setAnalysisResult(null);

        try {
            // Updated function call to use base44 SDK
            const response = await base44.functions.invoke('analyzeYoutubeVideo', { videoUrl });
            
            if (response.data?.success) {
                setAnalysisResult(response.data.data);
            } else {
                throw new Error(response.data?.error || 'Ocorreu um erro desconhecido durante a análise.');
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Falha ao analisar o vídeo. Tente novamente.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8 text-center">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white flex items-center justify-center gap-3">
                        <Youtube className="w-10 h-10 text-red-500" />
                        Análise de Vídeos com IA
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">Transforme videoaulas do YouTube em resumos, flashcards e questões.</p>
                </header>

                <Card className="bg-white dark:bg-gray-800 shadow-xl border-0">
                    <CardHeader>
                        <CardTitle>Analisar Vídeo do YouTube</CardTitle>
                        <CardDescription>Cole o link do vídeo que você deseja analisar e deixe nossa IA fazer o trabalho pesado.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="video-url" className="text-lg font-semibold">Link do Vídeo</Label>
                            <Input
                                id="video-url"
                                type="url"
                                placeholder="https://www.youtube.com/watch?v=..."
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                className="text-base"
                            />
                        </div>

                        <Button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || !videoUrl}
                            className="w-full text-lg bg-indigo-600 hover:bg-indigo-700 text-white"
                            size="lg"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Analisando... Isso pode levar um momento.
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-5 h-5 mr-2" />
                                    Analisar com IA
                                </>
                            )}
                        </Button>

                        {error && (
                            <div className="mt-4 text-center text-red-500 flex items-center justify-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <AlertTriangle className="w-5 h-5" />
                                <p>{error}</p>
                            </div>
                        )}
                        
                        {analysisResult && (
                            <div className="mt-6 border-t pt-6 dark:border-gray-700">
                                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Resultado da Análise</h3>
                                <Tabs defaultValue="summary">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="summary"><FileText className="w-4 h-4 mr-2"/>Resumo</TabsTrigger>
                                        <TabsTrigger value="flashcards"><Brain className="w-4 h-4 mr-2"/>Flashcards</TabsTrigger>
                                        <TabsTrigger value="questions"><HelpCircle className="w-4 h-4 mr-2"/>Questões</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="summary" className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                        <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
                                            {analysisResult.summary}
                                        </ReactMarkdown>
                                    </TabsContent>
                                    <TabsContent value="flashcards" className="mt-4">
                                        <div className="space-y-3">
                                            {analysisResult.flashcards.map((card, index) => (
                                                <Flashcard key={index} front={card.front} back={card.back} />
                                            ))}
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="questions" className="mt-4">
                                       <div className="space-y-4">
                                            {analysisResult.questions.map((q, index) => (
                                                <QuestionItem key={index} question={q} index={index} />
                                            ))}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
