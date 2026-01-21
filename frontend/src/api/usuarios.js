const API_URL = "http://localhost:8080/api/usuarios";

// 🔥 Ruta correcta para crear usuario (POST)
const API_CREAR = "http://localhost:8080/api/CrearUsuarios";

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
    // Extraer mensaje de error más específico
    let errorMessage = data.message || `Error ${res.status}: ${res.statusText}`;
    
    // Si hay errores de validación (422), extraer el primer mensaje
    if (res.status === 422 && data.errors) {
      const errorMessages = Object.values(data.errors).flat();
      if (errorMessages.length > 0) {
        errorMessage = errorMessages[0]; // Tomar el primer mensaje de error
      }
    }
    
    const error = new Error(errorMessage);
    error.status = res.status;
    error.data = data;
    error.errors = data.errors; // Incluir errores de validación
    throw error;
  }
  return data;
}

// 🔹 Crear usuario
export async function crearUsuario(usuario) {
  return handleFetch(`${API_CREAR}`, {
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
export async function toggleUsuarioEstado(usuario) {
  // Enviar true si estaba bloqueado, false si estaba activo
  const activar = usuario.is_locked ? true : false;

  return handleFetch(`${API_URL}/${usuario.id}/toggle-estado`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ activar }),
  });
}

// 🔹 Obtener roles
export async function obtenerRoles() {
  return handleFetch("http://localhost:8080/api/roles", {
    method: "GET",
    headers: getHeaders(),
  });
}

// 🔹 Obtener usuarios para restablecer contraseña
export async function getUsuariosParaReset() {
  return handleFetch("http://localhost:8080/api/admin/reset-password/users", {
    method: "GET",
    headers: getHeaders(),
  });
}

// 🔹 Resetear contraseña de un usuario
export async function resetearContrasena(userID) {
  return handleFetch(`http://localhost:8080/api/admin/reset-password/${userID}`, {
    method: "POST",
    headers: getHeaders(),
  });
}

// 🔹 Eliminar usuario
export async function eliminarUsuario(id) {
  return handleFetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
}