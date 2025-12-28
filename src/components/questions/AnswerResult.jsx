import { Lightbulb, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AnswerResult({ explanation, onDismiss }) {
  if (!explanation) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="mt-4 p-4 border rounded-lg relative shadow-sm text-white"
      style={{ backgroundColor: '#0464fc', borderColor: '#0353d1' }}
    >
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 text-blue-200 hover:text-white transition-colors"
        aria-label="Fechar gabarito"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-yellow-300 mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold text-white mb-2">
            Gabarito Comentado:
          </h4>
          <div 
            className="prose prose-sm max-w-none text-blue-100 prose-strong:text-white prose-p:text-blue-100" 
            dangerouslySetInnerHTML={{ __html: explanation }} 
          />
        </div>
      </div>
    </motion.div>
  );
}