
import React, { useState, useEffect, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Question } from '@/entities/Question';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Loader2 } from 'lucide-react';

// *** IMPORTANTE: ESTES OPTIONS DEVEM SER IDÊNTICOS AOS DO FILTRO ***
const subjectOptions = [
  { value: "portugues", label: "Português" },
  { value: "matematica", label: "Matemática" },
  { value: "direito_constitucional", label: "Direito Constitucional" },
  { value: "direito_administrativo", label: "Direito Administrativo" },
  { value: "direito_penal", label: "Direito Penal" },
  { value: "direito_civil", label: "Direito Civil" },
  { value: "direito_tributario", label: "Direito Tributário" },
  { value: "direito_previdenciario", label: "Direito Previdenciário" },
  { value: "direito_eleitoral", label: "Direito Eleitoral" },
  { value: "direito_ambiental", label: "Direito Ambiental" },
  { value: "administracao_geral", label: "Administração Geral" },
  { value: "administracao_publica", label: "Administração Pública" },
  { value: "administracao_recursos_materiais", label: "Administração de Recursos Materiais" },
  { value: "afo", label: "Administração Financeira e Orçamentária (AFO)" },
  { value: "financas_publicas", label: "Finanças Públicas" },
  { value: "etica_administracao", label: "Ética na Administração" },
  { value: "arquivologia", label: "Arquivologia" },
  { value: "atendimento_publico", label: "Atendimento ao Público" },
  { value: "direitos_humanos", label: "Direitos Humanos" },
  { value: "eca", label: "Direito da Criança e do Adolescente (ECA)" },
  { value: "informatica", label: "Informática" },
  { value: "conhecimentos_gerais", label: "Conhecimentos Gerais" },
  { value: "raciocinio_logico", label: "Raciocínio Lógico" },
  { value: "contabilidade", label: "Contabilidade" },
  { value: "economia", label: "Economia" },
  { value: "estatistica", label: "Estatística" },
  { value: "pedagogia", label: "Pedagogia" },
  { value: "seguranca_publica", label: "Segurança Pública" },
  { value: "lei_8112", label: "Lei 8.112/90" },
  { value: "lei_8666", label: "Lei 8.666/93" },
  { value: "lei_14133", label: "Lei 14.133/21" },
  { value: "constituicao_federal", label: "Constituição Federal" },
  { value: "regimento_interno", label: "Regimento Interno" },
  { value: "legislacao_estadual", label: "Legislação Estadual" },
  { value: "legislacao_municipal", label: "Legislação Municipal" }
];

