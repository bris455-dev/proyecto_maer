import React, { useEffect, useState } from "react";
import { getClientes, updateCliente, toggleClienteEstado } from "../../api/clientesApi.js";
import EditarCliente from "./EditarCliente.jsx";
import { useAuth } from "../../hooks/useAuth";
import "../../styles/clientes.css";

export default function ListadoClientes() {
  const { isAuthenticated } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "" });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [clienteAEditar, setClienteAEditar] = useState(null);

  // --- PAGINACIÓN ---
  const [paginaActual, setPaginaActual] = useState(1);
  const clientesPorPagina = 5;

  // Traer clientes
  const fetchClientes = async () => {
    setError("");
    try {
      const data = await getClientes();
      setClientes(data.clientes || []);
    } catch (err) {
      setError(err.message || "Error al cargar los clientes.");
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchClientes();
  }, [isAuthenticated]);

  // Filtrar clientes
  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      c.dni_ruc.includes(filtro) ||
      c.email.toLowerCase().includes(filtro.toLowerCase())
  );

  const totalPaginas = Math.ceil(clientesFiltrados.length / clientesPorPagina);
  const indiceInicio = (paginaActual - 1) * clientesPorPagina;
  const clientesPaginados = clientesFiltrados.slice(
    indiceInicio,
    indiceInicio + clientesPorPagina
  );

  const handleChangePagina = (num) => setPaginaActual(num);

  // Abrir modal de edición
  const handleOpenEditModal = (cliente) => {
    setClienteAEditar(cliente);
    setIsEditModalOpen(true);
  };

  // Guardar cambios de edición
  const handleSaveEdit = async (clienteEditado) => {
    try {
      const data = await updateCliente(clienteEditado.clienteID, clienteEditado);
      setClientes((prev) =>
        prev.map((c) =>
          c.clienteID === clienteEditado.clienteID ? { ...c, ...data.cliente } : c
        )
      );
      showToast("Cliente actualizado correctamente", "success");
      setIsEditModalOpen(false);
    } catch (err) {
      showToast(`Error al actualizar el cliente: ${err.message}`, "error");
    }
  };

  // Cambiar estado de cliente
  const handleToggleEstado = async (cliente) => {
    try {
      const data = await toggleClienteEstado(cliente.clienteID);
      setClientes((prev) =>
        prev.map((c) =>
          c.clienteID === cliente.clienteID ? data.cliente : c
        )
      );
      showToast(
        data.cliente.estado === 1
          ? "Cliente activado correctamente"
          : "Cliente desactivado correctamente",
        "success"
      );
    } catch (err) {
      showToast(`Error al cambiar estado: ${err.message}`, "error");
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "" }), 3500);
  };

  return (
    <div className="clientes-container">
  <h2>Listado de Clientes</h2>

  {error && <p className="error">{error}</p>}

  {/* FILTRO A LA IZQUIERDA */}
  <div className="filtro-container">
    <input
      type="text"
      placeholder="Buscar por nombre, DNI/RUC o email..."
      value={filtro}
      onChange={(e) => {
        setFiltro(e.target.value);
        setPaginaActual(1);
      }}
      className="input-filtro"
    />
    <span className="lupa">🔍</span>
  </div>

  {/* Toast */}
  {toast.message && <div className={`toast ${toast.type}`}>{toast.message}</div>}

  {clientesFiltrados.length > 0 ? (
    <>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>DNI/RUC</th>
              <th>Dirección</th>
              <th>Email</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientesPaginados.map((c, index) => (
              <tr key={c.clienteID}>
                <td>{indiceInicio + index + 1}</td>
                <td>{c.nombre}</td>
                <td>{c.dni_ruc}</td>
                <td>{c.direccion}</td>
                <td>{c.email}</td>
                <td className="acciones">
                  <button onClick={() => handleOpenEditModal(c)} className="btn-editar">Editar</button>
                  <button onClick={() => handleToggleEstado(c)} className={c.estado === 1 ? "btn-desactivar" : "btn-activar"}>
                    {c.estado === 1 ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}
      <div className="paginacion">
        {Array.from({ length: totalPaginas }, (_, i) => (
          <button key={i + 1} onClick={() => handleChangePagina(i + 1)} className={paginaActual === i + 1 ? "activo" : ""}>
            {i + 1}
          </button>
        ))}
      </div>
    </>
  ) : (
    <p>No hay clientes disponibles.</p>
  )}

  {isEditModalOpen && clienteAEditar && (
    <EditarCliente cliente={clienteAEditar} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveEdit} />
  )}
</div>

  );
}
