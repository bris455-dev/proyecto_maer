/**
 * Utilidades para identificar el rol del usuario
 */

/**
 * Obtiene el rol del usuario desde localStorage
 * @returns {Object|null} Objeto con información del rol o null
 */
export function getRoleFromStorage() {
  try {
    const userData = localStorage.getItem("user_data");
    if (!userData) return null;
    
    const user = JSON.parse(userData);
    return {
      rolID: user.rolID,
      nombreRol: user.rol?.nombreRol || user.nombreRol || null,
      user: user
    };
  } catch (error) {
    console.error("Error obteniendo rol desde storage:", error);
    return null;
  }
}

/**
 * Identifica el tipo de rol por nombre
 * @param {string} nombreRol - Nombre del rol
 * @returns {string} Tipo de rol: 'admin', 'diseñador', 'cliente', 'estudiante', 'desconocido'
 */
export function identifyRoleType(nombreRol) {
  if (!nombreRol) return 'desconocido';
  
  const rolLower = nombreRol.toLowerCase();
  
  if (rolLower.includes('admin') || rolLower.includes('administrador')) {
    return 'admin';
  }
  if (rolLower.includes('diseñador') || rolLower.includes('diseñador') || rolLower.includes('empleado')) {
    return 'diseñador';
  }
  if (rolLower.includes('cliente')) {
    return 'cliente';
  }
  if (rolLower.includes('estudiante') || rolLower.includes('student')) {
    return 'estudiante';
  }
  
  return 'desconocido';
}

/**
 * Obtiene el rol del usuario desde la URL (query params)
 * Útil para debugging: ?rol=admin
 * @returns {string|null} Tipo de rol desde URL o null
 */
export function getRoleFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('rol');
}

/**
 * Obtiene información completa del rol del usuario
 * @returns {Object} Información del rol
 */
export function getUserRoleInfo() {
  const roleData = getRoleFromStorage();
  const roleFromURL = getRoleFromURL();
  
  return {
    rolID: roleData?.rolID || null,
    nombreRol: roleData?.nombreRol || null,
    tipoRol: roleData?.nombreRol ? identifyRoleType(roleData.nombreRol) : null,
    roleFromURL: roleFromURL, // Solo para debugging
    user: roleData?.user || null,
    isAdmin: identifyRoleType(roleData?.nombreRol) === 'admin',
    isDiseñador: identifyRoleType(roleData?.nombreRol) === 'diseñador',
    isCliente: identifyRoleType(roleData?.nombreRol) === 'cliente',
    isEstudiante: identifyRoleType(roleData?.nombreRol) === 'estudiante'
  };
}

/**
 * Agrega el rol a la URL como query param (solo para debugging)
 * ⚠️ NO usar en producción por seguridad
 */
export function addRoleToURL() {
  const roleInfo = getUserRoleInfo();
  if (roleInfo.tipoRol) {
    const url = new URL(window.location.href);
    url.searchParams.set('rol', roleInfo.tipoRol);
    window.history.replaceState({}, '', url);
  }
}

/**
 * Muestra información del rol en la consola
 * Útil para debugging
 */
export function logUserRole() {
  const roleInfo = getUserRoleInfo();
  console.group('👤 Información del Usuario');
  console.log('Rol ID:', roleInfo.rolID);
  console.log('Nombre Rol:', roleInfo.nombreRol);
  console.log('Tipo Rol:', roleInfo.tipoRol);
  console.log('Es Admin:', roleInfo.isAdmin);
  console.log('Es Diseñador:', roleInfo.isDiseñador);
  console.log('Es Cliente:', roleInfo.isCliente);
  console.log('Es Estudiante:', roleInfo.isEstudiante);
  if (roleInfo.roleFromURL) {
    console.log('⚠️ Rol desde URL (debug):', roleInfo.roleFromURL);
  }
  console.groupEnd();
  return roleInfo;
}

