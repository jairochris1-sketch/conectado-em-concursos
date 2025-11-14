
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import SDQuestionForm from "@/components/sd/SDQuestionForm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Plus, Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SDAdmin() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [headerTitle, setHeaderTitle] = useState("");
  const [headerSubtitle, setHeaderSubtitle] = useState("");
  const [headerId, setHeaderId] = useState(null);
  const [searchId, setSearchId] = useState("");

  const load = async () => {
    setLoading(true);
    const list = await base44.entities.SDQuestion.list("-updated_date", 200);
    setItems(list || []);

    // Load SD header content
    const sc = await base44.entities.SiteContent.filter({ page_key: "sd_header" });
    if (sc?.length) {
      setHeaderId(sc[0].id);
      setHeaderTitle(sc[0].title || "");
      setHeaderSubtitle(sc[0].subtitle || "");
    } else {
      // Clear header state if no content is found
      setHeaderId(null);
      setHeaderTitle("");
      setHeaderSubtitle("");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveHeader = async () => {
    const payload = { page_key: "sd_header", title: headerTitle, subtitle: headerSubtitle };
    if (headerId) {
      await base44.entities.SiteContent.update(headerId, payload);
    } else {
      const created = await base44.entities.SiteContent.create(payload);
      setHeaderId(created.id);
    }
    // Optionally, re-load content to ensure UI is updated with server state
    // load(); // Could be called here if needed for more complex scenarios
  };

  const displayedItems = items.filter((q) => {
    if (!searchId.trim()) return true;
    return (q.id || "").toLowerCase().includes(searchId.trim().toLowerCase());
  });

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: "#1c2c34" }}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Simulados Digital</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                placeholder="Buscar por ID da questão..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="pl-9 bg-white/90"
              />
            </div>
            <Button onClick={() => setEditing({})} className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="w-4 h-4 mr-2" /> Nova Questão
            </Button>
          </div>
        </div>

        {editing && (
          <SDQuestionForm
            initial={editing.id ? editing : undefined}
            onSaved={() => { setEditing(null); load(); }}
            onCancel={() => setEditing(null)}
          />
        )}

        {/* Header editor */}
        <Card className="bg-white/90">
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="headerTitle" className="mb-1 block">Título (linha 1)</Label>
              <Input id="headerTitle" placeholder="Ex: PREFEITURA MUNICIPAL DE ..." value={headerTitle} onChange={(e) => setHeaderTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="headerSubtitle" className="mb-1 block">Subtítulo</Label>
              <Input id="headerSubtitle" placeholder="Ex: CONCURSO PÚBLICO 01/2023" value={headerSubtitle} onChange={(e) => setHeaderSubtitle(e.target.value)} />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <Button onClick={saveHeader} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Salvar Títulos
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90">
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Enunciado</TableHead>
                    <TableHead>Disciplina</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan="6">Carregando...</TableCell></TableRow>
                  ) : displayedItems.length === 0 ? (
                    <TableRow><TableCell colSpan="6">Nenhuma questão encontrada.</TableCell></TableRow>
                  ) : displayedItems.map(q => (
                    <TableRow key={q.id}>
                      <TableCell className="font-mono text-xs">{q.id.slice(-8).toUpperCase()}</TableCell>
                      <TableCell className="max-w-md">
                        <div className="line-clamp-2" dangerouslySetInnerHTML={{ __html: q.statement || '' }} />
                      </TableCell>
                      <TableCell>{q.subject?.replace(/_/g,' ') || '-'}</TableCell>
                      <TableCell>{q.cargo?.replace(/_/g,' ') || '-'}</TableCell>
                      <TableCell>{q.year || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="icon" onClick={() => setEditing(q)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="destructive" size="icon" onClick={async () => { await base44.entities.SDQuestion.delete(q.id); load(); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
