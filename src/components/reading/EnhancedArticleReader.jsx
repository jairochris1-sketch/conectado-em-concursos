import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  X,
  Moon,
  Sun,
  Maximize2,
  Minimize2,
  Type,
  AlignJustify,
  FileText,
  Highlighter,
  Trash2,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const subjectNames = {
  portugues: "Português",
  matematica: "Matemática",
  direito_constitucional: "Direito Constitucional",
  direito_administrativo: "Direito Administrativo",
  direito_penal: "Direito Penal",
  direito_civil: "Direito Civil",
  informatica: "Informática",
  conhecimentos_gerais: "Conhecimentos Gerais",
  raciocinio_logico: "Raciocínio Lógico",
  contabilidade: "Contabilidade",
  pedagogia: "Pedagogia",
  lei_8112: "Lei 8.112/90",
  lei_8666: "Lei 8.666/93",
  lei_14133: "Lei 14.133/21",
  constituicao_federal: "Constituição Federal"
};

export default function EnhancedArticleReader({ article, isOpen, onClose }) {
  const [darkMode, setDarkMode] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const [fontSize, setFontSize] = useState('medium');
  const [lineSpacing, setLineSpacing] = useState('normal');
  const [highlights, setHighlights] = useState([]);
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState('');
  const [showNotes, setShowNotes] = useState(true);
  const [selectedColor, setSelectedColor] = useState('#ffeb3b');

  const highlightColors = [
    { name: 'Amarelo', color: '#ffeb3b' },
    { name: 'Verde', color: '#4caf50' },
    { name: 'Azul', color: '#2196f3' },
    { name: 'Rosa', color: '#e91e63' },
    { name: 'Laranja', color: '#ff9800' }
  ];

  const fontSizes = {
    small: '14px',
    medium: '16px',
    large: '18px',
    xlarge: '20px'
  };

  const lineSpacings = {
    compact: '1.4',
    normal: '1.6',
    relaxed: '1.8',
    loose: '2.0'
  };

  // Carregar dados salvos do artigo
  useEffect(() => {
    if (article) {
      const savedHighlights = localStorage.getItem(`article_highlights_${article.id}`);
      const savedNotes = localStorage.getItem(`article_notes_${article.id}`);
      
      if (savedHighlights) setHighlights(JSON.parse(savedHighlights));
      if (savedNotes) setNotes(JSON.parse(savedNotes));
    }
  }, [article]);

  // Salvar highlights
  const saveHighlights = (newHighlights) => {
    setHighlights(newHighlights);
    localStorage.setItem(`article_highlights_${article.id}`, JSON.stringify(newHighlights));
  };

  // Salvar notas
  const saveNotes = (newNotes) => {
    setNotes(newNotes);
    localStorage.setItem(`article_notes_${article.id}`, JSON.stringify(newNotes));
  };

  // Adicionar destaque
  const handleHighlight = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text) {
      const newHighlight = {
        id: Date.now(),
        text,
        color: selectedColor,
        timestamp: new Date().toISOString()
      };
      
      saveHighlights([...highlights, newHighlight]);
      selection.removeAllRanges();
    }
  };

  // Adicionar nota
  const handleAddNote = () => {
    if (currentNote.trim()) {
      const newNote = {
        id: Date.now(),
        content: currentNote,
        timestamp: new Date().toISOString()
      };
      
      saveNotes([...notes, newNote]);
      setCurrentNote('');
    }
  };

  // Deletar highlight
  const deleteHighlight = (id) => {
    saveHighlights(highlights.filter(h => h.id !== id));
  };

  // Deletar nota
  const deleteNote = (id) => {
    saveNotes(notes.filter(n => n.id !== id));
  };

  // Exportar anotações
  const handleExportNotes = () => {
    const content = `
ANOTAÇÕES - ${article.title}
${article.author ? `Autor: ${article.author}` : ''}
Disciplina: ${subjectNames[article.subject] || article.subject}
Data: ${new Date().toLocaleDateString('pt-BR')}

────────────────────────────────────────

DESTAQUES:
${highlights.map(h => `• ${h.text}`).join('\n\n')}

────────────────────────────────────────

NOTAS:
${notes.map(n => `${new Date(n.timestamp).toLocaleString('pt-BR')}\n${n.content}`).join('\n\n─────────\n\n')}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `anotacoes-${article.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen || !article) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 overflow-hidden">
      <div className="h-full flex">
        {/* Main Content */}
        <div className={`flex-1 flex flex-col ${showNotes ? '' : 'mr-0'}`}>
          {/* Header com controles */}
          {!readingMode && (
            <div className={`border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="max-w-5xl mx-auto px-4 md:px-6 py-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Tamanho da fonte */}
                    <Select value={fontSize} onValueChange={setFontSize}>
                      <SelectTrigger className="w-[100px] h-8">
                        <Type className="w-3 h-3 mr-1" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Pequena</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="large">Grande</SelectItem>
                        <SelectItem value="xlarge">Muito Grande</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Espaçamento entre linhas */}
                    <Select value={lineSpacing} onValueChange={setLineSpacing}>
                      <SelectTrigger className="w-[110px] h-8">
                        <AlignJustify className="w-3 h-3 mr-1" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Compacto</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="relaxed">Relaxado</SelectItem>
                        <SelectItem value="loose">Amplo</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Cor do destaque */}
                    <div className="flex items-center gap-1 border rounded-lg px-2 h-8">
                      {highlightColors.map(({ color }) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`w-5 h-5 rounded-full border-2 transition-all ${
                            selectedColor === color ? 'border-gray-900 dark:border-white scale-110' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          title="Cor do destaque"
                        />
                      ))}
                    </div>

                    {/* Destacar texto */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleHighlight}
                      className="h-8"
                      title="Destacar texto selecionado"
                    >
                      <Highlighter className="w-3 h-3 mr-1" />
                      Destacar
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Modo escuro */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDarkMode(!darkMode)}
                      className="h-8"
                      title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
                    >
                      {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </Button>

                    {/* Modo de leitura */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setReadingMode(!readingMode)}
                      className="h-8"
                      title="Modo de Leitura"
                    >
                      {readingMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>

                    {/* Toggle painel de notas */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowNotes(!showNotes)}
                      className="h-8"
                      title={showNotes ? 'Ocultar Notas' : 'Mostrar Notas'}
                    >
                      {showNotes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>

                    {/* Fechar */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onClose}
                      className="h-8"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Artigo */}
          <div className={`flex-1 overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
              {readingMode && (
                <button
                  onClick={() => setReadingMode(false)}
                  className={`fixed top-4 right-4 z-10 p-2 rounded-full ${
                    darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
                  } shadow-lg hover:scale-110 transition-transform`}
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
              )}

              <article className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6 md:p-10`}>
                <div className="mb-6">
                  <h1
                    className={`font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}
                    style={{ fontSize: `calc(${fontSizes[fontSize]} * 1.5)` }}
                  >
                    {article.title}
                  </h1>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      {subjectNames[article.subject] || article.subject}
                    </Badge>
                    {article.topic && (
                      <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                        {article.topic}
                      </Badge>
                    )}
                    {article.author && (
                      <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                        {article.author}
                      </Badge>
                    )}
                    {article.reading_time && (
                      <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">
                        {article.reading_time} min
                      </Badge>
                    )}
                  </div>

                  {article.summary && (
                    <p
                      className={`italic ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                      style={{ fontSize: fontSizes[fontSize] }}
                    >
                      {article.summary}
                    </p>
                  )}
                </div>

                <div
                  className={`prose max-w-none ${darkMode ? 'prose-invert' : ''}`}
                  style={{
                    fontSize: fontSizes[fontSize],
                    lineHeight: lineSpacings[lineSpacing],
                    color: darkMode ? '#e5e7eb' : '#111827'
                  }}
                  dangerouslySetInnerHTML={{ __html: article.content }}
                />
              </article>
            </div>
          </div>
        </div>

        {/* Painel de Notas e Destaques */}
        {showNotes && !readingMode && (
          <div className={`w-80 lg:w-96 border-l flex-shrink-0 flex flex-col ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Notas e Destaques
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportNotes}
                  title="Exportar anotações"
                  disabled={highlights.length === 0 && notes.length === 0}
                >
                  <Download className="w-3 h-3" />
                </Button>
              </div>

              {/* Nova nota */}
              <div className="space-y-2">
                <Textarea
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                  placeholder="Digite sua nota aqui..."
                  className={`resize-none ${darkMode ? 'bg-gray-700 text-white border-gray-600' : ''}`}
                  rows={3}
                />
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={!currentNote.trim()}
                  className="w-full"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Adicionar Nota
                </Button>
              </div>
            </div>

            {/* Lista de destaques e notas */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Destaques */}
              {highlights.length > 0 && (
                <div>
                  <h4 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Destaques ({highlights.length})
                  </h4>
                  <div className="space-y-2">
                    {highlights.map((highlight) => (
                      <Card key={highlight.id} className={darkMode ? 'bg-gray-700 border-gray-600' : ''}>
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                              style={{ backgroundColor: highlight.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                "{highlight.text}"
                              </p>
                              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {new Date(highlight.timestamp).toLocaleString('pt-BR')}
                              </p>
                            </div>
                            <button
                              onClick={() => deleteHighlight(highlight.id)}
                              className={`flex-shrink-0 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 ${
                                darkMode ? 'text-red-400' : 'text-red-600'
                              }`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Notas */}
              {notes.length > 0 && (
                <div>
                  <h4 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Minhas Notas ({notes.length})
                  </h4>
                  <div className="space-y-2">
                    {notes.map((note) => (
                      <Card key={note.id} className={darkMode ? 'bg-gray-700 border-gray-600' : ''}>
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <FileText className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                              darkMode ? 'text-blue-400' : 'text-blue-600'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm whitespace-pre-wrap ${
                                darkMode ? 'text-gray-200' : 'text-gray-800'
                              }`}>
                                {note.content}
                              </p>
                              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {new Date(note.timestamp).toLocaleString('pt-BR')}
                              </p>
                            </div>
                            <button
                              onClick={() => deleteNote(note.id)}
                              className={`flex-shrink-0 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 ${
                                darkMode ? 'text-red-400' : 'text-red-600'
                              }`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Mensagem vazia */}
              {highlights.length === 0 && notes.length === 0 && (
                <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    Selecione texto para destacar ou adicione suas notas
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}