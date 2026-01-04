import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupSuperAdmin() {
  try {
    console.log('🔧 Configurando super admin...');
    
    const email = 'ederportelalima@hotmail.com';
    
    // Verificar se o usuário existe
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao listar usuários:', authError.message);
      console.log('💡 Nota: Este script precisa de permissões de admin. Execute o SQL diretamente no Supabase.');
      return;
    }
    
    const user = authUsers.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`❌ Usuário com email ${email} não encontrado`);
      console.log('💡 Certifique-se de que o usuário já se registrou no sistema');
      return;
    }
    
    // Verificar se a coluna is_super_admin existe
    const { error: columnError } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .limit(1);
    
    if (columnError && columnError.message.includes('column "is_super_admin" does not exist')) {
      console.log('⚠️ Coluna is_super_admin não existe. Execute primeiro o setup_super_admin.sql');
      return;
    }
    
    // Atualizar ou criar perfil como super admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || 'Eder Portal - Super Admin',
        role: 'super_admin',
        is_active: true,
        is_super_admin: true
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Erro ao atualizar perfil:', profileError.message);
      return;
    }
    
    // Buscar todos os tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('active', true);
    
    if (tenantsError) {
      console.error('❌ Erro ao buscar tenants:', tenantsError.message);
      return;
    }
    
    // Adicionar super admin a todos os tenants
    let addedToTenants = 0;
    for (const tenant of tenants) {
      const { error: tenantUserError } = await supabase
        .from('tenant_users')
        .upsert({
          tenant_id: tenant.id,
          user_id: user.id,
          role: 'super_admin',
          active: true
        });
      
      if (!tenantUserError) {
        addedToTenants++;
      }
    }
    
    console.log('✅ Super admin configurado com sucesso!');
    console.log('📋 Detalhes:');
    console.log(`   Email: ${profile.email}`);
    console.log(`   Nome: ${profile.full_name}`);
    console.log(`   Role: ${profile.role}`);
    console.log(`   Super Admin: ${profile.is_super_admin}`);
    console.log(`   Ativo: ${profile.is_active}`);
    console.log(`   Tenants com acesso: ${addedToTenants}/${tenants.length}`);
    
    if (addedToTenants < tenants.length) {
      console.log('⚠️ Alguns tenants podem não ter sido atualizados. Verifique as permissões.');
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setupSuperAdmin();
}

export { setupSuperAdmin };