# Guia de Cadastro de Clientes - Nexus Commerce

## 🎯 Visão Geral

Como super admin do Nexus Commerce, você pode cadastrar novos clientes de 3 formas diferentes.

## 📋 Método 1: Via Interface (Mais Fácil)

### Passo a Passo:

1. **Faça login** como super admin (`ederportelalima@hotmail.com`)
2. **Na sidebar**, você verá o botão "Nova Empresa"
3. **Clique em "Nova Empresa"**
4. **Preencha o formulário:**
   - Nome da Empresa (obrigatório)
   - CNPJ (opcional)
   - Endereço (opcional)
   - Telefone (opcional)
   - Email do proprietário (opcional)
   - Descrição (opcional)
5. **Clique em "Criar Empresa"**

### ✅ Vantagens:
- Interface amigável
- Validação automática
- Feedback visual
- Não precisa de SQL

## 🖥️ Método 2: Via Script JavaScript

### Como usar:

```bash
node scripts/cadastrar_cliente.js
```

### O script vai perguntar:
- Nome da Empresa
- Email do Cliente
- CNPJ (opcional)
- Endereço (opcional)
- Telefone (opcional)

### ✅ Vantagens:
- Automatizado
- Verifica se o cliente existe
- Cria tudo de uma vez
- Adiciona você como super admin automaticamente

## 💾 Método 3: Via SQL Manual

### Use o arquivo: `cadastrar_primeiro_cliente.sql`

**IMPORTANTE:** Substitua os dados de exemplo pelos dados reais:

```sql
-- Exemplo de dados para substituir:
'Padaria do João'  -- Nome da empresa
'joao@padaria.com' -- Email do cliente
'12.345.678/0001-99' -- CNPJ
'Rua das Padarias, 456' -- Endereço
'(11) 98765-4321' -- Telefone
```

## 🔄 Fluxo Completo de Cadastro

### 1. **Cliente se Registra**
- O cliente acessa o sistema
- Cria sua conta (email + senha)
- Confirma o email

### 2. **Você Cria a Empresa**
- Use qualquer um dos 3 métodos acima
- A empresa fica vinculada ao email do cliente

### 3. **Cliente Acessa sua Empresa**
- Cliente faz login
- Vê apenas sua empresa
- Pode gerenciar produtos, vendas, etc.

### 4. **Você Tem Acesso Total**
- Como super admin, você vê todas as empresas
- Pode alternar entre empresas
- Pode dar suporte a qualquer cliente

## 🎯 Exemplo Prático

### Cenário: Cadastrar "Padaria do João"

**1. Cliente se registra:**
- Email: `joao@padaria.com`
- Senha: (definida pelo cliente)

**2. Você cria a empresa via interface:**
- Nome: "Padaria do João"
- CNPJ: "12.345.678/0001-99"
- Email: `joao@padaria.com`

**3. Resultado:**
- João pode fazer login e ver apenas sua padaria
- Você pode alternar para a "Padaria do João" para dar suporte

## 🔧 Configurações Automáticas

Quando você cria uma empresa, o sistema automaticamente:

✅ **Cria o tenant** (empresa)  
✅ **Adiciona o cliente como admin** da empresa  
✅ **Adiciona você como super admin** da empresa  
✅ **Cria configurações padrão** da loja  
✅ **Define permissões** corretas  

## 🚨 Pontos Importantes

### ⚠️ O Cliente DEVE se Registrar Primeiro
- O cliente precisa criar uma conta no sistema
- Só depois você pode criar a empresa para ele
- Use o email exato que ele usou no registro

### ✅ Você Sempre Tem Acesso
- Como super admin, você automaticamente tem acesso a todas as empresas
- Pode alternar entre empresas na sidebar
- Pode dar suporte sem precisar de permissões extras

### 🔒 Isolamento de Dados
- Cada cliente vê apenas seus próprios dados
- Produtos, vendas e configurações são isolados por empresa
- Apenas você (super admin) pode ver tudo

## 📞 Suporte ao Cliente

### Como Acessar a Empresa de um Cliente:

1. **Faça login** como super admin
2. **Na sidebar**, use o seletor de empresas
3. **Selecione a empresa** do cliente
4. **Agora você vê os dados** como se fosse o cliente
5. **Pode ajudar** com produtos, vendas, configurações, etc.

### Para Voltar à Visão Geral:
- Selecione "🌐 Todas as Empresas" no seletor

---

**💡 Dica:** Comece sempre com o **Método 1 (Interface)** - é o mais simples e funciona perfeitamente para a maioria dos casos!