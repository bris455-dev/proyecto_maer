import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth.js";
import Layout from "./components/Layout.jsx";

// Páginas públicas
import Login from "./pages/auth/Login.jsx";
import MFA from "./pages/auth/MFA.jsx";
import FirstAccess from "./pages/auth/FirstAccess.jsx";
import ForgotPassword from "./pages/public/ForgotPassword.jsx";
import ResetPassword from "./pages/public/ResetPassword.jsx";

// Páginas privadas
import Inicio from "./pages/Inicio.jsx";

// Clientes
import ListadoClientes from "./pages/clientes/ListadoClientes.jsx";
import RegistrarCliente from "./pages/clientes/RegistrarCliente.jsx";
import EditarCliente from "./pages/clientes/EditarCliente.jsx";
import Clientes from "./pages/clientes/Clientes.jsx";

// Proyectos
import Proyectos from "./pages/proyectos/Proyectos.jsx";
import ProyectoDetalle from "./pages/proyectos/ProyectoDetalle.jsx";
import ProyectoForm from "./pages/proyectos/ProyectoForm.jsx";
import ProyectoBilling from "./pages/proyectos/ProyectoFacturado.jsx";

// Reportes y Seguridad
import Reportes from "./pages/reportes/Reportes.jsx";
import Seguridad from "./pages/seguridad/Seguridad.jsx";
import BajaUsuarios from "./pages/seguridad/BajaUsuarios.jsx";
import CrearUsuario from "./pages/seguridad/CrearUsuario.jsx";
import CambiarPassword from "./pages/seguridad/CambiarPassword.jsx";
// Opcional: si quieres crear búsqueda de usuarios
// import BuscarUsuarios from "./pages/seguridad/BuscarUsuarios.jsx";

// Layout privado
const PrivateLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
};

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div>Cargando...</div>;

  return (
    <BrowserRouter>
      <Routes>
        {/* Páginas públicas */}
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/inicio" replace /> : <Login />}
        />
        <Route path="/mfa" element={<MFA />} />
        <Route path="/first-access" element={<FirstAccess />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Páginas privadas */}
        <Route element={<PrivateLayout />}>
          <Route path="/inicio" element={<Inicio />} />

          {/* Clientes */}
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/listado" element={<ListadoClientes />} />
          <Route path="/clientes/nuevo" element={<RegistrarCliente />} />
          <Route path="/clientes/editar/:id" element={<EditarCliente />} />

          {/* Proyectos */}
          <Route path="/proyectos" element={<Proyectos />} />
          <Route path="/proyectos/nuevo" element={<ProyectoForm />} />
          <Route path="/proyectos/editar/:id" element={<ProyectoForm />} />
          <Route path="/proyectos/facturado/:id" element={<ProyectoBilling />} />
          <Route path="/proyectos/:id" element={<ProyectoDetalle />} />

          {/* Reportes */}
          <Route path="/reportes" element={<Reportes />} />

          {/* Seguridad / Usuarios */}
          <Route path="/seguridad" element={<Seguridad />} />
          <Route path="/seguridad/crear-usuario" element={<CrearUsuario />} />
          <Route path="/seguridad/baja-usuarios" element={<BajaUsuarios />} />
          <Route path="/seguridad/cambiar-password" element={<CambiarPassword />} />
          {/* Opcional: búsqueda de usuarios */}
          {/* <Route path="/seguridad/buscar-usuarios" element={<BuscarUsuarios />} /> */}
        </Route>

        {/* Ruta catch-all */}
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/inicio" : "/"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
