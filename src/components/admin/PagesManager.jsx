import React, { useEffect, useState } from "react";
import { SiteContent } from "@/entities/SiteContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Pencil, Trash2, Link as LinkIcon, Copy } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function PagesManager() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);

  const emptyForm = {
    page_key: "",
    title: "",
    subtitle: "",
    main_text: "",
    secondary_text: "",
    background_image_url: ""
  };
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const list = await SiteContent.list("-updated_date");
      setPages(list || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startNew = () => { setEditing(null); setForm(emptyForm); };
  const startEdit = (p) => { setEditing(p); setForm({ ...p }); };

  const save = async () => {
    if (!form.page_key) { alert("Defina um identificador (page_key)"); return; }
    setSaving(true);
    try {
      if (editing?.id) await SiteContent.update(editing.id, form);
      else await SiteContent.create(form);
      await load();
      startNew();
    } finally { setSaving(false); }
  };

  const remove = async (p) => {
    if (!window.confirm(`Excluir a página "${p.title || p.page_key}"?`)) return;
    await SiteContent.delete(p.id);
    await load();
  };

  const guideUrl = (key) => createPageUrl(`Guide?key=${encodeURIComponent(key)}`);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Link copiado!");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="w-4 h-4" /> Nova / Editar Página (SiteContent)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Identificador (page_key)</Label>
            <Input value={form.page_key} onChange={(e)=>setForm({...form, page_key: e.target.value})} placeholder="ex: como_estudar_primeiro_lugar" />
          </div>
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={form.title} onChange={(e)=>setForm({...form, title: e.target.value})} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Subtítulo</Label>
            <Input value={form.subtitle} onChange={(e)=>setForm({...form, subtitle: e.target.value})} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Texto Principal</Label>
            <Textarea rows={4} value={form.main_text} onChange={(e)=>setForm({...form, main_text: e.target.value})} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Texto Secundário</Label>
            <Textarea rows={3} value={form.secondary_text} onChange={(e)=>setForm({...form, secondary_text: e.target.value})} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Imagem de Fundo (URL)</Label>
            <Input value={form.background_image_url} onChange={(e)=>setForm({...form, background_image_url: e.target.value})} placeholder="https://..." />
          </div>
          <div className="md:col-span-2 flex gap-2">
            <Button onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar</Button>
            <Button variant="outline" onClick={startNew}>Limpar</Button>
            {form.page_key && (
              <Button variant="secondary" type="button" onClick={() => copyToClipboard(guideUrl(form.page_key))} className="gap-2">
                <Copy className="w-4 h-4" /> Copiar link
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Páginas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-500"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>page_key</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Atualizado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.page_key}</TableCell>
                    <TableCell>{p.title}</TableCell>
                    <TableCell>{new Date(p.updated_date).toLocaleString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => window.open(guideUrl(p.page_key), "_blank") }>
                        <LinkIcon className="w-3 h-3" /> Abrir
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => copyToClipboard(guideUrl(p.page_key))}>
                        <Copy className="w-3 h-3" /> Link
                      </Button>
                      <Button size="sm" className="gap-1" onClick={() => startEdit(p)}>
                        <Pencil className="w-3 h-3" /> Editar
                      </Button>
                      <Button size="sm" variant="destructive" className="gap-1" onClick={() => remove(p)}>
                        <Trash2 className="w-3 h-3" /> Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}