import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getCursos, deleteCurso } from '../../api/cursos';
import { isStudent } from '../../utils/roleHelper';
import Breadcrumbs from '../../components/Breadcrumbs';
import { FaPlus, FaEdit, FaTrash, FaEye, FaShoppingCart, FaUserGraduate, FaPlayCircle, FaBookOpen } from 'react-icons/fa';
import './ListadoCursos.css';

export default function ListadoCursos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, hasPermission } = useAuth();
  
  // Si es estudiante, redirigir a su catálogo
  useEffect(() => {
    if (isStudent(user)) {
      navigate('/estudiante/catalogo', { replace: true });
    }
  }, [user, navigate]);
  
  // Si es estudiante, no renderizar nada (mientras redirige)
  if (isStudent(user)) {
    return null;
  }
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Obtener nivel de la URL (si viene de un submódulo)
  const nivelFromUrl = searchParams.get('nivel');
  const nivelFijado = nivelFromUrl || '';
  
  const [filters, setFilters] = useState({
    nivel: nivelFijado,
    estado: '',
    busqueda: ''
  });

  // Verificar si es administrador: tiene permiso de crear/editar (Básico, Intermedio, Avanzado)
  // Un administrador tendrá permisos de Básico/Intermedio/Avanzado (para crear/editar)
  // Un usuario no admin solo tendrá el permiso de "visualizar"
  const tienePermisoBásico = hasPermission('Cursos', 'Básico');
  const tienePermisoIntermedio = hasPermission('Cursos', 'Intermedio');
  const tienePermisoAvanzado = hasPermission('Cursos', 'Avanzado');
  
  // isAdmin solo es true si tiene permisos de admin (Básico, Intermedio o Avanzado)
  // Si solo tiene "visualizar", NO es admin
  const isAdmin = tienePermisoBásico || tienePermisoIntermedio || tienePermisoAvanzado;
  
  // Verificar si tiene permiso de visualizar (usuarios no admin con acceso a cursos)
  const puedeVisualizar = hasPermission('Cursos', 'visualizar');
  
  // Si hay nivel en la URL, está fijado y no se puede cambiar
  const nivelFijadoDesdeSubmodulo = !!nivelFromUrl;

  useEffect(() => {
    // Si hay nivel en la URL, actualizar el filtro automáticamente
    if (nivelFromUrl && filters.nivel !== nivelFromUrl) {
      setFilters(prev => ({ ...prev, nivel: nivelFromUrl }));
    }
    fetchCursos();
  }, [filters, nivelFromUrl]);

  const fetchCursos = async () => {
    try {
      setLoading(true);
      const response = await getCursos(filters);
      if (response.status === 'success') {
        setCursos(response.data || []);
      }
    } catch (error) {
      console.error('Error cargando cursos:', error);
      
      // Si es error 401, el handleFetch ya redirige al login
      // Solo mostrar mensaje si no es 401
      if (error.status !== 401 && !error.message?.includes('Sesión expirada')) {
        alert('Error al cargar cursos: ' + (error.message || 'Error desconocido'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este curso?')) return;
    
    try {
      const response = await deleteCurso(id);
      if (response.status === 'success') {
        fetchCursos();
      }
    } catch (error) {
      console.error('Error eliminando curso:', error);
      alert('Error al eliminar curso');
    }
  };

  const formatMoneda = (valor) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(valor || 0);
  };

  if (loading) {
    return <div className="cursos-loading">Cargando cursos...</div>;
  }

  return (
    <div className="cursos-container">
      <Breadcrumbs items={[
        { label: 'Cursos', path: '/cursos' }
      ]} />

      <div className="cursos-header">
        <h1>
          Cursos
          {nivelFijadoDesdeSubmodulo && <span className="nivel-badge"> - {nivelFijado}</span>}
        </h1>
        <div className="cursos-header-actions">
          {puedeVisualizar && !isAdmin && (
            <button 
              className="btn-mis-cursos"
              onClick={() => navigate('/cursos/mis-cursos')}
            >
              <FaBookOpen /> Mis Cursos
            </button>
          )}
          {isAdmin && (
            <button 
              className="btn-crear-curso"
              onClick={() => {
                const nivelParam = nivelFijado ? `?nivel=${encodeURIComponent(nivelFijado)}` : '';
                navigate(`/cursos/nuevo${nivelParam}`);
              }}
            >
              <FaPlus /> Crear Curso {nivelFijado ? `(${nivelFijado})` : ''}
            </button>
          )}
        </div>
      </div>

      {/* Filtros mejorados */}
      <div className="cursos-filters">
        <div className="filter-group">
          <label>Nivel</label>
          <select
            value={filters.nivel}
            onChange={(e) => setFilters({ ...filters, nivel: e.target.value })}
            disabled={nivelFijadoDesdeSubmodulo}
            title={nivelFijadoDesdeSubmodulo ? `Filtrado automático por nivel: ${nivelFijado}` : ''}
          >
            <option value="">Todos los niveles</option>
            <option value="Básico">Básico</option>
            <option value="Intermedio">Intermedio</option>
            <option value="Avanzado">Avanzado</option>
          </select>
        </div>
        {isAdmin && (
          <div className="filter-group">
            <label>Estado</label>
            <select
              value={filters.estado}
              onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
            >
              <option value="">Todos los estados</option>
              <option value="Borrador">Borrador</option>
              <option value="Publicado">Publicado</option>
              <option value="Archivado">Archivado</option>
            </select>
          </div>
        )}
        <div className="filter-group search-group">
          <label>Buscar</label>
          <input
            type="text"
            placeholder="Buscar por nombre, descripción..."
            value={filters.busqueda}
            onChange={(e) => setFilters({ ...filters, busqueda: e.target.value })}
            className="search-input"
          />
        </div>
        {(filters.nivel || filters.estado || filters.busqueda) && (
          <button
            className="btn-limpiar-filtros"
            onClick={() => setFilters({ nivel: nivelFijado, estado: '', busqueda: '' })}
          >
            Limpiar Filtros
          </button>
        )}
      </div>

      <div className="cursos-grid">
        {cursos.length === 0 ? (
          <p className="no-cursos">No hay cursos disponibles</p>
        ) : (
          cursos.map((curso) => (
            <div key={curso.cursoID} className="curso-card">
              {curso.imagen_portada && (
                <img 
                  src={`/storage/${curso.imagen_portada}`} 
                  alt={curso.nombre}
                  className="curso-imagen"
                />
              )}
              <div className="curso-content">
                <h3>{curso.nombre}</h3>
                <p className="curso-nivel">{curso.nivel}</p>
                <p className="curso-descripcion">{curso.descripcion}</p>
                <div className="curso-info">
                  <span>{curso.cantidad_horas} horas</span>
                  <span className="curso-precio">{formatMoneda(curso.precio)}</span>
                </div>
                <div className="curso-acciones">
                  {isAdmin ? (
                    // Botones para administradores
                    <>
                      <button
                        className="btn-vista-previa"
                        onClick={() => navigate(`/cursos/${curso.cursoID}`)}
                        title="Ver vista previa del curso (como estudiante)"
                      >
                        <FaPlayCircle /> Vista Previa
                      </button>
                      <button
                        className="btn-ver"
                        onClick={() => navigate(`/cursos/${curso.cursoID}/sesiones`)}
                        title="Gestionar sesiones y archivos"
                      >
                        <FaEdit /> Gestionar
                      </button>
                      <button
                        className="btn-editar"
                        onClick={() => navigate(`/cursos/editar/${curso.cursoID}`)}
                        title="Editar curso"
                      >
                        <FaEdit /> Editar
                      </button>
                      <button
                        className="btn-eliminar"
                        onClick={() => handleDelete(curso.cursoID)}
                        title="Eliminar curso"
                      >
                        <FaTrash /> Eliminar
                      </button>
                    </>
                  ) : puedeVisualizar ? (
                    // Botones para usuarios con permiso de visualizar (no admin)
                    <>
                      <button
                        className="btn-vista-previa"
                        onClick={() => navigate(`/cursos/${curso.cursoID}`)}
                        title="Ver vista previa del curso"
                      >
                        <FaPlayCircle /> Vista Previa
                      </button>
                      <button
                        className="btn-carrito"
                        onClick={async () => {
                          try {
                            // Agregar al carrito directamente desde aquí
                            const { agregarAlCarrito } = await import('../../api/cursos');
                            const response = await agregarAlCarrito(curso.cursoID);
                            if (response.status === 'success') {
                              alert('Curso agregado al carrito');
                              navigate('/cursos/carrito');
                            } else {
                              alert(response.message || 'Error al agregar al carrito');
                            }
                          } catch (error) {
                            console.error('Error agregando al carrito:', error);
                            alert('Error al agregar al carrito');
                          }
                        }}
                        title="Agregar al carrito de compras"
                      >
                        <FaShoppingCart /> Agregar al Carrito
                      </button>
                      <button
                        className="btn-matricular"
                        onClick={async () => {
                          try {
                            // Matricularse directamente
                            const { matricularse } = await import('../../api/cursos');
                            const response = await matricularse(curso.cursoID);
                            if (response.status === 'success') {
                              alert('Matrícula realizada correctamente');
                              navigate(`/cursos/${curso.cursoID}`);
                            } else {
                              alert(response.message || 'Error al matricularse');
                            }
                          } catch (error) {
                            console.error('Error matriculándose:', error);
                            alert('Error al matricularse');
                          }
                        }}
                        title="Matricularse en el curso"
                      >
                        <FaUserGraduate /> Matricularse
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

