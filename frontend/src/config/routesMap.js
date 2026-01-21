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
  },
  Facturación: {
    rutaFrontend: "/facturacion",
    submenus: [
      { nombre: "Gestionar", rutaFrontend: "/facturacion", rutaBackend: "/facturacion" }
    ]
  },
  Cursos: {
    rutaFrontend: "/cursos/dashboard",
    submenus: [
      { nombre: "Dashboard de Cursos", rutaFrontend: "/cursos/dashboard", rutaBackend: "/cursos/dashboard/kpis" },
      { nombre: "Básico", rutaFrontend: "/cursos/basico", rutaBackend: "/cursos?nivel_id=1" },
      { nombre: "Intermedio", rutaFrontend: "/cursos/intermedio", rutaBackend: "/cursos?nivel_id=2" },
      { nombre: "Avanzado", rutaFrontend: "/cursos/avanzado", rutaBackend: "/cursos?nivel_id=3" },
      { nombre: "Reportes de Contenido", rutaFrontend: "/cursos/reportes", rutaBackend: "/cursos/reportes" },
      { nombre: "Gestión de Metadatos", rutaFrontend: "/cursos/metadatos", rutaBackend: "/cursos/metadata" }
    ]
  },
  Inventario: {
    rutaFrontend: "/inventario",
    submenus: [
      { nombre: "Listado de Productos", rutaFrontend: "/inventario", rutaBackend: "/inventario" },
      { nombre: "Nuevo Producto", rutaFrontend: "/inventario/crear", rutaBackend: "/inventario" }
    ]
  },
  Producción: {
    rutaFrontend: "/produccion",
    submenus: [
      { nombre: "Listado de Entregas", rutaFrontend: "/produccion", rutaBackend: "/produccion" },
      { nombre: "Nueva Entrega", rutaFrontend: "/produccion/crear", rutaBackend: "/produccion" }
    ]
  }
};
