// src/config/routesMap.js
export const routesMap = {
  Inicio: {
    rutaFrontend: "/inicio",
    submenus: [{ nombre: "Volver al Inicio", rutaFrontend: "/inicio" }],
  },
  Clientes: {
    rutaFrontend: "/clientes",
    submenus: [
      { nombre: "Listado de Clientes", rutaFrontend: "/clientes/listado", rutaBackend: "/clientes" },
      { nombre: "Registrar Cliente", rutaFrontend: "/clientes/nuevo", rutaBackend: "/clientes" },
      { nombre: "Editar Cliente", rutaFrontend: "/clientes/editar/:id", rutaBackend: "/clientes/{id}" }
    ],
  },
  Proyectos: {
    rutaFrontend: "/proyectos",
    submenus: [
      { nombre: "Nuevo Proyecto", rutaFrontend: "/proyectos/nuevo", rutaBackend: "/proyectos" },
      { nombre: "Listado de Proyectos", rutaFrontend: "/proyectos", rutaBackend: "/proyectos" },
      { nombre: "Aprobar Proyecto", rutaFrontend: "/proyectos/aprobar/:id", rutaBackend: "/proyectos/{id}/aprobar" },
      { nombre: "Devolver Proyecto", rutaFrontend: "/proyectos/devolver/:id", rutaBackend: "/proyectos/{id}/devolver" }
    ]
  },
  Reportes: {
    rutaFrontend: "/reportes",
    submenus: [
      { nombre: "Por Fecha", rutaFrontend: "/reportes?tipo=fecha", rutaBackend: "/reportes?tipo=fecha" },
      { nombre: "Por Cliente", rutaFrontend: "/reportes?tipo=cliente", rutaBackend: "/reportes?tipo=cliente" },
      { nombre: "Por Diseñador", rutaFrontend: "/reportes?tipo=diseñador", rutaBackend: "/reportes?tipo=diseñador" },
      { nombre: "Por Tipo de Pieza", rutaFrontend: "/reportes?tipo=pieza", rutaBackend: "/reportes?tipo=pieza" },
      { nombre: "Personalizado", rutaFrontend: "/reportes?tipo=personalizado", rutaBackend: "/reportes?tipo=personalizado" }
    ]
  },
  Seguridad: {
    rutaFrontend: "/seguridad",
    submenus: [
      { nombre: "Gestión de Usuarios", rutaFrontend: "/seguridad/usuarios", rutaBackend: "/usuarios" },
      { nombre: "Gestión de Roles", rutaFrontend: "/seguridad/roles", rutaBackend: "/roles" },
      { nombre: "Restablecer Contraseña", rutaFrontend: "/seguridad/restablecer", rutaBackend: "/change-password" },
      { nombre: "Baja de Usuarios", rutaFrontend: "/seguridad/baja-usuarios", rutaBackend: "/usuarios/{id}/deactivate" }
    ]
  }
};
