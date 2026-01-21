import React, { useEffect, useState } from "react";
import { FaTrash, FaEye, FaPlus } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import "../../styles/GestionRoles.css";

const Roles = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permisos, setPermisos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");

  useEffect(() => {
    const cargarRoles = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch("http://localhost:8080/api/roles", {
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        if (res.status === 401) {
          alert("Token inválido o expirado. Por favor inicia sesión de nuevo.");
          setRoles([]);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setRoles(data.data || []);
      } catch (err) {
        console.error("Error cargando roles:", err);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    cargarRoles();
  }, [isAuthenticated]);

  const eliminarRol = async (rolID) => {
    if (!confirm("¿Seguro que deseas eliminar este rol?")) return;

    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`http://localhost:8080/api/roles/${rolID}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("No se pudo eliminar el rol");

      alert("Rol eliminado correctamente");
      setRoles(prev => prev.filter(r => r.rolID !== rolID));
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error eliminando el rol");
    }
  };

  const verPermisos = async (rolID, rolNombre) => {
    try {
     const token = localStorage.getItem("auth_token");
     const res = await fetch(`http://localhost:8080/api/roles/${rolID}`, {
        headers: {
         "Accept": "application/json",
         "Authorization": `Bearer ${token}`
         }
     });

     if (!res.ok) throw new Error("Error al obtener permisos");

     const dataJson = await res.json();

     // ******************************************************
     // * CORRECCIÓN CLAVE AQUÍ: Acceder a 'data' directamente *
     // ******************************************************
      const permisosRaw = dataJson.data || []; // Anteriormente: dataJson.data?.data || []

       // Tu lógica para desduplicar permisos (Array.from(new Map...)) es excelente y la mantenemos.
       const permisosUnicos = Array.from(
        new Map(permisosRaw.map(p => [p.permisoID, p])).values()
      );

      setPermisos(permisosUnicos);
      setModalTitle(`Permisos del rol: ${rolNombre}`);
      setModalVisible(true);
   } catch (err) {
     console.error(err);
     alert("No se pudieron cargar los permisos.");
    }
 };

  return (
    <div className="gestion-roles-container">
      <div className="gestion-roles-header">
        <h1>Gestión de Roles</h1>
        <button
          onClick={() => navigate("/seguridad/roles/nuevo")}
          className="btn-nuevo-rol"
        >
          <FaPlus /> Nuevo Rol
        </button>
      </div>

      {loading ? (
        <div className="cargando-roles">Cargando roles...</div>
      ) : roles.length === 0 ? (
        <div className="sin-roles">No existen roles registrados.</div>
      ) : (
        <div className="roles-table-container">
          <table className="roles-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((rol, index) => (
                <tr key={rol.rolID}>
                  <td>{index + 1}</td>
                  <td>{rol.nombreRol}</td>
                  <td>
                    <div className="roles-acciones">
                      <button
                        onClick={() => verPermisos(rol.rolID, rol.nombreRol)}
                        className="btn-ver-permisos"
                      >
                        <FaEye /> Ver detalle
                      </button>
                      <button
                        onClick={() => eliminarRol(rol.rolID)}
                        className="btn-eliminar-rol"
                      >
                        <FaTrash /> Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de permisos */}
      {modalVisible && (
        <div className="modal-overlay" onClick={() => setModalVisible(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalTitle}</h2>
              <button
                onClick={() => setModalVisible(false)}
                className="btn-cerrar-modal"
              >
                ×
              </button>
            </div>
            {permisos.length === 0 ? (
              <p>Este rol no tiene permisos asignados.</p>
            ) : (
              <ul className="modal-permisos-list">
                {permisos.map((permiso) => (
                  <li key={permiso.permisoID}>
                    {permiso.nombreModulo} → {permiso.nombreSubmodulo}
                  </li>
                ))}
              </ul>
            )}
            <div className="modal-footer">
              <button
                onClick={() => setModalVisible(false)}
                className="btn-cerrar"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;
