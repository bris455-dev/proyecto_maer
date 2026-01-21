// API client para funcionalidades del estudiante

const getToken = () => {
  return localStorage.getItem('auth_token') || '';
};

const getHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

const handleFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers
      }
    });

    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
      throw new Error('Unauthenticated.');
    }

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        const error = new Error(errorData.message || `Error ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
      } else {
        const text = await response.text();
        throw new Error(`Error ${response.status}: ${text.substring(0, 100)}`);
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Error en fetch:', error);
    throw error;
  }
};

// Obtener perfil del estudiante
export const getPerfil = async () => {
  return handleFetch('/api/estudiante/perfil');
};

// Actualizar perfil (nombre, idioma, tema)
export const updatePerfil = async (data) => {
  return handleFetch('/api/estudiante/perfil', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

// Cambiar contraseña
export const cambiarContrasena = async (data) => {
  return handleFetch('/api/estudiante/perfil/cambiar-contrasena', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// Actualizar preferencias de notificaciones
export const updateNotificaciones = async (data) => {
  return handleFetch('/api/estudiante/perfil/notificaciones', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

