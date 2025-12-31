-- INSTRUÇÕES PARA CONFIGURAR USUÁRIO ADMIN
-- 1. Execute primeiro o arquivo supabase_profiles_schema.sql no SQL Editor do Supabase
-- 2. Substitua 'SEU_EMAIL_AQUI' pelo seu email real
-- 3. Execute este script no SQL Editor do Supabase

-- Primeiro, vamos verificar se a tabela profiles existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'profiles'
);

-- Se a tabela não existir, execute primeiro o supabase_profiles_schema.sql

-- Agora, vamos encontrar seu usuário na tabela auth.users
-- SUBSTITUA 'SEU_EMAIL_AQUI' pelo seu email real
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'SEU_EMAIL_AQUI';

-- Copie o ID do usuário da consulta acima e use na próxima consulta
-- SUBSTITUA 'SEU_USER_ID_AQUI' pelo ID real do usuário
-- SUBSTITUA 'SEU_EMAIL_AQUI' pelo seu email real
INSERT INTO profiles (id, email, full_name, role, is_active)
VALUES (
  'SEU_USER_ID_AQUI',  -- Substitua pelo ID real
  'SEU_EMAIL_AQUI',    -- Substitua pelo seu email
  'Administrador',      -- Ou seu nome real
  'admin',
  true
)
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  is_active = true,
  updated_at = now();

-- Verificar se o usuário foi configurado corretamente
SELECT p.*, u.email as auth_email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'admin';

-- EXEMPLO PRÁTICO:
-- Se seu email for joao@exemplo.com e o ID for 12345678-1234-1234-1234-123456789012
-- A consulta seria:
/*
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
*/