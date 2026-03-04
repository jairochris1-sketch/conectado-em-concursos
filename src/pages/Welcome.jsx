import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/entities/User';
import { SiteContent } from '@/entities/SiteContent';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Rocket, Loader2, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const sergipeCities = [
  "Aracaju","Nossa Senhora do Socorro","Lagarto","Itabaiana","São Cristóvão",
  "Estância","Tobias Barreto","Simão Dias","Propriá","Nossa Senhora das Dores",
  "Itaporanga d'Ajuda","Boquim","Neópolis","Canindé de São Francisco","Poço Redondo",
  "Carira","Aquidabã","Itabi","Nossa Senhora da Glória","Porto da Folha",
  "Frei Paulo","Moita Bonita","Campo do Brito","Areia Branca","Poço Verde",
  "Ribeirópolis","Gararu","Monte Alegre de Sergipe","Pedrinhas","Japaratuba",
  "Laranjeiras","Maruim","Santo Amaro das Brotas","General Maynard","Divina Pastora",
  "Riachuelo","Rosário do Catete","Cumbe","Feira Nova","Gracho Cardoso",
  "Outra cidade"
];

export default function WelcomePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [city, setCity] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [content, setContent] = useState({
    title: "Seja Bem-vindo!",
    subtitle: "Sua jornada para a aprovação começa agora.",
    main_text: "Você está prestes a entrar em uma plataforma completa, projetada para te ajudar a alcançar seus objetivos.",
    secondary_text: "Explore questões, acompanhe suas estatísticas, monte seu cronograma e muito mais!",
    background_image_url: "",
    background_image_url_desktop: "",
    background_images_desktop: [],
    background_image_url_mobile: "",
    card_background_color: "#000000",
    card_opacity: 100,
    background_blur: 0
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const filteredCities = sergipeCities.filter(c =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      await User.updateMyUserData({ 
        onboarding_complete: true,
        current_plan: 'gratuito',
        city: city || undefined,
        state: city ? 'SE' : undefined,
      });
      navigate(createPageUrl('Dashboard'));
    } catch (error) {
      console.error("Erro ao atualizar status do usuário:", error);
      navigate(createPageUrl('Dashboard'));
    }
    setIsLoading(false);
  };
  
  const [bgImage, setBgImage] = useState("");

  useEffect(() => {
    if (!content) return;

    if (isMobile && content.background_image_url_mobile) {
      setBgImage(content.background_image_url_mobile);
      return;
    }
    
    // Desktop: usar rotação de imagens se disponível
    if (!isMobile) {
      const desktopImages = content.background_images_desktop || [];
      if (desktopImages.length > 0) {
        // Escolher imagem aleatória apenas uma vez no carregamento
        const randomIndex = Math.floor(Math.random() * desktopImages.length);
        setBgImage(desktopImages[randomIndex]);
        return;
      }
      if (content.background_image_url_desktop) {
        setBgImage(content.background_image_url_desktop);
        return;
      }
    }
    
    // Fallback para imagem legada
    setBgImage(content.background_image_url || content.background_image_url_desktop || content.background_image_url_mobile);
  }, [content, isMobile]);
  const blurAmount = content.background_blur || 0;

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
      className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${!bgImage ? 'bg-gradient-to-br from-blue-50 via-white to-indigo-50' : ''}`}
    >
      {bgImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${bgImage})`,
            filter: blurAmount > 0 ? `blur(${blurAmount}px)` : 'none',
            transform: blurAmount > 0 ? 'scale(1.1)' : 'none'
          }}
        />
      )}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="backdrop-blur-sm rounded-2xl relative z-10"
        style={{ 
          backgroundColor: (() => {
            let color = content.card_background_color || '#000000';
            const opacity = (content.card_opacity ?? 100) / 100;
            
            // If already rgba, extract rgb values
            const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (rgbaMatch) {
              return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${opacity})`;
            }
            
            // If hex, convert to rgba
            if (color.startsWith('#')) {
              const r = parseInt(color.slice(1, 3), 16);
              const g = parseInt(color.slice(3, 5), 16);
              const b = parseInt(color.slice(5, 7), 16);
              return `rgba(${r}, ${g}, ${b}, ${opacity})`;
            }
            
            return color;
          })()
        }}
      >
        <Card className="max-w-lg w-full shadow-2xl border-0 rounded-2xl overflow-hidden bg-transparent text-white">
          <div className="p-8 text-center">
             <img 
               src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c0cbbbdc46b91cef9a4fd7/c4db9e5bf_logopng.png"
               alt="Logo Conectado em Concursos"
               className="w-16 h-16 mx-auto mb-4 object-contain"
             />
             <h1 className="text-3xl font-extrabold" style={{ fontFamily: getFontStyle(content.title_font) }}>{content.title}</h1>
             <p className="mt-2 opacity-90" style={{ fontFamily: getFontStyle(content.subtitle_font) }}>{content.subtitle}</p>
           </div>
           <CardContent className="p-8 text-center pt-0">
             <p className="text-lg leading-relaxed" style={{ fontFamily: getFontStyle(content.main_text_font) }}>
               {content.main_text}
             </p>
             <p className="mt-4" style={{ fontFamily: getFontStyle(content.secondary_text_font) }}>
               {content.secondary_text}
             </p>

             {/* Cidade de Sergipe */}
             <div className="mt-6 text-left relative">
               <label className="flex items-center gap-1.5 text-sm font-semibold mb-2 text-white/90">
                 <MapPin className="w-4 h-4" /> De qual cidade de Sergipe você é?
               </label>
               <div className="relative">
                 <Input
                   value={city || citySearch}
                   onChange={(e) => {
                     setCitySearch(e.target.value);
                     setCity("");
                     setShowCityDropdown(true);
                   }}
                   onFocus={() => setShowCityDropdown(true)}
                   placeholder="Digite ou selecione sua cidade..."
                   className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:bg-white/20"
                 />
                 {showCityDropdown && citySearch && (
                   <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto border">
                     {filteredCities.map(c => (
                       <button
                         key={c}
                         type="button"
                         onClick={() => { setCity(c); setCitySearch(c); setShowCityDropdown(false); }}
                         className="w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                       >
                         {c}
                       </button>
                     ))}
                     {filteredCities.length === 0 && (
                       <p className="px-3 py-2 text-sm text-gray-500">Nenhuma cidade encontrada</p>
                     )}
                   </div>
                 )}
               </div>
               {city && (
                 <p className="text-xs text-green-300 mt-1">✓ {city}, Sergipe selecionada</p>
               )}
             </div>
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