import React, { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Trash2, RefreshCw, Search, FileSearch } from 'lucide-react';
import { format } from "date-fns";

export default function QuestionsList({
  questions,
  isDataLoading,
  onEditQuestion,
  onDeleteQuestion,
  onRefreshQuestions,
  subjectNames,
  institutionNames
}) {
  const [searchId, setSearchId] = useState('');
  const [searchText, setSearchText] = useState('');

  const filteredQuestions = useMemo(() => {
    let filtered = [...questions];

    if (searchId.trim()) {
      filtered = filtered.filter(q => 
        q.id.toLowerCase().includes(searchId.toLowerCase())
      );
    }

    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(q =>
        (q.statement && q.statement.toLowerCase().includes(search)) ||
        (q.command && q.command.toLowerCase().includes(search)) ||
        q.id.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [questions, searchId, searchText]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Lista de Questões</h2>
        <Button onClick={onRefreshQuestions} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {/* Campos de Busca */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <FileSearch className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por ID da questão..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por texto..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">ID</TableHead>
                  <TableHead>Enunciado</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Banca</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isDataLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell colSpan="8">
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredQuestions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan="8" className="text-center py-8 text-gray-500">
                      Nenhuma questão encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuestions.map(question => (
                    <TableRow key={question.id}>
                      <TableCell className="font-mono text-xs">{question.id.slice(-8).toUpperCase()}</TableCell>
                      <TableCell className="max-w-md">
                        <div 
                          className="line-clamp-2 text-sm"
                          dangerouslySetInnerHTML={{ 
                            __html: question.statement || question.command || 'Sem enunciado' 
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-blue-600 font-medium">
                          {subjectNames[question.subject] || question.subject}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-orange-600 font-medium">
                          {institutionNames[question.institution] || question.institution.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {question.type === 'multiple_choice' ? 'Múltipla Escolha' : 'Certo/Errado'}
                        </span>
                      </TableCell>
                      <TableCell>{question.year || '-'}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {format(new Date(question.created_date), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditQuestion(question)}
                            title="Editar questão"
                          >
                            <Pencil className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeleteQuestion(question.id)}
                            title="Excluir questão"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {!isDataLoading && filteredQuestions.length > 0 && (
            <div className="mt-4 text-sm text-gray-600 text-center">
              Mostrando {filteredQuestions.length} de {questions.length} questões
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}