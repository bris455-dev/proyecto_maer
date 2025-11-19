import React, { useState } from "react";
import { toggleUsuarioEstado } from "../../api/usuarios.js";
import "../../styles/DesactivarCliente.css";

export default function DesactivarUsuario({ usuario, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleToggleEstado = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await toggleUsuarioEstado(usuario); // enviamos todo el usuario
      onUpdate(res.usuario); // actualiza la lista en el front
      setLoading(false);
    } catch (err) {
      setError(err.message || "Error al cambiar el estado");
      setLoading(false);
    }
  };

  return (
    <div className="desactivar-cliente-modal">
      {error && <p className="error">{error}</p>}
      <button
        className={`btn-estado ${usuario.is_locked === 1 ? "desactivar" : "activar"}`}
        onClick={handleToggleEstado}
        disabled={loading}
      >
        {usuario.is_locked === 1 ? "Desactivar" : "Activar"}
      </button>
      <button className="btn-cerrar" onClick={onClose}>
        Cerrar
      </button>
    </div>
  );
}
