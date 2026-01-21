import React, { useState, useEffect } from "react";
import { Pencil, Highlighter, Underline, Eraser, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const colors = [
  { name: "Amarelo", value: "yellow", class: "bg-yellow-300" },
  { name: "Verde", value: "green", class: "bg-green-300" },
  { name: "Azul", value: "blue", class: "bg-blue-300" },
  { name: "Rosa", value: "pink", class: "bg-pink-300" },
  { name: "Roxo", value: "purple", class: "bg-purple-300" },
  { name: "Laranja", value: "orange", class: "bg-orange-300" },
];

const AnnotationTool = ({ questionId, onAnnotationsChange }) => {
  const [isActive, setIsActive] = useState(false);
  const [annotationType, setAnnotationType] = useState("highlight");
  const [selectedColor, setSelectedColor] = useState("yellow");
  const [annotations, setAnnotations] = useState([]);

  useEffect(() => {
    if (questionId) {
      loadAnnotations();
    }
  }, [questionId]);

  const loadAnnotations = async () => {
    if (!questionId) return;
    try {
      const data = await base44.entities.QuestionAnnotation.filter({ 
        question_id: questionId 
      });
      setAnnotations(data);
      applyAnnotations(data);
    } catch (error) {
      console.error("Erro ao carregar anotações:", error);
    }
  };

  const applyAnnotations = (annotationsList) => {
    // Remove anotações anteriores
    document.querySelectorAll('[data-annotation-id]').forEach(el => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    });

    // Aplica novas anotações
    annotationsList.forEach(annotation => {
      const elements = document.querySelectorAll(`[data-question-id="${questionId}"] p, [data-question-id="${questionId}"] div, [data-question-id="${questionId}"] span`);
      elements.forEach(element => {
        if (element.textContent.includes(annotation.text_content)) {
          highlightText(element, annotation);
        }
      });
    });
  };

  const highlightText = (element, annotation) => {
    const text = element.textContent;
    const index = text.indexOf(annotation.text_content);
    if (index === -1) return;

    const beforeText = text.substring(0, index);
    const highlightedText = text.substring(index, index + annotation.text_content.length);
    const afterText = text.substring(index + annotation.text_content.length);

    const colorMap = {
      yellow: "bg-yellow-300 dark:bg-yellow-600",
      green: "bg-green-300 dark:bg-green-600",
      blue: "bg-blue-300 dark:bg-blue-600",
      pink: "bg-pink-300 dark:bg-pink-600",
      purple: "bg-purple-300 dark:bg-purple-600",
      orange: "bg-orange-300 dark:bg-orange-600",
    };

    const span = document.createElement('span');
    span.setAttribute('data-annotation-id', annotation.id);
    span.textContent = highlightedText;
    
    if (annotation.annotation_type === 'highlight') {
      span.className = `${colorMap[annotation.color]} rounded px-0.5`;
    } else {
      span.className = `border-b-2 border-${annotation.color}-500 dark:border-${annotation.color}-400`;
      span.style.borderBottomWidth = '2px';
      span.style.borderBottomStyle = 'solid';
    }

    element.textContent = '';
    element.appendChild(document.createTextNode(beforeText));
    element.appendChild(span);
    element.appendChild(document.createTextNode(afterText));
  };

  const handleTextSelection = async () => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (!selectedText || !questionId) {
      toast.error("Selecione um texto para anotar");
      return;
    }

    try {
      const annotationData = {
        question_id: questionId,
        text_content: selectedText,
        annotation_type: annotationType,
        color: selectedColor,
      };

      const newAnnotation = await base44.entities.QuestionAnnotation.create(annotationData);
      const updatedAnnotations = [...annotations, newAnnotation];
      setAnnotations(updatedAnnotations);
      applyAnnotations(updatedAnnotations);
      
      if (onAnnotationsChange) {
        onAnnotationsChange(updatedAnnotations);
      }

      selection.removeAllRanges();
      toast.success("Anotação adicionada!");
    } catch (error) {
      console.error("Erro ao salvar anotação:", error);
      toast.error("Erro ao salvar anotação");
    }
  };

  const clearAnnotations = async () => {
    if (!questionId) return;
    
    if (confirm("Deseja limpar todas as anotações desta questão?")) {
      try {
        for (const annotation of annotations) {
          await base44.entities.QuestionAnnotation.delete(annotation.id);
        }
        setAnnotations([]);
        applyAnnotations([]);
        toast.success("Anotações removidas");
      } catch (error) {
        console.error("Erro ao limpar anotações:", error);
        toast.error("Erro ao limpar anotações");
      }
    }
  };

  useEffect(() => {
    if (isActive) {
      const handleSelection = (e) => {
        if (e.type === 'mouseup') {
          const selection = window.getSelection();
          if (selection.toString().trim()) {
            handleTextSelection();
          }
        }
      };

      document.addEventListener('mouseup', handleSelection);
      return () => document.removeEventListener('mouseup', handleSelection);
    }
  }, [isActive, annotationType, selectedColor, questionId]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`relative ${isActive ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : ''}`}
        >
          <Pencil className="w-5 h-5" />
          {annotations.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-blue-500 rounded-full text-white text-xs flex items-center justify-center">
              {annotations.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 dark:text-white">Ferramenta de Anotação</h4>
            <Button
              size="sm"
              variant={isActive ? "default" : "outline"}
              onClick={() => setIsActive(!isActive)}
            >
              {isActive ? "Desativar" : "Ativar"}
            </Button>
          </div>

          {isActive && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Tipo de Marcação
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={annotationType === "highlight" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAnnotationType("highlight")}
                    className="w-full"
                  >
                    <Highlighter className="w-4 h-4 mr-2" />
                    Destaque
                  </Button>
                  <Button
                    variant={annotationType === "underline" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAnnotationType("underline")}
                    className="w-full"
                  >
                    <Underline className="w-4 h-4 mr-2" />
                    Sublinhado
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Cor
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedColor(color.value)}
                      className={`w-8 h-8 rounded-full ${color.class} border-2 ${
                        selectedColor === color.value
                          ? "border-gray-900 dark:border-white scale-110"
                          : "border-gray-300 dark:border-gray-600"
                      } transition-all hover:scale-110`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Selecione o texto na questão para aplicar a marcação
                </p>
              </div>
            </>
          )}

          {annotations.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={clearAnnotations}
              className="w-full"
            >
              <Eraser className="w-4 h-4 mr-2" />
              Limpar Anotações ({annotations.length})
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AnnotationTool;