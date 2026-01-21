/**
 * Sistema de traducciones simple para la aplicación
 */

const translations = {
  es: {
    // Configuración
    'configuracion.titulo': 'Configuración',
    'configuracion.subtitulo': 'Gestiona tu perfil y preferencias',
    'configuracion.perfil': 'Perfil',
    'configuracion.seguridad': 'Seguridad',
    'configuracion.notificaciones': 'Notificaciones',
    'configuracion.preferencias': 'Preferencias',
    
    // Perfil
    'perfil.nombre': 'Nombre',
    'perfil.email': 'Email',
    'perfil.emailNoModificable': 'El email no se puede modificar',
    'perfil.guardar': 'Guardar Cambios',
    
    // Seguridad
    'seguridad.cambiarContrasena': 'Cambiar Contraseña',
    'seguridad.passwordActual': 'Contraseña Actual',
    'seguridad.passwordNueva': 'Nueva Contraseña',
    'seguridad.passwordConfirmar': 'Confirmar Nueva Contraseña',
    'seguridad.passwordRequisitos': 'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial.',
    'seguridad.actualizar': 'Actualizar Contraseña',
    
    // Notificaciones
    'notificaciones.titulo': 'Notificaciones',
    'notificaciones.email': 'Notificaciones por Email',
    'notificaciones.emailDesc': 'Recibe notificaciones importantes por correo electrónico',
    'notificaciones.nuevosCursos': 'Nuevos Cursos Disponibles',
    'notificaciones.nuevosCursosDesc': 'Recibe notificaciones cuando se publiquen nuevos cursos',
    'notificaciones.recordatorios': 'Recordatorios de Estudio',
    'notificaciones.recordatoriosDesc': 'Recibe recordatorios para continuar con tus cursos',
    'notificaciones.guardar': 'Guardar Preferencias',
    
    // Preferencias
    'preferencias.titulo': 'Preferencias',
    'preferencias.idioma': 'Idioma',
    'preferencias.tema': 'Tema',
    'preferencias.temaClaro': 'Claro',
    'preferencias.temaOscuro': 'Oscuro',
    'preferencias.temaAutomatico': 'Automático',
    'preferencias.temaAutomaticoDesc': 'El tema automático se ajusta según la configuración de tu sistema',
    'preferencias.guardar': 'Guardar Preferencias',
    
    // Mensajes
    'mensajes.exito': 'Cambios guardados correctamente',
    'mensajes.error': 'Error al guardar los cambios',
    'mensajes.cargando': 'Cargando...',
    'mensajes.guardando': 'Guardando...',
  },
  en: {
    // Configuration
    'configuracion.titulo': 'Settings',
    'configuracion.subtitulo': 'Manage your profile and preferences',
    'configuracion.perfil': 'Profile',
    'configuracion.seguridad': 'Security',
    'configuracion.notificaciones': 'Notifications',
    'configuracion.preferencias': 'Preferences',
    
    // Profile
    'perfil.nombre': 'Name',
    'perfil.email': 'Email',
    'perfil.emailNoModificable': 'Email cannot be modified',
    'perfil.guardar': 'Save Changes',
    
    // Security
    'seguridad.cambiarContrasena': 'Change Password',
    'seguridad.passwordActual': 'Current Password',
    'seguridad.passwordNueva': 'New Password',
    'seguridad.passwordConfirmar': 'Confirm New Password',
    'seguridad.passwordRequisitos': 'Password must contain at least one uppercase, one lowercase, one number and one special character.',
    'seguridad.actualizar': 'Update Password',
    
    // Notifications
    'notificaciones.titulo': 'Notifications',
    'notificaciones.email': 'Email Notifications',
    'notificaciones.emailDesc': 'Receive important notifications by email',
    'notificaciones.nuevosCursos': 'New Courses Available',
    'notificaciones.nuevosCursosDesc': 'Receive notifications when new courses are published',
    'notificaciones.recordatorios': 'Study Reminders',
    'notificaciones.recordatoriosDesc': 'Receive reminders to continue with your courses',
    'notificaciones.guardar': 'Save Preferences',
    
    // Preferences
    'preferencias.titulo': 'Preferences',
    'preferencias.idioma': 'Language',
    'preferencias.tema': 'Theme',
    'preferencias.temaClaro': 'Light',
    'preferencias.temaOscuro': 'Dark',
    'preferencias.temaAutomatico': 'Automatic',
    'preferencias.temaAutomaticoDesc': 'Automatic theme adjusts according to your system settings',
    'preferencias.guardar': 'Save Preferences',
    
    // Messages
    'mensajes.exito': 'Changes saved successfully',
    'mensajes.error': 'Error saving changes',
    'mensajes.cargando': 'Loading...',
    'mensajes.guardando': 'Saving...',
  }
};

/**
 * Obtiene una traducción según el idioma actual
 * @param {string} key - Clave de traducción
 * @param {string} idioma - Idioma ('es' o 'en')
 * @returns {string} - Texto traducido
 */
export function t(key, idioma = 'es') {
  return translations[idioma]?.[key] || translations['es'][key] || key;
}

/**
 * Obtiene el idioma actual del usuario
 * @returns {string} - Idioma actual
 */
export function obtenerIdioma() {
  return localStorage.getItem('idioma') || 'es';
}

/**
 * Establece el idioma del usuario
 * @param {string} idioma - Idioma a establecer
 */
export function establecerIdioma(idioma) {
  localStorage.setItem('idioma', idioma);
  document.documentElement.lang = idioma;
}

/**
 * Inicializa el idioma al cargar la aplicación
 */
export function inicializarIdioma() {
  const idioma = obtenerIdioma();
  establecerIdioma(idioma);
}

