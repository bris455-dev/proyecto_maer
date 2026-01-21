import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./hooks/useAuth.js";
import Layout from "./components/Layout.jsx";
import StudentLayout from "./components/StudentLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { isStudent } from "./utils/roleHelper.js";

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
import Dashboard from "./pages/reportes/Dashboard.jsx";
import Seguridad from "./pages/seguridad/Seguridad.jsx";
import BajaUsuarios from "./pages/seguridad/BajaUsuarios.jsx";
import CrearUsuario from "./pages/seguridad/CrearUsuario.jsx";
import ListadoUsuarios from "./pages/seguridad/ListadoUsuarios.jsx";
import EditarUsuario from "./pages/seguridad/EditarUsuario.jsx";
import Roles from "./pages/seguridad/Roles.jsx";
import NuevoRol from "./pages/seguridad/NuevoRol.jsx";
import RestablecerContrasena from "./pages/seguridad/RestablecerContrasena.jsx";

// Facturación
import ListadoFacturacion from "./pages/facturacion/ListadoFacturacion.jsx";
import FacturaDetalle from "./pages/facturacion/FacturaDetalle.jsx";
import FacturaGrupal from "./pages/facturacion/FacturaGrupal.jsx";

// Cursos
import ListadoCursos from "./pages/cursos/ListadoCursos.jsx";
import DashboardCursos from "./pages/cursos/DashboardCursos.jsx";

// Inventario
import ListadoInventario from "./pages/inventario/ListadoInventario.jsx";
import CrearProducto from "./pages/inventario/CrearProducto.jsx";
import MovimientosInventario from "./pages/inventario/MovimientosInventario.jsx";

// Producción
import ListadoProduccion from "./pages/produccion/ListadoProduccion.jsx";
import CrearEntrega from "./pages/produccion/CrearEntrega.jsx";
import DetalleEntrega from "./pages/produccion/DetalleEntrega.jsx";
import ReportesCursos from "./pages/cursos/ReportesCursos.jsx";
import GestionMetadatos from "./pages/cursos/GestionMetadatos.jsx";
import CursosBasico from "./pages/cursos/CursosBasico.jsx";
import CursosIntermedio from "./pages/cursos/CursosIntermedio.jsx";
import CursosAvanzado from "./pages/cursos/CursosAvanzado.jsx";
import CrearCurso from "./pages/cursos/CrearCurso.jsx";
import GestionarSesiones from "./pages/cursos/GestionarSesiones.jsx";
import VistaEstudiante from "./pages/cursos/VistaEstudiante.jsx";
import Carrito from "./pages/cursos/Carrito.jsx";
import Pagos from "./pages/cursos/Pagos.jsx";
import MisCursos from "./pages/cursos/MisCursos.jsx";

// Estudiante
import EstudianteDashboard from "./pages/estudiante/Dashboard.jsx";
import EstudianteMisCursos from "./pages/estudiante/MisCursos.jsx";
import EstudianteCatalogo from "./pages/estudiante/Catalogo.jsx";
import EstudianteProgreso from "./pages/estudiante/Progreso.jsx";
import EstudianteMensajes from "./pages/estudiante/Mensajes.jsx";
import EstudianteConfiguracion from "./pages/estudiante/Configuracion.jsx";
import CursoEstudiante from "./pages/estudiante/CursoEstudiante.jsx";

// Componente de redirección para inicio
import InicioRedirect from "./components/InicioRedirect.jsx";

// Utilidades

// --------------  🔥 FIX 🔥 --------------
// Layout para secciones privadas con outlet (IMPORTANTE)
const PrivateLayout = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  
  // Si es estudiante, usar StudentLayout
  if (isStudent(user)) {
    return (
      <StudentLayout>
        <Outlet /> 
      </StudentLayout>
    );
  }
  
  // Para otros roles, usar Layout normal
  return (
    <Layout>
      <Outlet /> 
    </Layout>
  );
};
// ----------------------------------------

