import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { StickyNote, Trash2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AnnotationTools({ articleId, darkMode }) {
  const [annotations, setAnnotations] = useState([]);
  const [showNewNote, setShowNewNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [selectedText, setSelectedText] = useState('');

  useEffect(() => {
    loadAnnotations();
  }, [articleId]);

  const loadAnnotations = async () => {
    try {
      const userAnnotations = JSON.parse(localStorage.getItem('articleAnnotations') || '{}');
      setAnnotations(userAnnotations[articleId] || []);
    } catch (error) {
      console.error('Erro ao carregar anotações:', error);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (text) {
      setSelectedText(text);
      setShowNewNote(true);
    }
  };

  const saveAnnotation = () => {
    if (!newNoteContent.trim()) return;

    const annotation = {
      id: Date.now().toString(),
      content: newNoteContent,
      selectedText: selectedText,
      timestamp: new Date().toISOString()
    };

    const userAnnotations = JSON.parse(localStorage.getItem('articleAnnotations') || '{}');
    userAnnotations[articleId] = [...(userAnnotations[articleId] || []), annotation];
    localStorage.setItem('articleAnnotations', JSON.stringify(userAnnotations));

    setAnnotations(userAnnotations[articleId]);
    setNewNoteContent('');
    setSelectedText('');
    setShowNewNote(false);
  };

  const deleteAnnotation = (annotationId) => {
    const userAnnotations = JSON.parse(localStorage.getItem('articleAnnotations') || '{}');
    userAnnotations[articleId] = (userAnnotations[articleId] || []).filter(a => a.id !== annotationId);
    localStorage.setItem('articleAnnotations', JSON.stringify(userAnnotations));
    setAnnotations(userAnnotations[articleId] || []);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          <StickyNote className="w-4 h-4" />
          Minhas Anotações
        </h3>
        <Button size="sm" variant="outline" onClick={() => setShowNewNote(!showNewNote)}>
          Nova Nota
        </Button>
      </div>

      {showNewNote && (
        <Card className={`p-4 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-yellow-50 border-yellow-200'}`}>
          {selectedText && (
            <div className={`text-xs mb-2 p-2 rounded ${darkMode ? 'bg-gray-600' : 'bg-yellow-100'}`}>
              <strong>Texto selecionado:</strong> "{selectedText}"
            </div>
          )}
          <Textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Digite sua anotação..."
            rows={3}
            className={darkMode ? 'bg-gray-600 text-white border-gray-500' : ''}
          />
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={saveAnnotation}>Salvar</Button>
            <Button size="sm" variant="outline" onClick={() => {
              setShowNewNote(false);
              setNewNoteContent('');
              setSelectedText('');
            }}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {annotations.map(annotation => (
          <Card key={annotation.id} className={`p-3 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-yellow-50 border-yellow-200'}`}>
            {annotation.selectedText && (
              <div className={`text-xs mb-2 p-2 rounded italic ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-yellow-100 text-gray-700'}`}>
                "{annotation.selectedText}"
              </div>
            )}
            <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{annotation.content}</p>
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {new Date(annotation.timestamp).toLocaleDateString('pt-BR')}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => deleteAnnotation(annotation.id)}
              >
                <Trash2 className="w-3 h-3 text-red-500" />
              </Button>
            </div>
          </Card>
        ))}
        {annotations.length === 0 && (
          <p className={`text-sm text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Nenhuma anotação ainda. Selecione um texto ou clique em "Nova Nota".
          </p>
        )}
      </div>
    </div>
  );
}