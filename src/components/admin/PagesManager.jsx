import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusCircle, Pencil, Trash2, ImageIcon, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function PagesManager() {
  const [pages, setPages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ page_key: "", title: "", subtitle: "", main_text: "", secondary_text: "", background_image_url: "" });

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.SiteContent.list("-updated_date");
      setPages(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startCreate = () => {
    setEditing(null);
    setForm({ page_key: "", title: "", subtitle: "", main_text: "", secondary_text: "", background_image_url: "" });
  };

  const startEdit = (p) => {
    setEditing(p);
    setForm({
      id: p.id,
      page_key: p.page_key || "",
      title: p.title || "",
      subtitle: p.subtitle || "",
      main_text: p.main_text || "",
      secondary_text: p.secondary_text || "",
      background_image_url: p.background_image_url || ""
    });
  };

  const remove = async (p) => {
    if (!window.confirm("Excluir esta página?")) return;
    await base44.entities.SiteContent.delete(p.id);
    await load();
  };

  const handleUpload = async (file) => {
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((prev) => ({ ...prev, background_image_url: file_url }));
  };

  const save = async () => {
    if (!form.page_key.trim()) { alert("Defina um identificador (page_key)"); return; }
    setIsSaving(true);
    const payload = { ...form };
    try {
      if (form.id) await base44.entities.SiteContent.update(form.id, payload);
      else await base44.entities.SiteContent.create(payload);
      await load();
      setEditing(null);
      startCreate();
    } finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Gerenciar Páginas (SiteContent)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">Use page_key para vincular páginas. Ex.: <Badge variant="secondary">como_estudar_primeiro_lugar</Badge></div>
            <Button onClick={startCreate} className="gap-2"><PlusCircle className="w-4 h-4" /> Nova Página</Button>
          </div>

          {isLoading ? (
            <div className="py-10 text-center text-sm text-gray-500"><Loader2 className="inline w-4 h-4 animate-spin mr-2" />Carregando...</div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>page_key</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Atualizada</TableHead>
                    <TableHead className="w-40">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell><Badge variant="outline">{p.page_key}</Badge></TableCell>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell>{new Date(p.updated_date).toLocaleString()}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(p)} className="gap-1"><Pencil className="w-4 h-4" />Editar</Button>
                        <Button size="sm" variant="destructive" onClick={() => remove(p)} className="gap-1"><Trash2 className="w-4 h-4" />Excluir</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Editar Página" : "Nova Página"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Identificador (page_key)</Label>
              <Input value={form.page_key} onChange={(e) => setForm({ ...form, page_key: e.target.value })} placeholder="ex.: como_estudar_primeiro_lugar" />
            </div>
            <div>
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Subtítulo</Label>
              <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
            </div>
            <div>
              <Label>Imagem de Fundo</Label>
              <div className="flex items-center gap-2">
                <Input type="url" placeholder="https://..." value={form.background_image_url} onChange={(e) => setForm({ ...form, background_image_url: e.target.value })} />
                <label className="inline-flex items-center gap-2 cursor-pointer px-3 py-2 border rounded">
                  <ImageIcon className="w-4 h-4" />
                  <span>Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0])} />
                </label>
              </div>
            </div>
          </div>
          <div>
            <Label>Texto Principal</Label>
            <Textarea rows={4} value={form.main_text} onChange={(e) => setForm({ ...form, main_text: e.target.value })} />
          </div>
          <div>
            <Label>Texto Secundário</Label>
            <Textarea rows={3} value={form.secondary_text} onChange={(e) => setForm({ ...form, secondary_text: e.target.value })} />
          </div>
          <div className="flex justify-end">
            <Button onClick={save} disabled={isSaving} className="gap-2">{isSaving && <Loader2 className="w-4 h-4 animate-spin" />}Salvar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}