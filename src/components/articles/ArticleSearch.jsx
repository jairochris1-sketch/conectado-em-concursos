import { useState, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";

export default function ArticleSearch({ articles = [], onFilteredArticles, onSearch }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState("relevance");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Extrair tags únicas dos artigos
  const allTags = useMemo(() => {
    const tags = new Set();
    articles.forEach(a => {
      if (Array.isArray(a.tags)) {
        a.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [articles]);

  // Gerar sugestões baseadas no termo digitado
  const suggestions = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const term = searchTerm.toLowerCase();
    const titleMatches = articles
      .filter(a => a.title.toLowerCase().includes(term))
      .map(a => a.title)
      .slice(0, 5);

    const authorMatches = articles
      .filter(a => a.author && a.author.toLowerCase().includes(term) && !titleMatches.includes(a.title))
      .map(a => a.author)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 3);

    return [...new Set([...titleMatches, ...authorMatches])];
  }, [searchTerm, articles]);

  // Calcular score de relevância
  const calculateRelevance = useCallback((article) => {
    const term = searchTerm.toLowerCase();
    let score = 0;

    if (article.title.toLowerCase().includes(term)) score += 10;
    if (article.author?.toLowerCase().includes(term)) score += 5;
    if (article.summary?.toLowerCase().includes(term)) score += 3;
    if (article.content?.toLowerCase().includes(term)) score += 1;

    return score;
  }, [searchTerm]);

  // Filtrar e ordenar artigos
  const filteredArticles = useMemo(() => {
    let results = articles;

    // Filtro por termo de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      results = results.filter(a =>
        a.title.toLowerCase().includes(term) ||
        a.author?.toLowerCase().includes(term) ||
        a.summary?.toLowerCase().includes(term) ||
        a.content?.toLowerCase().includes(term)
      );
    }

    // Filtro por tags
    if (selectedTags.length > 0) {
      results = results.filter(a =>
        selectedTags.some(tag => Array.isArray(a.tags) && a.tags.includes(tag))
      );
    }

    // Ordenação
    if (sortBy === "relevance" && searchTerm.trim()) {
      results.sort((a, b) => calculateRelevance(b) - calculateRelevance(a));
    } else if (sortBy === "newest") {
      results.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    } else if (sortBy === "oldest") {
      results.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    }

    return results;
  }, [articles, searchTerm, selectedTags, sortBy, calculateRelevance]);

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedTags([]);
    setSortBy("relevance");
  };

  // Notificar parent sobre artigos filtrados
  useMemo(() => {
    onFilteredArticles?.(filteredArticles);
  }, [filteredArticles, onFilteredArticles]);

  return (
    <div className="space-y-4">
      {/* Barra de busca com sugestões */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar artigos..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => searchTerm && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setShowSuggestions(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sugestões dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            <div className="max-h-64 overflow-y-auto">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0 text-sm"
                >
                  <Search className="w-3 h-3 inline mr-2 text-gray-400" />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controles de filtro e ordenação */}
      <div className="flex flex-wrap gap-2 items-center">
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevância</SelectItem>
            <SelectItem value="newest">Mais Recente</SelectItem>
            <SelectItem value="oldest">Mais Antigo</SelectItem>
          </SelectContent>
        </Select>

        {(searchTerm || selectedTags.length > 0) && (
          <Button
            onClick={clearFilters}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            Limpar Filtros
          </Button>
        )}
      </div>

      {/* Tags disponíveis */}
      {allTags.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600">Filtrar por categoria:</p>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <Badge
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`cursor-pointer transition-all ${
                  selectedTags.includes(tag)
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Contador de resultados */}
      <div className="text-xs text-gray-500">
        {filteredArticles.length} {filteredArticles.length === 1 ? "artigo encontrado" : "artigos encontrados"}
      </div>
    </div>
  );
}