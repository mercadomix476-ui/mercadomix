-- Criar tabela de perfis de usuário
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text default 'operator' check (role in ('admin', 'manager', 'operator', 'viewer')),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Habilitar RLS (Row Level Security)
alter table profiles enable row level security;

-- Política para permitir que usuários vejam apenas seu próprio perfil
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

-- Política para permitir que usuários atualizem apenas seu próprio perfil (exceto role)
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- Política para admins gerenciarem todos os perfis
create policy "Admins can manage all profiles" on profiles
  for all using (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and role = 'admin'
    )
  );

-- Função para criar perfil automaticamente quando um usuário se registra
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case 
      when new.email = 'seu-email@exemplo.com' then 'admin'  -- Substitua pelo seu email
      else 'operator'
    end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger para executar a função quando um novo usuário é criado
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Função para atualizar o updated_at automaticamente
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger para atualizar updated_at
create or replace trigger on_profiles_updated
  before update on profiles
  for each row execute procedure public.handle_updated_at();