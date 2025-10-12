import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MenuProvider } from "./context/MenuContext";
import React, { useState } from "react";

import Login from "./components/login.jsx";
import Inicio from "./pages/Inicio.jsx";
import Clientes from "./pages/clientes/Clientes.jsx";
import Proyectos from "./pages/proyectos/Proyectos.jsx";
import Consultar from "./pages/Consultar.jsx";
import Reportes from "./pages/reportes/Reportes.jsx";
import Seguridad from "./pages/seguridad/Seguridad.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

function App() {
  // ✅ Cargar el estado inicial directamente desde localStorage
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("isAuthenticated") === "true";
  });

  // 🔹 Manejar login / logout
  const handleAuthChange = (value) => {
    setIsAuthenticated(value);
    if (value) {
      localStorage.setItem("isAuthenticated", "true");
    } else {
      localStorage.removeItem("isAuthenticated");
    }
  };

  // 🔹 Ruta protegida
  const PrivateRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/" replace />;
  };

  return (
    <BrowserRouter>
      <MenuProvider>
        <Routes>
          {/* 🔹 RUTAS PÚBLICAS */}
          <Route
            path="/"
            element={<Login setIsAuthenticated={handleAuthChange} />}
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* 🔹 RUTAS PROTEGIDAS */}
          <Route
            path="/inicio"
            element={
              <PrivateRoute>
                <Inicio setIsAuthenticated={handleAuthChange} />
              </PrivateRoute>
            }
          />
          <Route
            path="/clientes/*"
            element={
              <PrivateRoute>
                <Clientes setIsAuthenticated={handleAuthChange} />
              </PrivateRoute>
            }
          />
          <Route
            path="/proyectos/*"
            element={
              <PrivateRoute>
                <Proyectos setIsAuthenticated={handleAuthChange} />
              </PrivateRoute>
            }
          />
          <Route
            path="/consultar"
            element={
              <PrivateRoute>
                <Consultar setIsAuthenticated={handleAuthChange} />
              </PrivateRoute>
            }
          />
          <Route
            path="/reportes/*"
            element={
              <PrivateRoute>
                <Reportes setIsAuthenticated={handleAuthChange} />
              </PrivateRoute>
            }
          />
          <Route
            path="/seguridad/*"
            element={
              <PrivateRoute>
                <Seguridad setIsAuthenticated={handleAuthChange} />
              </PrivateRoute>
            }
          />

          {/* 🔹 Si no coincide ninguna ruta, redirige según autenticación */}
          <Route
            path="*"
            element={
              <Navigate to={isAuthenticated ? "/inicio" : "/"} replace />
            }
          />
        </Routes>
      </MenuProvider>
    </BrowserRouter>
  );
}

export default App;
