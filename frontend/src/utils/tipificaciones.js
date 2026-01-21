// Configuración de tipificaciones de proyectos
export const TIPIFICACIONES = {
  Pendiente: { nombre: 'Pendiente', color: '#f39c12', bgColor: '#fff3cd', editable: true },
  'En Proceso': { nombre: 'En Proceso', color: '#3498db', bgColor: '#d1ecf1', editable: true },
  'En HTML': { nombre: 'En HTML', color: '#9b59b6', bgColor: '#e7d4f8', editable: true },
  Observado: { nombre: 'Observado', color: '#e74c3c', bgColor: '#f8d7da', editable: true },
  Devuelto: { nombre: 'Devuelto', color: '#e67e22', bgColor: '#ffeaa7', editable: true },
  Aprobado: { nombre: 'Aprobado', color: '#27ae60', bgColor: '#d4edda', editable: true },
  Atrasado: { nombre: 'Atrasado', color: '#c0392b', bgColor: '#fadbd8', editable: false }, // Automático
};

// Obtener información de una tipificación
export function getTipificacionInfo(tipificacion) {
  return TIPIFICACIONES[tipificacion] || TIPIFICACIONES.Pendiente;
}

// Obtener todas las tipificaciones editables
export function getTipificacionesEditables(rolID) {
  const todas = Object.values(TIPIFICACIONES).filter(t => t.editable);
  
  // Rol 3 (Cliente) solo puede establecer "Aprobado"
  if (rolID === 3) {
    return [TIPIFICACIONES.Aprobado];
  }
  
  // Admin y Diseñador pueden editar todas excepto "Atrasado"
  return todas;
}

// Verificar si un proyecto está atrasado
export function esAtrasado(proyecto) {
  if (!proyecto.fecha_fin) return false;
  
  const fechaFin = new Date(proyecto.fecha_fin);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fechaFin.setHours(0, 0, 0, 0);
  
  return fechaFin < hoy && proyecto.tipificacion !== 'Aprobado';
}

// Calcular tipificación final (incluyendo atrasado automático)
export function calcularTipificacionFinal(proyecto) {
  if (esAtrasado(proyecto)) {
    return 'Atrasado';
  }
  return proyecto.tipificacion || 'Pendiente';
}

