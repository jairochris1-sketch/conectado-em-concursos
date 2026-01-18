import { useState } from 'react';
import { X, FileText, Image } from 'lucide-react';

export default function StudyMaterialViewer({ material, isOpen, onClose }) {
  if (!isOpen || !material) return null;

  const getPdfViewerUrl = (pdfUrl) => {
    return `https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className={`flex-1 flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
         {/* Minimal Header */}
         <div className={`flex justify-between items-center p-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
           <button
             onClick={onClose}
             className={`p-2 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
             aria-label="Fechar"
           >
             <X className="w-6 h-6" />
           </button>
         </div>

        {/* Content Viewer */}
         <div className="flex-1 overflow-auto bg-white">
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
                className="w-full h-full object-contain"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}