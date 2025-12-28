
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadPrivateFile } from '@/integrations/Core';
import { ProvaEnviada } from '@/entities/ProvaEnviada';
import { User } from '@/entities/User';
import { Loader2, UploadCloud, FileText, CheckCircle, AlertTriangle, Trash2, X, Lightbulb } from 'lucide-react';

const bancaOptions = [
  { value: "fcc", label: "FCC" },
  { value: "cespe", label: "CESPE/CEBRASPE" },
  { value: "vunesp", label: "VUNESP" },
  { value: "fgv", label: "FGV" },
  { value: "cesgranrio", label: "CESGRANRIO" },
  { value: "esaf", label: "ESAF" },
  { value: "idecan", label: "IDECAN" },
  { value: "fundatec", label: "FUNDATEC" },
  { value: "consulplan", label: "CONSULPLAN" },
  { value: "instituto_aocp", label: "AOCP" },
  { value: "ibade", label: "IBADE" },
  { value: "quadrix", label: "QUADRIX" },
  { value: "ibfc", label: "IBFC" },
  { value: "objetiva", label: "Objetiva" },
  { value: "iades", label: "IADES" },
  { value: "itame", label: "ITAME" },
  { value: "outras", label: "Outras" }
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
  { value: "professor", label: "Professor" },
  { value: "tecnico_bancario", label: "Técnico Bancário" },
  { value: "tecnico_receita_federal", label: "Técnico da Receita Federal" },
  { value: "tecnico_judiciario", label: "Técnico Judiciário" },
  { value: "outros", label: "Outros" }
];

const instituicaoOptions = [
  { value: "tribunal_justica", label: "Tribunal de Justiça" },
  { value: "tribunal_regional_trabalho", label: "Tribunal Regional do Trabalho" },
  { value: "tribunal_superior_trabalho", label: "Tribunal Superior do Trabalho" },
  { value: "supremo_tribunal_federal", label: "Supremo Tribunal Federal" },
  { value: "superior_tribunal_justica", label: "Superior Tribunal de Justiça" },
  { value: "receita_federal", label: "Receita Federal" },
  { value: "policia_federal", label: "Polícia Federal" },
  { value: "policia_civil", label: "Polícia Civil" },
  { value: "detran", label: "DETRAN" },
  { value: "inss", label: "INSS" },
  { value: "ministerio_publico", label: "Ministério Público" },
  { value: "prefeitura", label: "Prefeitura" },
  { value: "governo_estadual", label: "Governo Estadual" },
  { value: "banco_brasil", label: "Banco do Brasil" },
  { value: "caixa_economica", label: "Caixa Econômica Federal" },
  { value: "outros", label: "Outros" }
];

