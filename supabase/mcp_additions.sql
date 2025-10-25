-- Nuevas tablas requeridas por el backend MCP Financiero
-- Ejecutar este script en la base de datos de Supabase correspondiente al proyecto existente.

create table if not exists financial_goals (
    id uuid primary key default gen_random_uuid(),
    user_id integer not null references app_users(id) on delete cascade,
    name text not null,
    description text,
    target_amount numeric not null,
    current_amount numeric default 0,
    deadline date,
    created_at timestamp with time zone default timezone('utc', now())
);

create table if not exists simulations (
    id uuid primary key default gen_random_uuid(),
    user_id integer not null references app_users(id) on delete cascade,
    name text not null,
    parameters jsonb not null,
    created_at timestamp with time zone default timezone('utc', now())
);

create table if not exists simulation_results (
    id uuid primary key default gen_random_uuid(),
    simulation_id uuid not null references simulations(id) on delete cascade,
    projected_data jsonb not null,
    summary_insight text,
    created_at timestamp with time zone default timezone('utc', now())
);
