import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function WeeklyCreateDialog({ open, onOpenChange, onCreate, initialName = "" }) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (open) setName(initialName || "");
  }, [open, initialName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Trilha Semanal</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Nome da Trilha</label>
            <Input
              placeholder="Trilha A..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Este é o nome que identifica a sua Trilha Semanal.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={() => onCreate(name)} disabled={!name.trim()}>Criar trilha</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}