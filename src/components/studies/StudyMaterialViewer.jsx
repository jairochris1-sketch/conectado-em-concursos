import { X } from 'lucide-react';
import PdfViewer from './PdfViewer';

export default function StudyMaterialViewer({ material, isOpen, onClose }) {
  if (!isOpen || !material) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="flex-1 flex flex-col bg-white">
         {/* Minimal Header */}
         <div className="flex justify-between items-center p-3 border-b border-gray-200">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
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