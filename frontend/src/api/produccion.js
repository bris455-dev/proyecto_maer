const API_BASE = (import.meta?.env?.VITE_API_URL || "/api").replace(/\/$/, "");

// 🔹 Obtener token
function getToken() {
  return localStorage.getItem("auth_token") || "";
}

// 🔹 Headers
function getHeaders({ includeJson = true } = {}) {
  const headers = {
    Accept: "application/json",
  };

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// 🔹 Manejo genérico de fetch
async function handleFetch(url, options = {}) {
  const includeJson = !(options.body instanceof FormData);
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      ...getHeaders({ includeJson }),
      ...(options.headers || {}),
    },
  });

  const contentType = res.headers.get("content-type") || "";
  let data;
  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => ({}));
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    // Manejar error 401 (no autenticado)
    if (res.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }
    const errorMessage = data?.message || `Error ${res.status}: ${res.statusText}`;
    const error = new Error(errorMessage);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const getEntregas = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const url = `/api/produccion${queryParams ? `?${queryParams}` : ''}`;
  return handleFetch(url);
};

export const getEntrega = async (id) => {
  return handleFetch(`/api/produccion/${id}`);
};

export const crearEntrega = async (data) => {
  return handleFetch('/api/produccion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(data)
  });
};

export const procesarEntrega = async (id) => {
  return handleFetch(`/api/produccion/${id}/procesar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
};

export const cancelarEntrega = async (id) => {
  return handleFetch(`/api/produccion/${id}/cancelar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
};

