import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AuthContext } from "./AuthContext.jsx";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);

  // 🔹 LOGOUT memoizado para no cambiar en cada render
  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    setUser(null);
    setIsAuthenticated(false);
    setMfaRequired(false);
  }, []);

  // 🔹 Cierre de sesión por inactividad
  useEffect(() => {
    const timeout = 15 * 60 * 1000; // 15 minutos
    let timer;

    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        alert("Sesión cerrada por inactividad");
        logout();
      }, timeout);
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("scroll", resetTimer);
    window.addEventListener("click", resetTimer);

    // Iniciar el timer la primera vez
    resetTimer();

    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("scroll", resetTimer);
      window.removeEventListener("click", resetTimer);
    };
  }, [logout]);

  // 🔹 LOGIN
  const login = async (email, password) => {
    if (!email || !password) throw new Error("Email y contraseña son obligatorios");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.status === "mfa_required") {
        setMfaRequired(true);
        setUser(data.user || null);
        setIsAuthenticated(false);
      } else if (data.status === "success") {
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user_data", JSON.stringify(data.user));
        setUser(data.user);
        setIsAuthenticated(true);
        setMfaRequired(false);
      } else {
        throw new Error(data.message || "Error en el login");
      }

      return data;
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    }
  };

  // 🔹 VERIFICAR MFA
  const verifyMFA = async (email, mfa_code) => {
    if (!email) throw new Error("Correo del usuario no definido");
    if (!mfa_code) throw new Error("Código MFA obligatorio");

    try {
      const res = await fetch("/api/auth/verify-mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, mfa_code }),
      });

      const data = await res.json();

      if (data.status === "success") {
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user_data", JSON.stringify(data.user));
        setUser(data.user);
        setIsAuthenticated(true);
        setMfaRequired(false);
      } else {
        throw new Error(data.message || "Código MFA inválido");
      }

      return data;
    } catch (err) {
      console.error("MFA verification failed:", err);
      throw err;
    }
  };

  // 🔹 CARGAR USUARIO AL INICIAR LA APP
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user_data");

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        setMfaRequired(false);
      } catch {
        logout();
      }
    } else {
      logout();
    }

    setIsLoading(false);
  }, [logout]);

  // 🔹 CONTEXTO MEMOIZADO
  const contextValue = useMemo(() => {
    const userName = user?.nombre || null;
    const permissions = user?.permissions || [];

    return {
      user,
      userName,
      permissions,
      isAuthenticated,
      isLoading,
      mfaRequired,
      login,
      verifyMFA,
      logout,
      hasPermission: (modulo, submodulo) =>
        permissions.some(
          (p) => p.nombreModulo === modulo && p.nombreSubmodulo === submodulo
        ),
    };
  }, [user, isAuthenticated, isLoading, mfaRequired, logout]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
