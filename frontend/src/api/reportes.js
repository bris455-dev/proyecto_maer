// 🔹 Usar ruta relativa para aprovechar el proxy de Vite
const API_BASE = (import.meta?.env?.VITE_API_URL || "/api").replace(/\/$/, "");
const API_URL = `${API_BASE}/reportes`;

// 🔹 Obtener token
function getToken() {
  return localStorage.getItem("auth_token") || "";
}

// 🔹 Headers
function getHeaders() {
  const token = getToken();
  if (!token) {
    console.warn("No se encontró token de autenticación");
  }
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": `Bearer ${token}`,
  };
}

// 🔹 Manejo genérico de fetch
async function handleFetch(url, options = {}) {
  const res = await fetch(url, options);
  let data;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const errorMessage = data.message || `Error ${res.status}: ${res.statusText}`;
    const error = new Error(errorMessage);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

// 🔹 Listar reportes
export async function getReportes(filters = {}) {
  const params = new URLSearchParams();
  if (filters.fechaInicio) params.append('fecha_inicio', filters.fechaInicio);
  if (filters.fechaFin) params.append('fecha_fin', filters.fechaFin);
  if (filters.clienteID) params.append('clienteID', filters.clienteID);
  if (filters.diseñadorID) params.append('empleadoID', filters.diseñadorID);
  
  const queryString = params.toString();
  const url = queryString ? `${API_URL}?${queryString}` : API_URL;
  return handleFetch(url, { headers: getHeaders() });
}

// 🔹 Exportar reportes a Excel
export async function exportReportesExcel(filters = {}) {
  // Construir query string con los filtros
  const params = new URLSearchParams();
  if (filters.fechaInicio) params.append('fecha_inicio', filters.fechaInicio);
  if (filters.fechaFin) params.append('fecha_fin', filters.fechaFin);
  if (filters.clienteID) params.append('clienteID', filters.clienteID);
  if (filters.diseñadorID) params.append('empleadoID', filters.diseñadorID);

  const queryString = params.toString();
  const url = queryString ? `${API_URL}/export?${queryString}` : `${API_URL}/export`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Authorization": `Bearer ${getToken()}`,
    },
  });

  if (!res.ok) {
    // Intentar leer el mensaje de error si es JSON
    const contentType = res.headers.get("content-type");
    let errorMessage = `Error ${res.status}: ${res.statusText}`;
    
    if (contentType && contentType.includes("application/json")) {
      try {
        const errorData = await res.json();
        errorMessage = errorData.message || errorData.debug?.message || errorMessage;
      } catch (e) {
        // Si no se puede parsear, usar el mensaje por defecto
      }
    } else {
      try {
        const errorText = await res.text();
        errorMessage = errorText.substring(0, 200) || errorMessage;
      } catch (e) {
        // Si no se puede leer, usar el mensaje por defecto
      }
    }
    
    const error = new Error(errorMessage);
    error.status = res.status;
    throw error;
  }

  // Retornar Blob para descargar archivo
  return res.blob();
}
