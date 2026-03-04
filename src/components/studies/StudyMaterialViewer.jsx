import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, FileText, Image, Moon, Sun, Download, WifiOff, BookOpen, Save, Check, Maximize, Minimize } from 'lucide-react';
import { User } from '@/entities/User';
import { Textarea } from '@/components/ui/textarea';

export default function StudyMaterialViewer({ material, isOpen, onClose }) {
  const [darkMode, setDarkMode] = useState(false);
  const [userPlan, setUserPlan] = useState('gratuito');
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    const loadUserPlan = async () => {
      try {
        const user = await User.me();
        setUserPlan(user?.current_plan || 'gratuito');
      } catch (error) {
        console.error('Erro ao carregar plano do usuário:', error);
      } finally {
        setIsLoadingUser(false);
      }
    };

    if (isOpen) {
      loadUserPlan();
    }
  }, [isOpen]);

  useEffect(() => {
    if (material && isOpen) {
      if ('caches' in window) {
        caches.match(material.file_url).then(res => {
          setIsOfflineReady(!!res);
        });
      }
      
      const savedNotes = localStorage.getItem(`material_notes_${material.id}`);
      setNotes(savedNotes || '');
      
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = material.file_url;
      link.as = material.file_type === 'pdf' ? 'document' : 'image';
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [material, isOpen]);

  const handleNotesChange = (e) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    localStorage.setItem(`material_notes_${material.id}`, newNotes);
    setSaveStatus('Salvo');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  const canDownload = userPlan === 'avancado';

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = material.file_url;
    link.download = material.file_name || 'material';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMakeOffline = async () => {
    if (!('caches' in window)) {
      alert('Seu navegador não suporta leitura offline.');
      return;
    }
    try {
      const cache = await caches.open('offline-materials');
      await cache.add(material.file_url);
      setIsOfflineReady(true);
      alert('Material salvo para leitura offline!');
    } catch (err) {
      console.error('Erro ao salvar offline:', err);
      alert('Não foi possível salvar o material para leitura offline.');
    }
  };
  
  if (!isOpen || !material) return null;

  const getPdfViewerUrl = (pdfUrl) => {
    if (!navigator.onLine || isOfflineReady) {
      return pdfUrl; 
    }
    return `https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className={`flex-1 flex flex-col lg:flex-row ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="flex-1 flex flex-col min-w-0">
          <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-4 md:p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex-1 min-w-0">
              <h2 className={`text-lg md:text-xl font-bold mb-1 line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {material.title}
              </h2>
              <p className={`text-xs md:text-sm line-clamp-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {material.description}
              </p>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 self-end sm:self-auto">
              <Button
                variant={isOfflineReady ? 'default' : 'outline'}
                size="icon"
                onClick={handleMakeOffline}
                className={isOfflineReady ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}
                title={isOfflineReady ? 'Disponível offline' : 'Salvar para leitura offline'}
              >
                <WifiOff className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              <Button
                variant={canDownload ? 'default' : 'outline'}
                size="icon"
                onClick={handleDownload}
                disabled={!canDownload || isLoadingUser}
                className={canDownload ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                title={canDownload ? 'Baixar material' : 'Disponível apenas para plano Avançado'}
              >
                <Download className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              <Button
                variant={showNotes ? 'default' : 'outline'}
                size="icon"
                onClick={() => setShowNotes(!showNotes)}
                className={showNotes ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                title="Anotações"
              >
                <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(true)}
                className={darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
                title="Tela Cheia"
              >
                <Maximize className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDarkMode(!darkMode)}
                className={darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
                title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
              >
                {darkMode ? <Sun className="w-4 h-4 md:w-5 md:h-5" /> : <Moon className="w-4 h-4 md:w-5 md:h-5" />}
              </Button>
              <button
                onClick={onClose}
                className={`p-2 ml-1 md:ml-2 rounded-full ${darkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
          </div>

          <div className={`flex-1 overflow-auto p-4 md:p-6 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            {material.file_type === 'pdf' ? (
              <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden">
                <iframe
                  src={getPdfViewerUrl(material.file_url)}
                  width="100%"
                  height="100%"
                  className="border-0 flex-1"
                  title={material.title}
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <img
                  src={material.file_url}
                  alt={material.title}
                  className="max-w-full max-h-full mx-auto rounded-lg shadow-lg object-contain"
                  style={{ maxHeight: '80vh' }}
                />
                <div className={`mt-6 p-4 rounded-lg flex items-center justify-center w-full max-w-md ${darkMode ? 'bg-gray-700' : 'bg-white shadow-sm'}`}>
                  <div className="text-center">
                    <Image className={`w-8 h-8 mx-auto mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Visualizando: {material.file_name}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {showNotes && (
          <div className={`w-full lg:w-96 border-t lg:border-t-0 lg:border-l flex flex-col ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
            <div className={`p-4 border-b flex items-center justify-between ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                <FileText className="w-4 h-4" />
                Anotações Avançadas
              </h3>
              {saveStatus && (
                <span className="text-xs font-medium text-green-500 flex items-center gap-1">
                  <Check className="w-3 h-3" /> {saveStatus}
                </span>
              )}
            </div>
            <div className="flex-1 p-4 flex flex-col">
              <Textarea
                value={notes}
                onChange={handleNotesChange}
                placeholder="Faça suas anotações sobre este material aqui... Elas são salvas automaticamente no seu navegador e estarão disponíveis mesmo offline."
                className={`flex-1 resize-none border-0 focus-visible:ring-0 p-0 text-sm ${darkMode ? 'bg-gray-900 text-gray-200 placeholder:text-gray-600' : 'bg-white text-gray-800 placeholder:text-gray-400'}`}
              />
            </div>
            <div className={`p-4 border-t text-xs ${darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-500'}`}>
              <p className="flex items-center gap-2 mb-2">
                <Save className="w-3 h-3" /> Salvo localmente
              </p>
              As anotações ficam armazenadas no seu dispositivo.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}