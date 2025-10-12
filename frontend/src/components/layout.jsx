// src/components/layout.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { useMenu } from "../context/MenuContext";
import "../styles/layout.css";

// Imágenes
import inicioImg from "../assets/inicio.jpg";
import clientesImg from "../assets/clientes.jpg";
import consultarproyectosImg from "../assets/consultarproyectos.jpeg";
import proyectosImg from "../assets/proyectos.jpeg";
import reportesImg from "../assets/reportes.jpeg";
import seguridadImg from "../assets/seguridad.jpeg";

function Layout({ children, setIsAuthenticated }) {
  const { menuAbierto, setMenuAbierto, mostrarSubmenu, setMostrarSubmenu } = useMenu();
  const navigate = useNavigate();

  const modulos = [
    { nombre: "Inicio", imagen: inicioImg, ruta: "/inicio" },
    { nombre: "Clientes", imagen: clientesImg, ruta: "/clientes" },
    { nombre: "Proyectos", imagen: proyectosImg, ruta: "/proyectos" },
    { nombre: "Consultar Proyectos", imagen: consultarproyectosImg, ruta: "/consultar" },
    { nombre: "Reportes", imagen: reportesImg, ruta: "/reportes" },
    { nombre: "Seguridad", imagen: seguridadImg, ruta: "/seguridad" },
  ];

  const toggleMenu = () => setMenuAbierto(!menuAbierto);

  const handleLogout = () => {
    if (window.confirm("¿Deseas cerrar sesión?")) {
      if (setIsAuthenticated) setIsAuthenticated(false);
      localStorage.removeItem("isAuthenticated");
      alert("Sesión cerrada correctamente.");
      navigate("/");
    }
  };

  const handleModuloClick = (modulo) => {
    if (["Seguridad", "Clientes", "Proyectos", "Reportes"].includes(modulo.nombre)) {
      setMostrarSubmenu((prev) => (prev === modulo.nombre ? null : modulo.nombre));
    } else {
      navigate(modulo.ruta);
      setMostrarSubmenu(null);
    }
  };

  return (
    <div className={`layout-container ${menuAbierto ? "" : "menu-colapsado"}`}>
      <button className="toggle-btn" onClick={toggleMenu}>
        <Menu size={24} />
      </button>

      <aside className={`menu-lateral ${menuAbierto ? "abierto" : "cerrado"}`}>
        <h2>Menú</h2>
        <ul>
          {modulos.map((modulo, index) => (
            <React.Fragment key={index}>
              <li onClick={() => handleModuloClick(modulo)}>{modulo.nombre}</li>

              {/* Submenús */}
              {modulo.nombre === "Clientes" && mostrarSubmenu === "Clientes" && (
                <ul className="submenu">
                  <li onClick={() => navigate("/clientes/registrar")}>Registrar Cliente</li>
                  <li onClick={() => navigate("/clientes/detalle")}>Detalle de Clientes</li>
                </ul>
              )}

              {modulo.nombre === "Seguridad" && mostrarSubmenu === "Seguridad" && (
                <ul className="submenu">
                  <li onClick={() => navigate("/seguridad/usuarios")}>Gestión de Usuarios</li>
                  <li onClick={() => navigate("/seguridad/roles")}>Gestión de Roles</li>
                  <li onClick={() => navigate("/seguridad/restablecer")}>Restablecer Contraseña</li>
                  <li onClick={() => navigate("/seguridad/baja")}>Baja de Usuarios</li>
                </ul>
              )}

              {modulo.nombre === "Reportes" && mostrarSubmenu === "Reportes" && (
                <ul className="submenu">
                  <li onClick={() => navigate("/reportes/porfecha")}>Por Fecha</li>
                  <li onClick={() => navigate("/reportes/porcliente")}>Por Cliente</li>
                  <li onClick={() => navigate("/reportes/pordiseñador")}>Por Diseñador</li>
                  <li onClick={() => navigate("/reportes/tipodepieza")}>Por Tipo de Pieza</li>
                  <li onClick={() => navigate("/reportes/personalizado")}>Personalizado</li>
                </ul>
              )}

              {modulo.nombre === "Proyectos" && mostrarSubmenu === "Proyectos" && (
                <ul className="submenu">
                  <li onClick={() => navigate("/proyectos/nuevo")}>Nuevo Proyecto</li>
                  <li onClick={() => navigate("/proyectos/listado")}>Listado de Proyectos</li>
                </ul>
              )}
            </React.Fragment>
          ))}
        </ul>

        <button className="logout-btn" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </aside>

      <main className="contenido-principal">{children}</main>
    </div>
  );
}

export default Layout;
