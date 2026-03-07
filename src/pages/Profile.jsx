import { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { UserFollow } from "@/entities/all";
import { UploadFile } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Save, User as UserIcon, Loader2, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ProfileStatsCard from "@/components/profile/ProfileStatsCard";
// Link is no longer used, but keeping it for now if createPageUrl still uses it or other parts. If not, it can be removed.
// createPageUrl is no longer used, can be removed if not used elsewhere.

const brazilianStates = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" }
];

const subjectOptions = [
  { value: "portugues", label: "Português" },
  { value: "matematica", label: "Matemática" },
  { value: "direito_constitucional", label: "Direito Constitucional" },
  { value: "direito_administrativo", label: "Direito Administrativo" },
  { value: "direito_penal", label: "Direito Penal" },
  { value: "direito_civil", label: "Direito Civil" },
  { value: "informatica", label: "Informática" },
  { value: "conhecimentos_gerais", label: "Conhecimentos Gerais" },
  { value: "raciocinio_logico", label: "Raciocínio Lógico" },
  { value: "contabilidade", label: "Contabilidade" },
  { value: "pedagogia", label: "Pedagogia" }
];

const cargoOptions = [
  { value: "advogado", label: "Advogado" },
  { value: "agente_de_limpeza", label: "Agente de Limpeza" },
  { value: "agente_policia", label: "Agente de Polícia" },
  { value: "agente_policia_federal", label: "Agente de Polícia Federal" },
  { value: "agente_penitenciario", label: "Agente Penitenciário" },
  { value: "analista_bancario", label: "Analista Bancário" },
  { value: "analista_receita_federal", label: "Analista da Receita Federal" },
  { value: "analista_sistemas", label: "Analista de Sistemas" },
  { value: "analista_judiciario", label: "Analista Judiciário" },
  { value: "assistente_administrativo", label: "Assistente Administrativo" },
  { value: "auditor_fiscal", label: "Auditor Fiscal" },
  { value: "contador", label: "Contador" },
  { value: "delegado_policia", label: "Delegado de Polícia" },
  { value: "delegado_policia_civil", label: "Delegado de Polícia Civil" },
  { value: "delegado_policia_civil_substituto", label: "Delegado de Polícia Civil Substituto" },
  { value: "delegado_policia_federal", label: "Delegado de Polícia Federal" },
  { value: "delegado_policia_substituto", label: "Delegado de Polícia Substituto" },
  { value: "enfermeiro", label: "Enfermeiro" },
  { value: "engenheiro", label: "Engenheiro" },
  { value: "escrivao_policia_civil", label: "Escrivão de Polícia Civil" },
  { value: "escriturario", label: "Escriturário" },
  { value: "gari", label: "Gari" },
  { value: "guarda_civil_municipal", label: "Guarda Civil Municipal" },
  { value: "guarda_municipal", label: "Guarda Municipal" },
  { value: "medico", label: "Médico" },
  { value: "policial_civil", label: "Policial Civil" },
  { value: "policial_federal", label: "Policial Federal" },
  { value: "professor_1_ao_5_ano", label: "Professor - 1 ao 5 Ano Ensino Fundamental" },
  { value: "professor_artes", label: "Professor (Artes)" },
  { value: "professor_biologia", label: "Professor (Biologia)" },
  { value: "professor_ciencias", label: "Professor (Ciências)" },
  { value: "professor_educacao_basica", label: "Professor (Educação Básica)" },
  { value: "professor_educacao_fisica", label: "Professor (Educação Física)" },
  { value: "professor_fisica", label: "Professor (Física)" },
  { value: "professor_geografia", label: "Professor (Geografia)" },
  { value: "professor_historia", label: "Professor (História)" },
  { value: "professor_ingles", label: "Professor (Inglês)" },
  { value: "professor_matematica", label: "Professor (Matemática)" },
  { value: "professor_portugues", label: "Professor (Português)" },
  { value: "professor_quimica", label: "Professor (Química)" },
  { value: "professor_educacao_basica_anos_iniciais", label: "Professor de Educação Básica dos anos iniciais" },
  { value: "professor_educacao_basica_fundamental_medio", label: "Professor de Educação Básica - Ensino Fundamental e Médio" },
  { value: "tecnico_bancario", label: "Técnico Bancário" },
  { value: "tecnico_receita_federal", label: "Técnico da Receita Federal" },
  { value: "tecnico_informatica", label: "Técnico em Informática" },
  { value: "tecnico_judiciario", label: "Técnico Judiciário" }
];

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    profession: "",
    state: "",
    city: "",
    phone: "",
    target_position: "",
    study_hours_per_day: 0,
    preferred_subjects: [],
    profile_photo_url: "",
    instagram_url: "",
    linkedin_url: "",
    portfolio_url: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [showFollowersDialog, setShowFollowersDialog] = useState(false);
  const [showFollowingDialog, setShowFollowingDialog] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);
      setFormData({
        full_name: userData.full_name || "",
        email: userData.email || "",
        profession: userData.profession || "",
        state: userData.state || "",
        city: userData.city || "",
        phone: userData.phone || "",
        target_position: userData.target_position || "",
        study_hours_per_day: userData.study_hours_per_day || 0,
        preferred_subjects: userData.preferred_subjects || [],
        profile_photo_url: userData.profile_photo_url || "",
        instagram_url: userData.instagram_url || "",
        linkedin_url: userData.linkedin_url || "",
        portfolio_url: userData.portfolio_url || ""
      });

      const [followersList, followingList] = await Promise.all([
        UserFollow.filter({ following_email: userData.email }),
        UserFollow.filter({ follower_email: userData.email })
      ]);
      
      setFollowers(followersList);
      setFollowing(followingList);
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
    }
    setIsLoading(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubjectToggle = (subject) => {
    const updatedSubjects = formData.preferred_subjects.includes(subject)
      ? formData.preferred_subjects.filter(s => s !== subject)
      : [...formData.preferred_subjects, subject];
    
    handleInputChange('preferred_subjects', updatedSubjects);
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const { file_url } = await UploadFile({ file });
      handleInputChange('profile_photo_url', file_url);
    } catch (error) {
      console.error("Erro ao fazer upload da foto:", error);
      alert("Erro ao fazer upload da foto. Tente novamente.");
    }
    setIsUploadingPhoto(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await User.updateMyUserData(formData);
      alert("Perfil atualizado com sucesso!");
      loadUserData();
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
      alert("Erro ao salvar dados. Tente novamente.");
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Meu Perfil
          </h1>
          <p className="text-gray-600">
            Gerencie suas informações pessoais e preferências de estudo
          </p>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            {/* Foto de perfil */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5" />
                    Foto de Perfil
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={formData.profile_photo_url} />
                        <AvatarFallback className="text-2xl">
                          {formData.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <label
                        htmlFor="photo-upload"
                        className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors"
                      >
                        {isUploadingPhoto ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                      </label>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={isUploadingPhoto}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{formData.full_name || 'Usuário'}</h3>
                      <p className="text-sm text-gray-600">{formData.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Clique no ícone da câmera para alterar sua foto
                      </p>
                      <ProfileStatsCard user={user} />
                      <div className="flex gap-4 mt-3">
                        <Dialog open={showFollowersDialog} onOpenChange={setShowFollowersDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Users className="w-4 h-4 mr-1" />
                              {followers.length} Seguidores
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Seguidores</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {followers.map(follower => (
                                <div key={follower.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                                  <Avatar className="w-10 h-10">
                                    <AvatarImage src={follower.following_photo_url} />
                                    <AvatarFallback>{follower.following_name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{follower.following_name}</span>
                                </div>
                              ))}
                              {followers.length === 0 && (
                                <p className="text-center text-gray-500 py-8">Você ainda não tem seguidores</p>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Dialog open={showFollowingDialog} onOpenChange={setShowFollowingDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Users className="w-4 h-4 mr-1" />
                              {following.length} Seguindo
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Seguindo</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {following.map(follow => (
                                <div key={follow.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                                  <Avatar className="w-10 h-10">
                                    <AvatarImage src={follow.following_photo_url} />
                                    <AvatarFallback>{follow.following_name?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{follow.following_name}</span>
                                </div>
                              ))}
                              {following.length === 0 && (
                                <p className="text-center text-gray-500 py-8">Você ainda não segue ninguém</p>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Informações pessoais */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Nome Completo</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        placeholder="Digite seu nome completo"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="profession">Profissão</Label>
                      <Input
                        id="profession"
                        value={formData.profession}
                        onChange={(e) => handleInputChange('profession', e.target.value)}
                        placeholder="Ex: Professor, Advogado, Estudante..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="state">Estado</Label>
                      <Select
                        value={formData.state}
                        onValueChange={(value) => handleInputChange('state', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione seu estado" />
                        </SelectTrigger>
                        <SelectContent>
                          {brazilianStates.map(state => (
                            <SelectItem key={state.value} value={state.value}>
                              {state.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Digite sua cidade"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Informações de estudo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Preferências de Estudo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="target_position">Cargo Pretendido</Label>
                      <Select
                        value={formData.target_position}
                        onValueChange={(value) => handleInputChange('target_position', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cargo pretendido" />
                        </SelectTrigger>
                        <SelectContent>
                          {cargoOptions.map(cargo => (
                            <SelectItem key={cargo.value} value={cargo.value}>
                              {cargo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="study_hours">Horas de Estudo por Dia</Label>
                      <Input
                        id="study_hours"
                        type="number"
                        min="0"
                        max="24"
                        value={formData.study_hours_per_day}
                        onChange={(e) => handleInputChange('study_hours_per_day', parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div>
                      <Label>Disciplinas Preferidas</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {subjectOptions.map(subject => (
                          <label
                            key={subject.value}
                            className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                              formData.preferred_subjects.includes(subject.value)
                                ? 'bg-blue-50 border-blue-300'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.preferred_subjects.includes(subject.value)}
                              onChange={() => handleSubjectToggle(subject.value)}
                              className="rounded text-blue-600"
                            />
                            <span className="text-sm">{subject.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Redes Sociais - Apenas Admins */}
            {(user?.email === 'conectadoemconcursos@gmail.com' || user?.email === 'jairochris1@gmail.com' || user?.email === 'juniorgmj2016@gmail.com') && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Redes Sociais e Portfólio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="instagram_url">Instagram</Label>
                        <Input
                          id="instagram_url"
                          value={formData.instagram_url}
                          onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                          placeholder="https://instagram.com/seu_usuario"
                        />
                      </div>
                      <div>
                        <Label htmlFor="linkedin_url">LinkedIn</Label>
                        <Input
                          id="linkedin_url"
                          value={formData.linkedin_url}
                          onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                          placeholder="https://linkedin.com/in/seu_usuario"
                        />
                      </div>
                      <div>
                        <Label htmlFor="portfolio_url">Site ou Portfólio</Label>
                        <Input
                          id="portfolio_url"
                          value={formData.portfolio_url}
                          onChange={(e) => handleInputChange('portfolio_url', e.target.value)}
                          placeholder="https://seusite.com.br"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Botão de salvar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-end"
            >
              <Button
                type="submit"
                size="lg"
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </form>
      </div>
    </div>
  );
}