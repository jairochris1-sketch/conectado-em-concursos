
import { useState } from 'react';
import { StudyMaterial } from '@/entities/StudyMaterial';
import { Notification } from '@/entities/Notification';
import { UploadFile } from '@/integrations/Core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Image, Loader2, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const cargoOptions = [
  { value: "materiais_questoes", label: "📝 Materiais de Questões" },
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
  { value: "professor_educacao_basica", label: "Professor (Educação Básica)" },
  { value: "professor_matematica", label: "Professor (Matemática)" },
  { value: "professor_portugues", label: "Professor (Português)" },
  { value: "tecnico_bancario", label: "Técnico Bancário" },
  { value: "tecnico_receita_federal", label: "Técnico da Receita Federal" },
  { value: "tecnico_informatica", label: "Técnico em Informática" },
  { value: "tecnico_judiciario", label: "Técnico Judiciário" }
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
  { value: "pedagogia", label: "Pedagogia" },
  { value: "lei_8112", label: "Lei 8.112/90" },
  { value: "lei_8666", label: "Lei 8.666/93" },
  { value: "lei_14133", label: "Lei 14.133/21" },
  { value: "constituicao_federal", label: "Constituição Federal" }
];

const typeOptions = [
  { value: "teoria", label: "Teoria" },
  { value: "revisao", label: "Revisão" },
  { value: "exercicio", label: "Exercício" },
  { value: "resumo", label: "Resumo" },
  { value: "leis", label: "Leis" },
  { value: "chatgpt", label: "ChatGPT" }
];