const topicOptions = [
  // Português - ASSUNTOS COMPLETOS
  { value: "acentuacao_grafica", label: "Acentuação Gráfica" },
  { value: "adjetivos", label: "Adjetivos" },
  { value: "adjunto_adverbial", label: "Adjunto Adverbial" },
  { value: "analise_das_estruturas_linguisticas_do_texto", label: "Análise das Estruturas Linguísticas do Texto" },
  { value: "analise_sintatica", label: "Análise Sintática" },
  { value: "classes_palavras", label: "Classes de Palavras" },
  { value: "coesao_coerencia", label: "Coesão e Coerência" },
  { value: "coesao_referencial", label: "Coesão Referencial" },
  { value: "colocacao_pronominal", label: "Colocação Pronominal" },
  { value: "concordancia", label: "Concordância" },
  { value: "concordancia_verbal", label: "Concordância Verbal" },
  { value: "conhecimentos_especificos_de_linguistica", label: "Conhecimentos Específicos de Linguística" },
  { value: "conjuncoes_coordenativas_conclusivas", label: "Conjunções Coordenativas Conclusivas" },
  { value: "crase", label: "Crase" },
  { value: "deslocamento_termos_oracao", label: "Mudança de Posição/Ordem (Deslocamento)" },
  { value: "emprego_do_sinal_indicativo_de_crase", label: "Emprego do Sinal Indicativo de Crase" },
  { value: "emprego_dos_sinais_de_pontuacao", label: "Emprego dos Sinais de Pontuação" },
  { value: "equivalencia_e_substituicao_de_palavras", label: "Equivalência e Substituição de Palavras" },
  { value: "estilistica", label: "Estilística" },
  { value: "figuras_linguagem", label: "Figuras de Linguagem" },
  { value: "fonetica", label: "Fonética" },
  { value: "fonologia", label: "Fonologia" },
  { value: "formacao_palavras", label: "Formação de Palavras" },
  { value: "funcao_textual_dos_vocabulos", label: "Função Textual dos Vocábulos" },
  { value: "funcoes_da_linguagem", label: "Funções da Linguagem" },
  { value: "funcoes_morfossintaticas_da_palavra_que", label: "Funções Morfossintáticas da Palavra QUE" },
  { value: "funcoes_morfossintaticas_da_palavra_se", label: "Funções Morfossintáticas da Palavra SE" },
  { value: "funcoes_sintaticas_da_palavra_que", label: "Funções Sintáticas da Palavra 'que'" },
  { value: "generos_textuais", label: "Gêneros Textuais" },
  { value: "grafia_correta_das_palavras", label: "Grafia Correta das Palavras" },
  { value: "gramatica", label: "Gramática" },
  { value: "hifen", label: "Hífen" },
  { value: "inferencia_textual", label: "Inferência Textual" },
  { value: "intertextualidade", label: "Intertextualidade" },
  { value: "interpretacao_texto", label: "Interpretação de Texto" },
  { value: "linguagem_informal_popular_coloquial", label: "Linguagem Informal/Popular/Coloquial" },
  { value: "literatura", label: "Literatura" },
  { value: "locucao_conjuntiva", label: "Locução Conjuntiva" },
  { value: "mecanismos_de_coesao_textual", label: "Mecanismos de Coesão Textual" },
  { value: "modo_indicativo", label: "Modo Indicativo" },
  { value: "morfologia", label: "Morfologia" },
  { value: "movimentos_literarios", label: "Movimentos Literários (Literatura Brasileira)" },
  { value: "niveis_de_linguagem", label: "Níveis de Linguagem (Níveis de Registro)" },
  { value: "nova_ortografia", label: "Nova Ortografia" },
  { value: "oracoes_coordenadas_adversativas", label: "Orações Coordenadas Adversativas" },
  { value: "oracoes_subordinadas_adverbiais_proporcionais", label: "Orações Subordinadas Adverbiais Proporcionais" },
  { value: "ortografia", label: "Ortografia" },
  { value: "periodo_composto_por_subordinacao", label: "Período Composto por Subordinação" },
  { value: "ponto_final", label: "Ponto Final" },
  { value: "pontuacao", label: "Pontuação" },
  { value: "pressupostos_e_subentendidos", label: "Pressupostos e Subentendidos" },
  { value: "pronomes", label: "Pronomes" },
  { value: "redacao_oficial", label: "Redação Oficial" },
  { value: "reescrita_de_frases_e_paragrafos", label: "Reescrita de Frases e Parágrafos" },
  { value: "regencia", label: "Regência" },
  { value: "regencia_nominal", label: "Regência Nominal" },
  { value: "regencia_verbal", label: "Regência Verbal" },
  { value: "relacoes_semanticas_entre_as_palavras", label: "Relações Semânticas entre as Palavras" },
  { value: "semantica", label: "Semântica" },
  { value: "significacao_das_palavras", label: "Significação das Palavras" },
  { value: "sintaxe", label: "Sintaxe" },
  { value: "tipos_de_discurso", label: "Tipos de Discurso" },
  { value: "uso_de_maiusculas_e_minusculas", label: "Uso de Maiúsculas e Minúsculas" },
  { value: "variacoes_linguisticas", label: "Variações Linguísticas" },
  { value: "verbos", label: "Verbos" },
  { value: "vozes_verbais", label: "Vozes Verbais" },
  
  // Matemática
  { value: "aritmetica", label: "Aritmética" },
  { value: "algebra", label: "Álgebra" },
  { value: "geometria", label: "Geometria" },
  { value: "porcentagem", label: "Porcentagem" },
  { value: "juros", label: "Juros" },
  { value: "probabilidade", label: "Probabilidade" },
  { value: "estatistica_basica", label: "Estatística Básica" },
  { value: "funcoes", label: "Funções" },
  { value: "equacoes", label: "Equações" },
  { value: "regra_tres", label: "Regra de Três" },
  
  // Direito Constitucional
  { value: "principios_constitucionais", label: "Princípios Constitucionais" },
  { value: "direitos_fundamentais", label: "Direitos Fundamentais" },
  { value: "organizacao_estado", label: "Organização do Estado" },
  { value: "poder_executivo", label: "Poder Executivo" },
  { value: "poder_legislativo", label: "Poder Legislativo" },
  { value: "poder_judiciario", label: "Poder Judiciário" },
  { value: "controle_constitucionalidade", label: "Controle de Constitucionalidade" },
  
  // Direito Administrativo
  { value: "atos_administrativos", label: "Atos Administrativos" },
  { value: "licitacao", label: "Licitação" },
  { value: "contratos_administrativos", label: "Contratos Administrativos" },
  { value: "servicos_publicos", label: "Serviços Públicos" },
  { value: "processo_administrativo", label: "Processo Administrativo" },
  { value: "responsabilidade_civil", label: "Responsabilidade Civil" },
  { value: "improbidade_administrativa", label: "Improbidade Administrativa" },
  { value: "servidores_publicos", label: "Servidores Públicos" },
  
  // Administração Pública
  { value: "principios_adm_publica", label: "Princípios da Administração Pública" },
  { value: "organizacao_administrativa", label: "Organização Administrativa" },
  { value: "controle_administracao", label: "Controle da Administração" },
  { value: "modernizacao_administrativa", label: "Modernização Administrativa" },
  { value: "governanca_publica", label: "Governança Pública" },
  { value: "politicas_publicas", label: "Políticas Públicas" },
  
  // Informática
  { value: "hardware_software", label: "Hardware e Software" },
  { value: "sistemas_operacionais", label: "Sistemas Operacionais" },
  { value: "redes_computadores", label: "Redes de Computadores" },
  { value: "seguranca_informacao", label: "Segurança da Informação" },
  { value: "internet_navegadores", label: "Internet e Navegadores" },
  { value: "office_editores_texto", label: "Office e Editores de Texto" },
  { value: "banco_dados", label: "Banco de Dados" },
  { value: "lgpd", label: "LGPD" },
  
  // ECA
  { value: "lei_8069_1990_eca_alteracoes", label: "Lei nº 8.069 de 1990 - Estatuto da Criança e do Adolescente e suas alterações" },
  { value: "direitos_fundamentais_crianca", label: "Direitos Fundamentais da Criança" },
  { value: "medidas_protecao", label: "Medidas de Proteção" },
  { value: "conselho_tutelar", label: "Conselho Tutelar" },
  { value: "ato_infracional", label: "Ato Infracional" },
  { value: "medidas_socioeducativas", label: "Medidas Socioeducativas" },
  
  // Outros
  { value: "conhecimentos_gerais_atualidades", label: "Conhecimentos Gerais e Atualidades" },
  { value: "etica_servico_publico", label: "Ética no Serviço Público" },
  { value: "sustentabilidade", label: "Sustentabilidade" },
  { value: "acessibilidade", label: "Acessibilidade" },

  // Novos Itens - Português
  { value: "elementos_construcao_texto_sentido", label: "Elementos de construção do texto e seu sentido" },
  { value: "genero_texto_literario_nao_literario", label: "Gênero do texto: literário e não literário; narrativo, descritivo e argumentativo" },
  { value: "interpretacao_organizacao_interna", label: "Interpretação e organização interna" },
  { value: "sentido_emprego_vocabulos", label: "Sentido e emprego dos vocábulos" },
  { value: "campos_semanticos", label: "Campos semânticos" },
  { value: "emprego_tempos_modos_verbais", label: "Emprego de tempos e modos dos verbos" },
  { value: "reconhecimento_emprego_sentido_classes_gramaticais", label: "Reconhecimento, emprego e sentido das classes gramaticais" },
  { value: "processos_formacao_palavras", label: "Processos de formação de palavras" },
  { value: "mecanismos_flexao_nomes_verbos", label: "Mecanismos de flexão dos nomes e verbos" },
  { value: "frase_oracao_periodo", label: "Frase, oração e período" },
  { value: "termos_da_oracao", label: "Termos da oração" },
  { value: "processos_coordenacao_subordinacao", label: "Processos de coordenação e subordinação" },
  { value: "padroes_gerais_colocacao_pronominal", label: "Padrões gerais de colocação pronominal" },
  { value: "reescrita_frases_substituicao_deslocamento_paralelismo", label: "Reescrita de frases: substituição, deslocamento, paralelismo" },
  { value: "variacao_linguistica_norma_culta", label: "Variação linguística: norma culta" },

  // Novos Itens - Direito Administrativo
  { value: "principios_da_adm_publica_expressos_implicitos", label: "Princípios da Administração Pública (expressos e implícitos)" },
  { value: "adm_publica_direta_indireta", label: "Administração Pública: direta e indireta" },
  { value: "poderes_administrativos", label: "Poderes Administrativos" },
  { value: "agentes_publicos", label: "Agentes Públicos" },
  { value: "controle_da_adm_publica", label: "Controle da Administração Pública" },

  // Novos Itens - Direito Constitucional
  { value: "direitos_garantias_fundamentais", label: "Direitos e garantias fundamentais" },
  { value: "organizacao_estado_municipios", label: "Organização do Estado: dos Municípios" },
  { value: "adm_publica_disposicoes_gerais_servidores", label: "Administração Pública: disposições gerais e servidores públicos" },
  { value: "fiscalizacao_contabil_financeira_orcamentaria", label: "Fiscalização Contábil, Financeira e Orçamentária" },
  { value: "regimento_interno_camara_aracaju", label: "Regimento Interno da Câmara Municipal de Aracaju (Resolução 18/71)" },
  
  // Novos Itens - Administração Pública
  { value: "organizacao_governamental_brasileira", label: "Organização Governamental Brasileira" },
  { value: "paradigmas_reformas_administrativas", label: "Paradigmas e reformas administrativas" },
  { value: "administracao_burocratica", label: "Administração burocrática" },
  { value: "estado_bem_estar_social", label: "Estado de bem-estar social" },
  { value: "nova_gestao_publica", label: "Nova gestão pública (New Public Management)" },
  { value: "formulacao_avaliacao_politicas_publicas", label: "Formulação e avaliação de Políticas Públicas" },
  { value: "arranjos_institucionais_politicas_publicas", label: "Arranjos institucionais de Políticas Públicas" },
  { value: "processo_politica_publica", label: "Processo de política pública" },
  { value: "planejamento_publico", label: "Planejamento público" },
  { value: "planos_programas_governo", label: "Planos e programas de governo" },
  { value: "processo_orcamentario_ppa_ldo_loa", label: "Processo orçamentário (PPA, LDO, LOA)" },
  { value: "flexibilizacao_acao_estatal", label: "Flexibilização da ação estatal (PPP, consórcios, terceirização, redes e parcerias)" },
  { value: "mudancas_institucionais_conselhos_os_oscip", label: "Mudanças institucionais (Conselhos, OS, OSCIP, agências)" },
  { value: "governanca_governabilidade", label: "Governança e governabilidade" },
  { value: "estrategia_organizacoes_publicas", label: "Estratégia em Organizações Públicas" },
  { value: "gestao_resultados_setor_publico", label: "Gestão por resultados no setor público (Metodologias, avaliação, indicadores)" },

  // Novos Itens - Administração Geral
  { value: "conceitos_principios_fundamentais_adm", label: "Conceitos e princípios fundamentais de Administração" },
  { value: "funcoes_da_administracao", label: "Funções da Administração" },
  { value: "controle_administrativo_indicadores", label: "Controle administrativo e indicadores" },
  { value: "comportamento_organizacional", label: "Comportamento organizacional (Liderança, trabalho em equipe, comunicação)" },
  { value: "motivacao_negociacao", label: "Motivação e negociação" },
  { value: "gestao_estrategica_planejamento", label: "Gestão estratégica e planejamento (estratégico, Balanced Scorecard)" },
  { value: "gestao_de_pessoas", label: "Gestão de pessoas (competências, desempenho, T&D, auditoria)" },
  { value: "gestao_de_processos", label: "Gestão de processos (análise, cadeia de valor, desenho, organogramas)" },
  { value: "gestao_de_projetos", label: "Gestão de projetos (ciclo e instrumentos)" },
  { value: "gestao_informacao_conhecimento", label: "Gestão da informação e do conhecimento" },
  { value: "processo_decisorio", label: "Processo decisório (ferramentas, heurísticas, tipos de decisão)" },
  { value: "administracao_de_materiais", label: "Administração de materiais" },

  // Novos Itens - Informática
  { value: "hardware_geral", label: "Hardware: processadores, memória, periféricos, armazenamento" },
  { value: "arquivos_digitais_geral", label: "Arquivos digitais: documentos, planilhas, imagens, sons, vídeos, PDF" },
  { value: "sistema_operacional_windows_10", label: "Sistema Operacional Windows 10" },
  { value: "editores_texto_planilhas_office_libreoffice", label: "Editores de texto e planilhas (MS Office, LibreOffice)" },
  { value: "manipulacao_protecao_arquivos", label: "Manipulação e proteção de arquivos" },
  { value: "impressao_importacao_exportacao_dados", label: "Impressão, importação e exportação de dados" },
  { value: "internet_seguranca_digital", label: "Internet e segurança digital (navegadores, senhas, criptografia, tokens)" },
  { value: "email_webmail", label: "E-mail e webmail" },
  { value: "transferencia_arquivos_dados", label: "Transferência de arquivos e dados (upload, download, banda, velocidade)" },

  // Novos Itens - Administração Orçamentária e Financeira
  { value: "orcamento_publico_conceitos", label: "Orçamento público: conceitos, princípios, orçamento-programa" },
  { value: "ciclo_orcamentario", label: "Ciclo orçamentário: elaboração, aprovação, execução, avaliação" },
  { value: "constituicao_1988_orcamento", label: "Constituição de 1988 e orçamento" },
  { value: "receita_despesa_publica", label: "Receita e despesa públicas (conceituação, estágios)" },
  { value: "divida_ativa_restos_pagar", label: "Dívida ativa, restos a pagar, despesas anteriores, dívida pública" },
  { value: "creditos_adicionais_descentralizacao", label: "Créditos adicionais e descentralização" },
  { value: "lei_4320_1964", label: "Lei nº 4.320/1964" },
  { value: "decreto_93872_1986", label: "Decreto nº 93.872/1986" },
  { value: "mcasp_8_edicao", label: "MCASP - 8ª edição" },
  { value: "lei_responsabilidade_fiscal", label: "Lei de Responsabilidade Fiscal (LC nº 101/2000)" },
  { value: "transparencia_adm_publica", label: "Transparência na Administração Pública (LC nº 131/2009, Lei nº 12.527/2011)" },
  { value: "normas_procedimentos_controle_interno", label: "Normas e procedimentos de Controle Interno" },

  // Novos Itens - Enfermeiro
  { value: "sus_principios_diretrizes", label: "Sistema Único de Saúde (SUS): princípios, diretrizes, organização" },
  { value: "legislacao_basica_sus", label: "Legislação básica do SUS (Leis nº 8.080/90, nº 8.142/90, Decreto nº 7.508/11)" },
  { value: "vigilancia_epidemiologica_saude", label: "Vigilância Epidemiológica e em Saúde" },
  { value: "notificacao_compulsoria_doencas", label: "Notificação Compulsória de Doenças (Portaria nº 204/2016)" },
  { value: "programa_nacional_imunizacoes", label: "Programa Nacional de Imunizações" },
  { value: "doencas_cronicas_transmissiveis", label: "Doenças crônicas e transmissíveis" },
  { value: "sistemas_informacao_saude", label: "Sistemas de Informação em Saúde" },
  { value: "indicadores_de_saude", label: "Indicadores de Saúde" },
  { value: "acolhimento_classificacao_risco", label: "Acolhimento e Classificação de Risco" },
  { value: "teorias_fundamentos_processo_enfermagem", label: "Teorias, fundamentos e processo de Enfermagem" },
  { value: "sistematizacao_assistencia_enfermagem_sae", label: "Sistematização da Assistência de Enfermagem (SAE)" },
  { value: "diagnosticos_de_enfermagem", label: "Diagnósticos de Enfermagem" },
  { value: "assistencia_enfermagem_geral", label: "Assistência de Enfermagem (adulto, saúde mental, gerontologia, etc.)" },
  { value: "enfermagem_medico_cirurgica", label: "Enfermagem médico-cirúrgica" },
  { value: "urgencia_emergencia_bls", label: "Urgência e emergência (hospitalar e pré-hospitalar, suporte básico de vida)" },
  { value: "administracao_gerenciamento_saude", label: "Administração e gerenciamento em serviços de saúde" },
  { value: "dimensionamento_de_enfermagem", label: "Dimensionamento de Enfermagem" },
  { value: "avaliacao_qualidade_auditoria_saude", label: "Avaliação da qualidade, custos, auditoria, acreditação em saúde" },
  { value: "procedimentos_metodos_diagnosticos", label: "Procedimentos e métodos diagnósticos" },
  { value: "saude_do_trabalhador", label: "Saúde do trabalhador" },
  { value: "bioestatistica_aplicada_saude", label: "Bioestatística aplicada à saúde" },
  { value: "pesquisa_em_enfermagem", label: "Pesquisa em enfermagem" },
  { value: "gerenciamento_residuos_saude", label: "Gerenciamento de resíduos de saúde" },
  { value: "processamento_produtos_saude", label: "Processamento de produtos para saúde" },
  { value: "biosseguranca_precaucoes_isolamento", label: "Biossegurança, precauções e isolamento" },
  { value: "prevencao_infeccao_assistencia", label: "Prevenção de infecção relacionada à assistência" },
  { value: "etica_codigo_etica_enfermagem", label: "Ética profissional e Código de Ética da Enfermagem" },
  { value: "legislacao_exercicio_profissional_enfermagem", label: "Legislação do exercício profissional de Enfermagem" }
];

