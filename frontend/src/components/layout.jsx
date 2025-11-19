import React, { useMemo } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { useMenu } from "../hooks/useMenu.js";
import { useAuth } from "../hooks/useAuth.js"; 
import "../styles/layout.css";
import LogoutButton from "../components/LogoutButton"; 
import { routesMap } from "../config/routesMap";

export default function Layout() {
  const { menuAbierto, toggleMenu, mostrarSubmenu, toggleSubmenu, setMostrarSubmenu } = useMenu();
  const navigate = useNavigate();
  const { permissions: permisos, userName: usuario } = useAuth(); 

  const modulos = useMemo(() => {
    if (!permisos || permisos.length === 0) return [];

    const modMap = {};
    const submenusSet = new Set();

    permisos.forEach(p => {
      const nombreModulo = p.nombreModulo;
      const nombreSubmodulo = p.nombreSubmodulo;

      if (!modMap[nombreModulo]) {
        modMap[nombreModulo] = { nombre: nombreModulo, submenus: [] };
      }

      if (routesMap[nombreModulo]) {
        // Filtrar solo el submódulo permitido en Reportes
        if (nombreModulo === "Reportes" && nombreSubmodulo !== "Personalizado") return;

        const submenuFound = routesMap[nombreModulo].submenus.find(
          s => s.nombre === nombreSubmodulo
        );
        if (submenuFound) {
          const submenuKey = `${nombreModulo}-${submenuFound.rutaFrontend}`;
          if (!submenusSet.has(submenuKey)) {
            modMap[nombreModulo].submenus.push({
              nombre: submenuFound.nombre,
              ruta: submenuFound.rutaFrontend
            });
            submenusSet.add(submenuKey);
          }
        }
      }
    });

    const orden = ["Inicio", "Clientes", "Proyectos", "Consultar", "Reportes", "Seguridad"];
    orden.forEach(name => {
      if (!modMap[name]) {
        modMap[name] = { nombre: name, submenus: [] };
      }
    });

    return orden
      .filter(name => 
          modMap[name] && (modMap[name].submenus.length > 0 || name === "Inicio" || name === "")
      )
      .map(name => modMap[name]);
  }, [permisos]);

  const handleModuloClick = (modulo) => {
    if (modulo.submenus?.length) {
      toggleSubmenu(modulo.nombre);
    } else {
      const rutaBase = modulo.nombre.toLowerCase().replace(/\s+/g, "");
      navigate(`/${rutaBase}`);
      setMostrarSubmenu(null); 
    }
  };

  return (
    <div className="layout-container">
      <button className="toggle-btn" onClick={toggleMenu} title="Abrir/Cerrar Menú">
        <Menu size={24} />
      </button>

      <aside className={`menu-lateral ${menuAbierto ? "abierto" : "cerrado"}`}>
        <div className="menu-superior">
          <h2>Menú</h2> 
          {usuario && <p className="user-name">Bienvenido, <strong>{usuario}</strong></p>}

          <ul>
            {modulos.map((modulo, index) => (
              <React.Fragment key={index}>
                <li onClick={() => handleModuloClick(modulo)}>{modulo.nombre}</li>
                {modulo.submenus?.length && mostrarSubmenu === modulo.nombre && (
                  <ul className="submenu"> 
                    {modulo.submenus.map((item, i) => (
                      <li key={i} onClick={() => navigate(item.ruta)}>
                        {item.nombre}
                      </li>
                    ))}
                  </ul>
                )}
              </React.Fragment>
            ))}
          </ul>
        </div>

        <div className="menu-inferior">
          <LogoutButton />
        </div>
      </aside>

      <main className={`contenido-principal ${menuAbierto ? "menu-abierto" : "menu-colapsado"}`}>
        <Outlet />
      </main>
    </div>
  );
}
