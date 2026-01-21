import React, { useMemo, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { useMenu } from "../hooks/useMenu.js";
import { useAuth } from "../hooks/useAuth.js";
import { updateURLWithRole, addRoleToPath } from "../utils/urlRoleHelper.js";
import "../styles/layout.css";
import "../styles/admin-containers.css";
import LogoutButton from "../components/LogoutButton";
import ChangeProfile from "../components/ChangeProfile";
import { routesMap } from "../config/routesMap";

export default function Layout() {
  const { menuAbierto, toggleMenu, mostrarSubmenu, toggleSubmenu, setMostrarSubmenu } = useMenu();
  const navigate = useNavigate();
  const location = useLocation();
  const { permissions: permisos, userName: usuario, user } = useAuth();

  const modulos = useMemo(() => {
    if (!permisos || permisos.length === 0) return [];

    const modMap = {};
    const submenusSet = new Set();

    // Agregar "Inicio" siempre con su submenú
    if (routesMap["Inicio"]) {
      modMap["Inicio"] = { nombre: "Inicio", submenus: [] };
      // Agregar los submenús de Inicio y marcarlos en el set para evitar duplicados
      routesMap["Inicio"].submenus.forEach(submenu => {
        const submenuKey = `Inicio-${submenu.rutaFrontend}`;
        if (!submenusSet.has(submenuKey)) {
          modMap["Inicio"].submenus.push({
            nombre: submenu.nombre,
            ruta: submenu.rutaFrontend
          });
          submenusSet.add(submenuKey);
        }
      });
    }

    permisos.forEach(p => {
      const nombreModulo = p.nombreModulo;
      const nombreSubmodulo = p.nombreSubmodulo;

      // Solo procesar si el módulo existe en routesMap
      if (!routesMap[nombreModulo]) {
        return;
      }

      // Saltar "Inicio" ya que ya se procesó arriba
      if (nombreModulo === "Inicio") {
        return;
      }

      // Filtrar solo el submódulo permitido en Reportes
      if (nombreModulo === "Reportes" && nombreSubmodulo !== "Personalizado") return;

      // Filtrar "Editar Proyecto" y variaciones ya que no es un submódulo del menú, es una acción dentro de "Listado de Proyectos"
      if (nombreModulo === "Proyectos") {
        const submoduloLower = nombreSubmodulo?.toLowerCase() || '';
        if (submoduloLower === "editar proyecto" || submoduloLower === "editar" || nombreSubmodulo === "Editar Proyecto") {
          return;
        }
      }

      // Filtrar "visualizar" de Cursos ya que no es un submódulo del menú, es solo un permiso para ver cursos
      if (nombreModulo === "Cursos" && (nombreSubmodulo === "visualizar" || nombreSubmodulo?.toLowerCase() === "visualizar")) {
        return;
      }

      // Inicializar el módulo solo si no existe
      if (!modMap[nombreModulo]) {
        modMap[nombreModulo] = { nombre: nombreModulo, submenus: [] };
      }

      // Buscar el submódulo en routesMap
      const submenuFound = routesMap[nombreModulo].submenus.find(
        s => s.nombre === nombreSubmodulo || s.nombre.toLowerCase() === nombreSubmodulo.toLowerCase()
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
      // Si no se encuentra el submódulo, simplemente no se agrega (no es necesario loguear)
    });

    const orden = ["Inicio", "Clientes", "Proyectos", "Consultar", "Reportes", "Facturación", "Cursos", "Inventario", "Producción", "Seguridad"];

    // Solo incluir módulos que tienen permisos (submenus o son módulos especiales sin submenus)
    return orden
      .filter(name => {
        const modulo = modMap[name];
        if (!modulo) return false;

        // Inicio siempre se muestra si existe
        if (name === "Inicio") return true;

        // Facturación, Cursos, Inventario y Producción solo se muestran si tienen submenus (tienen permisos)
        if (name === "Facturación" || name === "Cursos" || name === "Inventario" || name === "Producción") {
          return modulo.submenus.length > 0;
        }

        // Otros módulos solo se muestran si tienen submenus
        return modulo.submenus.length > 0;
      })
      .map(name => modMap[name])
      .filter(modulo => modulo); // Eliminar cualquier módulo undefined
  }, [permisos]);

  // Mantener la URL sincronizada con el rol del usuario
  useEffect(() => {
    if (user) {
      updateURLWithRole(user);
    }
  }, [user]);

  // Asegurar que el rol se mantenga en la URL al cambiar de ruta
  useEffect(() => {
    if (user && location.pathname) {
      // Verificar si la URL actual tiene los parámetros de rol
      const url = new URL(window.location.href);
      const tieneRol = url.searchParams.has('rol');
      
      // Si no tiene los parámetros de rol, agregarlos
      if (!tieneRol) {
        updateURLWithRole(user);
      }
    }
  }, [location.pathname, user]);

  const handleModuloClick = (modulo) => {
    if (modulo.submenus?.length) {
      toggleSubmenu(modulo.nombre);
    } else {
      // Si no tiene submenus pero está en routesMap, navegar a la ruta base
      let ruta = null;
      if (routesMap[modulo.nombre]?.rutaFrontend) {
        ruta = routesMap[modulo.nombre].rutaFrontend;
      } else {
        const rutaBase = modulo.nombre.toLowerCase().replace(/\s+/g, "");
        ruta = `/${rutaBase}`;
      }
      // Agregar parámetros de rol a la ruta antes de navegar
      const rutaConRol = addRoleToPath(ruta, user);
      navigate(rutaConRol);
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
          {usuario && (
            <div className="user-info">
              <p className="user-name">Bienvenido, <strong>{usuario}</strong></p>
              {(() => {
                if (!user) return null;

                // Obtener el nombre del rol desde rolesDisponibles
                const rolesDisponibles = user.rolesDisponibles || [];
                const rolIDActual = user.rolID;

                // Buscar el rol actual en rolesDisponibles
                let nombreRol = null;

                if (rolesDisponibles.length > 0 && rolIDActual) {
                  const rolActual = rolesDisponibles.find(r => r.rolID === rolIDActual);
                  nombreRol = rolActual?.nombreRol;
                }

                // Si no se encuentra, intentar con el primer rol disponible
                if (!nombreRol && rolesDisponibles.length > 0) {
                  nombreRol = rolesDisponibles[0]?.nombreRol;
                }

                // Si aún no hay nombre, intentar obtenerlo directamente del user si tiene la propiedad
                if (!nombreRol) {
                  nombreRol = user.nombreRol || user.rol?.nombreRol || null;
                }

                return nombreRol ? <p className="user-role">{nombreRol}</p> : null;
              })()}
            </div>
          )}

          {/* Selector de perfil/rol */}
          <ChangeProfile />

          <ul>
            {modulos.map((modulo, index) => (
              <React.Fragment key={index}>
                <li onClick={() => handleModuloClick(modulo)}>{modulo.nombre}</li>
                {modulo.submenus?.length && mostrarSubmenu === modulo.nombre && (
                  <ul className="submenu">
                    {modulo.submenus.map((item, i) => (
                      <li key={i} onClick={() => {
                        const rutaConRol = addRoleToPath(item.ruta, user);
                        navigate(rutaConRol);
                      }}>
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