export default function ProvaUploader({ isOpen, onOpenChange }) {
  const [formData, setFormData] = useState({
    banca: '',
    cargo: '',
    instituicao: '',
    data_prova: '',
    ano_edital: ''
  });
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef(null);
  const [user, setUser] = useState(null);

  const MAX_FILES = 10;

  useEffect(() => {
    const fetchUser = async () => {
        try {
            const userData = await User.me();
            setUser(userData);
        } catch (error) {
            console.error("Usuário não autenticado:", error);
        }
    };
    if (isOpen) {
        fetchUser();
    }
  }, [isOpen]);

  const validateAndSetFiles = (selectedFiles) => {
    setUploadStatus('idle');
    setErrorMessage('');

    if (!selectedFiles || selectedFiles.length === 0) return;
    
    if (files.length + selectedFiles.length > MAX_FILES) {
        setErrorMessage(`Você pode enviar no máximo ${MAX_FILES} arquivos por vez.`);
        return;
    }

    const allowedTypes = ['application/pdf', 'image/png', 'application/zip', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    let validNewFiles = [];
    let errors = [];

    for (const file of selectedFiles) {
        if (!allowedTypes.includes(file.type)) {
            errors.push(`'${file.name}' formato não aceito.`);
            continue;
        }
        if (file.size > maxSize) {
            errors.push(`'${file.name}' excede 50MB.`);
            continue;
        }
        validNewFiles.push(file);
    }
    
    setFiles(prev => [...prev, ...validNewFiles].slice(0, MAX_FILES));
    
    if (errors.length > 0) {
        setErrorMessage(errors.join(' '));
    }
  };

  const handleDragEvents = (e) => { // Renamed from handleDrag
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else if (e.type === "dragleave") setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFiles(Array.from(e.dataTransfer.files));
    }
  };
  
  const handleFileSelect = (e) => {
      e.preventDefault();
      if(e.target.files && e.target.files.length > 0){
        validateAndSetFiles(Array.from(e.target.files));
        e.target.value = null;
      }
  };
  
  const removeFile = (indexToRemove) => { // Renamed from handleRemoveFile
      setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  const handleFormChange = (field, value) => { // Renamed from handleInputChange
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getYears = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({length: 30}, (_, i) => currentYear - i);
  };

  const handleSubmit = async () => { // Renamed from handleUpload
    if (!user) {
        setErrorMessage("Você precisa estar logado para enviar provas.");
        return;
    }
    
    for (const key in formData) {
        if (!formData[key]) {
            setErrorMessage("Por favor, preencha todos os campos do formulário.");
            return;
        }
    }

    if (files.length === 0) {
      setErrorMessage('Por favor, selecione pelo menos um arquivo para enviar.');
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');
    setErrorMessage('');

    try {
      for (const file of files) {
        const { file_uri } = await UploadPrivateFile({ file });
        if (!file_uri) throw new Error(`Falha ao obter URI para ${file.name}.`);
    
        await ProvaEnviada.create({
          file_name: file.name,
          file_uri: file_uri,
          user_email: user.email,
          user_name: user.full_name || user.email,
          metadata: { // Keep metadata structure
            banca: formData.banca,
            cargo: formData.cargo,
            instituicao: formData.instituicao,
            data_prova: formData.data_prova,
            ano_edital: formData.ano_edital
          },
          status: 'pendente'
        });
      }

      setUploadStatus('success');
      setFiles([]);
      // Do not clear the form data to facilitate multiple submissions
    } catch (error) {
      console.error('Erro no upload:', error);
      setUploadStatus('error');
      setErrorMessage('Ocorreu um erro durante o upload. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const resetForm = () => { // Renamed from resetState
    setFiles([]);
    setFormData({
      banca: '',
      cargo: '',
      instituicao: '',
      data_prova: '',
      ano_edital: ''
    });
    setUploadStatus('idle');
    setErrorMessage('');
    setIsDragActive(false);
  };

  const years = getYears();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if(!open) resetForm(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {uploadStatus === 'success' ? (
          <div className="flex flex-col items-center justify-center p-12 text-center h-[500px]">
            <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
            <h3 className="text-2xl font-bold text-green-700 mb-2">Arquivos enviados com sucesso!</h3>
            <p className="text-gray-600 text-lg">Agradecemos sua contribuição para construir uma plataforma ainda mais completa!</p>
          </div>
        ) : ( // Render the main form and sidebar if not success
          <div className="flex">
            {/* Coluna Esquerda com header e formulário */}
            <div className="w-full lg:w-2/3 p-8 pr-4">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Envio de provas e gabaritos</h2>
                <p className="text-gray-600">Envie suas provas e gabaritos de concursos públicos e nos ajude a construir uma plataforma ainda mais completa!</p>
              </div>
              
              <div className="border-b border-gray-200 mb-6">
                  <span className="inline-block px-1 py-2 border-b-2 border-blue-600 text-blue-600 font-semibold">
                      Enviar arquivos
                  </span>
              </div>

              <p className="text-sm text-gray-800 mb-1">Preencha os campos a seguir, conforme a prova e o gabarito que você irá enviar</p>
              <div className="flex justify-end mb-4">
                  <a href="#" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      <Lightbulb className="w-3 h-3"/>
                      Dicas para enviar um bom arquivo!
                  </a>
              </div>

              {/* Formulário */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div>
                  <Label htmlFor="banca" className="text-gray-700 font-medium">Banca</Label>
                  <Select value={formData.banca} onValueChange={(value) => handleFormChange('banca', value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Banca" />
                    </SelectTrigger>
                    <SelectContent>
                      {bancaOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cargo" className="text-gray-700 font-medium">Cargo</Label>
                  <Select value={formData.cargo} onValueChange={(value) => handleFormChange('cargo', value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {cargoOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="instituicao" className="text-gray-700 font-medium">Instituição</Label>
                  <Select value={formData.instituicao} onValueChange={(value) => handleFormChange('instituicao', value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Instituição" />
                    </SelectTrigger>
                    <SelectContent>
                      {instituicaoOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="data_prova" className="text-gray-700 font-medium">Data da prova</Label>
                  <Input
                    id="data_prova"
                    type="date"
                    value={formData.data_prova}
                    onChange={(e) => handleFormChange('data_prova', e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div className="md:col-span-1">
                  <Label htmlFor="ano_edital" className="text-gray-700 font-medium">Ano do edital</Label>
                  <Select value={formData.ano_edital} onValueChange={(value) => handleFormChange('ano_edital', value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Ano do edital" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Área de Upload */}
              <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors
                                ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}`}
                   onDragEnter={handleDragEvents}
                   onDragLeave={handleDragEvents}
                   onDragOver={handleDragEvents}
                   onDrop={handleDrop}
              >
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.zip,.png"
                />
                <div className="text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-semibold text-blue-600">Selecione um o mais arquivos</span> ou arraste e solte-os aqui
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Lembre-se de selecionar a prova e o gabarito do concurso.</p>
                  <p className="text-xs text-gray-500">São aceitos arquivos nos formatos DOC, PDF ou ZIP, no tamanho máximo total de 50 MB.</p>
                   <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={() => inputRef.current?.click()}
                  >
                      Selecionar arquivos
                  </Button>
                </div>
              </div>

              {/* Mensagem de erro */}
              {errorMessage && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-red-700">{errorMessage}</p>
                </div>
              )}

              {/* Lista de Arquivos */}
              {files.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-800 mb-4">Arquivos selecionados:</h4>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-800">{file.name}</p>
                            <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botão de Envio */}
              <div className="mt-8 flex justify-end">
                <Button 
                  onClick={handleSubmit}
                  disabled={isUploading || files.length === 0 || !user}
                  className="w-full md:w-auto"
                >
                  {isUploading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                  ) : (
                    `Enviar Prova${files.length !== 1 ? 's' : ''}`
                  )}
                </Button>
              </div>
            </div>
            
            {/* Sidebar de dicas */}
            <div className="hidden lg:block lg:w-1/3 p-8 pl-4 border-l border-gray-200">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 sticky top-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Lightbulb className="w-5 h-5 text-yellow-600" />
                        <h4 className="font-semibold text-yellow-800">Dicas para enviar um bom arquivo!</h4>
                    </div>
                    <div className="space-y-3 text-sm text-yellow-700">
                        <div>
                            <p className="font-medium">✓ Qualidade da imagem</p>
                            <p>Certifique-se de que o texto esteja legível e bem nítido.</p>
                        </div>
                        <div>
                            <p className="font-medium">✓ Prova completa</p>
                            <p>Envie todas as páginas da prova, incluindo o gabarito oficial.</p>
                        </div>
                        <div>
                            <p className="font-medium">✓ Formatos aceitos</p>
                            <p>PDF, DOC, ZIP ou imagens PNG. Máximo de 50MB por envio.</p>
                        </div>
                        <div>
                            <p className="font-medium">✓ Informações corretas</p>
                            <p>Preencha os campos com dados precisos da prova.</p>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
