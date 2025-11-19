const API_BASE = (import.meta?.env?.VITE_API_URL || "/api").replace(/\/$/, "");
const API_URL = `${API_BASE}/proyectos`;

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

const parseCodigoParts = (codigo) => {
  if (typeof codigo !== "string") return null;
  const match = codigo.match(/^(.*?)(\d+)$/);
  if (!match) return null;
  return {
    prefix: match[1] || "",
    number: parseInt(match[2], 10),
    digits: match[2].length,
  };
};

const computeCodigoFromListado = async () => {
  try {
    const data = await handleFetch(API_URL);
    const lista = Array.isArray(data)
      ? data
      : data?.proyectos || data?.data || [];

    const resultado = lista.reduce(
      (acc, item) => {
        const partes = parseCodigoParts(
          item?.numero_proyecto || item?.codigo || item?.code
        );
        if (!partes) return acc;
        if (!acc || partes.number > acc.number) {
          return partes;
        }
        return acc;
      },
      null
    );

    if (!resultado) return null;
    const siguiente = resultado.number + 1;
    return `${resultado.prefix}${siguiente
      .toString()
      .padStart(resultado.digits, "0")}`;
  } catch (err) {
    console.warn("No se pudo calcular el código desde el listado:", err);
    return null;
  }
};

// 🔹 Listado de proyectos
export async function getProyectos() {
  return handleFetch(API_URL);
}

// 🔹 Código consecutivo para nuevos proyectos
export async function getNextProyectoCodigo() {
  // Intentar primero calcular desde el listado (más confiable)
  const calculado = await computeCodigoFromListado();
  if (calculado) return calculado;
  
  // Si falla, intentar endpoint (si existe)
  try {
    const data = await handleFetch(`${API_URL}/next-code`);
    return data?.codigo || data?.code || data;
  } catch {
    // Silenciosamente retornar null para usar fallback local
    return null;
  }
}

// 🔹 Detalle de proyecto
export async function getProyectoById(id) {
  return handleFetch(`${API_URL}/${id}`);
}

// 🔹 Crear proyecto
export async function createProyecto(proyecto) {
  return handleFetch(API_URL, {
    method: "POST",
    body: JSON.stringify(proyecto),
  });
}

// 🔹 Actualizar proyecto
export async function updateProyecto(id, proyecto) {
  return handleFetch(`${API_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(proyecto),
  });
}

// 🔹 Subir imágenes al proyecto
export async function uploadProyectoImages(id, formData) {
  const token = getToken();
  const res = await fetch(`${API_URL}/${id}/imagenes`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
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

// 🔹 Facturación de proyecto (solo rol 1)
export async function getProyectoFacturado(id) {
  return handleFetch(`${API_URL}/${id}/billing`, {
    method: "POST",
  });
}
