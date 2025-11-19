import { useState, useEffect, useCallback } from 'react';
import * as proyectosApi from '../api/proyectos.js';

export const useProyectos = () => {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProyectos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await proyectosApi.getProyectos();
      const parsed =
        Array.isArray(data)
          ? data
          : data?.proyectos || data?.data || [];
      setProyectos(parsed);
      setError(null);
    } catch (err) {
      console.error('Error obteniendo proyectos:', err);
      const message =
        err?.status === 401
          ? 'Tu sesión expiró. Inicia sesión nuevamente.'
          : err.message || 'No se pudieron cargar los proyectos';
      setError(message);
      setProyectos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProyectos();
  }, [fetchProyectos]);

  return { proyectos, loading, error, fetchProyectos };
};
