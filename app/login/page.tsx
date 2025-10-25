"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import supabase from "@/services/supabase";
import {
  authenticatePersonalUser,
  authenticateCompanyUser,
} from "@/services/auth";
import { Tables } from "@/services/supabasaTypes";
import BanorteLogo from "@/components/BanorteLogo";

type AppUser = Tables<"app_users">;
type Company = Tables<"companies">;

export default function LoginPage() {
  const [userType, setUserType] = useState<"personal" | "company">("personal");
  const [userId, setUserId] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [users, setUsers] = useState<AppUser[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const establishSupabaseSession = async (
    type: "personal" | "company",
    id: string
  ) => {
    await supabase.auth.signOut();

    const { data: signInData, error: signInError } =
      await supabase.auth.signInAnonymously();

    if (signInError || !signInData.session) {
      throw new Error(
        signInError?.message || "No se pudo iniciar una sesión segura en Supabase"
      );
    }

    const numericId = parseInt(id, 10);

    if (type === "personal" && Number.isNaN(numericId)) {
      throw new Error("El identificador del usuario personal debe ser numérico");
    }

    const metadata: Record<string, unknown> = {
      app_user_id: type === "personal" ? numericId : 0,
      user_type: type,
    };

    if (type === "company") {
      metadata.company_id = id;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      data: metadata,
    });

    if (updateError) {
      throw new Error(
        `No se pudo actualizar el perfil seguro del usuario: ${updateError.message}`
      );
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar usuarios personales
        const { data: usersData, error: usersError } = await supabase
          .from("app_users")
          .select("*");

        if (usersError) throw usersError;
        setUsers(usersData || []);

        // Cargar empresas
        const { data: companiesData, error: companiesError } = await supabase
          .from("companies")
          .select("*");

        if (companiesError) throw companiesError;
        setCompanies(companiesData || []);
      } catch (error) {
        console.error("Error cargando datos:", error);
        setError("Error al cargar usuarios y empresas");
      }
    };

    loadData();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      let authResult;

      if (userType === "personal") {
        authResult = await authenticatePersonalUser(userId, userName);
      } else {
        authResult = await authenticateCompanyUser(userId, userName);
      }

      if (authResult.success) {
        await establishSupabaseSession(userType, userId);
        // Guardar información de la sesión
        sessionStorage.setItem("isAuthenticated", "true");
        sessionStorage.setItem("userType", userType);
        sessionStorage.setItem("userId", userId);

        // Redirigir al dashboard principal
        window.location.href = "/dashboard";
      } else {
        setError(authResult.error || "Credenciales incorrectas");
      }
    } catch (error) {
      console.error("Error en autenticación:", error);
      setError("Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-red-100">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4">
            <BanorteLogo size="lg" className="mx-auto shadow-lg" />
          </div>
          <h1 className="text-2xl font-bold text-red-900">Banorte Digital</h1>
          <p className="text-red-700 mt-2">Inicia sesión en tu cuenta</p>
        </div>
        {/* Formulario de inicio de sesión */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Selector de tipo de usuario */}
          <div className="flex rounded-lg bg-red-100 p-1">
            <button
              type="button"
              onClick={() => {
                setUserType("personal");
                setUserId("");
                setUserName("");
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                userType === "personal"
                  ? "bg-white text-red-700 shadow-sm"
                  : "text-red-600 hover:text-red-700"
              }`}
            >
              Personal
            </button>
            <button
              type="button"
              onClick={() => {
                setUserType("company");
                setUserId("");
                setUserName("");
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                userType === "company"
                  ? "bg-white text-red-700 shadow-sm"
                  : "text-red-600 hover:text-red-700"
              }`}
            >
              Empresarial
            </button>
          </div>

          {/* Field de la ID */}
          <div>
            <label
              htmlFor="userId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {userType === "personal" ? "ID de Usuario" : "ID de Empresa"}
            </label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder={userType === "personal" ? "Ej: 47" : "Ej: E016"}
              list={
                userType === "personal"
                  ? "personal-user-ids"
                  : "company-ids"
              }
            />
            {userType === "personal" ? (
              <datalist id="personal-user-ids">
                {users.map((user) => (
                  <option key={user.id} value={user.id.toString()}>
                    {user.name || `Usuario ${user.id}`}
                  </option>
                ))}
              </datalist>
            ) : (
              <datalist id="company-ids">
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name || company.id}
                  </option>
                ))}
              </datalist>
            )}
          </div>

          {/* Campo de Nombre */}
          <div>
            <label
              htmlFor="userName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              {userType === "personal"
                ? "Nombre de Usuario"
                : "Nombre de Empresa"}
            </label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder={
                userType === "personal"
                  ? "Ej: Usuario Demo"
                  : "Ej: E016 SA de CV"
              }
              list={
                userType === "personal"
                  ? "personal-user-names"
                  : "company-names"
              }
            />
            {userType === "personal" ? (
              <datalist id="personal-user-names">
                {users.map((user) => (
                  <option
                    key={user.id}
                    value={user.name || `Usuario ${user.id}`}
                  />
                ))}
              </datalist>
            ) : (
              <datalist id="company-names">
                {companies.map((company) => (
                  <option
                    key={company.id}
                    value={company.name || company.id}
                  />
                ))}
              </datalist>
            )}
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white"
            disabled={isLoading || !userId || !userName}
          >
            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>
        </form>
      </div>
    </div>
  );
}
