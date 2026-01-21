import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUsuarios, obtenerRoles, actualizarUsuario } from "../../api/usuarios.js";
import "../../styles/CrearUsuario.css";

export default function EditarUsuario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [rolID, setRolID] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener roles
        const resRoles = await obtenerRoles();
        setRoles(Array.isArray(resRoles.data) ? resRoles.data : []);

        // Obtener usuario
        const data = await getUsuarios();
        const lista = Array.isArray(data) ? data : data.usuarios || data.data || [];
        const usuario = lista.find(u => u.id === parseInt(id));
        
        if (usuario) {
          setNombre(usuario.nombre || "");
          setEmail(usuario.email || "");
          setRolID(usuario.rolID ? String(usuario.rolID) : "");
        } else {
          setMensaje("Usuario no encontrado");
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
        setMensaje("Error al cargar los datos del usuario");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");

    try {
      await actualizarUsuario(id, {
        nombre: nombre.trim(),
        email: email.trim(),
        rolID: rolID ? parseInt(rolID) : null,
      });

      setMensaje("✅ Usuario actualizado correctamente");
      setTimeout(() => {
        navigate("/seguridad/usuarios");
      }, 1500);
    } catch (error) {
      console.error(error);
      setMensaje("❌ Ocurrió un error al actualizar el usuario: " + (error.message || "Error desconocido"));
    }
  };

  if (loading) {
    return <div className="crear-usuario-container"><div className="loading">Cargando...</div></div>;
  }

  return (
    <div className="crear-usuario-container">
      <div className="crear-usuario-header">
        <h2>Editar Usuario</h2>
        <button onClick={() => navigate("/seguridad/usuarios")} className="btn-volver">
          ← Volver al listado
        </button>
      </div>

      {mensaje && (
        <div className={`mensaje ${mensaje.includes("✅") ? "success" : "error"}`}>
          {mensaje}
        </div>
      )}

      <form onSubmit={handleSubmit} className="crear-usuario-form">
        <label>
          Nombre:
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            maxLength={100}
          />
        </label>

        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Rol:
          <select
            value={rolID}
            onChange={(e) => setRolID(e.target.value)}
            required
          >
            <option value="">Seleccione un rol</option>
            {roles.map((rol) => (
              <option key={rol.rolID} value={rol.rolID}>
                {rol.nombreRol}
              </option>
            ))}
          </select>
        </label>

        <div className="form-actions">
          <button type="submit" className="btn-submit">Guardar Cambios</button>
          <button
            type="button"
            onClick={() => navigate("/seguridad/usuarios")}
            className="btn-cancel"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
