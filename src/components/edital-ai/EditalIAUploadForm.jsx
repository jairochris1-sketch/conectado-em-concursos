import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Loader2, Sparkles, Upload } from "lucide-react";

export default function EditalIAUploadForm({ form, setForm, fileName, isBusy, onFileChange, onSubmit }) {
  return (
    <Card className="border-blue-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Sparkles className="w-5 h-5 text-blue-600" />
          Edital com IA
        </CardTitle>
        <CardDescription>
          Envie um PDF do edital para extrair tópicos, montar o cronograma verticalizado e sugerir questões.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="contestName">Nome do concurso</Label>
              <Input
                id="contestName"
                value={form.contestName}
                onChange={(e) => setForm((prev) => ({ ...prev, contestName: e.target.value }))}
                placeholder="Ex: TRT, INSS, Prefeitura..."
              />
            </div>
            <div>
              <Label htmlFor="role">Cargo</Label>
              <Input
                id="role"
                value={form.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                placeholder="Ex: Técnico Judiciário"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="examDate">Data da prova</Label>
              <Input
                id="examDate"
                type="date"
                value={form.examDate}
                onChange={(e) => setForm((prev) => ({ ...prev, examDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="weeklyHours">Horas por semana</Label>
              <Input
                id="weeklyHours"
                type="number"
                min="1"
                max="80"
                value={form.weeklyHours}
                onChange={(e) => setForm((prev) => ({ ...prev, weeklyHours: Number(e.target.value) || 1 }))}
              />
            </div>
            <div>
              <Label htmlFor="studyDays">Dias de estudo por semana</Label>
              <Input
                id="studyDays"
                type="number"
                min="1"
                max="7"
                value={form.studyDays}
                onChange={(e) => setForm((prev) => ({ ...prev, studyDays: Number(e.target.value) || 1 }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="editalPdf">PDF do edital</Label>
            <Input id="editalPdf" type="file" accept="application/pdf,.pdf" onChange={onFileChange} disabled={isBusy} />
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
              <FileText className="w-4 h-4" />
              <span>{fileName || "Nenhum arquivo selecionado"}</span>
            </div>
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isBusy}>
            {isBusy ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analisando edital...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Analisar PDF com IA
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}