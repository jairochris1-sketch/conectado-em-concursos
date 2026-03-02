import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, PlayCircle, FileText, BookOpen, Loader2, Sparkles, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SmartRecommendations() {
  const [recommendations, setRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const { data } = await base44.functions.invoke('getSmartRecommendations');
        setRecommendations(data);
      } catch (error) {
        console.error("Erro ao buscar recomendações:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (isLoading) {
    return (
      <Card className="shadow-lg border-indigo-200 bg-indigo-50/30 overflow-hidden relative">
        <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px]">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Brain className="w-32 h-32 text-indigo-500" />
          </div>
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <h3 className="text-lg font-medium text-indigo-900 z-10">A IA está analisando seu perfil...</h3>
          <p className="text-sm text-indigo-700 mt-2 z-10 text-center max-w-sm">
            Cruzando seus acertos, erros e cronograma para montar as melhores sugestões de estudo.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || (!recommendations.videos?.length && !recommendations.artigos?.length && !recommendations.materiais?.length)) {
    return null; // Don't show if nothing to recommend
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="shadow-lg border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 overflow-hidden relative">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        
        <CardHeader className="relative z-10 pb-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center">
              <Sparkles className="w-3 h-3 mr-1" /> IA Recommendations
            </span>
          </div>
          <CardTitle className="text-xl font-bold text-indigo-950 flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-600" />
            Tutor Inteligente
          </CardTitle>
          <CardDescription className="text-indigo-800/80 font-medium italic mt-2 border-l-4 border-indigo-300 pl-3">
            "{recommendations.mensagem || 'Separamos alguns materiais baseados nos seus pontos fracos e próximos estudos.'}"
          </CardDescription>
        </CardHeader>
        
        <CardContent className="relative z-10 space-y-6 pt-4">
          
          {/* Vídeos */}
          {recommendations.videos && recommendations.videos.length > 0 && (
            <div className="space-y-3">
              <h4 className="flex items-center text-sm font-bold text-gray-800 uppercase tracking-wider">
                <PlayCircle className="w-4 h-4 mr-2 text-red-500" /> Videoaulas Sugeridas
              </h4>
              <div className="grid gap-3">
                {recommendations.videos.map((video, idx) => (
                  <div key={idx} className="bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{video.title}</h5>
                        <p className="text-xs font-medium text-indigo-600 mb-2">{video.subject}</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{video.justificativa}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="shrink-0 ml-4 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700" onClick={() => navigate(createPageUrl("Studies"))}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Materiais */}
          {recommendations.materiais && recommendations.materiais.length > 0 && (
            <div className="space-y-3">
              <h4 className="flex items-center text-sm font-bold text-gray-800 uppercase tracking-wider">
                <FileText className="w-4 h-4 mr-2 text-blue-500" /> PDFs & Resumos
              </h4>
              <div className="grid gap-3">
                {recommendations.materiais.map((mat, idx) => (
                  <div key={idx} className="bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">{mat.title}</h5>
                        <p className="text-xs font-medium text-blue-600 mb-2">{mat.type || mat.subjects?.[0]}</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{mat.justificativa}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="shrink-0 ml-4 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700" onClick={() => navigate(createPageUrl("Studies"))}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Artigos */}
          {recommendations.artigos && recommendations.artigos.length > 0 && (
            <div className="space-y-3">
              <h4 className="flex items-center text-sm font-bold text-gray-800 uppercase tracking-wider">
                <BookOpen className="w-4 h-4 mr-2 text-green-500" /> Artigos
              </h4>
              <div className="grid gap-3">
                {recommendations.artigos.map((art, idx) => (
                  <div key={idx} className="bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-1">{art.title}</h5>
                        <p className="text-xs font-medium text-green-600 mb-2">{art.subject}</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{art.justificativa}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="shrink-0 ml-4 rounded-full bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700" onClick={() => navigate(createPageUrl("Studies"))}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
        </CardContent>
      </Card>
    </motion.div>
  );
}