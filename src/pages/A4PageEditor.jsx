import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { A4Page } from "@/entities/A4Page";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import ReactQuill from "react-quill";
import 'react-quill/dist/quill.snow.css';
import A4PageViewer from "../components/a4/A4PageViewer";
import { Save, ArrowLeft } from "lucide-react";

export default function A4PageEditor() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    cover_image_url: '',
    content_html: '',
    footer_text: '',
    tagsInput: ''
  });

  useEffect(() => {
    const load = async () => {
      const user = await User.me();
      setMe(user);
      if (id) {
        const res = await A4Page.filter({ id });
        if (res && res[0]) {
          const p = res[0];
          setForm({
            title: p.title || '',
            subtitle: p.subtitle || '',
            cover_image_url: p.cover_image_url || '',
            content_html: p.content_html || '',
            footer_text: p.footer_text || '',
            tagsInput: (p.tags || []).join(', ')
          });
        }
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const isAdmin = me && (me.role === 'admin' || me.email === 'conectadoemconcursos@gmail.com');
  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <CardContent className="py-10 text-center">Apenas administradores podem criar/editar páginas A4.</CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      cover_image_url: form.cover_image_url.trim(),
      content_html: form.content_html,
      footer_text: form.footer_text.trim(),
      tags: form.tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      is_published: true
    };
    if (id) {
      await A4Page.update(id, payload);
    } else {
      const created = await A4Page.create(payload);
      if (created && created.id) {
        window.location.href = createPageUrl(`A4PageEditor?id=${created.id}`);
        return;
      }
    }
    setSaving(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link to={createPageUrl('A4Pages')}><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1"/> Voltar</Button></Link>
          <h1 className="text-xl font-bold">{id ? 'Editar Página A4' : 'Nova Página A4'}</h1>
        </div>
        <Button onClick={handleSave} disabled={saving || !form.title} className="bg-indigo-600 hover:bg-indigo-700">
          <Save className="w-4 h-4 mr-2"/> {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Conteúdo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input value={form.title} onChange={(e)=>setForm({...form, title: e.target.value})} placeholder="Digite o título" />
            </div>
            <div>
              <label className="text-sm font-medium">Subtítulo</label>
              <Input value={form.subtitle} onChange={(e)=>setForm({...form, subtitle: e.target.value})} placeholder="Opcional" />
            </div>
            <div>
              <label className="text-sm font-medium">URL da imagem de capa</label>
              <Input value={form.cover_image_url} onChange={(e)=>setForm({...form, cover_image_url: e.target.value})} placeholder="https://..." />
            </div>
            <div>
              <label className="text-sm font-medium">Conteúdo (HTML rich)</label>
              <ReactQuill theme="snow" value={form.content_html} onChange={(v)=>setForm({...form, content_html: v})} />
            </div>
            <div>
              <label className="text-sm font-medium">Rodapé</label>
              <Input value={form.footer_text} onChange={(e)=>setForm({...form, footer_text: e.target.value})} placeholder="Opcional" />
            </div>
            <div>
              <label className="text-sm font-medium">Tags (separadas por vírgula)</label>
              <Input value={form.tagsInput} onChange={(e)=>setForm({...form, tagsInput: e.target.value})} placeholder="ex.: guia, aprovado, estudos" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pré-visualização A4</CardTitle></CardHeader>
          <CardContent>
            <A4PageViewer page={{
              title: form.title,
              subtitle: form.subtitle,
              cover_image_url: form.cover_image_url,
              content_html: form.content_html,
              footer_text: form.footer_text
            }} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}