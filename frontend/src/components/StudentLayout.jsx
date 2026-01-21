import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Home, BookOpen, Search, Trophy, MessageCircle, Settings, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { updateURLWithRole, addRoleToPath } from "../utils/urlRoleHelper.js";
import "../styles/studentLayout.css";

export default function StudentLayout() {
  const [menuAbierto, setMenuAbierto] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { userName: usuario, user, logout } = useAuth();

  // Mantener la URL sincronizada con el rol del usuario
  useEffect(() => {
    if (user) {
      updateURLWithRole(user);
    }
  }, [user]);

  // Asegurar que el rol se mantenga en la URL al cambiar de ruta
  useEffect(() => {
    if (user && location.pathname) {
      const url = new URL(window.location.href);
      const tieneRol = url.searchParams.has('rol');
      
      if (!tieneRol) {
        updateURLWithRole(user);
      }
    }
  }, [location.pathname, user]);

  const menuItems = [
    {
      id: 'dashboard',
      nombre: 'Inicio',
      icono: Home,
      ruta: '/estudiante/dashboard',
      descripcion: 'Resumen y progreso'
    },
    {
      id: 'mis-cursos',
      nombre: 'Mis Cursos',
      icono: BookOpen,
      ruta: '/estudiante/mis-cursos',
      descripcion: 'Cursos inscritos'
    },
    {
      id: 'catalogo',
      nombre: 'Catálogo',
      icono: Search,
      ruta: '/estudiante/catalogo',
      descripcion: 'Explorar cursos'
    },
    {
      id: 'progreso',
      nombre: 'Progreso',
      icono: Trophy,
      ruta: '/estudiante/progreso',
      descripcion: 'Certificados y logros'
    },
    {
      id: 'mensajes',
      nombre: 'Mensajes',
      icono: MessageCircle,
      ruta: '/estudiante/mensajes',
      descripcion: 'Comunidad y foros'
    },
    {
      id: 'configuracion',
      nombre: 'Configuración',
      icono: Settings,
      ruta: '/estudiante/configuracion',
      descripcion: 'Perfil y preferencias'
    }
  ];

  const handleNavigation = (ruta) => {
    const rutaConRol = addRoleToPath(ruta, user);
    navigate(rutaConRol);
    // Cerrar menú en móviles después de navegar
    if (window.innerWidth < 768) {
      setMenuAbierto(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout();
      navigate('/');
    }
  };

  const rutaActual = location.pathname;
  const itemActivo = menuItems.find(item => rutaActual.startsWith(item.ruta));

  return (
    <div className="student-layout-container">
      {/* Botón de toggle para móviles */}
      <button 
        className="student-toggle-btn" 
        onClick={() => setMenuAbierto(!menuAbierto)}
        title="Abrir/Cerrar Menú"
      >
        {menuAbierto ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar del estudiante */}
      <aside className={`student-sidebar ${menuAbierto ? "abierto" : "cerrado"}`}>
        <div className="student-sidebar-header">
          <div className="student-logo">
            <BookOpen size={32} />
            <h2>Plataforma de Aprendizaje</h2>
          </div>
          {usuario && (
            <div className="student-user-info">
              <div className="student-avatar">
                {usuario.charAt(0).toUpperCase()}
              </div>
              <div className="student-user-details">
                <p className="student-user-name">{usuario}</p>
                <p className="student-user-role">Estudiante</p>
              </div>
            </div>
          )}
        </div>

        <nav className="student-nav">
          <ul className="student-menu-list">
            {menuItems.map((item) => {
              const Icono = item.icono;
              const isActive = itemActivo?.id === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    className={`student-menu-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavigation(item.ruta)}
                    title={item.descripcion}
                  >
                    <Icono size={20} />
                    <span>{item.nombre}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="student-sidebar-footer">
          <button
            className="student-logout-btn"
            onClick={handleLogout}
            title="Cerrar sesión"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className={`student-main-content ${menuAbierto ? "menu-abierto" : "menu-cerrado"}`}>
        <Outlet />
      </main>
    </div>
  );
}

