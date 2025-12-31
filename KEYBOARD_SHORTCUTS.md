# Atalhos de Teclado - Nexus Commerce

Este documento descreve todos os atalhos de teclado disponíveis no sistema Nexus Commerce.

## 🚀 Navegação Principal

| Atalho | Ação | Descrição |
|--------|------|-----------|
| `Alt + 1` | Dashboard | Navegar para a página inicial |
| `Alt + 2` | PDV | Abrir o Ponto de Venda |
| `Alt + 3` | Produtos | Ir para gestão de produtos |
| `Alt + 4` | Vendas | Visualizar vendas realizadas |
| `Alt + 5` | Estoque | Controlar estoque |
| `Alt + 6` | Relatórios | Acessar relatórios |
| `Alt + 7` | Configurações | Abrir configurações do sistema |

## 💰 PDV (Ponto de Venda)

| Atalho | Ação | Descrição |
|--------|------|-----------|
| `F1` | Ajuda | Mostrar atalhos específicos do PDV |
| `F2` | Buscar Produto | Focar no campo de busca de produtos |
| `F3` | Finalizar Venda | Processar pagamento e finalizar venda |
| `F4` | Cancelar Venda | Limpar carrinho e cancelar venda atual |
| `F5` | Atualizar | Recarregar a página do PDV |
| `F9` | Aplicar Desconto | Focar no campo de desconto |
| `F12` | Abrir Gaveta | Abrir gaveta da impressora (se conectada) |

## 🔧 Ações Gerais

| Atalho | Ação | Descrição |
|--------|------|-----------|
| `Ctrl + N` | Novo Item | Criar novo item na página atual |
| `Ctrl + S` | Salvar | Salvar formulário atual |
| `Ctrl + F` | Buscar | Focar no campo de busca da página |
| `Ctrl + P` | Imprimir | Imprimir conteúdo atual |
| `Escape` | Cancelar/Fechar | Fechar modais ou cancelar ações |
| `Ctrl + ?` | Ajuda | Mostrar todos os atalhos disponíveis |

## 📦 Produtos

| Atalho | Ação | Descrição |
|--------|------|-----------|
| `Ctrl + N` | Novo Produto | Abrir formulário de novo produto |
| `Ctrl + F` | Buscar Produtos | Focar no campo de busca |
| `Escape` | Fechar Formulário | Fechar formulário de produto |

## 🛒 Vendas

| Atalho | Ação | Descrição |
|--------|------|-----------|
| `Ctrl + F` | Buscar Vendas | Focar no campo de busca |
| `Ctrl + P` | Imprimir Relatório | Imprimir relatório de vendas |

## 📊 Estoque

| Atalho | Ação | Descrição |
|--------|------|-----------|
| `Ctrl + F` | Buscar Itens | Focar no campo de busca |
| `Ctrl + N` | Nova Movimentação | Criar nova movimentação de estoque |

## 📈 Relatórios

| Atalho | Ação | Descrição |
|--------|------|-----------|
| `Ctrl + P` | Imprimir | Imprimir relatório atual |
| `Ctrl + F` | Filtrar | Focar nos filtros de data |

## ⚙️ Configurações

| Atalho | Ação | Descrição |
|--------|------|-----------|
| `Ctrl + S` | Salvar | Salvar configurações |
| `Escape` | Cancelar | Cancelar alterações |

## 💡 Dicas de Uso

### Contexto dos Atalhos
- Os atalhos funcionam globalmente, exceto quando você está digitando em campos de texto
- Atalhos específicos do PDV só funcionam quando você está na tela do PDV
- Atalhos de página (como `Ctrl + N`) funcionam apenas na página correspondente

### Acessibilidade
- Todos os atalhos são compatíveis com leitores de tela
- Use `Tab` para navegar entre elementos
- Use `Enter` ou `Espaço` para ativar botões
- Use `Escape` para fechar modais e cancelar ações

### Personalização
- Os atalhos podem ser visualizados clicando no botão "⌨️ Atalhos" na barra lateral
- Uma janela de ajuda mostra todos os atalhos organizados por categoria

## 🔧 Implementação Técnica

### Para Desenvolvedores

Os atalhos são implementados através do hook `useKeyboardShortcuts` que:

1. **Escuta eventos globais de teclado**
2. **Filtra inputs ativos** (não funciona quando digitando)
3. **Dispara eventos customizados** para componentes específicos
4. **Gerencia navegação** através do React Router

### Eventos Customizados

- `pdv-shortcut`: Para ações específicas do PDV
- `app-shortcut`: Para ações gerais da aplicação

### Adicionando Novos Atalhos

Para adicionar um novo atalho:

1. Edite o arquivo `src/hooks/useKeyboardShortcuts.js`
2. Adicione o atalho no objeto `shortcuts`
3. Implemente a ação correspondente
4. Atualize este documento

## 🐛 Solução de Problemas

### Atalho não funciona
- Verifique se não está digitando em um campo de texto
- Confirme se está na página correta (para atalhos específicos)
- Verifique se o navegador não está interceptando o atalho

### Conflitos com o navegador
- Alguns atalhos podem conflitar com atalhos do navegador
- Use `Ctrl + Shift + I` para abrir as ferramentas de desenvolvedor e verificar se há erros

### Performance
- Os atalhos são otimizados e não afetam a performance
- Listeners são removidos automaticamente quando componentes são desmontados

---

**Versão:** 1.0  
**Última atualização:** Dezembro 2024  
**Sistema:** Nexus Commerce Multi-Tenant