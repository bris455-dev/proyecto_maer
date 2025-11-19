import { useState, useEffect } from 'react';
import * as usuariosApi from '../api/usuarios.js';

export const useUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUsuarios = async () => {
    setLoading(true);
    const data = await usuariosApi.getUsuarios();
    setUsuarios(data || []);
    setLoading(false);
  };

  const toggleEstado = async (id) => {
    await usuariosApi.toggleEstadoUsuario(id);
    fetchUsuarios();
  };

  useEffect(() => { fetchUsuarios(); }, []);

  return { usuarios, loading, fetchUsuarios, toggleEstado };
};
