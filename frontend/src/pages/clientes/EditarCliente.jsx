import React, { useState } from "react";
import "../../styles/EditarCliente.css";

export default function EditarCliente({ cliente, onClose, onSave }) {
  const [clienteData, setClienteData] = useState(cliente);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setClienteData({ ...clienteData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onSave(clienteData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Editar Cliente: {clienteData.nombre}</h3>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label>Dirección</label>
          <input name="direccion" value={clienteData.direccion} onChange={handleChange} required />
          <label>Email</label>
          <input type="email" name="email" value={clienteData.email} onChange={handleChange} required />
          <div className="modal-buttons">
            <button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
            <button type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
