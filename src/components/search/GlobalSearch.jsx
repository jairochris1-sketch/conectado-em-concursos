import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { 
  Search, X, User as UserIcon, MessageSquare, 
  Calendar, Filter, Loader2, ChevronRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function GlobalSearch({ isMobile }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all'); // all, users, messages
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ users: [], messages: [] });
  const [hasSearched, setHasSearched] = useState(false);
  
  const navigate = useNavigate();

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length >= 2 || dateFrom || dateTo) {
        performSearch();
      } else if (query.trim().length === 0 && !dateFrom && !dateTo) {
        setResults({ users: [], messages: [] });
        setHasSearched(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, type, dateFrom, dateTo]);

  const performSearch = async () => {
    try {
      setLoading(true);
      setHasSearched(true);
      const res = await base44.functions.invoke('globalSearch', {
        query,
        type,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null
      });
      
      if (res.data) {
        setResults({
          users: res.data.users || [],
          messages: res.data.messages || []
        });
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
  };

  const handleUserClick = (email) => {
    setOpen(false);
    navigate(`${createPageUrl('UserProfile')}?email=${encodeURIComponent(email)}`);
  };

  const activeFiltersCount = (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isMobile ? (
          <Button variant="ghost" size="icon" className="text-gray-700 dark:text-gray-300">
            <Search className="w-5 h-5" />
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            size="icon"
            className="hidden md:flex text-gray-300 hover:text-white hover:bg-white/10"
          >
            <Search className="w-5 h-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden flex flex-col h-[85vh] sm:h-[600px] gap-0">
        <div className="p-4 border-b flex items-center gap-2 bg-slate-50 dark:bg-slate-900">
          <Search className="w-5 h-5 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar usuários, mensagens..."
            className="border-0 shadow-none focus-visible:ring-0 bg-transparent text-base"
            autoFocus
          />
          {query && (
            <Button variant="ghost" size="icon" onClick={() => setQuery('')} className="h-8 w-8 text-gray-400">
              <X className="w-4 h-4" />
            </Button>
          )}
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 shrink-0 h-9 relative">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filtros</span>
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Filtros de Data (Mensagens)</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">De</label>
                    <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Até</label>
                    <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-sm" />
                  </div>
                </div>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full text-xs text-red-500">
                    Limpar Filtros
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Tabs value={type} onValueChange={setType} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-2 border-b">
            <TabsList className="w-full justify-start h-10 bg-transparent p-0">
              <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-4 pb-2">
                Tudo
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-4 pb-2 gap-2">
                <UserIcon className="w-4 h-4" /> Usuários {hasSearched && !loading && `(${results.users.length})`}
              </TabsTrigger>
              <TabsTrigger value="messages" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none px-4 pb-2 gap-2">
                <MessageSquare className="w-4 h-4" /> Mensagens {hasSearched && !loading && `(${results.messages.length})`}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 dark:bg-gray-900/50">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p>Buscando resultados...</p>
              </div>
            ) : !hasSearched ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-center">
                <Search className="w-12 h-12 mb-4 text-gray-300" />
                <p>Digite pelo menos 2 caracteres para pesquisar</p>
                <p className="text-sm mt-1">Busque por nomes de usuários, emails ou conteúdos de mensagens.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* USERS RESULTS */}
                {(type === 'all' || type === 'users') && (
                  <div className="space-y-3">
                    {type === 'all' && results.users.length > 0 && <h3 className="font-semibold text-sm text-gray-500 uppercase">Usuários</h3>}
                    
                    {results.users.length === 0 && type === 'users' && (
                      <p className="text-center text-gray-500 py-8">Nenhum usuário encontrado.</p>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {results.users.map(u => (
                        <button 
                          key={u.id}
                          onClick={() => handleUserClick(u.email)}
                          className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-gray-800 border hover:border-blue-300 hover:shadow-sm transition-all text-left w-full"
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={u.photo} />
                            <AvatarFallback>{u.name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate text-gray-900 dark:text-gray-100">{u.name || 'Sem nome'}</p>
                            <p className="text-xs text-gray-500 truncate">{u.email}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* MESSAGES RESULTS */}
                {(type === 'all' || type === 'messages') && (
                  <div className="space-y-3">
                    {type === 'all' && results.messages.length > 0 && <h3 className="font-semibold text-sm text-gray-500 uppercase mt-4">Mensagens</h3>}
                    
                    {results.messages.length === 0 && type === 'messages' && (
                      <p className="text-center text-gray-500 py-8">Nenhuma mensagem encontrada.</p>
                    )}

                    <div className="space-y-2">
                      {results.messages.map(m => (
                        <div key={m.id} className="p-3 rounded-lg bg-white dark:bg-gray-800 border flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={m.sender_photo} />
                                <AvatarFallback className="text-[10px]">{m.sender_name?.charAt(0) || 'U'}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium">{m.sender_name || m.sender_email}</span>
                            </div>
                            <span className="text-xs text-gray-400">
                              {format(new Date(m.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 pl-8">{m.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.users.length === 0 && results.messages.length === 0 && (
                  <div className="text-center text-gray-500 py-12">
                    <p>Nenhum resultado encontrado para "{query}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}