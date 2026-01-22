import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { SiteContent } from '@/entities/SiteContent';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { LogIn, UserPlus, Loader2, BookOpen, BarChart3, Calendar, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WelcomePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState({
    title: "Conectado em Concursos Públicos SE",
    subtitle: "Sua jornada para a aprovação começa aqui.",
    main_text: "Plataforma completa de estudos com milhares de questões, simulados, estatísticas e muito mais!",
    secondary_text: "Cadastre-se gratuitamente e tenha acesso a 20 questões por dia.",
    background_image_url: ""
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthenticated = await base44.auth.isAuthenticated();
        if (isAuthenticated) {
          navigate(createPageUrl('Dashboard'));
        }
      } catch (error) {
        // Usuário não autenticado, continua na página de boas-vindas
      }
    };
    checkAuth();

    const fetchContent = async () => {
      try {
        const contentData = await SiteContent.filter({ page_key: 'welcome_page' });
        if (contentData && contentData.length > 0) {
          setContent(contentData[0]);
        }
      } catch (error) {
        console.error("Erro ao carregar conteúdo da página:", error);
      }
    };
    fetchContent();
  }, [navigate]);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await base44.auth.redirectToLogin(createPageUrl('Dashboard'));
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    setIsLoading(true);
    try {
      await base44.auth.redirectToLogin(createPageUrl('Dashboard'));
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      setIsLoading(false);
    }
  };
  
  const backgroundStyle = content.background_image_url 
    ? { 
        backgroundImage: `url(${content.background_image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } 
    : {};

  const getFontStyle = (fontType) => {
    const fonts = {
      'sans-serif': 'sans-serif',
      'serif': 'serif',
      'monospace': 'monospace',
      'arial': 'Arial, sans-serif',
      'verdana': 'Verdana, sans-serif',
      'lato': 'Lato, sans-serif'
    };
    return fonts[fontType] || 'sans-serif';
  };

  return (
    <div 
      className={`min-h-screen flex flex-col items-center justify-center p-4 ${!content.background_image_url ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700' : ''}`}
      style={backgroundStyle}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c0cbbbdc46b91cef9a4fd7/63462b910_logopng.png"
          alt="Logo Conectado em Concursos"
          className="w-24 h-24 mx-auto mb-6 object-contain drop-shadow-2xl"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-4xl"
      >
        <Card className="shadow-2xl border-0 rounded-2xl overflow-hidden bg-white dark:bg-gray-900">
          <div className="p-8 md:p-12 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4" style={{ fontFamily: getFontStyle(content.title_font) }}>
              {content.title}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-2" style={{ fontFamily: getFontStyle(content.subtitle_font) }}>
              {content.subtitle}
            </p>
            <div className="flex items-center justify-center gap-1 mb-6">
              <span className="text-2xl">⭐⭐⭐⭐⭐</span>
            </div>
          </div>

          <CardContent className="px-8 md:px-12 pb-8">
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6 text-center" style={{ fontFamily: getFontStyle(content.main_text_font) }}>
              {content.main_text}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Milhares de Questões</p>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Estatísticas Detalhadas</p>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Cronograma de Estudos</p>
              </div>
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-amber-600 dark:text-amber-400" />
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Simulados Personalizados</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 mb-8 border-2 border-blue-200 dark:border-blue-800">
              <p className="text-center text-lg font-semibold text-gray-800 dark:text-gray-200" style={{ fontFamily: getFontStyle(content.secondary_text_font) }}>
                {content.secondary_text}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="text-lg font-semibold shadow-lg bg-blue-600 hover:bg-blue-700 text-white px-8"
                onClick={handleSignup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-5 h-5 mr-2" />
                )}
                Cadastrar Gratuitamente
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="text-lg font-semibold shadow-lg border-2 px-8"
                onClick={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <LogIn className="w-5 h-5 mr-2" />
                )}
                Já tenho conta
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-white text-sm mt-8 text-center"
      >
        © 2025 Conectado em Concursos SE - Todos os direitos reservados
      </motion.p>
    </div>
  );
}