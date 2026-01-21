import React, { useState } from "react";

export default function CambiarPassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

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

    if (newPassword !== confirmPassword) {
      setMensaje("La confirmación de la nueva contraseña no coincide.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        "http://localhost:8080/api/user/change-password",
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
            new_password_confirmation: confirmPassword,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || `Error ${res.status}: ${res.statusText}`);
      }

      setMensaje(data?.message || "Contraseña actualizada correctamente");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      setMensaje(error.message || "Error al cambiar contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Cambiar Contraseña</h1>
      {mensaje && (
        <p className={`mb-4 ${mensaje.includes("error") ? "text-red-600" : "text-green-600"}`}>
          {mensaje}
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="password"
          placeholder="Contraseña actual"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className="border p-2 rounded"
        />
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="border p-2 rounded"
        />
        <input
          type="password"
          placeholder="Confirmar nueva contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="border p-2 rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </form>
    </div>
  );
}