export default function StudyMaterialUploader({ onMaterialUploaded, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'teoria',
    cargo: '',
    subjects: [],
    tags: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubjectToggle = (subjectValue) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subjectValue)
        ? prev.subjects.filter(s => s !== subjectValue)
        : [...prev.subjects, subjectValue]
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileType = file.type.includes('pdf') ? 'pdf' : 'image';
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      
      if (!allowedTypes.includes(file.type)) {
        alert('Apenas arquivos PDF, PNG, JPG e JPEG são permitidos.');
        return;
      }
      
      setSelectedFile({ file, type: fileType });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Agora somente título e arquivo (quando não for ChatGPT) são obrigatórios
    if (!selectedFile && formData.type !== 'chatgpt') {
      alert('Por favor, selecione um arquivo.');
      return;
    }
    if (!formData.title.trim()) {
      alert('Por favor, informe o título do material.');
      return;
    }

    setIsUploading(true);
    try {
      let file_url = '';
      let file_type = '';
      let file_name = '';

      if (selectedFile) {
        // Upload do arquivo
        const uploadResult = await UploadFile({ file: selectedFile.file });
        file_url = uploadResult.file_url;
        file_type = selectedFile.type;
        file_name = selectedFile.file.name;
      } else if (formData.type === 'chatgpt') {
        // For ChatGPT type, file_url can be a placeholder or null if content is directly in description
        file_url = 'N/A'; 
        file_type = 'text'; // Assuming text content for ChatGPT
        file_name = 'Conteúdo Gerado por IA';
      }
      
      // Criar material
      await StudyMaterial.create({
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        cargo: formData.cargo || undefined, // Make cargo optional
        subjects: formData.subjects || [],   // Subjects are now optional
        file_url: file_url,
        file_type: file_type,
        file_name: file_name,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      });

      // Criar notificação automática para novo material
      try {
        await Notification.create({
          title: 'Novo Material Disponível! 📚',
          message: `Foi adicionado um novo material: "${formData.title}"`, // Updated message
          type: 'new_material',
          is_global: true,
          target_users: [],
          action_url: '/studies' // Direciona para a área de estudos
        });
      } catch (notificationError) {
        // Não quebrar o fluxo se a notificação falhar
        console.error('Erro ao criar notificação:', notificationError);
      }

      alert('Material adicionado com sucesso!');
      onMaterialUploaded?.(); // Safely call onMaterialUploaded
    } catch (error) {
      console.error('Erro ao adicionar material:', error);
      alert('Erro ao adicionar material. Tente novamente.');
    }
    setIsUploading(false);
  };

  const isFileRequired = formData.type !== 'chatgpt';

  return (
    <Card className="dark:bg-gray-800 dark:text-gray-50 dark:border-gray-700">
      <CardHeader className="dark:border-b dark:border-gray-700">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 dark:text-gray-50">
            <Upload className="w-5 h-5" />
            Adicionar Material de Estudo
          </CardTitle>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title" className="dark:text-gray-200">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Digite o título do material"
                required
                className="dark:bg-gray-700 dark:text-gray-50 dark:border-gray-600 focus:dark:ring-blue-500 focus:dark:border-blue-500"
              />
            </div>

            <div>
              <Label htmlFor="type" className="dark:text-gray-200">Tipo de Material *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger className="dark:bg-gray-700 dark:text-gray-50 dark:border-gray-600 focus:dark:ring-blue-500 focus:dark:border-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:text-gray-50 dark:border-gray-600">
                  {typeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value} className="dark:hover:bg-gray-600 dark:focus:bg-gray-600">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="cargo" className="dark:text-gray-200">Cargo (opcional)</Label>
              <Select value={formData.cargo} onValueChange={(value) => handleInputChange('cargo', value)}>
                <SelectTrigger className="dark:bg-gray-700 dark:text-gray-50 dark:border-gray-600 focus:dark:ring-blue-500 focus:dark:border-blue-500">
                  <SelectValue placeholder="Selecione um cargo (opcional)" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:text-gray-50 dark:border-gray-600">
                  {cargoOptions.map(option => (
                    <SelectItem key={option.value} value={option.value} className="dark:hover:bg-gray-600 dark:focus:bg-gray-600">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="dark:text-gray-200 mb-3 block">Disciplinas (opcional)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-4 border rounded-lg dark:border-gray-600">
              {subjectOptions.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`subject-${option.value}`}
                    checked={formData.subjects.includes(option.value)}
                    onCheckedChange={() => handleSubjectToggle(option.value)}
                    className="dark:border-gray-500 dark:bg-gray-700 data-[state=checked]:dark:bg-indigo-600 data-[state=checked]:dark:text-gray-50"
                  />
                  <label
                    htmlFor={`subject-${option.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer dark:text-gray-200"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
            {formData.subjects.length > 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {formData.subjects.length} disciplina(s) selecionada(s)
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description" className="dark:text-gray-200">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descreva o conteúdo do material"
              rows={3}
              className="dark:bg-gray-700 dark:text-gray-50 dark:border-gray-600 focus:dark:ring-blue-500 focus:dark:border-blue-500"
            />
          </div>

          <div>
            <Label htmlFor="tags" className="dark:text-gray-200">Tags (separadas por vírgula)</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              placeholder="Ex: concurso, resumo, importante"
              className="dark:bg-gray-700 dark:text-gray-50 dark:border-gray-600 focus:dark:ring-blue-500 focus:dark:border-blue-500"
            />
          </div>

          {isFileRequired && ( // Conditionally render file input
            <div>
              <Label htmlFor="file" className="dark:text-gray-200">Arquivo (PDF ou Imagem) *</Label>
              <div className="mt-2">
                <input
                  id="file"
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-600 dark:file:text-indigo-50 dark:hover:file:bg-indigo-700 dark:text-gray-400"
                  required={isFileRequired}
                />
                {selectedFile && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    {selectedFile.type === 'pdf' ? <FileText className="w-4 h-4" /> : <Image className="w-4 h-4" />}
                    <span>{selectedFile.file.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel} className="dark:bg-gray-700 dark:text-gray-50 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-50">
              Cancelar
            </Button>
            <Button type="submit" disabled={isUploading} className="dark:bg-indigo-600 dark:text-white dark:hover:bg-indigo-700">
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Adicionar Material
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
