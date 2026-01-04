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

async function cadastrarCliente() {
  try {
    console.log('🏢 Cadastrando novo cliente...');
    
    // Solicitar dados do cliente
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const pergunta = (question) => new Promise((resolve) => {
      rl.question(question, resolve);
    });
    
    console.log('\n📝 Preencha os dados do cliente:');
    
    const nomeEmpresa = await pergunta('Nome da Empresa: ');
    const emailCliente = await pergunta('Email do Cliente: ');
    const cnpj = await pergunta('CNPJ (opcional): ');
    const endereco = await pergunta('Endereço (opcional): ');
    const telefone = await pergunta('Telefone (opcional): ');
    
    rl.close();
    
    if (!nomeEmpresa || !emailCliente) {
      console.error('❌ Nome da empresa e email são obrigatórios');
      return;
    }
    
    // Verificar se o usuário existe
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao verificar usuários:', authError.message);
      console.log('💡 O cliente precisa se registrar primeiro no sistema');
      console.log(`💡 Envie este link para o cliente: ${supabaseUrl.replace('/rest/v1', '')}/auth/signup`);
      return;
    }
    
    const clienteUser = authUsers.users.find(u => u.email === emailCliente);
    
    if (!clienteUser) {
      console.log('⚠️ Cliente não encontrado no sistema de autenticação');
      console.log('💡 O cliente precisa se registrar primeiro');
      console.log(`💡 Link de registro: ${supabaseUrl.replace('/rest/v1', '')}/auth/signup`);
      console.log('💡 Após o cliente se registrar, execute este script novamente');
      return;
    }
    
    // Criar tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: nomeEmpresa,
        cnpj: cnpj || null,
        address: endereco || null,
        phone: telefone || null,
        email: emailCliente,
        active: true,
        owner_id: clienteUser.id
      })
      .select()
      .single();
    
    if (tenantError) {
      console.error('❌ Erro ao criar empresa:', tenantError.message);
      return;
    }
    
    // Adicionar cliente como admin do tenant
    const { error: clienteUserError } = await supabase
      .from('tenant_users')
      .insert({
        tenant_id: tenant.id,
        user_id: clienteUser.id,
        role: 'admin',
        active: true
      });
    
    if (clienteUserError) {
      console.error('❌ Erro ao adicionar cliente ao tenant:', clienteUserError.message);
    }
    
    // Adicionar super admin ao tenant
    const { data: superAdminUsers } = await supabase.auth.admin.listUsers();
    const superAdmin = superAdminUsers.users.find(u => u.email === 'ederportelalima@hotmail.com');
    
    if (superAdmin) {
      await supabase
        .from('tenant_users')
        .insert({
          tenant_id: tenant.id,
          user_id: superAdmin.id,
          role: 'super_admin',
          active: true
        });
    }
    
    // Criar configurações da loja
    const { error: settingsError } = await supabase
      .from('store_settings')
      .insert({
        store_name: nomeEmpresa,
        cnpj: cnpj || null,
        address: endereco || null,
        phone: telefone || null,
        tenant_id: tenant.id,
        auto_print: true,
        enable_stock_alerts: true,
        currency: 'BRL'
      });
    
    if (settingsError) {
      console.error('⚠️ Erro ao criar configurações:', settingsError.message);
    }
    
    console.log('\n✅ Cliente cadastrado com sucesso!');
    console.log('📋 Detalhes:');
    console.log(`   Empresa: ${tenant.name}`);
    console.log(`   Email: ${tenant.email}`);
    console.log(`   ID do Tenant: ${tenant.id}`);
    console.log(`   Owner ID: ${tenant.owner_id}`);
    
    console.log('\n🎯 Próximos passos:');
    console.log('1. O cliente já pode fazer login no sistema');
    console.log('2. Ele verá apenas sua empresa na lista');
    console.log('3. Você (super admin) pode acessar a empresa dele para suporte');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  cadastrarCliente();
}

export { cadastrarCliente };