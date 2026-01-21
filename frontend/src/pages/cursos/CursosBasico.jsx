import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardCursosList, deleteCurso, getFiltrosCatalogo } from '../../api/cursos';
import Breadcrumbs from '../../components/Breadcrumbs';
import { FaPlus, FaEdit, FaTrash, FaEye, FaLink, FaEllipsisV } from 'react-icons/fa';
import './CursosNivel.css';

export default function CursosBasico() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    cursos_publicados: 0,
    total_inscritos: 0,
    tasa_finalizacion: 0
  });
  const [filters, setFilters] = useState({
    busqueda: '',
    estado: '',
    software_id: '',
    sort_by: 'created_at',
    sort_order: 'desc',
    nivel_id: 1, // Principiante = 1
    page: 1,
    per_page: 15
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  });
  const [filterOptions, setFilterOptions] = useState({
    software: []
  });

  useEffect(() => {
    fetchFilterOptions();
    fetchCursos();
  }, []);

  useEffect(() => {
    fetchCursos();
  }, [filters]);

  const fetchFilterOptions = async () => {
    try {
      const response = await getFiltrosCatalogo();
      if (response.status === 'success') {
        setFilterOptions(response.data);
      }
    } catch (error) {
      console.error('Error cargando opciones de filtros:', error);
    }
  };

  const fetchCursos = async () => {
    try {
      setLoading(true);
      const response = await getDashboardCursosList(filters);
      if (response.status === 'success') {
        setCursos(response.data.cursos || []);
        setPagination(response.data.pagination || pagination);
        calcularKPIs(response.data.cursos || []);
      }
    } catch (error) {
      console.error('Error cargando cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularKPIs = (cursosList) => {
    const publicados = cursosList.filter(c => c.estado === 'Publicado').length;
    const totalInscritos = cursosList.reduce((sum, c) => sum + (c.total_inscritos || 0), 0);
    // Tasa de finalización simulada (en producción vendría del backend)
    const tasaFinalizacion = 65.5;
    
    setKpis({
      cursos_publicados: publicados,
      total_inscritos: totalInscritos,
      tasa_finalizacion: tasaFinalizacion
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este curso?')) return;
    try {
      await deleteCurso(id);
      fetchCursos();
    } catch (error) {
      alert('Error al eliminar curso: ' + (error.message || 'Error desconocido'));
    }
  };

  const getEstadoBadgeClass = (estado) => {
    const estadoLower = estado?.toLowerCase() || '';
    if (estadoLower === 'publicado') return 'badge-publicado';
    if (estadoLower === 'borrador') return 'badge-borrador';
    return 'badge-inactivo';
  };

  return (
    <div className="cursos-nivel-container">
      <Breadcrumbs />
      
      <div className="cursos-nivel-header">
        <h1>Cursos Básico</h1>
        <p className="subtitle">Gestión de cursos de nivel Principiante</p>
      </div>

      {/* Métricas del Segmento */}
      <div className="metricas-segmento">
        <div className="metrica-card">
          <h3>{kpis.cursos_publicados}</h3>
          <p>Cursos Básico Publicados</p>
        </div>
        <div className="metrica-card">
          <h3>{kpis.total_inscritos}</h3>
          <p>Inscritos en Básico</p>
        </div>
        <div className="metrica-card">
          <h3>{kpis.tasa_finalizacion}%</h3>
          <p>Tasa de Finalización del Básico</p>
        </div>
      </div>

      {/* Búsqueda y Filtros */}
      <div className="filtros-section">
        <div className="search-bar">
          <input
            type="text"
            name="busqueda"
            placeholder="Buscar por Título..."
            value={filters.busqueda}
            onChange={handleFilterChange}
            className="search-input"
          />
        </div>
        
        <div className="filtros-row">
          <select
            name="software_id"
            value={filters.software_id}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">Todos los Software</option>
            {filterOptions.software?.map(soft => (
              <option key={soft.id} value={soft.id}>{soft.nombre}</option>
            ))}
          </select>
          
          <select
            name="estado"
            value={filters.estado}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">Todos los Estados</option>
            <option value="Publicado">Publicado</option>
            <option value="Borrador">Borrador</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </div>
      </div>

      {/* Tabla de Cursos */}
      {loading ? (
        <div className="loading">Cargando cursos...</div>
      ) : cursos.length === 0 ? (
        <div className="no-cursos">
          <p>No hay cursos de nivel Básico disponibles.</p>
          <button 
            className="btn-crear"
            onClick={() => navigate('/cursos/nuevo?nivel=Principiante')}
          >
            <FaPlus /> Crear Primer Curso Básico
          </button>
        </div>
      ) : (
        <>
          <table className="cursos-table">
            <thead>
              <tr>
                <th>Título del Curso</th>
                <th>Estado</th>
                <th>Precio</th>
                <th>Inscritos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cursos.map((curso) => (
                <tr key={curso.cursoID}>
                  <td>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/cursos/editar/${curso.cursoID}`);
                      }}
                      className="curso-link"
                    >
                      {curso.nombre}
                    </a>
                  </td>
                  <td>
                    <span className={`badge ${getEstadoBadgeClass(curso.estado)}`}>
                      {curso.estado}
                    </span>
                  </td>
                  <td>{curso.precio}</td>
                  <td>{curso.total_inscritos || 0}</td>
                  <td>
                    <div className="acciones-cell">
                      <button
                        className="btn-action btn-edit"
                        onClick={() => navigate(`/cursos/editar/${curso.cursoID}`)}
                        title="Editar"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="btn-action btn-preview"
                        onClick={() => window.open(`/cursos/preview/${curso.cursoID}`, '_blank')}
                        title="Previsualizar"
                      >
                        <FaEye />
                      </button>
                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDelete(curso.cursoID)}
                        title="Eliminar"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Paginación */}
          {pagination.last_page > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
              >
                Anterior
              </button>
              <span>
                Página {pagination.current_page} de {pagination.last_page}
              </span>
              <button
                onClick={() => handlePageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

