import React, { useState } from "react";

export default function CambiarPassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [mensaje, setMensaje] = useState("");

  // 🔹 Obtener token del localStorage
  function getToken() {
    return localStorage.getItem("auth_token") || "";
  }

  // 🔹 Headers con token
  function getHeaders() {
    return {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${getToken()}`,
    };
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    try {
      const res = await fetch("http://localhost:8080/api/user/change-password", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Si la API devuelve error
        throw new Error(data?.message || `Error ${res.status}: ${res.statusText}`);
      }

      setMensaje(data?.message || "Contraseña actualizada correctamente");
      setOldPassword("");
      setNewPassword("");
    } catch (error) {
      console.error(error);
      setMensaje(error.message || "Error al cambiar contraseña");
    }
  };

  return (
    <div>
      <h1>Cambiar Contraseña</h1>
      {mensaje && <p>{mensaje}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Contraseña actual"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button type="submit">Actualizar</button>
      </form>
    </div>
  );
}
