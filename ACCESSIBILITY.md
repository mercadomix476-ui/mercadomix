# Guia de Acessibilidade - Mercadinho Mix

Este documento descreve as melhorias de acessibilidade implementadas no sistema Mercadinho Mix, seguindo as diretrizes WCAG 2.1 AA.

## ✅ Melhorias Implementadas

### 1. **Estrutura Semântica (WCAG 1.3.1)**
- Uso correto de elementos HTML semânticos (`<main>`, `<nav>`, `<header>`, `<section>`, `<article>`)
- Hierarquia de cabeçalhos apropriada (h1, h2, h3)
- Landmarks ARIA para navegação (`role="main"`, `role="navigation"`)

### 2. **Navegação por Teclado (WCAG 2.1.1)**
- Skip link para pular para o conteúdo principal
- Navegação completa por teclado em todos os componentes
- Indicadores de foco visíveis e consistentes
- Trap de foco em modais e diálogos
- Suporte a teclas de atalho (setas, Enter, Escape)

### 3. **Contraste de Cores (WCAG 1.4.3)**
- Cores ajustadas para atender contraste mínimo 4.5:1
- Suporte a modo de alto contraste
- Indicadores visuais não dependem apenas de cor

### 4. **Texto e Conteúdo (WCAG 1.4.4, 1.4.10)**
- Textos responsivos que escalam até 200%
- Suporte a zoom sem perda de funcionalidade
- Linguagem definida no HTML (`lang="pt-BR"`)

### 5. **Formulários Acessíveis (WCAG 3.3.1, 3.3.2)**
- Labels associados corretamente aos campos
- Mensagens de erro descritivas
- Validação em tempo real com feedback
- Autocomplete apropriado para campos sensíveis

### 6. **Imagens e Mídia (WCAG 1.1.1)**
- Textos alternativos descritivos
- Ícones decorativos marcados com `aria-hidden="true"`
- Imagens funcionais com labels apropriados

### 7. **Estados e Propriedades ARIA**
- `aria-expanded` para elementos expansíveis
- `aria-current="page"` para navegação ativa
- `aria-label` e `aria-labelledby` para contexto
- `aria-describedby` para informações adicionais
- `aria-live` para atualizações dinâmicas

### 8. **Componentes Interativos**
- Botões com tamanho mínimo de 44px (touch targets)
- Estados de hover, focus e active bem definidos
- Feedback visual e sonoro para ações
- Componentes customizados seguem padrões ARIA

## 🎯 Componentes Específicos

### Sidebar/Menu de Navegação
- Menu hambúrguer com labels descritivos
- Navegação por teclado com indicação visual
- Estado expandido/colapsado anunciado
- Links com descrições contextuais

### Busca de Produtos (PDV)
- Combobox com suporte completo a teclado
- Lista de opções navegável por setas
- Anúncios de resultados para leitores de tela
- Instruções de uso disponíveis

### Carrinho de Compras
- Itens agrupados semanticamente
- Controles de quantidade acessíveis
- Remoção de itens com confirmação
- Totais anunciados dinamicamente

### Formulários
- Validação em tempo real
- Mensagens de erro associadas aos campos
- Campos obrigatórios claramente marcados
- Suporte a navegação por teclado

### Dashboard/Home
- Cards de estatísticas com contexto
- Listas semânticas para vendas e alertas
- Informações numéricas com descrições
- Links de ação claramente identificados

## 🛠️ Recursos Técnicos

### CSS de Acessibilidade
```css
/* Classe para conteúdo apenas para leitores de tela */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Skip link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  /* ... */
}

/* Indicadores de foco melhorados */
*:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

### Hooks Personalizados
- `useAnnouncement`: Para anúncios dinâmicos
- `useFocusManagement`: Gerenciamento de foco

### Suporte a Preferências do Usuário
- `prefers-reduced-motion`: Animações reduzidas
- `prefers-contrast`: Alto contraste
- `prefers-color-scheme`: Modo escuro

## 📱 Responsividade Acessível

### Touch Targets
- Elementos interativos com mínimo 44px
- Espaçamento adequado entre elementos
- Gestos alternativos para funcionalidades

### Orientação e Zoom
- Funciona em portrait e landscape
- Suporte a zoom até 200%
- Reflow de conteúdo sem scroll horizontal

## 🧪 Testes de Acessibilidade

### Ferramentas Recomendadas
1. **axe-core** - Testes automatizados
2. **WAVE** - Análise visual de acessibilidade
3. **Lighthouse** - Auditoria de acessibilidade
4. **NVDA/JAWS** - Testes com leitores de tela
5. **Navegação apenas por teclado**

### Checklist de Testes
- [ ] Navegação completa por teclado
- [ ] Leitura com leitor de tela
- [ ] Contraste de cores adequado
- [ ] Zoom até 200% funcional
- [ ] Formulários validam corretamente
- [ ] Estados de foco visíveis
- [ ] Conteúdo dinâmico é anunciado

## 🎯 Próximos Passos

### Melhorias Futuras
1. Implementar testes automatizados de acessibilidade
2. Adicionar suporte a mais idiomas
3. Melhorar feedback tátil em dispositivos móveis
4. Implementar modo de alto contraste personalizado
5. Adicionar atalhos de teclado personalizáveis

### Monitoramento Contínuo
- Auditorias regulares de acessibilidade
- Testes com usuários reais
- Atualizações conforme novas diretrizes WCAG
- Feedback da comunidade de usuários

## 📚 Recursos e Referências

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)

---

**Nota**: Este sistema foi desenvolvido com foco na inclusão e acessibilidade para todos os usuários, independentemente de suas habilidades ou tecnologias assistivas utilizadas.