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
    // No lanzar error para 404 en el endpoint /next-code (es opcional)
    if (res.status === 404 && url.includes('/next-code')) {
      return null;
    }
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
    // Usar fetch directamente para evitar que handleFetch lance errores visibles
    const token = getToken();
    const res = await fetch(API_URL, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    
    if (!res.ok) {
      return null; // Silenciosamente retornar null si falla
    }
    
    const data = await res.json().catch(() => ({}));
    const lista = Array.isArray(data)
      ? data
      : data?.proyectos || data?.data || [];

    if (!Array.isArray(lista) || lista.length === 0) {
      return null;
    }

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
    // Silenciosamente retornar null para usar fallback
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
  try {
    const calculado = await computeCodigoFromListado();
    if (calculado) return calculado;
  } catch (err) {
    // Silenciosamente continuar al fallback
  }
  
  // No intentar el endpoint /next-code ya que no existe
  // Retornar null para usar fallback local
  return null;
}

// 🔹 Detalle de proyecto
export async function getProyectoById(id) {
  return handleFetch(`${API_URL}/${id}`);
}

// 🔹 Crear proyecto
export async function createProyecto(proyecto, files = []) {
  // Si hay archivos, usar FormData, sino JSON
  if (files && files.length > 0) {
    const formData = new FormData();
    
    // Agregar datos del proyecto como JSON string
    const proyectoData = { ...proyecto };
    formData.append('data', JSON.stringify(proyectoData));
    
    // Agregar archivos (cualquier tipo)
    files.forEach((file) => {
      formData.append("images[]", file);
    });
    
    const token = getToken();
    const headers = {
      Accept: "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const res = await fetch(API_URL, {
      method: "POST",
      headers: headers,
      body: formData,
    });
    
    const contentType = res.headers.get("content-type") || "";
    let data;
    if (contentType.includes("application/json")) {
      data = await res.json().catch(() => ({}));
    } else {
      const textData = await res.text();
      // Si recibimos HTML en lugar de JSON, es un error de routing o autenticación
      if (textData.trim().startsWith("<!") || textData.includes("<html")) {
        console.error("❌ Error: El servidor devolvió HTML en lugar de JSON");
        console.error("❌ Esto generalmente indica que la ruta no se encontró o hay un problema de autenticación");
        console.error("❌ Response status:", res.status);
        console.error("❌ Response URL:", res.url);
        const error = new Error("Error de conexión: La ruta API no se encontró o no estás autenticado. Por favor, verifica tu sesión.");
        error.status = res.status || 404;
        error.data = { html: textData.substring(0, 200) };
        throw error;
      }
      data = textData;
    }
    
    if (!res.ok) {
      const errorMessage = data?.message || `Error ${res.status}: ${res.statusText}`;
      const error = new Error(errorMessage);
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return data;
  } else {
    // Sin archivos, enviar como JSON
    console.log("📤 Enviando proyecto como JSON (sin archivos)");
    console.log("📤 API_URL:", API_URL);
    console.log("📤 Payload:", JSON.stringify(proyecto, null, 2));
    
    try {
      const response = await handleFetch(API_URL, {
        method: "POST",
        body: JSON.stringify(proyecto),
      });
      
      console.log("✅ Respuesta del servidor recibida");
      console.log("✅ Respuesta completa:", JSON.stringify(response, null, 2));
      console.log("✅ Response status:", response?.status);
      console.log("✅ Response data:", response?.data);
      
      // Verificar que la respuesta tenga status success
      if (response?.status === 'success' || response?.data) {
        console.log("✅ Respuesta válida, retornando");
        return response;
      } else {
        console.error("❌ Respuesta inesperada:", response);
        throw new Error(response?.message || 'Error al crear proyecto');
      }
    } catch (error) {
      console.error("❌ Error en createProyecto:");
      console.error("❌ Error message:", error.message);
      console.error("❌ Error status:", error.status);
      console.error("❌ Error data:", error.data || error);
      console.error("❌ Error stack:", error.stack);
      throw error;
    }
  }
}

// 🔹 Actualizar proyecto
export async function updateProyecto(id, proyecto, images = []) {
  console.log("📤 updateProyecto - Archivos recibidos:", images.length);
  // Si hay imágenes, usar FormData, sino JSON
  if (images.length > 0) {
    const formData = new FormData();
    
    // Agregar datos del proyecto como JSON string
    const proyectoData = { ...proyecto };
    delete proyectoData.images; // No incluir imágenes en el JSON
    formData.append('data', JSON.stringify(proyectoData));
    
    // Agregar _method=PUT para que Laravel procese correctamente el FormData
    formData.append("_method", "PUT");
    
    // Agregar imágenes - Laravel agrupa automáticamente images[] en un array
    images.forEach((file, index) => {
      console.log(`📤 Agregando archivo ${index + 1}:`, file.name, file.size, "bytes");
      formData.append("images[]", file);
    });
    
    console.log("📤 FormData creado con", images.length, "archivos");
    
    const token = getToken();
    const headers = {
      Accept: "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    // Usar POST con _method=PUT para que Laravel procese correctamente los archivos
    const res = await fetch(`${API_URL}/${id}`, {
      method: "POST",
      headers: headers,
      body: formData,
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
  } else {
    return handleFetch(`${API_URL}/${id}`, {
      method: "PUT",
      body: JSON.stringify(proyecto),
    });
  }
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
