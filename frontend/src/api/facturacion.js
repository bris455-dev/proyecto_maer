const API_BASE = (import.meta?.env?.VITE_API_URL || "/api").replace(/\/$/, "");
const BASE_URL = `${API_BASE}/facturacion`;

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
  const res = await fetch(url, {
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
    const errorMessage = data?.message || `Error ${res.status}: ${res.statusText}`;
    const error = new Error(errorMessage);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Obtener lista de facturas
 */
export async function getFacturas(filters = {}) {
  const queryParams = new URLSearchParams();
  
  if (filters.estado) queryParams.append('estado', filters.estado);
  if (filters.fecha_desde) queryParams.append('fecha_desde', filters.fecha_desde);
  if (filters.fecha_hasta) queryParams.append('fecha_hasta', filters.fecha_hasta);
  if (filters.numero_factura) queryParams.append('numero_factura', filters.numero_factura);
  if (filters.clienteID) queryParams.append('clienteID', filters.clienteID);
  if (filters.empleadoID) queryParams.append('empleadoID', filters.empleadoID);

  const queryString = queryParams.toString();
  const url = queryString ? `${BASE_URL}?${queryString}` : BASE_URL;

  return handleFetch(url);
}

/**
 * Obtener factura por ID
 */
export async function getFacturaById(id) {
  return handleFetch(`${BASE_URL}/${id}`);
}

/**
 * Crear factura desde proyecto
 */
export async function createFactura(facturaData) {
  return handleFetch(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(facturaData),
  });
}

/**
 * Actualizar estado de factura
 */
export async function updateFacturaEstado(id, estado) {
  return handleFetch(`${BASE_URL}/${id}/estado`, {
    method: 'PUT',
    body: JSON.stringify({ estado }),
  });
}

/**
 * Obtener proyectos disponibles para facturar
 */
export async function getProyectosDisponibles(filters = {}) {
  const queryParams = new URLSearchParams();
  
  if (filters.clienteID) queryParams.append('clienteID', filters.clienteID);
  if (filters.fecha_desde) queryParams.append('fecha_desde', filters.fecha_desde);
  if (filters.fecha_hasta) queryParams.append('fecha_hasta', filters.fecha_hasta);

  const queryString = queryParams.toString();
  const url = queryString ? `${BASE_URL}/proyectos-disponibles?${queryString}` : `${BASE_URL}/proyectos-disponibles`;
  
  return handleFetch(url);
}

/**
 * Crear factura grupal desde múltiples proyectos
 */
export async function createFacturaGrupal(facturaData) {
  return handleFetch(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(facturaData),
  });
}

