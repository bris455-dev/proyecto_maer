import React, { useState, useEffect } from "react";
import { getUsuariosParaReset, resetearContrasena } from "../../api/usuarios.js";
import "../../styles/RestablecerContrasena.css";

export default function RestablecerContrasena() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });
  const [reseteandoId, setReseteandoId] = useState(null);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    setMensaje({ texto: "", tipo: "" });
    try {
      const response = await getUsuariosParaReset();
      const lista = Array.isArray(response.data) ? response.data : response.usuarios || [];
      setUsuarios(lista);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      setMensaje({
        texto: error.message || "Error al cargar la lista de usuarios.",
        tipo: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetear = async (usuario) => {
    if (!window.confirm(`¿Está seguro de resetear la contraseña del usuario ${usuario.nombre} (${usuario.email})? La contraseña se establecerá en: Maer1234$`)) {
      return;
    }

    setReseteandoId(usuario.id);
    setMensaje({ texto: "", tipo: "" });

    try {
      const response = await resetearContrasena(usuario.id);
      setMensaje({
        texto: response.message || `Contraseña restablecida correctamente para ${usuario.nombre}. La nueva contraseña es: Maer1234$`,
        tipo: "success",
      });
      // Recargar la lista para actualizar el estado
      await cargarUsuarios();
    } catch (error) {
      console.error("Error al resetear contraseña:", error);
      setMensaje({
        texto: error.message || "Error al resetear la contraseña.",
        tipo: "error",
      });
    } finally {
      setReseteandoId(null);
    }
  };

  if (loading) {
    return (
      <div className="restablecer-contrasena-container">
        <div className="loading">Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <div className="restablecer-contrasena-container">
      <h1>Restablecer Contraseñas</h1>
      <p className="descripcion">
        {usuarios.length === 1 ? (
          <>Puede resetear su contraseña. La contraseña se establecerá automáticamente en: <strong>Maer1234$</strong></>
        ) : (
          <>Lista de todos los usuarios. Puede resetear la contraseña de cualquier usuario. La contraseña se establecerá automáticamente en: <strong>Maer1234$</strong></>
        )}
      </p>

      {mensaje.texto && (
        <div className={`mensaje ${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="tabla-container">
        <table className="tabla-usuarios">
          <thead>
            <tr>
              <th>N°</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol ID</th>
              <th>Contraseña Cambiada</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length > 0 ? (
              usuarios.map((usuario, index) => (
                <tr key={usuario.id}>
                  <td>{index + 1}</td>
                  <td>{usuario.nombre}</td>
                  <td>{usuario.email}</td>
                  <td>{usuario.rolID}</td>
                  <td>{usuario.password_changed ? "Sí" : "No"}</td>
                  <td>
                    <button
                      className="btn-resetear"
                      onClick={() => handleResetear(usuario)}
                      disabled={reseteandoId === usuario.id}
                    >
                      {reseteandoId === usuario.id ? "Reseteando..." : "Resetear Contraseña"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="sin-datos">
                  No hay usuarios disponibles
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

