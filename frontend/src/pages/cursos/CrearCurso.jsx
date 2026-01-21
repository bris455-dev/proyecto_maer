import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { createCurso, updateCurso, getCursoById } from '../../api/cursos';
import { FaSave, FaTimes } from 'react-icons/fa';
import './CrearCurso.css';

export default function CrearCurso() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { hasPermission } = useAuth();
  const esEdicion = !!id;
  
  // Verificar si tiene permiso de administrador (puede crear/editar cursos)
  // Un administrador tendrá permisos de Básico/Intermedio/Avanzado
  const tienePermisoAdmin = hasPermission('Cursos', 'Básico') || hasPermission('Cursos', 'Intermedio') || hasPermission('Cursos', 'Avanzado');
  const isAdmin = tienePermisoAdmin;
  
  // Si no es admin, redirigir
  useEffect(() => {
    if (!isAdmin) {
      alert('No tiene permisos para crear o editar cursos. Solo los administradores pueden realizar esta acción.');
      navigate('/cursos');
    }
  }, [isAdmin, navigate]);
  
  if (!isAdmin) {
    return <div className="curso-loading">Redirigiendo...</div>;
  }
  
  // Obtener nivel de la URL si viene de un submódulo
  const nivelFromUrl = searchParams.get('nivel') || 'Básico';

  const [loading, setLoading] = useState(esEdicion);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    nivel: nivelFromUrl,
    cantidad_horas: 0,
    precio: 0,
    objetivos: '',
    requisitos: '',
    estado: 'Borrador'
  });

  useEffect(() => {
    if (esEdicion) {
      cargarCurso();
    }
  }, [id]);

  const cargarCurso = async () => {
    try {
      setLoading(true);
      const response = await getCursoById(id);
      if (response.status === 'success' && response.data) {
        setFormData({
          nombre: response.data.nombre || '',
          descripcion: response.data.descripcion || '',
          nivel: response.data.nivel || 'Básico',
          cantidad_horas: response.data.cantidad_horas || 0,
          precio: response.data.precio || 0,
          objetivos: response.data.objetivos || '',
          requisitos: response.data.requisitos || '',
          estado: response.data.estado || 'Borrador'
        });
      }
    } catch (error) {
      console.error('Error cargando curso:', error);
      alert('Error al cargar el curso');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cantidad_horas' || name === 'precio' 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = esEdicion 
        ? await updateCurso(id, formData)
        : await createCurso(formData);

      if (response.status === 'success') {
        alert(esEdicion ? 'Curso actualizado correctamente' : 'Curso creado correctamente');
        navigate(`/cursos/${esEdicion ? id : response.data.cursoID}/sesiones`);
      } else {
        alert(response.message || 'Error al guardar curso');
      }
    } catch (error) {
      console.error('Error guardando curso:', error);
      
      // Si es error 401, el handleFetch ya redirige al login
      // Solo mostrar mensaje si no es 401
      if (error.status !== 401 && !error.message?.includes('Sesión expirada')) {
        alert('Error al guardar curso: ' + (error.message || 'Error desconocido'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && esEdicion) {
    return <div className="curso-loading">Cargando curso...</div>;
  }

  return (
    <div className="crear-curso-container">
      <div className="crear-curso-header">
        <h1>
          {esEdicion ? 'Editar Curso' : 'Crear Nuevo Curso'}
          {nivelFromUrl && !esEdicion && <span className="nivel-badge"> - {nivelFromUrl}</span>}
        </h1>
        <button 
          className="btn-cancelar"
          onClick={() => {
            const nivelParam = nivelFromUrl ? `?nivel=${encodeURIComponent(nivelFromUrl)}` : '';
            navigate(`/cursos${nivelParam}`);
          }}
        >
          <FaTimes /> Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="curso-form">
        <div className="form-row">
          <div className="form-group">
            <label>Nombre del Curso *</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label>Nivel *</label>
            <select
              name="nivel"
              value={formData.nivel}
              onChange={handleChange}
              required
              disabled={!!nivelFromUrl && !esEdicion}
              title={nivelFromUrl && !esEdicion ? `Nivel fijado desde submódulo: ${nivelFromUrl}` : ''}
            >
              <option value="Básico">Básico</option>
              <option value="Intermedio">Intermedio</option>
              <option value="Avanzado">Avanzado</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Descripción</label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows={4}
            placeholder="Descripción del curso..."
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Cantidad de Horas Lectivas</label>
            <input
              type="number"
              name="cantidad_horas"
              value={formData.cantidad_horas}
              onChange={handleChange}
              min="0"
            />
          </div>

          <div className="form-group">
            <label>Precio (USD)</label>
            <input
              type="number"
              name="precio"
              value={formData.precio}
              onChange={handleChange}
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Objetivos</label>
          <textarea
            name="objetivos"
            value={formData.objetivos}
            onChange={handleChange}
            rows={3}
            placeholder="Objetivos del curso..."
          />
        </div>

        <div className="form-group">
          <label>Requisitos</label>
          <textarea
            name="requisitos"
            value={formData.requisitos}
            onChange={handleChange}
            rows={3}
            placeholder="Requisitos previos..."
          />
        </div>

        <div className="form-group">
          <label>Estado</label>
          <select
            name="estado"
            value={formData.estado}
            onChange={handleChange}
          >
            <option value="Borrador">Borrador</option>
            <option value="Publicado">Publicado</option>
            <option value="Archivado">Archivado</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-guardar" disabled={loading}>
            <FaSave /> {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}

