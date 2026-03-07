import { useEffect, useMemo, useState } from 'react';
import { StudyMaterial, YouTubeVideo, Article, User } from '@/entities/all';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, Play, Eye, Timer, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Course() {
  const [isLoading, setIsLoading] = useState(true);
  const [materials, setMaterials] = useState([]);
  const [videos, setVideos] = useState([]);
  const [articles, setArticles] = useState([]);
  const [user, setUser] = useState(null);

  // Read cargo from URL
  const urlParams = new URLSearchParams(window.location.search);
  const cargo = urlParams.get('cargo');

  useEffect(() => {
    (async () => {
      try {
        const me = await User.me().catch(() => null);
        setUser(me);
        const [mats, vids, arts] = await Promise.all([
          StudyMaterial.filter(cargo ? { cargo } : {}, '-created_date', 200),
          YouTubeVideo.filter({}, 'order', 200),
          Article.filter({ is_published: true }, '-created_date', 200),
        ]);
        setMaterials(mats || []);
        setVideos((vids || []).filter(v => !v.cargo || v.cargo === cargo));
        setArticles((arts || []).filter(a => !a.cargo || a.cargo === cargo));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [cargo]);

  const title = useMemo(() => {
    const map = new Map([
      ['tecnico_judiciario','Técnico Judiciário'],
      ['analista_judiciario','Analista Judiciário'],
      ['agente_penitenciario','Agente Penitenciário'],
      ['policial_civil','Policial Civil'],
      ['policial_federal','Policial Federal'],
      ['auditor_fiscal','Auditor Fiscal'],
      ['tecnico_receita_federal','Técnico da Receita Federal'],
      ['analista_receita_federal','Analista da Receita Federal'],
      ['professor_educacao_basica','Professor (Educação Básica)'],
      ['professor_portugues','Professor (Português)'],
      ['professor_matematica','Professor (Matemática)'],
      ['enfermeiro','Enfermeiro'],
      ['medico','Médico'],
      ['contador','Contador'],
      ['advogado','Advogado'],
      ['engenheiro','Engenheiro'],
      ['analista_sistemas','Analista de Sistemas'],
      ['tecnico_informatica','Técnico em Informática'],
      ['assistente_administrativo','Assistente Administrativo'],
      ['escriturario','Escriturário'],
      ['tecnico_bancario','Técnico Bancário'],
      ['analista_bancario','Analista Bancário'],
    ]);
    return map.get(cargo) || 'Curso';
  }, [cargo]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center text-gray-600 dark:text-gray-300">Carregando curso...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
            <p className="text-gray-600 dark:text-gray-400">Conteúdos do curso selecionado</p>
          </div>
          <Link to={createPageUrl('Studies')}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
          </Link>
        </div>

        {/* Materiais */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" /> Materiais
          </h2>
          {materials.length === 0 ? (
            <Card><CardContent className="p-6 text-gray-600 dark:text-gray-400">Nenhum material encontrado.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials.map(m => (
                <Card key={m.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base line-clamp-2">{m.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <Badge variant="outline">{m.type}</Badge>
                      <span className="truncate max-w-[50%]">{m.file_name}</span>
                    </div>
                    <Button size="sm" className="w-full">Abrir</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Vídeo-aulas */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Play className="w-5 h-5" /> Vídeo-Aulas
          </h2>
          {videos.length === 0 ? (
            <Card><CardContent className="p-6 text-gray-600 dark:text-gray-400">Nenhuma vídeo-aula encontrada.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map(v => (
                <Card key={v.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <BookOpen className="w-4 h-4" /> {v.title}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {v.duration && <span className="flex items-center gap-1"><Timer className="w-3 h-3" />{v.duration}</span>}
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />Aula</span>
                    </div>
                    <Button size="sm" className="w-full">Assistir</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Artigos */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5" /> Artigos
          </h2>
          {articles.length === 0 ? (
            <Card><CardContent className="p-6 text-gray-600 dark:text-gray-400">Nenhum artigo encontrado.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {articles.map(a => (
                <Card key={a.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base line-clamp-2">{a.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                    {a.summary || 'Sem resumo.'}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}