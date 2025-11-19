import React, { useEffect, useState } from 'react';
import "../../styles/BajaUsuarios.css";

export default function BajaUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const token = localStorage.getItem('auth_token');

  // Función para obtener usuarios
  const fetchUsuarios = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/usuarios', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('No autorizado');
      const data = await res.json();
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

  // Función para alternar estado de usuario
  const toggleEstado = async (usuarioId) => {
    try {
      const res = await fetch(`http://127.0.0.1:8080/api/usuarios/${usuarioId}/toggle-estado`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Error al cambiar estado');
      const data = await res.json();

      // Actualizar estado visualmente
      setUsuarios(prev => prev.map(u =>
        u?.id === usuarioId ? { ...u, is_locked: !u.is_locked } : u
      ));

      setMensaje(data.message || 'Estado actualizado');
    } catch (err) {
      console.error(err);
      setMensaje(err.message || 'Error al cambiar estado');
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
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(usuarios) && usuarios.length > 0 ? (
              usuarios.map(usuario => usuario && usuario.id && (
                <tr key={usuario.id}>
                  <td>{usuario.id}</td>
                  <td>{usuario.nombre}</td>
                  <td>{usuario.email}</td>
                  <td>{usuario.is_locked ? 'Desactivado' : 'Activo'}</td>
                  <td>
                    <button
                      className={`btn-estado ${usuario.is_locked ? 'activar' : 'desactivar'}`}
                      onClick={() => toggleEstado(usuario.id)}
                    >
                      {usuario.is_locked ? 'Activar' : 'Desactivar'}
                    </button>
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
