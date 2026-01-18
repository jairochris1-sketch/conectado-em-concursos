import { X, Maximize2 } from 'lucide-react';
import PdfViewer from './PdfViewer';

export default function StudyMaterialViewer({ material, isOpen, onClose }) {
  if (!isOpen || !material) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="flex flex-col bg-white rounded-lg shadow-2xl w-full h-[95vh] max-w-6xl">
         {/* Header com título */}
         <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-800 flex-1">{material.title}</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 ml-2"
              aria-label="Fechar"
            >
              <X className="w-6 h-6" />
            </button>
         </div>

        {/* Content Viewer */}
         <div className="flex-1 overflow-hidden bg-gray-100">
          {material.file_type === 'pdf' ? (
            <PdfViewer pdfUrl={material.file_url} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={material.file_url}
                alt={material.title}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
         </div>
      </div>
    </div>
  );
}