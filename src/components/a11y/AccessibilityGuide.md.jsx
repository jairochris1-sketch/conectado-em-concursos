# Guia de Acessibilidade WCAG 2.1 Nível AA

## Checklist de Implementação

### 1. Contraste de Cores
- ✅ Texto: Razão de contraste mínima de 4.5:1 (normal), 3:1 (grande)
- ✅ Componentes UI: Razão de contraste de 3:1 para bordas e backgrounds
- ✅ Validar com ferramentas: WebAIM Contrast Checker

### 2. Atributos ARIA
- ✅ `aria-label`: Para ícones e elementos visuais sem texto
- ✅ `aria-hidden`: Para elementos decorativos
- ✅ `aria-disabled`: Para elementos desabilitados
- ✅ `aria-live`: Para atualizações dinâmicas
- ✅ `role`: Para elementos interativos customizados
- ✅ `aria-labelledby`: Para relacionar labels com inputs

### 3. Navegação por Teclado
- ✅ Tab order lógico (top-to-bottom, left-to-right)
- ✅ Skip links: "Pular para conteúdo principal"
- ✅ :focus-visible: Estados visuais de foco claros
- ✅ Fechar menus com ESC
- ✅ Navegar opções com setas (Arrow keys)

### 4. Alternativas Textuais
- ✅ `alt` em todas as imagens
- ✅ `title` ou `aria-label` em ícones
- ✅ Legendas em vídeos
- ✅ Descrições para gráficos complexos

### 5. Padrões Implementados
- ✅ Buttons semanticamente corretos
- ✅ Links distinguíveis de texto normal
- ✅ Forms com labels associados
- ✅ Mensagens de erro clara e relacionadas
- ✅ Indicadores de progresso acessíveis

## Melhorias por Página

### ActivityFeed
- Ícones com aria-label ou title
- Links com aria-current para página ativa
- Contraste de cores do texto aprimorado
- Keyboard navigation melhorada

### Layout
- Menu mobile com suporte a ESC
- Focus management no menu
- Atributos ARIA no header
- Skip link implementado

### ChatWidget
- Inputs com labels
- Button com aria-label
- Navegação com Enter/ESC
- Indicador visual de foco

## Ferramentas de Teste
- axe DevTools
- WAVE Browser Extension
- Lighthouse (Chrome DevTools)
- Manual keyboard testing
- Screen reader testing (NVDA, JAWS, VoiceOver)

## Referências
- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
- ARIA Practices: https://www.w3.org/WAI/ARIA/apg/
- WebAIM: https://webaim.org/