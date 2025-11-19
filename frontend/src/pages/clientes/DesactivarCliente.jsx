// src/pages/clientes/DesactivarCliente.jsx
import React, { useState } from "react";
import { toggleClienteEstado } from "../../api/clientesApi.js";
import "../../styles/DesactivarCliente.css";

export default function DesactivarCliente({ cliente, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleToggleEstado = async () => {
  setLoading(true);
  setError("");
  try {
    const res = await toggleClienteEstado(cliente.clienteID);
    onUpdate(res.cliente); // Actualiza el estado en la lista
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
        className={`btn-estado ${cliente.estado === "1" ? "desactivar" : "activar"}`}
        onClick={handleToggleEstado}
        disabled={loading}
      >
        {cliente.estado === "1" ? "Desactivar" : "Activar"}
      </button>
      <button className="btn-cerrar" onClick={onClose}>
        Cerrar
      </button>
    </div>
  );
}
