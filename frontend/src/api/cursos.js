// API client para Cursos

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

    if (!response.ok) {
      // Manejar error 401 (no autenticado)
      if (response.status === 401) {
        // Limpiar datos de autenticación
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        // Redirigir al login
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        const errorMessage = errorData.message || errorData.error || `Error ${response.status}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = errorData;
        throw error;
      } else {
        const text = await response.text();
        // Mejorar el mensaje de error para reportes
        const errorMsg = url.includes('/cursos/reportes') 
          ? 'Error al obtener reportes de cursos. Por favor, verifique los filtros e intente nuevamente.'
          : `Error ${response.status}: ${text.substring(0, 100)}`;
        const error = new Error(errorMsg);
        error.status = response.status;
        throw error;
      }
    }

    return await response.json();
  } catch (error) {
    console.error('Error en fetch:', error);
    throw error;
  }
};

// Cursos
export const getCursos = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const url = `/api/cursos${queryParams ? `?${queryParams}` : ''}`;
  return handleFetch(url);
};

export const getFiltrosCatalogo = async () => {
  return handleFetch('/api/catalogo/filtros');
};

export const getCursoById = async (id) => {
  return handleFetch(`/api/cursos/${id}`);
};

export const createCurso = async (data) => {
  return handleFetch('/api/cursos', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateCurso = async (id, data) => {
  return handleFetch(`/api/cursos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const deleteCurso = async (id) => {
  return handleFetch(`/api/cursos/${id}`, {
    method: 'DELETE'
  });
};

// Sesiones
export const crearSesion = async (cursoID, data) => {
  return handleFetch(`/api/cursos/${cursoID}/sesiones`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// Archivos
export const subirArchivos = async (cursoID, formData, sesionID = null) => {
  const token = getToken();
  const url = `/api/cursos/${cursoID}/archivos${sesionID ? `?sesionID=${sesionID}` : ''}`;
  
  return fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: formData
  }).then(async (response) => {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Error ${response.status}` }));
      throw new Error(errorData.message || `Error ${response.status}`);
    }
    return response.json();
  });
};

export const eliminarArchivo = async (cursoID, archivoID) => {
  return handleFetch(`/api/cursos/${cursoID}/archivos/${archivoID}`, {
    method: 'DELETE'
  });
};

// Carrito
export const getCarrito = async () => {
  return handleFetch('/api/carrito');
};

export const agregarAlCarrito = async (cursoID) => {
  return handleFetch('/api/carrito', {
    method: 'POST',
    body: JSON.stringify({ cursoID })
  });
};

export const eliminarDelCarrito = async (carritoID) => {
  return handleFetch(`/api/carrito/${carritoID}`, {
    method: 'DELETE'
  });
};

export const vaciarCarrito = async () => {
  return handleFetch('/api/carrito/vaciar', {
    method: 'POST'
  });
};

// Matrículas
export const getMatriculas = async () => {
  return handleFetch('/api/matriculas');
};

export const matricularse = async (cursoID) => {
  return handleFetch('/api/matriculas', {
    method: 'POST',
    body: JSON.stringify({ cursoID })
  });
};

export const verificarAcceso = async (cursoID) => {
  return handleFetch(`/api/matriculas/verificar-acceso/${cursoID}`);
};

// Pagos
export const getPagos = async () => {
  return handleFetch('/api/pagos');
};

export const procesarPago = async (data) => {
  return handleFetch('/api/pagos/procesar', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// Dashboard de Cursos
export const getDashboardKPIs = async () => {
  return handleFetch('/api/cursos/dashboard/kpis');
};

export const getDashboardCursosList = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const url = `/api/cursos/dashboard/list${queryParams ? `?${queryParams}` : ''}`;
  return handleFetch(url);
};

export const getResumenPorNivel = async () => {
  return handleFetch('/api/cursos/dashboard/resumen-nivel');
};

export const getUltimosCursos = async (limit = 5) => {
  return handleFetch(`/api/cursos/dashboard/ultimos-cursos?limit=${limit}`);
};

// Reportes de Cursos
export const getReportesCursos = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const url = `/api/cursos/reportes${queryParams ? `?${queryParams}` : ''}`;
  return handleFetch(url);
};

