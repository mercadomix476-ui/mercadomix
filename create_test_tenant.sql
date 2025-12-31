-- CRIAR TENANT DE TESTE
-- Execute DEPOIS do fix_step_by_step.sql

-- 1. Encontrar seu ID de usuário
SELECT 'Seu ID de usuário:' as info, id, email 
FROM auth.users 
WHERE email = 'ederportelalima@hotmail.com';

-- 2. Criar tenant de teste (substitua USER_ID_AQUI pelo ID do passo 1)
/*
INSERT INTO tenants (name, active, owner_id)
VALUES (
    'Mercadinho Central',
    TRUE,
    'USER_ID_AQUI'  -- Substitua pelo seu ID real
);
*/

-- 3. Adicionar você ao tenant (substitua USER_ID_AQUI pelo ID do passo 1)
/*
INSERT INTO tenant_users (tenant_id, user_id, role, active)
SELECT 
    t.id,
    'USER_ID_AQUI',  -- Substitua pelo seu ID real
    'super_admin',
    TRUE
FROM tenants t
WHERE t.name = 'Mercadinho Central';
*/

-- 4. Verificar resultado
SELECT 
    'Tenants criados:' as info,
    COUNT(*) as total
FROM tenants;