/**
 * 🔹 Siempre usar rutas relativas para trabajar con proxy de Vite
 * Esto evita problemas de CORS y respeta la lógica del backend.
 */
const API_BASE_URL = ""; // dejar vacío para usar proxy de Vite

/**
 * 🔧 Obtiene headers con token si el usuario está autenticado
 */
function getAuthHeaders() {
  const token = localStorage.getItem("auth_token");
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

/**
 * 🟢 LOGIN
 * Maneja 3 estados posibles: 'success' (autenticación final), 'mfa_required', 'first_login'.
 */
export async function loginUser(email, password) {
  try {
    const res = await fetch("/api/auth/login", { // ruta relativa
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));
    
    // 1. Error de credenciales o validación (4xx)
    if (!res.ok) throw new Error(data.message || "Credenciales inválidas o error de red.");

    // 2. Respuesta exitosa (200 o 202)
    
    // Si la respuesta incluye datos de usuario (necesarios para el siguiente paso, ej: MFA)
    if (data.user) {
      // Guardar datos del usuario para el siguiente paso (MFA/Cambio de Contraseña)
      localStorage.setItem("user_data", JSON.stringify(data.user));
      localStorage.setItem("nombre", data.user.nombre || "");
    }

    // Si el estado es 'success', guardar el token final
    if (data.status === "success" && data.token) {
      localStorage.setItem("auth_token", data.token);
    }
    
    // Si el estado es 'mfa_required' o 'first_login', no guardamos token final, solo datos de usuario.

    return data;
  } catch (err) {
    console.error("Login failed:", err);
    throw err;
  }
}

/**
 * 🟢 VERIFICAR CÓDIGO MFA
 */
export async function verifyCode(email, mfa_code) {
  try {
    const res = await fetch("/api/auth/verify-mfa", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, mfa_code }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const firstError = data.errors ? Object.values(data.errors).flat()[0] : null;
      throw new Error(firstError || data.message || "Código MFA inválido o expirado");
    }

    // CORRECCIÓN: Si el MFA es exitoso, el backend debe responder con el token y el status 'success'
    if (data.status === "success" && data.token) {
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user_data", JSON.stringify(data.user));
      localStorage.setItem("nombre", data.user.nombre || "");
    }

    return data;
  } catch (err) {
    console.error("MFA verification failed:", err);
    throw err;
  }
}

/**
 * 🟢 OLVIDÉ MI CONTRASEÑA
 */
export async function forgotPassword(email) {
  try {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const firstError = data.errors ? Object.values(data.errors).flat()[0] : null;
      throw new Error(firstError || data.message || "Error al enviar correo de recuperación");
    }
    return data;
  } catch (err) {
    console.error("Forgot password failed:", err);
    throw err;
  }
}

/**
 * 🟢 RESTABLECER CONTRASEÑA
 */
export async function resetPassword(email, token, password, password_confirmation) {
  try {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, token, password, password_confirmation }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const firstError = data.errors ? Object.values(data.errors).flat()[0] : null;
      throw new Error(firstError || data.message || "Error al restablecer contraseña");
    }
    return data;
  } catch (err) {
    console.error("Reset password failed:", err);
    throw err;
  }
}

/**
 * 🟢 CAMBIAR PERFIL/ROL
 */
export async function changeProfile(usuarioRolID) {
  try {
    const res = await fetch("/api/auth/change-profile", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ usuarioRolID }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || "Error al cambiar el perfil");
    }
    return data;
  } catch (err) {
    console.error("Change profile failed:", err);
    throw err;
  }
}

/**
 * 🟢 CERRAR SESIÓN
 */
export async function logoutUser() {
  try {
    // Usar la cabecera de autenticación
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      headers: getAuthHeaders(),
    });

    // Limpiar el almacenamiento local independientemente de la respuesta del servidor
    // ya que el objetivo del logout es destruir la sesión del cliente.
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    localStorage.removeItem("nombre");

    // El backend podría devolver 204 No Content, 200 OK, o 401 si el token expiró/no existe
    if (res.status === 204 || res.status === 200) return { success: true };

    const data = await res.json().catch(() => ({}));
    // Si llegamos aquí y no es un 200/204, devolvemos un error, pero el cliente ya está 'deslogueado' localmente.
    throw new Error(data.message || "La sesión fue cerrada, pero ocurrió un error en el servidor.");
  } catch (err) {
    console.error("Logout failed:", err);
    // Asegurar la limpieza local incluso si falla el network request
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    localStorage.removeItem("nombre");
    throw err;
  }
}