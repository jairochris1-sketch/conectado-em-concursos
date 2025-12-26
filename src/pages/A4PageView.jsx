import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { A4Page } from "@/entities/A4Page";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import A4PageViewer from "../components/a4/A4PageViewer";

export default function A4PageView() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (id) {
        const res = await A4Page.filter({ id });
        setPage(res && res[0]);
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

  if (!page) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        Página não encontrada.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="no-print flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link to={createPageUrl('A4Pages')}><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1"/> Voltar</Button></Link>
          <h1 className="text-xl font-bold">{page.title}</h1>
        </div>
        <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2"/> Imprimir / PDF</Button>
      </div>

      <A4PageViewer page={page} />
    </div>
  );
}