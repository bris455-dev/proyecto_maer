import React, { useState } from "react";
import { createCliente } from "../../api/clientesApi.js";
import "../../styles/RegistrarCliente.css";

// 🔑 Hook ficticio para verificar autenticación
function useAuth() {
  return { 
    isAuthenticated: !!localStorage.getItem('auth_token')
  };
}

export default function RegistrarCliente() {
  const { isAuthenticated } = useAuth();

  const [cliente, setCliente] = useState({
    nombre: "",
    dni_ruc: "",
    direccion: "",
    pais: "",
    email: "",
  });

  const [loading, setLoading] = useState(false);

  // Modal: { show: boolean, message: string, type: 'success' | 'error' }
  const [modal, setModal] = useState({ show: false, message: "", type: "info" });

  const handleChange = (e) => {
    setCliente({ ...cliente, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!isAuthenticated) {
      setModal({
        show: true,
        message: "❌ Error: Debes iniciar sesión (estar autenticado) para registrar un cliente.",
        type: "error",
      });
      setLoading(false);
      return;
    }

    try {
      const data = await createCliente({ ...cliente, estado: "1" });

      setModal({
        show: true,
        message: data.message || "✅ Cliente registrado correctamente.",
        type: "success",
      });

      setCliente({ nombre: "", dni_ruc: "", direccion: "", pais: "", email: "" });
    } catch (err) {
      console.error("Error al registrar cliente:", err);
      setModal({
        show: true,
        message: (err && err.message) || "❌ Error de conexión o token inválido.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="clientes-container">
      <h2>Registrar Cliente</h2>
      <div className="form-card">
       

        {!isAuthenticated && (
          <p className="warning">⚠️ No estás logueado. Inicia sesión para registrar.</p>
        )}

        <form onSubmit={handleSubmit}>
          <input
            name="nombre"
            placeholder="Nombre"
            value={cliente.nombre}
            onChange={handleChange}
            required
          />
          <input
            name="dni_ruc"
            placeholder="DNI o RUC"
            value={cliente.dni_ruc}
            onChange={handleChange}
            required
          />
          <input
            name="direccion"
            placeholder="Dirección"
            value={cliente.direccion}
            onChange={handleChange}
            required
          />
          <input
            name="pais"
            placeholder="País"
            value={cliente.pais}
            onChange={handleChange}
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={cliente.email}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading || !isAuthenticated}>
            {loading ? "Procesando..." : "Guardar"}
          </button>
        </form>
      </div>

      {/* Modal emergente */}
      {modal.show && (
        <div className="modal-overlay">
          <div className={`modal-content ${modal.type}`}>
            <p>{modal.message}</p>
            <button onClick={() => setModal({ ...modal, show: false })}>Aceptar</button>
          </div>
        </div>
      )}
    </div>
  );
}
