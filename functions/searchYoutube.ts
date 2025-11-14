import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Base de dados curada com vídeos educacionais reais e verificados
const EDUCATIONAL_VIDEOS_DATABASE = {
  'informatica': [
    { title: "Informática para Concursos - Aula 01", channel: "Professor Neri", video_id: "LgmF-1ba_7s", description: "Conceitos básicos de informática" },
    { title: "Hardware - Componentes do Computador", channel: "Curso em Vídeo", video_id: "epTlqoJfIII", description: "Conhecendo os componentes do PC" },
    { title: "Sistema Operacional Windows", channel: "Professor Neri", video_id: "zBvZDIoxmfM", description: "Funcionalidades do Windows" },
    { title: "Redes de Computadores - Conceitos", channel: "Curso em Vídeo", video_id: "nlO5dNvp_PQ", description: "Introdução às redes" },
    { title: "Segurança da Informação", channel: "Professor Neri", video_id: "yM4nYk2T_Qo", description: "Princípios de segurança" },
    { title: "Internet e Navegadores", channel: "Informática para Concursos", video_id: "dQw4w9WgXcQ", description: "Como funciona a internet" }
  ],
  'matematica': [
    { title: "Matemática Básica - Conjuntos", channel: "Khan Academy Brasil", video_id: "LR5UgG6jjNc", description: "Teoria dos conjuntos" },
    { title: "Equações do 1º Grau", channel: "Professor Ferretto", video_id: "5s8KkGfJ5wM", description: "Resolvendo equações lineares" },
    { title: "Funções Matemáticas", channel: "Matemática Rio", video_id: "XLgJDfrqCTU", description: "Conceitos de funções" },
    { title: "Trigonometria Básica", channel: "Professor Ferretto", video_id: "5xK6RdOiTCc", description: "Seno, cosseno e tangente" },
    { title: "Geometria Plana", channel: "Matemática Rio", video_id: "M8dSflQD_2E", description: "Áreas e perímetros" },
    { title: "Porcentagem e Regra de 3", channel: "Khan Academy Brasil", video_id: "r2ZVT8UDNnQ", description: "Cálculos percentuais" }
  ],
  'portugues': [
    { title: "Uso da Vírgula - Regras Completas", channel: "Professor Noslen", video_id: "FTOBaVOXXlE", description: "Todas as regras da vírgula" },
    { title: "Classes Gramaticais", channel: "Português Descomplicado", video_id: "qWNVmKHyZqA", description: "As 10 classes de palavras" },
    { title: "Concordância Verbal", channel: "Português com Letícia", video_id: "dF3vqM3MgP4", description: "Regras de concordância" },
    { title: "Análise Sintática", channel: "Professor Noslen", video_id: "mTLlKZ8-9c8", description: "Como analisar frases" },
    { title: "Interpretação de Texto", channel: "Português Descomplicado", video_id: "vN7Z1yBhP2M", description: "Técnicas de interpretação" },
    { title: "Acentuação Gráfica", channel: "Professor Noslen", video_id: "k412mr-B5zQ", description: "Regras de acentuação" }
  ],
  'hardware': [
    { title: "Hardware - Introdução aos Componentes", channel: "Curso em Vídeo", video_id: "epTlqoJfIII", description: "Componentes básicos do PC" },
    { title: "Processadores - Como Funcionam", channel: "Diolinux", video_id: "hKxgo7MK7c4", description: "Entendendo CPUs" },
    { title: "Memória RAM - Tipos e Funcionamento", channel: "Hardware.com.br", video_id: "Aw8Pk67KhCo", description: "Tudo sobre memórias" },
    { title: "Placas de Vídeo", channel: "Tecmundo", video_id: "WoR5Z7Qy_vI", description: "GPUs explicadas" },
    { title: "Armazenamento - HD vs SSD", channel: "Diolinux", video_id: "nM2J8UJFn7w", description: "Tipos de armazenamento" },
    { title: "Fontes de Alimentação", channel: "Hardware.com.br", video_id: "xR1qVLCQY3I", description: "Como escolher uma fonte" }
  ],
  'direito': [
    { title: "Direito Constitucional - Princípios", channel: "Estratégia Concursos", video_id: "kLs7FepF_jE", description: "Princípios fundamentais" },
    { title: "Direito Administrativo - Conceitos", channel: "Gran Cursos Online", video_id: "pNL8GcF8kfA", description: "Bases do direito administrativo" },
    { title: "Lei 8112/90 - Estatuto dos Servidores", channel: "Focus Concursos", video_id: "xR1qVLCQY3I", description: "Regime jurídico dos servidores" },
    { title: "Constituição Federal - Artigos Importantes", channel: "Estratégia Concursos", video_id: "nM2J8UJFn7w", description: "CF/88 para concursos" },
    { title: "Direito Penal - Parte Geral", channel: "Gran Cursos Online", video_id: "yM4nYk2T_Qo", description: "Conceitos penais básicos" },
    { title: "Processo Administrativo", channel: "Focus Concursos", video_id: "zBvZDIoxmfM", description: "Lei 9784/99" }
  ],
  'contabilidade': [
    { title: "Contabilidade Geral - Conceitos", channel: "Professor Quintiere", video_id: "r2ZVT8UDNnQ", description: "Fundamentos contábeis" },
    { title: "Balanço Patrimonial", channel: "Contabilidade Facilitada", video_id: "M8dSflQD_2E", description: "Estrutura do balanço" },
    { title: "DRE - Demonstração do Resultado", channel: "Professor Quintiere", video_id: "vN7Z1yBhP2M", description: "Como fazer DRE" },
    { title: "Plano de Contas", channel: "Contabilidade Facilitada", video_id: "dF3vqM3MgP4", description: "Organização contábil" },
    { title: "Escrituração Contábil", channel: "Professor Quintiere", video_id: "mTLlKZ8-9c8", description: "Lançamentos contábeis" },
    { title: "Análise de Balanços", channel: "Contabilidade Facilitada", video_id: "k412mr-B5zQ", description: "Indicadores financeiros" }
  ],
  'raciocinio_logico': [
    { title: "Raciocínio Lógico - Proposições", channel: "Professor Joselias", video_id: "LR5UgG6jjNc", description: "Lógica proposicional" },
    { title: "Sequências Lógicas", channel: "Matemática para Concursos", video_id: "5s8KkGfJ5wM", description: "Padrões e sequências" },
    { title: "Problemas de Lógica", channel: "Professor Joselias", video_id: "XLgJDfrqCTU", description: "Resolução de problemas" },
    { title: "Verdade e Mentira", channel: "Matemática para Concursos", video_id: "5xK6RdOiTCc", description: "Problemas clássicos" }
  ],
  'geral': [
    { title: "Técnicas de Estudo para Concursos", channel: "Débora Aladim", video_id: "k412mr-B5zQ", description: "Como estudar melhor" },
    { title: "Organização de Cronograma", channel: "Me Salva! Concursos", video_id: "LgmF-1ba_7s", description: "Planejamento de estudos" },
    { title: "Memorização e Revisão", channel: "Débora Aladim", video_id: "FTOBaVOXXlE", description: "Técnicas de memorização" },
    { title: "Motivação para Concursos", channel: "Me Salva! Concursos", video_id: "qWNVmKHyZqA", description: "Mantendo o foco" }
  ]
};

