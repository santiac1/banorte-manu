## Proyecto Banorte MCP

Este repositorio contiene la aplicación de Banorte con frontend en Next.js y un backend avanzado en FastAPI localizado en `mcp_financiero_backend`. El backend utiliza Supabase como fuente de datos y bibliotecas de ciencia de datos (pandas, Prophet, LangChain) para habilitar simulaciones financieras y analítica enriquecida.

## Requisitos de entorno

1. **Frontend (Next.js)**

   Configura un archivo `.env.local` (puedes usar `env.local.example` como base) con las variables:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL="https://<tu-proyecto>.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="<tu-clave-anonima>"
   NEXT_PUBLIC_MCP_API_URL="http://127.0.0.1:8000"
   ```

2. **Backend (FastAPI)**

   Crea un archivo `.env` dentro de `mcp_financiero_backend/` con:

   ```bash
   SUPABASE_URL="https://<tu-proyecto>.supabase.co"
   SUPABASE_SERVICE_KEY="<tu-service-role-key>"
   GEMINI_API_KEY="<tu-api-key-de-gemini>"
   ```

3. **Base de datos Supabase**

   Ejecuta el script `supabase/mcp_additions.sql` sobre tu instancia de Supabase para crear las tablas adicionales (`financial_goals`, `simulations`, `simulation_results`) requeridas por el backend.

## Ejecución local

### Backend MCP Financiero

```bash
cd mcp_financiero_backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Next.js

En una terminal separada:

```bash
npm install
npm run dev
```

Accede a `http://localhost:3000` para utilizar la aplicación. El dashboard consumirá los endpoints del backend MCP para obtener estadísticas avanzadas y simulaciones.
