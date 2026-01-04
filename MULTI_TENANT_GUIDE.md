# Guia de Implementação Multi-Tenant - Mercadinho Mix

## 📋 Visão Geral

O sistema foi transformado em uma solução **multi-tenant** (multi-inquilino) que permite que múltiplos clientes utilizem a mesma aplicação com **isolamento completo de dados**. Cada empresa (tenant) tem seus próprios dados de produtos, vendas, estoque e configurações.

## 🏗️ Arquitetura

### Conceitos Principais

- **Tenant**: Uma empresa/cliente que usa o sistema
- **Tenant User**: Relacionamento entre usuário e empresa com roles específicos
- **Isolamento de Dados**: Cada tenant só acessa seus próprios dados
- **Row Level Security (RLS)**: Segurança implementada no nível do banco de dados

### Estrutura de Dados

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   Tenants   │────│ Tenant_Users │────│    Users    │
│             │    │              │    │ (Supabase)  │
└─────────────┘    └──────────────┘    └─────────────┘
       │                   │
       │                   │
       ▼                   ▼
┌─────────────┐    ┌──────────────┐
│  Products   │    │    Sales     │
│ (tenant_id) │    │ (tenant_id)  │
└─────────────┘    └──────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐    ┌──────────────┐
│Stock_Moves  │    │ Sale_Items   │
│ (tenant_id) │    │ (tenant_id)  │
└─────────────┘    └──────────────┘
```

## 🔧 Implementação Técnica

### 1. Contexto de Tenant (`TenantContext.jsx`)

```javascript
// Gerencia o tenant atual e lista de tenants do usuário
const { currentTenant, userTenants, selectTenant } = useTenant();
```

**Funcionalidades:**
- Busca tenants do usuário logado
- Gerencia seleção de tenant ativo
- Criação de novos tenants
- Verificação de permissões por tenant

### 2. Proteção de Rotas (`TenantGuard.jsx`)

```javascript
// Protege rotas garantindo que um tenant esteja selecionado
<TenantGuard>
  <MainLayout />
</TenantGuard>
```

**Comportamentos:**
- Redireciona para criação se não há tenants
- Exibe seletor se há tenants mas nenhum ativo
- Permite acesso normal quando tenant está selecionado

### 3. API com Isolamento (`supabaseService.js`)

```javascript
// Todas as queries incluem automaticamente o tenant_id
const tenantId = getCurrentTenantId();
query = query.eq('tenant_id', tenantId);
```

**Características:**
- Filtro automático por tenant em todas as operações
- Inserção automática de tenant_id em novos registros
- Validação de tenant antes de operações

### 4. Segurança no Banco (RLS)

```sql
-- Exemplo de política RLS
CREATE POLICY "Users can view products from their tenants" ON products
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id FROM tenant_users 
        WHERE user_id = auth.uid() AND active = true
    )
);
```

## 🚀 Como Usar

### Para Desenvolvedores

1. **Executar o SQL de migração:**
   ```bash
   # Execute o arquivo supabase_multi_tenant_schema.sql no seu Supabase
   ```

2. **Usar os contextos:**
   ```javascript
   import { useTenant } from '@/contexts/TenantContext';
   
   function MyComponent() {
     const { currentTenant, hasPermissionInTenant } = useTenant();
     
     if (!hasPermissionInTenant('products:view')) {
       return <div>Sem permissão</div>;
     }
     
     return <div>Empresa: {currentTenant.name}</div>;
   }
   ```

3. **Criar novos tenants:**
   ```javascript
   const { createTenant } = useTenant();
   
   await createTenant({
     name: "Minha Empresa",
     cnpj: "00.000.000/0000-00",
     address: "Rua das Flores, 123"
   });
   ```

### Para Usuários Finais

1. **Primeiro Acesso:**
   - Fazer login no sistema
   - Criar primeira empresa
   - Sistema redireciona automaticamente

2. **Múltiplas Empresas:**
   - Usar seletor na sidebar
   - Criar novas empresas via botão "Nova"
   - Alternar entre empresas conforme necessário

3. **Convites:**
   - Proprietários podem convidar usuários
   - Usuários recebem acesso com roles específicos
   - Dados permanecem isolados por empresa

## 🔐 Segurança

### Isolamento de Dados

- **Nível de Aplicação**: Filtros automáticos por tenant_id
- **Nível de Banco**: Row Level Security (RLS) no Supabase
- **Nível de API**: Validação de tenant em todas as operações

### Controle de Acesso

```javascript
// Roles por tenant
const TENANT_ROLES = {
  ADMIN: 'admin',     // Controle total da empresa
  MANAGER: 'manager', // Gerenciamento operacional
  OPERATOR: 'operator', // Operações básicas
  VIEWER: 'viewer'    // Apenas visualização
};
```

### Auditoria

- Logs de criação/atualização com timestamps
- Rastreamento de usuário por operação
- Histórico de mudanças por tenant

## 📊 Benefícios

### Para o Provedor (Você)

- **Escalabilidade**: Um sistema para múltiplos clientes
- **Manutenção**: Código único, atualizações centralizadas
- **Custos**: Infraestrutura compartilhada
- **Receita**: Modelo SaaS com múltiplos clientes

### Para os Clientes

- **Isolamento**: Dados completamente separados
- **Personalização**: Configurações por empresa
- **Colaboração**: Múltiplos usuários por empresa
- **Segurança**: Acesso controlado por roles

## 🔄 Migração de Dados Existentes

Se você já tem dados no sistema atual:

1. **Criar tenant padrão:**
   ```sql
   INSERT INTO tenants (name, owner_id) 
   VALUES ('Empresa Principal', 'user-id-atual');
   ```

2. **Associar dados existentes:**
   ```sql
   UPDATE products SET tenant_id = 'tenant-id-criado';
   UPDATE sales SET tenant_id = 'tenant-id-criado';
   -- Repetir para todas as tabelas
   ```

3. **Criar relacionamento usuário-tenant:**
   ```sql
   INSERT INTO tenant_users (tenant_id, user_id, role)
   VALUES ('tenant-id-criado', 'user-id-atual', 'admin');
   ```

## 🎯 Próximos Passos

1. **Implementar convites de usuários**
2. **Adicionar billing por tenant**
3. **Criar dashboard de administração**
4. **Implementar limites por plano**
5. **Adicionar métricas por tenant**

## 🆘 Troubleshooting

### Problemas Comuns

1. **"Nenhuma empresa selecionada"**
   - Verificar se localStorage tem current_tenant_id
   - Verificar se usuário tem acesso ao tenant

2. **Dados não aparecem**
   - Confirmar que tenant_id está sendo enviado
   - Verificar políticas RLS no Supabase

3. **Erro de permissão**
   - Verificar role do usuário no tenant
   - Confirmar que tenant_users está correto

### Debug

```javascript
// Verificar tenant atual
console.log('Current Tenant:', localStorage.getItem('current_tenant_id'));

// Verificar tenants do usuário
const { userTenants } = useTenant();
console.log('User Tenants:', userTenants);
```

## 📞 Suporte

Para dúvidas sobre a implementação multi-tenant:

1. Verificar este guia primeiro
2. Consultar logs do navegador
3. Verificar políticas RLS no Supabase
4. Testar com dados de exemplo

---

**Sistema Multi-Tenant implementado com sucesso! 🎉**

Agora você pode fornecer o Mercadinho Mix para múltiplos clientes com isolamento completo de dados.