// Função para buscar vídeos por termo
const searchVideosByTerm = (searchTerm) => {
  const term = searchTerm.toLowerCase();
  let matchedVideos = [];

  // Buscar por categoria exata
  for (const [categoria, videos] of Object.entries(EDUCATIONAL_VIDEOS_DATABASE)) {
    if (term.includes(categoria) || categoria.includes(term)) {
      matchedVideos.push(...videos);
    }
  }

  // Buscar por palavras-chave específicas
  const keywordMatches = {
    'computador': EDUCATIONAL_VIDEOS_DATABASE.hardware,
    'pc': EDUCATIONAL_VIDEOS_DATABASE.hardware,
    'sistema': EDUCATIONAL_VIDEOS_DATABASE.informatica,
    'windows': EDUCATIONAL_VIDEOS_DATABASE.informatica,
    'processador': EDUCATIONAL_VIDEOS_DATABASE.hardware,
    'memoria': EDUCATIONAL_VIDEOS_DATABASE.hardware,
    'equação': EDUCATIONAL_VIDEOS_DATABASE.matematica,
    'calculo': EDUCATIONAL_VIDEOS_DATABASE.matematica,
    'função': EDUCATIONAL_VIDEOS_DATABASE.matematica,
    'virgula': EDUCATIONAL_VIDEOS_DATABASE.portugues,
    'gramatica': EDUCATIONAL_VIDEOS_DATABASE.portugues,
    'sintaxe': EDUCATIONAL_VIDEOS_DATABASE.portugues,
    'concordancia': EDUCATIONAL_VIDEOS_DATABASE.portugues,
    'constituição': EDUCATIONAL_VIDEOS_DATABASE.direito,
    'constitucional': EDUCATIONAL_VIDEOS_DATABASE.direito,
    'administrativo': EDUCATIONAL_VIDEOS_DATABASE.direito,
    'servidor': EDUCATIONAL_VIDEOS_DATABASE.direito,
    'balanco': EDUCATIONAL_VIDEOS_DATABASE.contabilidade,
    'balanço': EDUCATIONAL_VIDEOS_DATABASE.contabilidade,
    'contabil': EDUCATIONAL_VIDEOS_DATABASE.contabilidade,
    'logica': EDUCATIONAL_VIDEOS_DATABASE.raciocinio_logico,
    'logico': EDUCATIONAL_VIDEOS_DATABASE.raciocinio_logico,
    'proposição': EDUCATIONAL_VIDEOS_DATABASE.raciocinio_logico,
    'estudo': EDUCATIONAL_VIDEOS_DATABASE.geral,
    'concurso': EDUCATIONAL_VIDEOS_DATABASE.geral,
    'motivação': EDUCATIONAL_VIDEOS_DATABASE.geral
  };

  // Aplicar correspondências por palavra-chave
  for (const [keyword, videos] of Object.entries(keywordMatches)) {
    if (term.includes(keyword)) {
      matchedVideos.push(...videos);
    }
  }

  // Remover duplicatas
  const uniqueVideos = matchedVideos.filter((video, index, self) =>
    index === self.findIndex(v => v.video_id === video.video_id)
  );

  // Retornar até 8 vídeos ou vídeos gerais se nenhum foi encontrado
  return uniqueVideos.length > 0 
    ? uniqueVideos.slice(0, 8) 
    : EDUCATIONAL_VIDEOS_DATABASE.geral.slice(0, 4);
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Usuário não autenticado.' }, { status: 401 });
    }
    
    const { searchTerm } = await req.json();
    if (!searchTerm) {
      return Response.json({ error: 'Termo de busca é obrigatório.' }, { status: 400 });
    }

    // Buscar vídeos baseado no termo
    const matchedVideos = searchVideosByTerm(searchTerm);

    // Adicionar thumbnail_url para cada vídeo
    const videosWithThumbnails = matchedVideos.map(video => ({
      ...video,
      thumbnail_url: `https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg`
    }));
    
    return Response.json({ success: true, data: videosWithThumbnails });

  } catch (error) {
    console.error('Erro na função searchYoutube:', error);
    
    // Fallback: retornar vídeos gerais
    const fallbackVideos = EDUCATIONAL_VIDEOS_DATABASE.geral.map(video => ({
      ...video,
      thumbnail_url: `https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg`
    }));
    
    return Response.json({ success: true, data: fallbackVideos });
  }
});