/**
 * Utilidades para agregar el rol del usuario a la URL
 * Útil para debugging y identificación rápida del rol activo
 */

/**
 * Obtiene el nombre del rol del usuario desde el contexto o localStorage
 */
export function getRoleNameFromUser(user) {
  if (!user) return null;
  
  const rolesDisponibles = user.rolesDisponibles || [];
  const rolIDActual = user.rolID;
  
  // Buscar el rol actual en rolesDisponibles
  if (rolesDisponibles.length > 0 && rolIDActual) {
    const rolActual = rolesDisponibles.find(r => r.rolID === rolIDActual);
    if (rolActual?.nombreRol) {
      return rolActual.nombreRol;
    }
  }
  
  // Si no se encuentra, usar el primer rol disponible
  if (rolesDisponibles.length > 0) {
    return rolesDisponibles[0]?.nombreRol;
  }
  
  // Fallback a propiedades directas
  return user.nombreRol || user.rol?.nombreRol || null;
}

/**
 * Actualiza la URL agregando el rol como query parameter
 * Formato: ?rol=Administrador&rolID=1
 */
export function updateURLWithRole(user) {
  if (typeof window === 'undefined') return;
  
  try {
    const nombreRol = getRoleNameFromUser(user);
    const rolID = user?.rolID;
    
    if (!nombreRol) {
      // Si no hay rol, remover el parámetro de la URL
      removeRoleFromURL();
      return;
    }
    
    const url = new URL(window.location.href);
    
    // Agregar o actualizar los parámetros de rol
    url.searchParams.set('rol', nombreRol);
    if (rolID) {
      url.searchParams.set('rolID', rolID.toString());
    }
    
    // Actualizar la URL sin recargar la página
    window.history.replaceState({}, '', url);
  } catch (error) {
    console.error('Error actualizando URL con rol:', error);
  }
}

/**
 * Remueve los parámetros de rol de la URL
 */
export function removeRoleFromURL() {
  if (typeof window === 'undefined') return;
  
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('rol');
    url.searchParams.delete('rolID');
    window.history.replaceState({}, '', url);
  } catch (error) {
    console.error('Error removiendo rol de URL:', error);
  }
}

/**
 * Obtiene el rol desde la URL (query params)
 * @returns {Object|null} { nombreRol, rolID } o null
 */
export function getRoleFromURL() {
  if (typeof window === 'undefined') return null;
  
  try {
    const url = new URL(window.location.href);
    const nombreRol = url.searchParams.get('rol');
    const rolID = url.searchParams.get('rolID');
    
    if (nombreRol) {
      return {
        nombreRol,
        rolID: rolID ? parseInt(rolID, 10) : null
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error obteniendo rol de URL:', error);
    return null;
  }
}

/**
 * Verifica si el rol en la URL coincide con el rol del usuario
 * Útil para detectar inconsistencias
 */
export function validateRoleInURL(user) {
  const urlRole = getRoleFromURL();
  const userRoleName = getRoleNameFromUser(user);
  
  if (!urlRole || !userRoleName) return true; // Si no hay datos, asumir válido
  
  if (urlRole.nombreRol !== userRoleName) {
    // Actualizar URL silenciosamente si hay inconsistencia
    updateURLWithRole(user);
    return false;
  }
  
  return true;
}

/**
 * Agrega los parámetros de rol a una ruta
 * @param {string} path - Ruta a la que agregar los parámetros
 * @param {object} user - Objeto de usuario con rolID y rolesDisponibles
 * @returns {string} Ruta con los parámetros de rol agregados
 */
export function addRoleToPath(path, user) {
  if (!user || !path) return path;
  
  const nombreRol = getRoleNameFromUser(user);
  const rolID = user?.rolID;
  
  if (!nombreRol) return path;
  
  // Si la ruta ya tiene parámetros de rol, mantenerlos o actualizarlos
  try {
    // Si la ruta es relativa, construir una URL completa temporalmente
    const baseUrl = window.location.origin;
    const fullUrl = path.startsWith('/') 
      ? new URL(path, baseUrl)
      : new URL(path, baseUrl);
    
    // Agregar o actualizar los parámetros de rol
    fullUrl.searchParams.set('rol', nombreRol);
    if (rolID) {
      fullUrl.searchParams.set('rolID', rolID.toString());
    }
    
    // Retornar solo la ruta relativa (pathname + search)
    return fullUrl.pathname + fullUrl.search;
  } catch (error) {
    // Si hay un error al construir la URL, agregar los parámetros manualmente
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}rol=${encodeURIComponent(nombreRol)}${rolID ? `&rolID=${rolID}` : ''}`;
  }
}

