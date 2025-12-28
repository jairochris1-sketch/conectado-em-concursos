import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User } from '@/entities/User';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Pencil, 
  Eraser, 
  Square, 
  Circle, 
  Type, 
  Trash2, 
  Download, 
  Grid3X3,
  Undo2,
  Redo2,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TOOLS = {
  PEN: 'pen',
  ERASER: 'eraser', 
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  TEXT: 'text'
};

const COLORS = [
  '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
  '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB'
];

export default function DigitalWhiteboard() {
  const canvasRef = useRef(null);
  const [user, setUser] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState(TOOLS.PEN);
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [showGrid, setShowGrid] = useState(false);
  const [isTextMode, setIsTextMode] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
        
        // Verificar se tem acesso ao plano avançado
        if (userData.current_plan !== 'avancado') {
          // Redirecionar para subscription page
          window.location.href = '/subscription';
          return;
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      }
    };
    loadUser();
  }, []);

  const saveCanvasState = useCallback(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const imageData = canvas.toDataURL();
      setUndoStack(prev => [...prev.slice(-19), imageData]); // Manter apenas últimos 20 estados
      setRedoStack([]); // Limpar redo quando nova ação é feita
    }
  }, []);

  const getCanvasCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = useCallback((e) => {
    if (currentTool === TOOLS.TEXT) {
      const coords = getCanvasCoords(e);
      setTextPosition(coords);
      setIsTextMode(true);
      return;
    }

    setIsDrawing(true);
    saveCanvasState();
    
    const coords = getCanvasCoords(e);
    setStartPos(coords);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (currentTool === TOOLS.PEN) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }
  }, [currentTool, saveCanvasState]);

  const draw = useCallback((e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const coords = getCanvasCoords(e);

    if (currentTool === TOOLS.PEN) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    } else if (currentTool === TOOLS.ERASER) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = strokeWidth * 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }
  }, [isDrawing, currentTool, strokeColor, strokeWidth]);

  const stopDrawing = useCallback((e) => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (currentTool === TOOLS.RECTANGLE || currentTool === TOOLS.CIRCLE) {
      const coords = getCanvasCoords(e);
      
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      
      if (currentTool === TOOLS.RECTANGLE) {
        const width = coords.x - startPos.x;
        const height = coords.y - startPos.y;
        ctx.strokeRect(startPos.x, startPos.y, width, height);
      } else if (currentTool === TOOLS.CIRCLE) {
        const radius = Math.sqrt(Math.pow(coords.x - startPos.x, 2) + Math.pow(coords.y - startPos.y, 2));
        ctx.beginPath();
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
    
    ctx.beginPath();
  }, [isDrawing, currentTool, strokeColor, strokeWidth, startPos]);

  const clearCanvas = () => {
    saveCanvasState();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (showGrid) drawGrid();
  };

  const drawGrid = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const gridSize = 20;
    
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  };

  const addText = () => {
    if (!textInput.trim()) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.font = `${Math.max(strokeWidth * 6, 16)}px Arial`;
    ctx.fillStyle = strokeColor;
    ctx.fillText(textInput, textPosition.x, textPosition.y);
    
    setTextInput('');
    setIsTextMode(false);
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const currentState = canvas.toDataURL();
    
    setRedoStack(prev => [...prev, currentState]);
    
    const previousState = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      if (showGrid) drawGrid();
    };
    img.src = previousState;
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const currentState = canvas.toDataURL();
    
    setUndoStack(prev => [...prev, currentState]);
    
    const nextState = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      if (showGrid) drawGrid();
    };
    img.src = nextState;
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `lousa-digital-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  useEffect(() => {
    if (showGrid && canvasRef.current) {
      drawGrid();
    }
  }, [showGrid]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user.current_plan !== 'avancado') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Recurso Exclusivo</h2>
            <p className="text-gray-600 mb-4">
              A Lousa Digital é um recurso exclusivo do Plano Avançado.
            </p>
            <Button onClick={() => window.location.href = '/subscription'} className="w-full">
              Fazer Upgrade
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex">
      {/* Barra de Ferramentas Lateral */}
      <div className="w-16 bg-white shadow-lg flex flex-col items-center py-4 space-y-2 z-10">
        {/* Ferramentas de Desenho */}
        <Button
          variant={currentTool === TOOLS.PEN ? "default" : "ghost"}
          size="icon"
          onClick={() => setCurrentTool(TOOLS.PEN)}
          className="w-12 h-12"
          title="Lápis"
        >
          <Pencil className="w-5 h-5" />
        </Button>
        
        <Button
          variant={currentTool === TOOLS.ERASER ? "default" : "ghost"}
          size="icon"
          onClick={() => setCurrentTool(TOOLS.ERASER)}
          className="w-12 h-12"
          title="Borracha"
        >
          <Eraser className="w-5 h-5" />
        </Button>
        
        <Button
          variant={currentTool === TOOLS.RECTANGLE ? "default" : "ghost"}
          size="icon"
          onClick={() => setCurrentTool(TOOLS.RECTANGLE)}
          className="w-12 h-12"
          title="Retângulo"
        >
          <Square className="w-5 h-5" />
        </Button>
        
        <Button
          variant={currentTool === TOOLS.CIRCLE ? "default" : "ghost"}
          size="icon"
          onClick={() => setCurrentTool(TOOLS.CIRCLE)}
          className="w-12 h-12"
          title="Círculo"
        >
          <Circle className="w-5 h-5" />
        </Button>
        
        <Button
          variant={currentTool === TOOLS.TEXT ? "default" : "ghost"}
          size="icon"
          onClick={() => setCurrentTool(TOOLS.TEXT)}
          className="w-12 h-12"
          title="Texto"
        >
          <Type className="w-5 h-5" />
        </Button>

        <div className="w-full border-t my-2"></div>

        {/* Controles */}
        <Button
          variant="ghost"
          size="icon"
          onClick={undo}
          disabled={undoStack.length === 0}
          className="w-12 h-12"
          title="Desfazer"
        >
          <Undo2 className="w-5 h-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={redo}
          disabled={redoStack.length === 0}
          className="w-12 h-12"
          title="Refazer"
        >
          <Redo2 className="w-5 h-5" />
        </Button>

        <Button
          variant={showGrid ? "default" : "ghost"}
          size="icon"
          onClick={() => setShowGrid(!showGrid)}
          className="w-12 h-12"
          title="Grade"
        >
          <Grid3X3 className="w-5 h-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={clearCanvas}
          className="w-12 h-12"
          title="Limpar Tudo"
        >
          <Trash2 className="w-5 h-5" />
        </Button>

        <div className="w-full border-t my-2"></div>

        <Button
          variant="ghost"
          size="icon"
          onClick={downloadCanvas}
          className="w-12 h-12"
          title="Baixar"
        >
          <Download className="w-5 h-5" />
        </Button>
      </div>

      {/* Área Principal */}
      <div className="flex-1 flex flex-col">
        {/* Barra Superior */}
        <div className="h-16 bg-white shadow-sm flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">Lousa Digital</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Seletor de Cor */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Cor:</span>
              {COLORS.map(color => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded-full border-2 ${strokeColor === color ? 'border-gray-900' : 'border-gray-300'}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setStrokeColor(color)}
                />
              ))}
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
              />
            </div>

            {/* Tamanho do Pincel/Borracha */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                {currentTool === TOOLS.ERASER ? 'Borracha:' : 'Espessura:'}
              </span>
              <input
                type="range"
                min="1"
                max="50"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                className="w-20"
              />
              <span className="text-sm text-gray-700 w-8">{strokeWidth}px</span>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <canvas
            ref={canvasRef}
            width={1400}
            height={800}
            className="absolute top-0 left-0 cursor-crosshair bg-white"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>
      </div>

      {/* Modal de Texto */}
      <AnimatePresence>
        {isTextMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <Card className="max-w-md w-full mx-4">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Adicionar Texto</h3>
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Digite seu texto..."
                  className="mb-4"
                  autoFocus
                  onKeyPress={(e) => e.key === 'Enter' && addText()}
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsTextMode(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={addText}>
                    Adicionar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}