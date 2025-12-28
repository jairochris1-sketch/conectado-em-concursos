import React, { useState, useEffect } from 'react';
import { SavedContest } from '@/entities/SavedContest';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Building, Briefcase, DollarSign, Calendar, ArrowUpRight, Search, Globe, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { findOpenContests } from '@/functions/findOpenContests';

const ContestCard = ({ contest, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
  >
    <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-lg text-blue-700 dark:text-blue-400">{contest.name}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
        <div className="flex items-start gap-2">
          <Building className="w-4 h-4 mt-1 text-gray-500" />
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200">Instituição</p>
            <p className="text-gray-600 dark:text-gray-400">{contest.institution}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Briefcase className="w-4 h-4 mt-1 text-gray-500" />
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200">Cargos</p>
            <p className="text-gray-600 dark:text-gray-400">{contest.positions}</p>
          </div>
        </div>
        {contest.salary && (
          <div className="flex items-start gap-2">
            <DollarSign className="w-4 h-4 mt-1 text-gray-500" />
            <div>
              <p className="font-semibold text-gray-800 dark:text-gray-200">Salário</p>
              <p className="text-gray-600 dark:text-gray-400">{contest.salary}</p>
            </div>
          </div>
        )}
        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 mt-1 text-gray-500" />
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200">Prazo de Inscrição</p>
            <p className="font-bold text-red-600 dark:text-red-400">{contest.registration_deadline}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <a href={contest.link} target="_blank" rel="noopener noreferrer" className="w-full">
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            Mais Informações
            <ArrowUpRight className="w-4 h-4 ml-2" />
          </Button>
        </a>
      </CardFooter>
    </Card>
  </motion.div>
);

export default function SavedContestsPage() {
  const [contests, setContests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchLocation, setSearchLocation] = useState(null);

  const loadContests = async () => {
    setIsLoading(true);
    try {
      const data = await SavedContest.list('-created_date');
      setContests(data);
    } catch (error) {
      console.error("Erro ao carregar concursos salvos:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadContests();
  }, []);

  const handleSearch = async (location) => {
    setIsSearching(true);
    setSearchLocation(location);
    try {
      await findOpenContests({ location });
      // Após a busca, recarrega a lista completa do banco de dados
      await loadContests();
    } catch (error) {
      console.error(`Erro ao buscar concursos para ${location}:`, error);
      alert(`Ocorreu um erro ao buscar os concursos. Tente novamente.`);
    }
    setIsSearching(false);
    setSearchLocation(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <Search className="w-8 h-8 text-blue-600" />
            Concursos Abertos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Acompanhe os concursos encontrados pela nossa IA. Busque por novas oportunidades a qualquer momento.
          </p>
        </motion.div>

        <Card className="mb-8 shadow-sm">
          <CardHeader>
            <CardTitle>Buscar Novos Concursos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => handleSearch('Sergipe')}
              disabled={isSearching}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSearching && searchLocation === 'Sergipe' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4 mr-2" />
              )}
              Buscar em Sergipe
            </Button>
            <Button
              onClick={() => handleSearch('Brasil')}
              disabled={isSearching}
              className="flex-1"
            >
              {isSearching && searchLocation === 'Brasil' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Globe className="w-4 h-4 mr-2" />
              )}
              Buscar no Brasil
            </Button>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          </div>
        ) : contests.length > 0 ? (
          <div className="space-y-4">
            {contests.map((contest, index) => (
              <ContestCard key={contest.id} contest={contest} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Nenhum concurso salvo ainda.</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Use os botões acima para iniciar uma busca.</p>
          </div>
        )}
      </div>
    </div>
  );
}