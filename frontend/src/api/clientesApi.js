// src/api/clientesApi.js

const API_BASE = (import.meta?.env?.VITE_API_URL || "/api").replace(/\/$/, "");
const API_URL = `${API_BASE}/clientes`;

// 🔹 Obtener el token de autenticación
function getToken() {
  return localStorage.getItem("auth_token") || "";
}

// 🔹 Generar headers para las peticiones
function getHeaders() {
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

// 🔹 Función genérica para manejar fetch y errores del backend
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

// 🔹 Listar todos los clientes
export async function getClientes() {
  return handleFetch(API_URL, { headers: getHeaders() });
}

// 🔹 Obtener un cliente por ID
export async function getClienteById(id) {
  return handleFetch(`${API_URL}/${id}`, { headers: getHeaders() });
}

// 🔹 Crear un cliente
export async function createCliente(cliente) {
  return handleFetch(API_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(cliente),
  });
}

// 🔹 Actualizar un cliente
export async function updateCliente(id, cliente) {
  return handleFetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(cliente),
  });
}

// 🔹 Activar / Desactivar cliente (toggle)
export async function toggleClienteEstado(id) {
  // Esta función llama al backend para alternar el estado
  // El backend devuelve el cliente actualizado
  return handleFetch(`${API_URL}/${id}/toggle-estado`, {
    method: "PUT",
    headers: getHeaders(),
  });
}

// 🔹 Eliminar cliente
export async function deleteCliente(id) {
  return handleFetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
}