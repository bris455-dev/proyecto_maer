const API_URL = "http://localhost:8080/api/reportes";

// 🔹 Obtener token
function getToken() {
  return localStorage.getItem("auth_token") || "";
}

// 🔹 Headers
function getHeaders() {
  const token = getToken();
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
export async function getReportes() {
  return handleFetch(API_URL, { headers: getHeaders() });
}

// 🔹 Exportar reportes a Excel
export async function exportReportesExcel() {
  const res = await fetch(`${API_URL}/export`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!res.ok) {
    const error = new Error(`Error ${res.status}: ${res.statusText}`);
    throw error;
  }

  // Retornar Blob para descargar archivo
  return res.blob();
}
