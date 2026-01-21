/**
 * Utilidades para verificar roles de usuario
 */

/**
 * Verifica si el usuario es estudiante
 * @param {object} user - Objeto de usuario
 * @returns {boolean} True si es estudiante
 */
export function isStudent(user) {
  if (!user) return false;
  
  const rolesDisponibles = user.rolesDisponibles || [];
  const rolIDActual = user.rolID;
  
  // Buscar el rol actual en rolesDisponibles
  if (rolesDisponibles.length > 0 && rolIDActual) {
    const rolActual = rolesDisponibles.find(r => r.rolID === rolIDActual);
    if (rolActual?.nombreRol) {
      return rolActual.nombreRol.toLowerCase() === 'estudiante';
    }
  }
  
  // Fallback a propiedades directas
  const nombreRol = user.nombreRol || user.rol?.nombreRol || '';
  return nombreRol.toLowerCase() === 'estudiante';
}

/**
 * Verifica si el usuario es administrador
 * @param {object} user - Objeto de usuario
 * @returns {boolean} True si es administrador
 */
export function isAdmin(user) {
  if (!user) return false;
  
  const rolesDisponibles = user.rolesDisponibles || [];
  const rolIDActual = user.rolID;
  
  // Buscar el rol actual en rolesDisponibles
  if (rolesDisponibles.length > 0 && rolIDActual) {
    const rolActual = rolesDisponibles.find(r => r.rolID === rolIDActual);
    if (rolActual?.nombreRol) {
      return rolActual.nombreRol.toLowerCase() === 'administrador';
    }
  }
  
  // Fallback a propiedades directas
  const nombreRol = user.nombreRol || user.rol?.nombreRol || '';
  return nombreRol.toLowerCase() === 'administrador';
}

