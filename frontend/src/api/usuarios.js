const API_URL = "http://localhost:8080/api/usuarios";

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

// 🔹 Crear usuario
export async function crearUsuario(usuario) {
  return handleFetch(`${API_URL}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(usuario),
  });
}

// 🔹 Actualizar usuario
export async function actualizarUsuario(id, usuario) {
  return handleFetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(usuario),
  });
}

// 🔹 Obtener todos los usuarios
export async function getUsuarios() {
  return handleFetch(`${API_URL}`, {
    method: "GET",
    headers: getHeaders(),
  });
}

// 🔹 Alternar estado de usuario
export async function toggleUsuarioEstado(id) {
  // Nuevo valor: si está bloqueado (1) => desbloquear (0), si no => bloquear (1)
  const nuevoEstado = id.is_locked === 1 ? 0 : 1;

  return handleFetch(`${API_URL}/${id}/toggle-estado`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ is_locked: nuevoEstado }),
  });
}



