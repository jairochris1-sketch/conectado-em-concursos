import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { X, ChevronRight, Edit, RefreshCcw, CheckCircle2, Play } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const availableSubjects = [
  "Contabilidade Geral", "Estatística", "Informática",
  "Legislação Especial", "Língua Portuguesa", "Direito Administrativo",
  "Direito Constitucional", "Direito Penal", "Direito Processual Penal",
  "Raciocínio Lógico"
];

const subjectColors = [
  "#fcd34d", "#6ee7b7", "#93c5fd", "#fde047", "#fca5a5",
  "#d8b4fe", "#fda4af", "#c4b5fd", "#f9a8d4", "#86efac"
];

const getColorForSub = (sub) => {
  const index = availableSubjects.indexOf(sub);
  return index !== -1 ? subjectColors[index % subjectColors.length] : "#cbd5e1";
};

import { Trash2, PlusCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function StudyCyclePage() {
  const navigate = useNavigate();
  const [allCycles, setAllCycles] = useState([]);
  const [cycle, setCycle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [user, setUser] = useState(null);

  // Wizard state
  const [step, setStep] = useState(1);
  const [cycleName, setCycleName] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [subjectDetails, setSubjectDetails] = useState({});
  const [weeklyHours, setWeeklyHours] = useState(25);
  const [studyDays, setStudyDays] = useState(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']);
  const [minDuration, setMinDuration] = useState(30);
  const [maxDuration, setMaxDuration] = useState(60);

  // Dialog state for registering time
  const [registerTimeFor, setRegisterTimeFor] = useState(null);
  const [timeInput, setTimeInput] = useState('');
  
  // Dialog state for delete
  const [cycleToDelete, setCycleToDelete] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      const cycles = await base44.entities.StudyCycle.filter({ user_email: currentUser.email });
      setAllCycles(cycles);
      
      if (cycles.length === 0) {
        setShowWizard(true);
        setCycle(null);
      } else if (cycle) {
        const updatedCycle = cycles.find(c => c.id === cycle.id);
        if (updatedCycle) setCycle(updatedCycle);
      }
    } catch (error) {
      console.error("Erro ao carregar ciclo:", error);
      toast.error("Erro ao carregar dados do ciclo de estudos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const calculatedPercentages = useMemo(() => {
    const weights = {};
    let totalWeight = 0;
    
    selectedSubjects.forEach(sub => {
      const imp = subjectDetails[sub]?.importance || 3;
      const knw = subjectDetails[sub]?.knowledge || 3;
      // Formula: higher importance and lower knowledge = higher weight
      const weight = imp * (6 - knw); 
      weights[sub] = weight;
      totalWeight += weight;
    });

    const percentages = {};
    if (totalWeight === 0) {
      selectedSubjects.forEach(sub => percentages[sub] = 100 / selectedSubjects.length);
      return percentages;
    }

    selectedSubjects.forEach(sub => {
      percentages[sub] = (weights[sub] / totalWeight) * 100;
    });

    return percentages;
  }, [selectedSubjects, subjectDetails]);

  const handleSubjectToggle = (sub) => {
    if (selectedSubjects.includes(sub)) {
      setSelectedSubjects(prev => prev.filter(s => s !== sub));
    } else {
      setSelectedSubjects(prev => [...prev, sub]);
      setSubjectDetails(prev => ({ ...prev, [sub]: { importance: 3, knowledge: 3 } }));
    }
  };

  const handleDetailChange = (sub, field, val) => {
    setSubjectDetails(prev => ({
      ...prev,
      [sub]: { ...prev[sub], [field]: val }
    }));
  };

  const handleSaveWizard = async () => {
    if (selectedSubjects.length === 0) {
      toast.error("Selecione pelo menos uma disciplina.");
      return;
    }

    try {
      // Generate Sequence
      const sequence = [];
      selectedSubjects.forEach((subName) => {
         const perc = calculatedPercentages[subName];
         const totalMinsForSub = Math.round((perc / 100) * weeklyHours * 60);
         
         let remaining = totalMinsForSub;
         while (remaining > 0) {
            let chunk = Math.min(remaining, maxDuration);
            if (chunk < minDuration && remaining === totalMinsForSub) {
               chunk = minDuration; 
            } else if (chunk < minDuration) {
               chunk = remaining; 
            }
            if (chunk > 0) {
              sequence.push({
                 id: Math.random().toString(36).substr(2, 9),
                 subject: subName,
                 color: getColorForSub(subName),
                 duration_minutes: chunk,
                 completed_minutes: 0
              });
            }
            remaining -= chunk;
         }
      });

      // Simple shuffling/interleaving
      const interleaved = [];
      const grouped = {};
      sequence.forEach(s => {
        if (!grouped[s.subject]) grouped[s.subject] = [];
        grouped[s.subject].push(s);
      });
      let added = true;
      while(added) {
        added = false;
        Object.keys(grouped).forEach(k => {
          if (grouped[k].length > 0) {
            interleaved.push(grouped[k].shift());
            added = true;
          }
        });
      }

      const newCycleData = {
        name: cycleName || `Planejamento ${allCycles.length + 1}`,
        user_email: user.email,
        subjects: selectedSubjects.map(sub => ({
          name: sub,
          importance: subjectDetails[sub]?.importance || 3,
          knowledge: subjectDetails[sub]?.knowledge || 3,
          percentage: calculatedPercentages[sub],
          color: getColorForSub(sub)
        })),
        sequence: interleaved,
        weekly_hours: Number(weeklyHours),
        study_days: studyDays,
        session_duration_min: minDuration,
        session_duration_max: maxDuration,
        total_cycle_hours: Number(weeklyHours),
        completed_cycles_count: cycle?.completed_cycles_count || 0
      };

      if (cycle) {
        await base44.entities.StudyCycle.update(cycle.id, newCycleData);
        toast.success("Ciclo atualizado com sucesso!");
      } else {
        const created = await base44.entities.StudyCycle.create(newCycleData);
        setCycle(created);
        toast.success("Ciclo criado com sucesso!");
      }

      setShowWizard(false);
      setStep(1);
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar ciclo de estudos.");
    }
  };

  const handleRestartCycle = async () => {
    if (!cycle) return;
    try {
      const resetSequence = cycle.sequence.map(s => ({ ...s, completed_minutes: 0 }));
      await base44.entities.StudyCycle.update(cycle.id, {
        sequence: resetSequence,
        completed_cycles_count: cycle.completed_cycles_count + 1
      });
      toast.success("Ciclo reiniciado com sucesso!");
      loadData();
    } catch (error) {
      toast.error("Erro ao reiniciar ciclo.");
    }
  };

  const confirmRegisterTime = async () => {
    if (!registerTimeFor || !timeInput) return;
    const mins = parseInt(timeInput);
    if (isNaN(mins) || mins <= 0) {
      toast.error("Digite um valor válido em minutos.");
      return;
    }

    try {
      const updatedSequence = cycle.sequence.map(seq => {
        if (seq.id === registerTimeFor.id) {
          return { ...seq, completed_minutes: Math.min(seq.duration_minutes, seq.completed_minutes + mins) };
        }
        return seq;
      });

      await base44.entities.StudyCycle.update(cycle.id, { sequence: updatedSequence });
      toast.success("Tempo registrado com sucesso!");
      setRegisterTimeFor(null);
      setTimeInput('');
      loadData();
    } catch (error) {
      toast.error("Erro ao registrar tempo.");
    }
  };

  const handleDeleteCycle = async () => {
    if (!cycleToDelete) return;
    try {
      await base44.entities.StudyCycle.delete(cycleToDelete.id);
      toast.success("Planejamento excluído!");
      setCycleToDelete(null);
      if (cycle?.id === cycleToDelete.id) setCycle(null);
      loadData();
    } catch (error) {
      toast.error("Erro ao excluir planejamento.");
    }
  };

  const formatMins = (totalMins) => {
    const h = Math.floor(totalMins / 60);
    const m = Math.round(totalMins % 60);
    if (h > 0) return `${h}h${m.toString().padStart(2, '0')}min`;
    return `${m}min`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!showWizard && !cycle && allCycles.length > 0) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate(createPageUrl("StudyPlanning"))} className="text-gray-600 gap-2 px-2 hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" /> Voltar
            </Button>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Meus Planejamentos</h1>
          </div>
          <Button className="bg-[#66d2ba] hover:bg-[#52ba9f] text-white gap-2" onClick={() => {
            setCycle(null);
            setCycleName('');
            setSelectedSubjects([]);
            setStep(1);
            setShowWizard(true);
          }}>
            <PlusCircle className="w-4 h-4" /> Novo Planejamento
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allCycles.map(c => {
            const totMins = c.sequence.reduce((a, b) => a + b.duration_minutes, 0);
            const totComp = c.sequence.reduce((a, b) => a + b.completed_minutes, 0);
            const prog = totMins > 0 ? (totComp / totMins) * 100 : 0;
            return (
              <Card key={c.id} className="shadow-sm hover:shadow-md transition-shadow cursor-pointer border-gray-200">
                <CardContent className="p-6 space-y-4" onClick={() => setCycle(c)}>
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-gray-800">{c.name || "Ciclo de Estudos"}</h3>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 -mt-2 -mr-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCycleToDelete(c);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                      <span>Progresso ({prog.toFixed(0)}%)</span>
                      <span>{formatMins(totComp)} / {formatMins(totMins)}</span>
                    </div>
                    <Progress value={prog} className="h-2 bg-gray-100 [&>div]:bg-[#66d2ba]" />
                  </div>
                  
                  <div className="pt-4 border-t flex flex-wrap gap-2">
                    {c.subjects.slice(0, 3).map(s => (
                      <span key={s.name} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                        {s.name}
                      </span>
                    ))}
                    {c.subjects.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                        +{c.subjects.length - 3}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        
        <Dialog open={!!cycleToDelete} onOpenChange={(v) => !v && setCycleToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Planejamento</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o planejamento <strong>{cycleToDelete?.name}</strong>? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setCycleToDelete(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDeleteCycle}>Excluir</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (showWizard) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 bg-white mt-8 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => {
                if (cycle) setShowWizard(false);
                else if (allCycles.length > 0) setShowWizard(false);
                else navigate(createPageUrl("StudyPlanning"));
              }} 
              className="text-gray-600 gap-2 px-2 hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" /> Voltar
            </Button>
            <h2 className="text-2xl font-bold text-gray-800">{cycle ? "Editar Planejamento" : "Criar Planejamento"}</h2>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2 mb-8">
              <Label className="text-gray-700 font-medium">Nome do Planejamento</Label>
              <Input 
                placeholder="Ex: Ciclo Pós-Edital, Ciclo Básico..." 
                value={cycleName}
                onChange={(e) => setCycleName(e.target.value)}
                className="max-w-md h-12"
              />
            </div>
            
            <p className="text-gray-600">
              Selecione as disciplinas que você já quer colocar no seu planejamento. Não se preocupe, você poderá adicionar outras a qualquer momento, ok?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableSubjects.map(sub => (
                <div 
                  key={sub}
                  onClick={() => handleSubjectToggle(sub)}
                  className={`p-4 rounded-xl border-2 text-center cursor-pointer font-medium transition-all ${
                    selectedSubjects.includes(sub) 
                      ? 'border-teal-500 bg-teal-50 text-teal-800' 
                      : 'border-gray-200 hover:border-teal-200 text-gray-600'
                  }`}
                >
                  {sub}
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-6 border-t mt-8">
              <Button 
                onClick={() => {
                  if (selectedSubjects.length === 0) toast.error("Selecione pelo menos uma disciplina.");
                  else setStep(2);
                }} 
                className="bg-[#66d2ba] hover:bg-[#52ba9f] text-white px-8 py-6 rounded-xl text-lg font-medium"
              >
                Avançar
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <p className="text-gray-600">
              Para cada disciplina, selecione a <u>importância</u> para sua prova e seu <u>grau de conhecimento</u>.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {selectedSubjects.map(sub => (
                  <Card key={sub} className="shadow-sm border-gray-100">
                    <CardContent className="p-5 space-y-5">
                       <h3 className="font-bold text-gray-800 text-center">{sub}</h3>
                       <div>
                         <div className="flex justify-between text-xs text-gray-400 font-medium mb-2 tracking-widest">
                           <span>IMPORTÂNCIA</span>
                           <span>{subjectDetails[sub]?.importance || 3}</span>
                         </div>
                         <Slider 
                            min={1} max={5} step={1} 
                            value={[subjectDetails[sub]?.importance || 3]} 
                            onValueChange={(val) => handleDetailChange(sub, 'importance', val[0])}
                            className="[&>span:first-child]:bg-teal-200 [&>span:first-child>span]:bg-teal-500 [&>span:last-child]:bg-teal-500"
                         />
                       </div>
                       <div>
                         <div className="flex justify-between text-xs text-gray-400 font-medium mb-2 tracking-widest">
                           <span>CONHECIMENTO</span>
                           <span>{subjectDetails[sub]?.knowledge || 3}</span>
                         </div>
                         <Slider 
                            min={1} max={5} step={1} 
                            value={[subjectDetails[sub]?.knowledge || 3]} 
                            onValueChange={(val) => handleDetailChange(sub, 'knowledge', val[0])} 
                            className="[&>span:first-child]:bg-teal-200 [&>span:first-child>span]:bg-teal-500 [&>span:last-child]:bg-teal-500"
                         />
                       </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="space-y-3 flex flex-col">
                <AnimatePresence>
                  {[...selectedSubjects]
                    .sort((a, b) => (calculatedPercentages[b] || 0) - (calculatedPercentages[a] || 0))
                    .map(sub => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      key={sub} 
                      className="flex items-center rounded-lg border-2" 
                      style={{ backgroundColor: getColorForSub(sub) + '30', borderColor: getColorForSub(sub) + '80' }}
                    >
                      <div className="px-5 py-4 font-bold border-r-2" style={{ borderColor: getColorForSub(sub) + '80', color: '#334155' }}>
                        {calculatedPercentages[sub]?.toFixed(0)}%
                      </div>
                      <div className="px-4 py-3 flex-1 font-medium text-gray-800 text-center">
                        {sub}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
            <div className="flex justify-between pt-6 border-t mt-8">
              <Button variant="outline" onClick={() => setStep(1)} className="px-8 py-6 rounded-xl text-lg font-medium text-teal-600 border-teal-200 hover:bg-teal-50">
                Voltar
              </Button>
              <Button onClick={() => setStep(3)} className="bg-[#66d2ba] hover:bg-[#52ba9f] text-white px-8 py-6 rounded-xl text-lg font-medium">
                Avançar
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-10 max-w-2xl mx-auto py-8">
            <div className="space-y-4">
              <Label className="text-lg text-gray-700 font-medium">Quantas horas, em média, pretende estudar por semana?</Label>
              <Input 
                type="number" 
                min={1} max={100} 
                value={weeklyHours} 
                onChange={(e) => setWeeklyHours(e.target.value)} 
                className="w-32 text-lg h-12 text-center" 
              />
            </div>

            <div className="space-y-4">
              <Label className="text-lg text-gray-700 font-medium">Em quais dias você pretende estudar?</Label>
              <div className="flex flex-wrap gap-2 bg-gray-100 p-2 rounded-xl">
                {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(day => (
                  <Button 
                    key={day}
                    variant={studyDays.includes(day) ? 'default' : 'ghost'}
                    onClick={() => {
                      if(studyDays.includes(day)) setStudyDays(studyDays.filter(d => d !== day));
                      else setStudyDays([...studyDays, day]);
                    }}
                    className={`rounded-lg flex-1 ${studyDays.includes(day) ? 'bg-slate-600 text-white hover:bg-slate-700' : 'text-slate-600 hover:bg-gray-200'}`}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-lg text-gray-700 font-medium">Qual duração mínima e máxima você deseja para uma sessão de estudos (disciplina)?</Label>
              <div className="flex items-center gap-4">
                <Select value={minDuration.toString()} onValueChange={(v) => setMinDuration(parseInt(v))}>
                  <SelectTrigger className="w-40 h-12 text-md bg-transparent border-b-2 border-t-0 border-l-0 border-r-0 border-teal-500 rounded-none focus:ring-0 px-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-gray-500 font-medium">a</span>
                <Select value={maxDuration.toString()} onValueChange={(v) => setMaxDuration(parseInt(v))}>
                  <SelectTrigger className="w-40 h-12 text-md bg-transparent border-b-2 border-t-0 border-l-0 border-r-0 border-teal-500 rounded-none focus:ring-0 px-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="90">1h 30min</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t mt-8">
              <Button variant="outline" onClick={() => setStep(2)} className="px-8 py-6 rounded-xl text-lg font-medium text-teal-600 border-teal-200 hover:bg-teal-50">
                Voltar
              </Button>
              <Button onClick={handleSaveWizard} className="bg-[#66d2ba] hover:bg-[#52ba9f] text-white px-8 py-6 rounded-xl text-lg font-medium">
                Concluir
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Dashboard calculations
  const totalMins = cycle.sequence.reduce((a, b) => a + b.duration_minutes, 0);
  const totalCompleted = cycle.sequence.reduce((a, b) => a + b.completed_minutes, 0);
  const progressPercentage = totalMins > 0 ? (totalCompleted / totalMins) * 100 : 0;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => setCycle(null)} className="text-gray-600 gap-2 px-2 hover:bg-gray-100 mr-2">
            <ArrowLeft className="w-5 h-5" /> Voltar
          </Button>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{cycle.name || "Planejamento"}</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="text-teal-600 border-teal-200 bg-teal-50 hover:bg-teal-100 rounded-lg px-6" onClick={handleRestartCycle}>
            Recomeçar Ciclo
          </Button>
          <Button className="bg-[#66d2ba] hover:bg-[#52ba9f] text-white rounded-lg px-6" onClick={() => {
            setSelectedSubjects(cycle.subjects.map(s => s.name));
            setWeeklyHours(cycle.weekly_hours);
            setStudyDays(cycle.study_days || []);
            setMinDuration(cycle.session_duration_min);
            setMaxDuration(cycle.session_duration_max);
            setStep(1);
            setShowWizard(true);
          }}>
            Editar Planejamento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <Card className="flex-1 shadow-sm border-gray-100">
              <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                <h3 className="text-xs font-bold text-gray-400 tracking-widest mb-4">CICLOS COMPLETOS</h3>
                <div className="w-20 h-20 rounded-full border-[6px] border-[#66d2ba] flex items-center justify-center text-3xl font-bold text-gray-800">
                  {cycle.completed_cycles_count || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card className="flex-[2] shadow-sm border-gray-100">
              <CardContent className="p-6">
                 <h3 className="text-xs font-bold text-gray-400 tracking-widest mb-4">PROGRESSO</h3>
                 <div className="mb-3 text-sm text-gray-500 font-bold">
                   {formatMins(totalCompleted)} / {formatMins(totalMins)}
                 </div>
                 <Progress value={progressPercentage} className="h-4 bg-gray-100 [&>div]:bg-[#66d2ba] rounded-full" />
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border-gray-100">
            <CardContent className="p-6">
              <h3 className="text-xs font-bold text-gray-400 tracking-widest mb-6">SEQUÊNCIA DOS ESTUDOS</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {cycle.sequence.map((seq) => {
                  const isCompleted = seq.completed_minutes >= seq.duration_minutes;
                  return (
                    <div key={seq.id} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${isCompleted ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200 hover:border-teal-200'}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-10 rounded-full" style={{ backgroundColor: seq.color }}></div>
                        <span className="font-bold text-gray-700 text-sm md:text-base">{seq.subject}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-sm text-gray-500 font-semibold">{formatMins(seq.completed_minutes)} / {formatMins(seq.duration_minutes)}</span>
                        {isCompleted ? (
                          <div className="w-10 h-10 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-[#66d2ba]" />
                          </div>
                        ) : (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-10 w-10 rounded-full bg-teal-50 text-teal-600 hover:bg-[#66d2ba] hover:text-white transition-colors" 
                            onClick={() => {
                              setRegisterTimeFor(seq);
                              setTimeInput((seq.duration_minutes - seq.completed_minutes).toString());
                            }}
                          >
                            <Play className="w-4 h-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex justify-end">
                <Button className="bg-[#66d2ba] hover:bg-[#52ba9f] text-white px-8 rounded-lg font-medium" onClick={() => {
                  setStep(3);
                  setShowWizard(true);
                }}>
                  Ajustar Ciclo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="md:col-span-1 shadow-sm border-gray-100">
          <CardContent className="p-6 h-full flex flex-col">
            <h3 className="text-xs font-bold text-gray-400 tracking-widest mb-6">CICLO</h3>
            <div className="flex-1 relative min-h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cycle.sequence}
                    cx="50%"
                    cy="50%"
                    innerRadius="65%"
                    outerRadius="85%"
                    dataKey="duration_minutes"
                    stroke="none"
                    paddingAngle={2}
                    cornerRadius={4}
                  >
                    {cycle.sequence.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(val, name, props) => [`${formatMins(val)}`, props.payload.subject]}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-3xl font-bold text-gray-700">{formatMins(totalMins)}</span>
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              {cycle.subjects.map(s => (
                <div key={s.name} className="flex items-center gap-2 text-xs font-medium text-gray-600">
                  <div className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: s.color }}></div>
                  <span className="truncate max-w-[120px]" title={s.name}>{s.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!registerTimeFor} onOpenChange={(v) => !v && setRegisterTimeFor(null)}>
        <DialogContent className="sm:max-w-[425px] bg-white border-0 shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Registrar Estudo</DialogTitle>
            <DialogDescription className="text-gray-500 pt-2">
              Quantos minutos você estudou <strong className="text-gray-800">{registerTimeFor?.subject}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <Label className="text-sm font-semibold text-gray-600 mb-2 block">Minutos estudados</Label>
            <Input 
              type="number" 
              value={timeInput} 
              onChange={(e) => setTimeInput(e.target.value)} 
              className="text-lg h-12 font-medium"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button variant="outline" onClick={() => setRegisterTimeFor(null)} className="rounded-lg font-medium border-gray-200">
              Cancelar
            </Button>
            <Button onClick={confirmRegisterTime} className="bg-[#66d2ba] hover:bg-[#52ba9f] text-white rounded-lg font-medium px-6">
              Salvar Tempo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}