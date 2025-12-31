# Configuração de Usuário Admin

Este guia explica como configurar seu usuário como administrador no sistema.

## Pré-requisitos

1. Ter uma conta no Supabase
2. Ter acesso ao painel do Supabase do seu projeto
3. Ter um usuário já registrado no sistema

## Passo 1: Criar a Tabela de Perfis

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Vá para o seu projeto
3. Clique em "SQL Editor" no menu lateral
4. Execute o conteúdo do arquivo `supabase_profiles_schema.sql`

## Passo 2: Configurar seu Usuário como Admin

### Opção A: Usando o SQL Editor (Recomendado)

1. No SQL Editor do Supabase, execute a seguinte consulta para encontrar seu usuário:

```sql
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'SEU_EMAIL_AQUI';
```

2. Copie o `id` do seu usuário

3. Execute a seguinte consulta substituindo os valores:

```sql
INSERT INTO profiles (id, email, full_name, role, is_active)
VALUES (
  'SEU_USER_ID_AQUI',  -- Cole o ID copiado
  'SEU_EMAIL_AQUI',    -- Seu email
  'Seu Nome Completo', -- Seu nome
  'admin',
  true
)
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  is_active = true,
  updated_at = now();
```

4. Verifique se funcionou:

```sql
SELECT p.*, u.email as auth_email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'admin';
```

### Opção B: Usando o Script Automático

1. Certifique-se de que o Node.js está instalado
2. No terminal, execute:

```bash
node scripts/setup_admin_user.js
```

3. Digite seu email quando solicitado

## Passo 3: Verificar no Sistema

1. Faça logout do sistema se estiver logado
2. Faça login novamente
3. Você deve ver que seu usuário agora tem role de "Administrador"
4. Acesse a área de gerenciamento de usuários (se disponível)

## Estrutura de Roles

O sistema possui 4 níveis de acesso:

- **Admin**: Acesso total ao sistema
- **Manager**: Gerenciamento de produtos, vendas e relatórios
- **Operator**: Operação básica (PDV, produtos)
- **Viewer**: Apenas visualização

## Permissões por Role

### Admin
- Todas as permissões do sistema
- Gerenciamento de usuários
- Configurações avançadas

### Manager
- Produtos: visualizar, criar, editar
- Vendas: visualizar, criar, cancelar
- Estoque: visualizar, editar, histórico
- Relatórios: visualizar, exportar
- PDV: acesso completo com descontos

### Operator
- Produtos: visualizar
- Vendas: visualizar, criar
- Estoque: visualizar
- PDV: acesso básico

### Viewer
- Produtos: visualizar
- Vendas: visualizar
- Estoque: visualizar
- Relatórios: visualizar

## Solução de Problemas

### Erro: "Tabela profiles não existe"
Execute primeiro o arquivo `supabase_profiles_schema.sql`

### Erro: "Usuário não encontrado"
Certifique-se de que você já se registrou no sistema pelo menos uma vez

### Erro: "Permissão negada"
Verifique se você está usando as credenciais corretas do Supabase

### Role não está sendo aplicada
1. Faça logout completo do sistema
2. Limpe o localStorage do navegador
3. Faça login novamente

## Exemplo Prático

Se seu email for `joao@exemplo.com` e o ID do usuário for `12345678-1234-1234-1234-123456789012`:

```sql
INSERT INTO profiles (id, email, full_name, role, is_active)
VALUES (
  '12345678-1234-1234-1234-123456789012',
  'joao@exemplo.com',
  'João Silva',
  'admin',
  true
)
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  is_active = true,
  updated_at = now();
```

## Próximos Passos

Após configurar seu usuário como admin, você pode:

1. Acessar o componente de gerenciamento de usuários
2. Configurar outros usuários com diferentes roles
3. Personalizar as permissões conforme necessário

## Suporte

Se encontrar problemas, verifique:

1. As variáveis de ambiente estão configuradas corretamente
2. O Supabase está acessível
3. As tabelas foram criadas corretamente
4. Você está usando o email correto