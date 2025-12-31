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

async function setupAdminUser() {
  try {
    console.log('🔧 Configurando usuário admin...');
    
    // Solicitar email do usuário
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const email = await new Promise((resolve) => {
      rl.question('Digite o email do usuário que deve ser admin: ', (answer) => {
        resolve(answer.trim());
      });
    });
    
    rl.close();
    
    if (!email) {
      console.error('❌ Email é obrigatório');
      return;
    }
    
    // Verificar se o usuário existe na tabela auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao listar usuários:', authError.message);
      console.log('💡 Nota: Este script precisa de permissões de admin. Você pode executar o SQL diretamente no Supabase.');
      return;
    }
    
    const user = authUsers.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`❌ Usuário com email ${email} não encontrado`);
      console.log('💡 Certifique-se de que o usuário já se registrou no sistema');
      return;
    }
    
    // Atualizar ou criar perfil como admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email.split('@')[0],
        role: 'admin',
        is_active: true
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Erro ao atualizar perfil:', profileError.message);
      return;
    }
    
    console.log('✅ Usuário configurado como admin com sucesso!');
    console.log('📋 Detalhes do usuário:');
    console.log(`   Email: ${profile.email}`);
    console.log(`   Nome: ${profile.full_name}`);
    console.log(`   Role: ${profile.role}`);
    console.log(`   Ativo: ${profile.is_active}`);
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setupAdminUser();
}

export { setupAdminUser };