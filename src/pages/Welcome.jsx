import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/entities/User';
import { SiteContent } from '@/entities/SiteContent';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Rocket, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WelcomePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState({
    title: "Seja Bem-vindo!",
    subtitle: "Sua jornada para a aprovação começa agora.",
    main_text: "Você está prestes a entrar em uma plataforma completa, projetada para te ajudar a alcançar seus objetivos.",
    secondary_text: "Explore questões, acompanhe suas estatísticas, monte seu cronograma e muito mais!",
    background_image_url: ""
  });

  useEffect(() => {
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
  }, []);

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      // Ativa o período de teste de 10 dias no plano avançado
      await User.updateMyUserData({ 
        onboarding_complete: true,
        current_plan: 'avancado', // Set the plan to 'avancado' for the trial
        trial_start_date: new Date().toISOString(), // Record the trial start date
        trial_used: true // Mark trial as used
      });
      navigate(createPageUrl('Dashboard'));
    } catch (error) {
      console.error("Erro ao atualizar status do usuário:", error);
      // Mesmo se falhar, navega para o dashboard para não prender o usuário
      navigate(createPageUrl('Dashboard'));
    }
    setIsLoading(false);
  };
  
  const backgroundStyle = content.background_image_url 
    ? { 
        backgroundImage: `url(${content.background_image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } 
    : {};

  const getFontFamily = (fontType) => {
    const fonts = {
      'sans-serif': 'font-sans',
      'serif': 'font-serif',
      'monospace': 'font-mono'
    };
    return fonts[fontType] || 'font-sans';
  };

  return (
    <div 
      className={`min-h-screen flex items-center justify-center p-4 ${!content.background_image_url ? 'bg-gradient-to-br from-blue-50 via-white to-indigo-50' : ''}`}
      style={backgroundStyle}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-black bg-opacity-20 backdrop-blur-sm rounded-2xl"
      >
        <Card className="max-w-lg w-full shadow-2xl border-0 rounded-2xl overflow-hidden bg-transparent text-white">
          <div className="p-8 text-center">
             <img 
               src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c0cbbbdc46b91cef9a4fd7/c4db9e5bf_logopng.png"
               alt="Logo Conectado em Concursos"
               className="w-16 h-16 mx-auto mb-4 object-contain"
             />
             <h1 className={`text-3xl font-extrabold ${getFontFamily(content.title_font)}`}>{content.title}</h1>
             <p className={`mt-2 opacity-90 ${getFontFamily(content.subtitle_font)}`}>{content.subtitle}</p>
           </div>
           <CardContent className="p-8 text-center pt-0">
             <p className={`text-lg leading-relaxed ${getFontFamily(content.main_text_font)}`}>
               {content.main_text}
             </p>
             <p className={`mt-4 ${getFontFamily(content.secondary_text_font)}`}>
               {content.secondary_text}
             </p>
           </CardContent>
          <CardFooter className="p-6 flex justify-center">
            <Button
              size="lg"
              className="w-full max-w-xs text-lg font-semibold shadow-lg"
              style={{
                backgroundColor: content.button_color || '#ffffff',
                color: content.button_text_color || '#2563eb'
              }}
              onMouseEnter={(e) => {
                e.target.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.target.style.opacity = '1';
              }}
              onClick={handleContinue}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <Rocket className="w-5 h-5 mr-2" />
                  Começar a Estudar
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}