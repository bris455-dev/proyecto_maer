import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsuarios } from '../../api/usuarios.js';
import '../../styles/ListadoUsuarios.css';

export default function ListadoUsuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const data = await getUsuarios();
        const lista = Array.isArray(data) ? data : data.usuarios || data.data || [];
        setUsuarios(lista);
      } catch (err) {
        console.error('Error al obtener usuarios:', err);
        setError(err.message || 'Error al cargar usuarios');
      } finally {
        setLoading(false);
      }
    };
    fetchUsuarios();
  }, []);

  const handleEditar = (usuario) => {
    navigate(`/seguridad/usuarios/editar/${usuario.id}`);
  };

  const handleNuevo = () => {
    navigate('/seguridad/usuarios/nuevo');
  };

  if (loading) {
    return <div className="listado-usuarios-container"><div className="loading">Cargando usuarios...</div></div>;
  }

  return (
    <div className="listado-usuarios-container">
      <div className="listado-usuarios-header">
        <h1>Gestión de Usuarios</h1>
        <button onClick={handleNuevo} className="btn-nuevo-usuario">
          + Nuevo Usuario
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="usuarios-table-container">
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length > 0 ? (
              usuarios.map((usuario, index) => (
                <tr key={usuario.id}>
                  <td>{index + 1}</td>
                  <td>{usuario.nombre || 'Sin nombre'}</td>
                  <td>{usuario.email}</td>
                  <td>{usuario.rol?.nombreRol || `Rol ${usuario.rolID}`}</td>
                  <td>
                    <span className={`estado-badge ${usuario.is_locked ? 'desactivado' : 'activo'}`}>
                      {usuario.is_locked ? 'Desactivado' : 'Activo'}
                    </span>
                  </td>
                  <td>
                    <div className="usuarios-acciones">
                      <button
                        onClick={() => handleEditar(usuario)}
                        className="btn-editar-usuario"
                      >
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>No hay usuarios registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

