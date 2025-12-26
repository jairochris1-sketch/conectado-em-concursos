import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { A4Page } from "@/entities/A4Page";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Printer } from "lucide-react";

export default function A4Pages() {
  const [pages, setPages] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const me = await User.me();
        setIsAdmin(me && (me.role === 'admin' || me.email === 'conectadoemconcursos@gmail.com'));
        const list = await A4Page.list('-updated_date');
        setPages(list);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Páginas A4</h1>
        {isAdmin && (
          <Link to={createPageUrl('A4PageEditor')}>
            <Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4 mr-2" /> Nova Página</Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pages.map((p) => (
          <Card key={p.id} className="hover:shadow-md transition">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg line-clamp-1">{p.title}</CardTitle>
              {p.subtitle && <div className="text-sm text-gray-500 line-clamp-1">{p.subtitle}</div>}
            </CardHeader>
            <CardContent className="pt-0 flex items-center justify-between">
              <div className="flex gap-2 flex-wrap">
                {(p.tags || []).slice(0,3).map((t,i)=>(<Badge key={i} variant="secondary">{t}</Badge>))}
                {!p.is_published && <Badge className="bg-yellow-100 text-yellow-800">Rascunho</Badge>}
              </div>
              <div className="flex gap-2">
                <Link to={createPageUrl(`A4PageView?id=${p.id}`)}>
                  <Button size="sm" variant="outline" className="gap-1"><FileText className="w-4 h-4"/> Abrir</Button>
                </Link>
                <Link to={createPageUrl(`A4PageEditor?id=${p.id}`)}>
                  {isAdmin && <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">Editar</Button>}
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pages.length === 0 && (
        <Card className="mt-6">
          <CardContent className="py-10 text-center text-gray-600">
            Nenhuma página A4 criada ainda.
          </CardContent>
        </Card>
      )}

      <div className="mt-6 text-sm text-gray-500 flex items-center gap-2">
        <Printer className="w-4 h-4"/> Dica: ao abrir uma página, use Imprimir (Ctrl/Cmd+P) para gerar PDF A4.
      </div>
    </div>
  );
}