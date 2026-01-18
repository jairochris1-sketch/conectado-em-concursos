import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Printer, FileText, Image, Moon, Sun } from 'lucide-react';

export default function StudyMaterialViewer({ material, isOpen, onClose }) {
  const [darkMode, setDarkMode] = useState(false);
  
  if (!isOpen || !material) return null;

  const handlePrint = () => {
    window.print();
  };

  const getPdfViewerUrl = (pdfUrl) => {
    return `https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className={`flex-1 flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex justify-between items-center p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex-1">
            <h2 className={`text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {material.title}
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {material.description}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              className={darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
              title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </Button>
            <button
              onClick={onClose}
              className={`p-2 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
         <div className={`flex-1 overflow-auto p-6 md:p-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {material.file_type === 'pdf' ? (
            <div className="w-full h-full flex flex-col">
              <iframe
                src={getPdfViewerUrl(material.file_url)}
                width="100%"
                height="100%"
                className="border rounded-lg flex-1"
                title={material.title}
              />
            </div>
          ) : (
            <div className="w-full h-full">
              <img
                src={material.file_url}
                alt={material.title}
                className="max-w-full max-h-full mx-auto rounded-lg shadow-lg"
                style={{ maxHeight: '80vh' }}
              />
              <div className={`mt-4 p-4 rounded-lg flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="text-center">
                  <Image className={`w-12 h-12 mx-auto mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Visualizando: {material.file_name}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}