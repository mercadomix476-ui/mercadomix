# Migração para Nexus Commerce

## 📋 Resumo das Mudanças

O sistema foi atualizado de "Mercadinho Mix" para "Nexus Commerce" com um novo sistema de logos personalizado.

## 🎨 Sistema de Logos

### Logo do Login (Sempre Fixa)
- **Localização**: Tela de login
- **Logo**: Sempre usa a logo oficial do Nexus Commerce (`/src/assets/nexuslogo.jpg`)
- **Comportamento**: Não pode ser alterada pelo cliente

### Logo Interna (Personalizável)
- **Localização**: Sidebar, PDV, cupons fiscais
- **Logo**: Configurável pelo cliente nas configurações
- **Fallback**: Logo padrão do Nexus Commerce se não configurada
- **Configuração**: Página de Configurações > Aba "Loja" > Seção "Logo da Loja"

## 🔧 Arquivos Modificados

### Componentes Principais
- `src/pages/Login.jsx` - Atualizado para usar logo fixa do Nexus Commerce
- `src/components/layout/Sidebar.jsx` - Atualizado para usar logo configurável
- `src/pages/PDV.jsx` - Atualizado para usar logo configurável
- `src/pages/Settings.jsx` - Nova interface para configuração de logo

### Configurações e Dados
- `supabase_schema.sql` - Nome padrão atualizado
- `supabase_multi_tenant_schema.sql` - Comentários atualizados
- `src/entities/StoreSettings.json` - Valor padrão atualizado
- `index.html` - Título da página atualizado

### Migração
- `migration_nexus_commerce.sql` - Script para atualizar dados existentes

## 🚀 Como Usar

### Para Clientes
1. Acesse **Configurações** > **Loja**
2. Na seção "Logo da Loja", cole a URL da sua logo personalizada
3. Visualize o preview da logo
4. Clique em "Salvar Configurações"
5. A logo aparecerá no sistema interno (sidebar, PDV, etc.)

### Resetar para Logo Padrão
- Clique no botão "Usar Logo Padrão do Nexus Commerce" nas configurações

## 📝 Notas Técnicas

- A logo do login sempre usa `nexuslogo.jpg` e não pode ser alterada
- Logos personalizadas são carregadas via URL externa
- Fallback automático para logo padrão em caso de erro
- Recomenda-se imagens quadradas (1:1) para melhor resultado
- Sistema mantém compatibilidade com configurações existentes

## 🔄 Migração de Dados

Execute o script `migration_nexus_commerce.sql` para:
- Atualizar nome da loja de "Mercadinho Mix" para "Nexus Commerce"
- Preservar logos personalizadas existentes
- Criar configurações padrão se não existirem