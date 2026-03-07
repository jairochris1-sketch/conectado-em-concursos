import React from "react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CheckCircle2, MoreVertical } from "lucide-react";

export default function TaskCard({ task, onToggleComplete, onEdit, onDelete }) {
  return (
    <div className={`p-3 rounded-lg border bg-white dark:bg-slate-800 ${task.completed ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <button onClick={onToggleComplete} title="Concluir" className="text-green-600">
              <CheckCircle2 className={`w-5 h-5 ${task.completed ? 'fill-green-600' : ''}`} />
            </button>
            <p className="font-semibold text-sm">{task.title}</p>
          </div>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-600">
            {task.duration_minutes > 0 && (
              <Badge variant="outline">{Math.round(task.duration_minutes)}m</Badge>
            )}
            {task.questions_target > 0 && (
              <Badge variant="outline">{task.questions_target} questões</Badge>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={onDelete}>Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}