/**
 * Gestor de temas para la aplicación
 * Aplica y persiste el tema seleccionado por el usuario
 */

/**
 * Aplica un tema a la aplicación
 * @param {string} tema - 'claro', 'oscuro', o 'automatico'
 */
export function aplicarTema(tema) {
  const root = document.documentElement;
  
  // Remover clases de tema anteriores
  root.classList.remove('dark-theme', 'light-theme');
  
  if (tema === 'automatico') {
    // Detectar preferencia del sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark-theme');
    } else {
      root.classList.add('light-theme');
    }
    
    // Escuchar cambios en la preferencia del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (tema === 'automatico') {
        root.classList.toggle('dark-theme', e.matches);
        root.classList.toggle('light-theme', !e.matches);
      }
    };
    
    // Remover listener anterior si existe
    if (window.themeMediaQueryListener) {
      mediaQuery.removeEventListener('change', window.themeMediaQueryListener);
    }
    
    window.themeMediaQueryListener = handleChange;
    mediaQuery.addEventListener('change', handleChange);
  } else if (tema === 'oscuro') {
    root.classList.add('dark-theme');
  } else {
    root.classList.add('light-theme');
  }
  
  // Guardar en localStorage para persistencia
  localStorage.setItem('tema', tema);
}

/**
 * Obtiene el tema actual del usuario
 * @returns {string} - El tema actual
 */
export function obtenerTema() {
  return localStorage.getItem('tema') || 'claro';
}

/**
 * Inicializa el tema al cargar la aplicación
 */
export function inicializarTema() {
  const temaGuardado = obtenerTema();
  aplicarTema(temaGuardado);
}

