import React from 'react';
import { useUsuarios } from '../../hooks/useUsuarios.js';

const Usuarios = () => {
  const { usuarios, loading, toggleEstado } = useUsuarios();

  if (loading) return <div>Cargando usuarios...</div>;

  return (
    <div>
      <h1>Listado de Usuarios</h1>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(u => (
            <tr key={u.id}>
              <td>{u.nombre}</td>
              <td>{u.email}</td>
              <td>{u.rol}</td>
              <td>{u.estado ? 'Activo' : 'Inactivo'}</td>
              <td>
                <button
                  onClick={() => toggleEstado(u.id)}
                  style={{
                    background: u.estado ? 'red' : 'green',
                    color: 'white',
                    padding: '4px 8px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {u.estado ? 'Desactivar' : 'Activar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Usuarios;
