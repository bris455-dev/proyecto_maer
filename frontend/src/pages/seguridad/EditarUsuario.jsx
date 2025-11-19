import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { editarUsuario, getUsuarios } from '../../api/usuarios.js';

const EditarUsuario = () => {
  const { id } = useParams();
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const fetchUsuario = async () => {
      const allUsers = await getUsuarios();
      const u = allUsers.find(user => user.id === parseInt(id));
      setUsuario(u);
    };
    fetchUsuario();
  }, [id]);

  if (!usuario) return <div>Cargando...</div>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await editarUsuario(id, usuario);
    alert('Usuario actualizado');
  };

  return (
    <div>
      <h1>Editar Usuario</h1>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Nombre"
          value={usuario.nombre}
          onChange={e => setUsuario({ ...usuario, nombre: e.target.value })}
        />
        <input
          placeholder="Email"
          value={usuario.email}
          onChange={e => setUsuario({ ...usuario, email: e.target.value })}
        />
        <input
          placeholder="Rol"
          value={usuario.rol}
          onChange={e => setUsuario({ ...usuario, rol: e.target.value })}
        />
        <button type="submit">Guardar</button>
      </form>
    </div>
  );
};

export default EditarUsuario;
