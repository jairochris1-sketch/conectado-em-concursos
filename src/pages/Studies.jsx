import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  BookUser,
  BookOpen,
  Briefcase,
  GraduationCap,
  Shield,
  Stethoscope,
  Cpu,
  Calculator,
  Building2,
  ClipboardList
} from 'lucide-react';
import { motion } from 'framer-motion';

// Lista de carreiras (cargos)
const careers = [
  { value: 'tecnico_judiciario', label: 'Técnico Judiciário' },
  { value: 'analista_judiciario', label: 'Analista Judiciário' },
  { value: 'agente_penitenciario', label: 'Agente Penitenciário' },
  { value: 'policial_civil', label: 'Policial Civil' },
  { value: 'policial_federal', label: 'Policial Federal' },
  { value: 'auditor_fiscal', label: 'Auditor Fiscal' },
  { value: 'tecnico_receita_federal', label: 'Técnico da Receita Federal' },
  { value: 'analista_receita_federal', label: 'Analista da Receita Federal' },
  { value: 'professor_educacao_basica', label: 'Professor (Educação Básica)' },
  { value: 'professor_portugues', label: 'Professor (Português)' },
  { value: 'professor_matematica', label: 'Professor (Matemática)' },
  { value: 'enfermeiro', label: 'Enfermeiro' },
  { value: 'medico', label: 'Médico' },
  { value: 'contador', label: 'Contador' },
  { value: 'advogado', label: 'Advogado' },
  { value: 'engenheiro', label: 'Engenheiro' },
  { value: 'analista_sistemas', label: 'Analista de Sistemas' },
  { value: 'tecnico_informatica', label: 'Técnico em Informática' },
  { value: 'assistente_administrativo', label: 'Assistente Administrativo' },
  { value: 'escriturario', label: 'Escriturário' },
  { value: 'tecnico_bancario', label: 'Técnico Bancário' },
  { value: 'analista_bancario', label: 'Analista Bancário' }
];

// Ícones genéricos para variar visualmente os cards
const icons = [Briefcase, GraduationCap, Shield, Stethoscope, Cpu, Calculator, Building2, ClipboardList];
const getIcon = (index) => icons[index % icons.length];

export default function StudiesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Cabeçalho */}
        <header>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <BookUser className="w-8 h-8" /> Áreas de Estudo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Escolha uma carreira para acessar os materiais e conteúdos do curso.
          </p>
        </header>

        {/* Pastas Personalizadas (placeholder/CTA) */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Pastas de Materiais Personalizadas</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Organize seus próprios materiais por pasta. Em breve você poderá criar e gerenciar essas pastas aqui.
          </p>
          <div className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 flex flex-col items-center justify-center text-center bg-white dark:bg-gray-900">
            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
              <BookOpen className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">Você ainda não criou nenhuma pasta.</p>
            <p className="text-sm text-gray-500">Crie uma pasta para organizar seus próprios materiais.</p>
          </div>
        </section>

        {/* Grid de Carreiras */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Áreas de Estudo</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {careers.map((c, idx) => {
              const Icon = getIcon(idx);
              return (
                <motion.div
                  key={c.value}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                >
                  <Link to={createPageUrl('Course') + `?cargo=${c.value}`} className="block">
                    <Card className="hover:shadow-lg transition-shadow h-full">
                      <CardContent className="p-6 flex flex-col items-center text-center gap-2">
                        <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                          <Icon className="w-7 h-7 text-gray-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">{c.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Acessar conteúdo do curso</p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}