const institutionOptions = [
  { value: "fcc", label: "FCC - Fundação Carlos Chagas" },
  { value: "cespe", label: "CESPE CEBRASPE - Centro de Seleção e de Promoção de Eventos UnB" },
  { value: "vunesp", label: "VUNESP - Fundação para o Vestibular da Universidade Estadual Paulista" },
  { value: "fgv", label: "FGV - Fundação Getúlio Vargas" },
  { value: "cesgranrio", label: "CESGRANRIO" },
  { value: "esaf", label: "ESAF" },
  { value: "fundatec", label: "FUNDATEC" },
  { value: "consulplan", label: "CONSULPLAN" },
  { value: "idecan", label: "IDECAN" },
  { value: "instituto_aocp", label: "AOCP - Assessoria em Organização de Concursos Públicos" },
  { value: "ibade", label: "IBADE" },
  { value: "quadrix", label: "QUADRIX" },
  { value: "ibfc", label: "IBFC" },
  { value: "objetiva", label: "Objetiva" },
  { value: "iades", label: "IADES" },
  { value: "itame", label: "ITAME" },
  { value: "outras", label: "Outras" }
];

const cargoOptions = [
  { value: "tecnico_judiciario", label: "Técnico Judiciário" },
  { value: "analista_judiciario", label: "Analista Judiciário" },
  { value: "agente_penitenciario", label: "Agente Penitenciário" },
  { value: "agente_policia", label: "Agente de Polícia" },
  { value: "agente_policia_federal", label: "Agente de Polícia Federal" },
  { value: "delegado_policia", label: "Delegado de Polícia" },
  { value: "delegado_policia_civil", label: "Delegado de Polícia Civil" },
  { value: "delegado_policia_civil_substituto", label: "Delegado de Polícia Civil Substituto" },
  { value: "delegado_policia_federal", label: "Delegado de Polícia Federal" },
  { value: "delegado_policia_substituto", label: "Delegado de Polícia Substituto" },
  { value: "escrivao_policia_civil", label: "Escrivão de Polícia Civil" },
  { value: "policial_civil", label: "Policial Civil" },
  { value: "policial_federal", label: "Policial Federal" },
  { value: "auditor_fiscal", label: "Auditor Fiscal" },
  { value: "tecnico_receita_federal", label: "Técnico da Receita Federal" },
  { value: "analista_receita_federal", label: "Analista da Receita Federal" },
  { value: "professor_educacao_basica", label: "Professor (Educação Básica)" },
  { value: "professor_educacao_basica_fundamental_medio", label: "Professor de Educação Básica - Ensino Fundamental e Médio" },
  { value: "professor_1_ao_5_ano", label: "Professor - 1 ao 5 Ano Ensino Fundamental" },
  { value: "professor_educacao_basica_anos_iniciais", label: "Professor de Educação Básica dos anos iniciais" },
  { value: "professor_portugues", label: "Professor (Português)" },
  { value: "professor_matematica", label: "Professor (Matemática)" },
  { value: "professor_historia", label: "Professor (História)" },
  { value: "professor_geografia", label: "Professor (Geografia)" },
  { value: "professor_artes", label: "Professor (Artes)" },
  { value: "professor_ingles", label: "Professor (Inglês)" },
  { value: "professor_ciencias", label: "Professor (Ciências)" },
  { value: "professor_fisica", label: "Professor (Física)" },
  { value: "professor_quimica", label: "Professor (Química)" },
  { value: "professor_biologia", label: "Professor (Biologia)" },
  { value: "professor_educacao_fisica", label: "Professor (Educação Física)" },
  { value: "enfermeiro", label: "Enfermeiro" },
  { value: "medico", label: "Médico" },
  { value: "contador", label: "Contador" },
  { value: "advogado", label: "Advogado" },
  { value: "engenheiro", label: "Engenheiro" },
  { value: "analista_sistemas", label: "Analista de Sistemas" },
  { value: "tecnico_informatica", label: "Técnico em Informática" },
  { value: "assistente_administrativo", label: "Assistente Administrativo" },
  { value: "escriturario", label: "Escriturário" },
  { value: "tecnico_bancario", label: "Técnico Bancário" },
  { value: "analista_bancario", label: "Analista Bancário" }
];