// Componente para redirección inicial
const InitialRedirect = () => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Login />;
  }
  
  if (isStudent(user)) {
    return <Navigate to="/estudiante/dashboard" replace />;
  }
  
  return <Navigate to="/inicio" replace />;
};

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div>Cargando...</div>;

  return (
    <BrowserRouter>
      <Routes>

        {/* Publicas */}
        <Route path="/" element={<InitialRedirect />} />
        <Route path="/mfa" element={<MFA />} />
        <Route path="/first-access" element={<FirstAccess />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Privadas */}
        <Route element={<PrivateLayout />}>

          <Route path="/inicio" element={<InicioRedirect />} />

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
          <Route path="/reportes/dashboard" element={<Dashboard />} />

          {/* Facturación - Protegido con permisos */}
          <Route path="/facturacion" element={<ProtectedRoute requiredPermission="Facturación,Gestionar"><ListadoFacturacion /></ProtectedRoute>} />
          <Route path="/facturacion/grupal" element={<ProtectedRoute requiredPermission="Facturación,Gestionar"><FacturaGrupal /></ProtectedRoute>} />
          <Route path="/facturacion/:id" element={<ProtectedRoute requiredPermission="Facturación,Gestionar"><FacturaDetalle /></ProtectedRoute>} />

          {/* Cursos */}
          <Route path="/cursos/dashboard" element={<ProtectedRoute requiredPermission="Cursos,Dashboard"><DashboardCursos /></ProtectedRoute>} />
          <Route path="/cursos/basico" element={<ProtectedRoute requiredPermission="Cursos,Básico"><CursosBasico /></ProtectedRoute>} />
          <Route path="/cursos/intermedio" element={<ProtectedRoute requiredPermission="Cursos,Intermedio"><CursosIntermedio /></ProtectedRoute>} />
          <Route path="/cursos/avanzado" element={<ProtectedRoute requiredPermission="Cursos,Avanzado"><CursosAvanzado /></ProtectedRoute>} />
          <Route path="/cursos/reportes" element={<ProtectedRoute requiredPermission="Cursos,Reportes de Contenido"><ReportesCursos /></ProtectedRoute>} />
          <Route path="/cursos/metadatos" element={<ProtectedRoute requiredPermission="Cursos,Gestión de Metadatos"><GestionMetadatos /></ProtectedRoute>} />
          <Route path="/cursos" element={<ListadoCursos />} />
          <Route path="/cursos/mis-cursos" element={<MisCursos />} />
          <Route path="/cursos/nuevo" element={<ProtectedRoute requiredPermission="Cursos,Básico"><CrearCurso /></ProtectedRoute>} />
          <Route path="/cursos/editar/:id" element={<ProtectedRoute requiredPermission="Cursos,Básico"><CrearCurso /></ProtectedRoute>} />
          <Route path="/cursos/:id/sesiones" element={<ProtectedRoute requiredPermission="Cursos,Básico"><GestionarSesiones /></ProtectedRoute>} />
          <Route path="/cursos/preview/:id" element={<VistaEstudiante />} />
          <Route path="/cursos/curso/:id" element={<VistaEstudiante />} />
          <Route path="/cursos/carrito" element={<Carrito />} />
          <Route path="/cursos/pagos" element={<Pagos />} />

          {/* Inventario */}
          <Route path="/inventario" element={<ProtectedRoute requiredPermission="Inventario,listar"><ListadoInventario /></ProtectedRoute>} />
          <Route path="/inventario/crear" element={<ProtectedRoute requiredPermission="Inventario,crear"><CrearProducto /></ProtectedRoute>} />
          <Route path="/inventario/editar/:id" element={<ProtectedRoute requiredPermission="Inventario,editar"><CrearProducto /></ProtectedRoute>} />
          <Route path="/inventario/:id/movimientos" element={<ProtectedRoute requiredPermission="Inventario,listar"><MovimientosInventario /></ProtectedRoute>} />

          {/* Producción */}
          <Route path="/produccion" element={<ProtectedRoute requiredPermission="Producción,listar"><ListadoProduccion /></ProtectedRoute>} />
          <Route path="/produccion/crear" element={<ProtectedRoute requiredPermission="Producción,crear"><CrearEntrega /></ProtectedRoute>} />
          <Route path="/produccion/:id" element={<ProtectedRoute requiredPermission="Producción,listar"><DetalleEntrega /></ProtectedRoute>} />

          {/* Seguridad */}
          <Route path="/seguridad" element={<Seguridad />} />
          <Route path="/seguridad/usuarios" element={<ListadoUsuarios />} />
          <Route path="/seguridad/usuarios/nuevo" element={<CrearUsuario />} />
          <Route path="/seguridad/usuarios/editar/:id" element={<EditarUsuario />} />
          <Route path="/seguridad/roles" element={<Roles />} />
          <Route path="/seguridad/roles/nuevo" element={<NuevoRol />} />
          <Route path="/seguridad/restablecer" element={<RestablecerContrasena />} />
          <Route path="/seguridad/baja-usuarios" element={<BajaUsuarios />} />

          {/* Rutas del Estudiante */}
          <Route path="/estudiante/dashboard" element={<EstudianteDashboard />} />
          <Route path="/estudiante/mis-cursos" element={<EstudianteMisCursos />} />
          <Route path="/estudiante/curso/:id" element={<CursoEstudiante />} />
          <Route path="/estudiante/catalogo" element={<EstudianteCatalogo />} />
          <Route path="/estudiante/progreso" element={<EstudianteProgreso />} />
          <Route path="/estudiante/mensajes" element={<EstudianteMensajes />} />
          <Route path="/estudiante/configuracion" element={<EstudianteConfiguracion />} />

        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/inicio" : "/"} replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
