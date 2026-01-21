import React, { useState, useEffect } from 'react';
import { MaterialNote } from '@/entities/all';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Trash2, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

const highlightColors = {
  yellow: 'bg-yellow-200 dark:bg-yellow-700',
  green: 'bg-green-200 dark:bg-green-700',
  blue: 'bg-blue-200 dark:bg-blue-700',
  pink: 'bg-pink-200 dark:bg-pink-700',
  orange: 'bg-orange-200 dark:bg-orange-700'
};

export default function MaterialNotesPanel({ materialId, isOpen, onClose }) {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [highlightColor, setHighlightColor] = useState('yellow');
  const [selectedPage, setSelectedPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && materialId) {
      loadNotes();
    }
  }, [isOpen, materialId]);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const fetchedNotes = await MaterialNote.filter({ material_id: materialId });
      setNotes(fetchedNotes);
    } catch (error) {
      console.error('Erro ao carregar anotações:', error);
    }
    setIsLoading(false);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      await MaterialNote.create({
        material_id: materialId,
        content: newNote,
        highlight_color: highlightColor,
        page: selectedPage
      });
      setNewNote('');
      await loadNotes();
    } catch (error) {
      console.error('Erro ao adicionar anotação:', error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm('Deseja deletar esta anotação?')) {
      try {
        await MaterialNote.delete(noteId);
        await loadNotes();
      } catch (error) {
        console.error('Erro ao deletar anotação:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 400 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 400 }}
      className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-xl z-40 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Anotações</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <p className="text-gray-500 text-center">Carregando...</p>
        ) : notes.length === 0 ? (
          <p className="text-gray-500 text-center text-sm">Nenhuma anotação ainda</p>
        ) : (
          notes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-lg border-l-4 ${highlightColors[note.highlight_color]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">{note.content}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Página {note.page || 1}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteNote(note.id)}
                  className="h-6 w-6 flex-shrink-0"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Note Form */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-2">
            Cor do destaque
          </label>
          <div className="flex gap-2">
            {Object.keys(highlightColors).map((color) => (
              <button
                key={color}
                onClick={() => setHighlightColor(color)}
                className={`w-6 h-6 rounded-full border-2 ${
                  highlightColor === color ? 'border-gray-900 dark:border-white' : 'border-gray-300'
                } ${highlightColors[color]}`}
              />
            ))}
          </div>
        </div>

        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Escreva sua anotação..."
          className="text-sm"
          rows={3}
        />

        <Button onClick={handleAddNote} className="w-full bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Anotação
        </Button>
      </div>
    </motion.div>
  );
}