const educationLevelOptions = [
  { value: "fundamental", label: "Ensino Fundamental" },
  { value: "medio", label: "Ensino Médio" },
  { value: "superior", label: "Ensino Superior" }
];

const typeOptions = [
  { value: "multiple_choice", label: "Múltipla Escolha" },
  { value: "true_false", label: "Certo/Errado" }
];

const initialQuestionState = {
  associated_text: '',
  statement: '',
  command: '', 
  type: 'multiple_choice',
  subject: '',
  topic: '', 
  institution: '',
  year: new Date().getFullYear(),
  cargo: '',
  exam_name: '',
  education_level: 'medio',
  options: [
    { letter: 'A', text: '' }, { letter: 'B', text: '' },
    { letter: 'C', text: '' }, { letter: 'D', text: '' }, { letter: 'E', text: '' },
  ],
  correct_answer: '',
  explanation: '',
};

export default function AdminQuestionForm({ onFormSubmit, questionToEdit }) {
  const [question, setQuestion] = useState(initialQuestionState);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (questionToEdit) {
      setQuestion(questionToEdit);
    } else {
      setQuestion(initialQuestionState);
    }
  }, [questionToEdit]);

  const handleInputChange = (field, value) => {
    setError('');
    setQuestion(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...question.options];
    newOptions[index].text = value;
    handleInputChange('options', newOptions);
  };
  
  const handleTypeChange = (type) => {
    let newOptions = question.options;
    if (type === 'true_false') {
      newOptions = [ { letter: 'A', text: 'Certo' }, { letter: 'B', text: 'Errado' } ];
    } else if (question.type === 'true_false') { 
      newOptions = initialQuestionState.options;
    }
    setQuestion(prev => ({ ...prev, type, options: newOptions, correct_answer: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.statement && !question.command || !question.subject || !question.institution || !question.correct_answer) { 
      setError('Preencha os campos obrigatórios (Comando da Questão, Disciplina, Banca e Alternativa Correta).');
      return;
    }
    if (!question.command && question.type !== 'true_false') { 
      setError('O campo "Comando da Questão" é obrigatório para questões de múltipla escolha.');
      return;
    }
    
    setIsSaving(true);
    setError('');

    try {
      if (question.id) {
        const { created_by, ...updateData } = question;
        await Question.update(question.id, updateData);
      } else {
        await Question.create(question);
      }
      onFormSubmit();
      alert(`Questão ${question.id ? 'atualizada' : 'adicionada'} com sucesso!`);
    } catch (err) {
      console.error(err);
      setError('Erro ao salvar a questão. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const quillModules = useMemo(() => ({
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'align': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image', 'video'],
      ['clean']
    ],
  }), []);

  const quillFormats = [
    'bold', 'italic', 'underline', 'strike',
    'align', 'size', 'list', 'bullet',
    'link', 'image', 'video'
  ];

  return (
    <Card className="dark:bg-gray-800">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <PlusCircle /> {question.id ? 'Editar Questão' : 'Adicionar Nova Questão'}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="associated_text" className="dark:text-gray-200">Texto Associado</Label>
            <div className="bg-white dark:bg-gray-700 rounded-lg">
              <ReactQuill 
                theme="snow"
                value={question.associated_text || ''}
                onChange={(value) => handleInputChange('associated_text', value)}
                modules={quillModules}
                formats={quillFormats}
                style={{ 
                  backgroundColor: 'white',
                  color: 'black'
                }}
              />
            </div>
          </div>
          
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="statement" className="dark:text-gray-200">Enunciado / Texto de Apoio</Label>
            <div className="bg-white dark:bg-gray-700 rounded-lg">
              <ReactQuill 
                theme="snow"
                value={question.statement}
                onChange={(value) => handleInputChange('statement', value)}
                modules={quillModules}
                formats={quillFormats}
                style={{ 
                  backgroundColor: 'white',
                  color: 'black'
                }}
              />
            </div>
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="command" className="dark:text-gray-200">Comando da Questão</Label>
            <div className="bg-white dark:bg-gray-700 rounded-lg">
              <ReactQuill 
                theme="snow"
                value={question.command || ''}
                onChange={(value) => handleInputChange('command', value)}
                modules={quillModules}
                formats={quillFormats}
                style={{ 
                  backgroundColor: 'white',
                  color: 'black'
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject" className="dark:text-gray-200">Disciplina</Label>
            <Select onValueChange={value => handleInputChange('subject', value)} value={question.subject} required>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {subjectOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic" className="dark:text-gray-200">Assunto</Label>
            <Select onValueChange={value => handleInputChange('topic', value)} value={question.topic || ''}>
              <SelectTrigger><SelectValue placeholder="Selecione um assunto..." /></SelectTrigger>
              <SelectContent>
                {topicOptions.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="institution" className="dark:text-gray-200">Banca</Label>
            <Select onValueChange={value => handleInputChange('institution', value)} value={question.institution} required>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {institutionOptions.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type" className="dark:text-gray-200">Tipo</Label>
            <Select onValueChange={handleTypeChange} value={question.type}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {typeOptions.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="education_level" className="dark:text-gray-200">Nível Escolar</Label>
            <Select onValueChange={value => handleInputChange('education_level', value)} value={question.education_level}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {educationLevelOptions.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="year" className="dark:text-gray-200">Ano</Label>
            <Input id="year" type="number" value={question.year} onChange={e => handleInputChange('year', parseInt(e.target.value))} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cargo" className="dark:text-gray-200">Cargo</Label>
            <Select onValueChange={value => handleInputChange('cargo', value)} value={question.cargo || ''}>
              <SelectTrigger><SelectValue placeholder="Selecione um cargo..." /></SelectTrigger>
              <SelectContent>
                {cargoOptions.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="exam_name" className="dark:text-gray-200">Prova</Label> 
            <Input id="exam_name" value={question.exam_name} placeholder="Ex: TRT-SP" onChange={e => handleInputChange('exam_name', e.target.value)} />
          </div>

          <div className="md:col-span-2 space-y-4">
            <h3 className="font-medium dark:text-white">Alternativas</h3>
            {question.options.slice(0, question.type === 'multiple_choice' ? 5 : 2).map((opt, index) => (
              <div key={opt.letter} className="flex items-center gap-2">
                {/* Mostrar letra apenas se não for questão true_false */}
                {question.type !== 'true_false' ? (
                  <Label htmlFor={`option-${opt.letter}`} className="p-2 bg-gray-200 dark:bg-gray-600 dark:text-white rounded-md font-bold">{opt.letter}</Label>
                ) : (
                  <div className="w-12 flex justify-center">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">{opt.text}</span>
                  </div>
                )}
                <Input 
                  id={`option-${opt.letter}`} 
                  value={opt.text}
                  onChange={e => handleOptionChange(index, e.target.value)}
                  disabled={question.type === 'true_false'}
                  required
                  className="dark:bg-gray-700 dark:text-white"
                />
              </div>
            ))}
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label className="dark:text-gray-200">Alternativa Correta</Label>
            <div className="flex flex-wrap gap-4">
              {question.options.slice(0, question.type === 'multiple_choice' ? 5 : 2).map(opt => (
                <Button
                  key={opt.letter}
                  type="button"
                  variant={question.correct_answer === opt.letter ? "default" : "outline"}
                  className={`min-w-[60px] h-10 ${
                    question.correct_answer === opt.letter 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => handleInputChange('correct_answer', opt.letter)}
                >
                  {question.type === 'true_false' ? opt.text : opt.letter}
                </Button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="explanation" className="dark:text-gray-200">Comentário / Explicação</Label>
            <div className="bg-white dark:bg-gray-700 rounded-lg">
              <ReactQuill 
                theme="snow"
                value={question.explanation}
                onChange={(value) => handleInputChange('explanation', value)}
                modules={quillModules}
                formats={quillFormats}
                style={{ 
                  backgroundColor: 'white',
                  color: 'black'
                }}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div />
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {question.id ? 'Atualizar Questão' : 'Salvar Questão'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
