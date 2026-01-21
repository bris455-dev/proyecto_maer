import React, { useEffect, useState } from 'react';
import { getUsuarios, toggleUsuarioEstado, eliminarUsuario } from '../../api/usuarios.js';
import { FaPowerOff, FaCheck, FaTrash } from 'react-icons/fa';
import "../../styles/BajaUsuarios.css";

export default function BajaUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [loadingId, setLoadingId] = useState(null);

  const fetchUsuarios = async () => {
    try {
      const data = await getUsuarios();
      const lista = Array.isArray(data) ? data : data.usuarios || data.data || [];
      setUsuarios(lista);
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
      setMensaje(err.message || 'Error al cargar usuarios');
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleToggleEstado = async (usuario) => {
    setLoadingId(usuario.id);
    setMensaje('');
    try {
      const data = await toggleUsuarioEstado(usuario);

      // Actualiza el usuario en la lista con el estado real que devuelve el backend
      setUsuarios(prev => prev.map(u => u.id === usuario.id ? { ...u, is_locked: !u.is_locked } : u));
      setMensaje(data.message || 'Estado actualizado');
    } catch (err) {
      console.error(err);
      setMensaje(err.message || 'Error al cambiar el estado');
    } finally {
      setLoadingId(null);
    }
  };

  const handleEliminar = async (usuario) => {
    if (!window.confirm(`¿Está seguro de eliminar al usuario ${usuario.nombre} (${usuario.email})? Esta acción no se puede deshacer.\n\nNOTA: No se puede eliminar un usuario que tenga proyectos asociados.`)) {
      return;
    }

    setLoadingId(usuario.id);
    setMensaje('');
    try {
      await eliminarUsuario(usuario.id);
      setUsuarios(prev => prev.filter(u => u.id !== usuario.id));
      setMensaje('Usuario eliminado correctamente');
    } catch (err) {
      console.error('Error eliminando usuario:', err);
      
      // Extraer mensaje de error más específico
      let errorMessage = 'Error al eliminar el usuario';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.data?.message) {
        errorMessage = err.data.message;
      } else if (err.data?.errors) {
        // Si hay errores de validación, tomar el primero
        const errorMessages = Object.values(err.data.errors).flat();
        if (errorMessages.length > 0) {
          errorMessage = errorMessages[0];
        }
      }
      
      setMensaje(errorMessage);
      
      // Mostrar alerta adicional si el error es por proyectos asociados
      if (errorMessage.includes('proyectos asociados') || errorMessage.includes('proyecto')) {
        alert(`⚠️ No se puede eliminar el usuario\n\n${errorMessage}\n\nSolución: Primero debe eliminar o reasignar los proyectos asociados a este usuario, o desactivar el usuario en lugar de eliminarlo usando el botón de activar/desactivar.`);
      } else if (err.status === 400) {
        // Error 400 genérico
        alert(`⚠️ Error al eliminar usuario\n\n${errorMessage}`);
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="baja-usuarios-container">
      <h1>Usuarios</h1>
      {mensaje && <p>{mensaje}</p>}

      <div className="baja-usuarios-table-container">
        <table className="baja-usuarios-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(usuarios) && usuarios.length > 0 ? (
              usuarios.map((usuario, index) => usuario && usuario.id && (
                <tr key={usuario.id}>
                  <td>{index + 1}</td>
                  <td>{usuario.nombre}</td>
                  <td>{usuario.email}</td>
                  <td>
                    <span className={`estado-badge ${usuario.is_locked ? 'desactivado' : 'activo'}`}>
                      {usuario.is_locked ? 'Desactivado' : 'Activo'}
                    </span>
                  </td>
                  <td>
                    <div className="usuarios-acciones">
                      <button
                        className={`btn-estado ${usuario.is_locked ? 'activar' : 'desactivar'}`}
                        onClick={() => handleToggleEstado(usuario)}
                        disabled={loadingId === usuario.id}
                        title={usuario.is_locked ? 'Activar usuario' : 'Desactivar usuario'}
                      >
                        {loadingId === usuario.id
                          ? '...'
                          : usuario.is_locked ? <FaCheck /> : <FaPowerOff />}
                      </button>
                      <button
                        className="btn-eliminar"
                        onClick={() => handleEliminar(usuario)}
                        disabled={loadingId === usuario.id}
                        title="Eliminar usuario"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>No hay usuarios</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
