import React, { useEffect, useMemo, useState } from "react";
import { SiteContent } from "@/entities/SiteContent";
import { Article } from "@/entities/Article";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import ReactQuill from "react-quill";

const subjectOptions = [
  { value: "portugues", label: "Português" },
  { value: "matematica", label: "Matemática" },
  { value: "direito_constitucional", label: "Direito Constitucional" },
  { value: "direito_administrativo", label: "Direito Administrativo" },
  { value: "direito_penal", label: "Direito Penal" },
  { value: "direito_civil", label: "Direito Civil" },
  { value: "direito_tributario", label: "Direito Tributário" },
  { value: "direito_previdenciario", label: "Direito Previdenciário" },
  { value: "informatica", label: "Informática" },
  { value: "conhecimentos_gerais", label: "Conhecimentos Gerais" },
  { value: "raciocinio_logico", label: "Raciocínio Lógico" },
  { value: "contabilidade", label: "Contabilidade" },
  { value: "administracao_publica", label: "Administração Pública" },
  { value: "pedagogia", label: "Pedagogia" },
  { value: "lei_8112", label: "Lei 8.112/90" },
  { value: "lei_8666", label: "Lei 8.666/93" },
  { value: "lei_14133", label: "Lei 14.133/21" },
  { value: "constituicao_federal", label: "Constituição Federal" },
];

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
    [{ align: [] }],
    ["blockquote", "code-block"],
    ["link"],
    ["clean"],
  ],
};

export default function GuideManager() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create/Edit guide state
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Create article state
  const [articleGuideSlug, setArticleGuideSlug] = useState("");
  const [articleTitle, setArticleTitle] = useState("");
  const [articleSubject, setArticleSubject] = useState("portugues");
  const [articleSummary, setArticleSummary] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [articleFeatured, setArticleFeatured] = useState(true);

  const orderedGuides = useMemo(() =>
    [...guides].sort((a, b) => (a.title || a.page_key).localeCompare(b.title || b.page_key))
  , [guides]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Fetch all site contents, then filter by slug pattern 'guia_*'
        const all = await SiteContent.list('-created_date', 500);
        setGuides((all || []).filter(sc => typeof sc.page_key === 'string' && sc.page_key.toLowerCase().startsWith('guia_')));
      } catch (e) {
        console.error(e);
        toast.error('Erro ao carregar guias');
      }
      setLoading(false);
    };
    load();
  }, []);

  const resetGuideForm = () => {
    setSlug("");
    setTitle("");
    setSubtitle("");
    setEditingId(null);
  };

  const handleSaveGuide = async () => {
    if (!slug.trim() || !title.trim()) {
      toast.error('Informe slug e título');
      return;
    }
    const cleanSlug = slug.trim().toLowerCase().replace(/\s+/g, '_');
    const payload = { page_key: cleanSlug, title: title.trim(), subtitle: subtitle.trim() };
    try {
      if (editingId) {
        await SiteContent.update(editingId, payload);
        toast.success('Guia atualizado');
      } else {
        await SiteContent.create(payload);
        toast.success('Guia criado');
      }
      // refresh list
      const all = await SiteContent.list('-created_date', 500);
      setGuides((all || []).filter(sc => typeof sc.page_key === 'string' && sc.page_key.toLowerCase().startsWith('guia_')));
      resetGuideForm();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao salvar guia');
    }
  };

  const handleEditGuide = (g) => {
    setEditingId(g.id);
    setSlug(g.page_key);
    setTitle(g.title || "");
    setSubtitle(g.subtitle || "");
  };

  const handleCreateArticle = async () => {
    if (!articleGuideSlug) {
      toast.error('Selecione um guia');
      return;
    }
    if (!articleTitle.trim() || !articleContent.trim()) {
      toast.error('Título e conteúdo são obrigatórios');
      return;
    }
    try {
      await Article.create({
        title: articleTitle.trim(),
        content: articleContent,
        summary: articleSummary.trim(),
        subject: articleSubject,
        tags: [articleGuideSlug],
        is_featured: articleFeatured,
        is_published: true,
      });
      toast.success('Artigo criado neste guia');
      setArticleTitle("");
      setArticleSummary("");
      setArticleContent("");
      setArticleFeatured(true);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao criar artigo');
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="manage-guides" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manage-guides">Guias</TabsTrigger>
          <TabsTrigger value="new-article">Novo Artigo</TabsTrigger>
        </TabsList>

        <TabsContent value="manage-guides" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Criar/Editar Guia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium">Slug (ex: guia_aprovacao)</label>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="guia_aprovacao" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Título</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do guia" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Subtítulo</label>
                <Textarea rows={3} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Descrição curta" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveGuide} className="bg-indigo-600 hover:bg-indigo-700 text-white">{editingId ? 'Atualizar' : 'Criar'} guia</Button>
                {editingId && (
                  <Button variant="outline" onClick={resetGuideForm}>Cancelar</Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Guias existentes</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div>Carregando...</div>
              ) : orderedGuides.length === 0 ? (
                <div>Nenhum guia criado ainda.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {orderedGuides.map(g => (
                    <div key={g.id} className="border rounded p-3 flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{g.title || g.page_key}</div>
                        <div className="text-xs text-gray-500">Slug: <Badge variant="outline">{g.page_key}</Badge></div>
                        {g.subtitle && (
                          <p className="text-sm mt-1 line-clamp-2">{g.subtitle}</p>
                        )}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleEditGuide(g)}>Editar</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new-article" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Novo Artigo no Guia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium">Guia</label>
                  <Select value={articleGuideSlug} onValueChange={setArticleGuideSlug}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o guia" />
                    </SelectTrigger>
                    <SelectContent>
                      {orderedGuides.map(g => (
                        <SelectItem key={g.id} value={g.page_key}>{g.title || g.page_key}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Título do artigo</label>
                  <Input value={articleTitle} onChange={(e) => setArticleTitle(e.target.value)} placeholder="Título" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium">Disciplina</label>
                  <Select value={articleSubject} onValueChange={setArticleSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectOptions.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Resumo (opcional)</label>
                  <Input value={articleSummary} onChange={(e) => setArticleSummary(e.target.value)} placeholder="Breve descrição" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Conteúdo</label>
                <div className="border rounded">
                  <ReactQuill theme="snow" value={articleContent} onChange={setArticleContent} modules={quillModules} />
                </div>
                <p className="text-xs text-gray-500 mt-1">Use o editor para alinhar texto, aplicar indentação, listas, títulos, etc.</p>
              </div>

              <div className="flex items-center gap-2">
                <input id="featured" type="checkbox" checked={articleFeatured} onChange={(e) => setArticleFeatured(e.target.checked)} />
                <label htmlFor="featured" className="text-sm">Marcar como recomendado no guia</label>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateArticle} className="bg-indigo-600 hover:bg-indigo-700 text-white">Criar artigo</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}