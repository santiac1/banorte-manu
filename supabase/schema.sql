-- Supabase Schema for MCP Financiero

-- Custom Types
CREATE TYPE transaction_type AS ENUM ('ingreso', 'gasto');
CREATE TYPE budget_period AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');

-- Profiles table extending auth.users
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at timestamptz,
  full_name text,
  avatar_url text,
  currency text DEFAULT 'MXN'::text
);

-- Categories table
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type transaction_type NOT NULL,
  icon_name text
);

-- Transactions table
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id),
  date timestamptz NOT NULL,
  amount numeric NOT NULL,
  type transaction_type NOT NULL,
  description text,
  metadata jsonb
);

-- Budgets table
CREATE TABLE public.budgets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id),
  amount numeric NOT NULL,
  period budget_period NOT NULL DEFAULT 'monthly'::budget_period,
  start_date date NOT NULL DEFAULT (date_trunc('month'::text, now()))::date
);

-- Financial goals table
CREATE TABLE public.financial_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric NOT NULL,
  current_amount numeric NOT NULL DEFAULT 0,
  target_date date,
  priority smallint DEFAULT 3
);

-- Simulations table
CREATE TABLE public.simulations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  parameters jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Simulation results table
CREATE TABLE public.simulation_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_id uuid NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
  projected_data jsonb NOT NULL,
  summary_insight text
);

-- Row Level Security Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Los usuarios pueden ver su propio perfil." ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Los usuarios pueden actualizar su propio perfil." ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Los usuarios pueden ver categorías globales y las suyas." ON public.categories FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Los usuarios pueden crear sus propias categorías." ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Los usuarios solo pueden modificar/borrar sus categorías." ON public.categories FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Los usuarios solo pueden gestionar sus propias transacciones." ON public.transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Los usuarios solo pueden gestionar sus propios presupuestos." ON public.budgets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Los usuarios solo pueden gestionar sus propias metas." ON public.financial_goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Los usuarios solo pueden gestionar sus propias simulaciones." ON public.simulations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.simulation_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Los usuarios solo pueden ver resultados de sus simulaciones." ON public.simulation_results FOR SELECT USING (
  auth.uid() IN (
    SELECT s.user_id FROM public.simulations s WHERE s.id = simulation_id
  )
);
