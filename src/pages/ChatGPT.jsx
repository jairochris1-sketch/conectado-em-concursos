import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, ExternalLink, Sparkles, BookOpen, Brain, MessageSquare, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const aiTools = [
  {
    name: "ChatGPT",
    url: "https://chatgpt.com/",
    description: "A IA mais popular para conversas, criação de conteúdo e resolução de problemas",
    icon: Bot,
    color: "from-green-400 to-blue-500"
  },
  {
    name: "Perplexity",
    url: "https://www.perplexity.ai/",
    description: "Motor de busca com IA que fornece respostas com fontes verificadas",
    icon: Sparkles,
    color: "from-purple-400 to-pink-500"
  },
  {
    name: "Teachy",
    url: "https://www.teachy.com.br/",
    description: "Plataforma educacional brasileira com recursos de IA para estudos",
    icon: BookOpen,
    color: "from-blue-400 to-cyan-500"
  },
  {
    name: "Manus",
    url: "https://manus.im/",
    description: "Assistente de escrita inteligente para criação de textos profissionais",
    icon: MessageSquare,
    color: "from-orange-400 to-red-500"
  },
  {
    name: "DeepSeek",
    url: "https://chat.deepseek.com/",
    description: "IA avançada para conversas profundas e análises complexas",
    icon: Brain,
    color: "from-indigo-400 to-purple-500"
  },
  {
    name: "Grok",
    url: "https://grok.com/",
    description: "IA desenvolvida pela xAI com acesso a informações em tempo real",
    icon: Zap,
    color: "from-yellow-400 to-orange-500"
  }
];

export default function ChatGPTPage() {
  const handleOpenAI = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center shadow-lg">
              <Bot className="w-7 h-7 text-white" />
            </div>
            Ferramentas de IA para Estudos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Acesse as melhores inteligências artificiais para turbinar seus estudos
          </p>
        </div>

        {/* Alert Info */}
        <Alert className="mb-8 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-300">
            <strong>Dica:</strong> Cada ferramenta tem suas especialidades. Experimente várias para descobrir qual funciona melhor para cada tipo de estudo! 🚀
          </AlertDescription>
        </Alert>

        {/* Grid de IAs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aiTools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <Card 
                key={index}
                className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-0 overflow-hidden"
                onClick={() => handleOpenAI(tool.url)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                  </div>
                  <CardTitle className="text-xl text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {tool.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
                    {tool.description}
                  </p>
                  <Button 
                    className={`w-full bg-gradient-to-r ${tool.color} hover:opacity-90 text-white border-0`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenAI(tool.url);
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Acessar {tool.name}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Dicas de Uso */}
        <Card className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Como usar as IAs nos seus estudos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Bot className="w-4 h-4 text-green-600" /> ChatGPT
                </h4>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-6">
                  <li>• Explicar conceitos difíceis</li>
                  <li>• Criar resumos de matérias</li>
                  <li>• Gerar exercícios práticos</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" /> Perplexity
                </h4>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-6">
                  <li>• Pesquisar atualidades</li>
                  <li>• Verificar informações</li>
                  <li>• Encontrar jurisprudências</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-600" /> DeepSeek
                </h4>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-6">
                  <li>• Análises complexas</li>
                  <li>• Raciocínio lógico</li>
                  <li>• Problemas matemáticos</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-orange-600" /> Manus
                </h4>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-6">
                  <li>• Redações e textos</li>
                  <li>• Revisão gramatical</li>
                  <li>• Recursos e petições</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            💡 <strong>Lembre-se:</strong> Use as IAs como ferramentas de apoio. O estudo ativo e a prática são essenciais para a aprovação!
          </p>
        </div>
      </div>
    </div>
  );
}