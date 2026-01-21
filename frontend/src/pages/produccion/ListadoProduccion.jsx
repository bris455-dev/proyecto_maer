import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { getEntregas, procesarEntrega, cancelarEntrega } from '../../api/produccion';
import { getUsuarios } from '../../api/usuarios';
import { FaPlus, FaEye, FaCheck, FaTimes, FaSearch } from 'react-icons/fa';
import './ListadoProduccion.css';

const ListadoProduccion = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [entregas, setEntregas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    usuario_asignado_id: '',
    estado: '',
    fecha_inicio: '',
    fecha_fin: '',
    busqueda: '',
    sort_by: 'created_at',
    sort_order: 'desc',
    page: 1,
    per_page: 15
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  });

  useEffect(() => {
    fetchUsuarios();
    fetchEntregas();
  }, []);

  useEffect(() => {
    fetchEntregas();
  }, [filters]);

  const fetchUsuarios = async () => {
    try {
      const response = await getUsuarios();
      if (response.status === 'success') {
        setUsuarios(response.data || []);
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  const fetchEntregas = async () => {
    try {
      setLoading(true);
      const params = { ...filters };
      if (!params.usuario_asignado_id) delete params.usuario_asignado_id;
      if (!params.estado) delete params.estado;
      if (!params.fecha_inicio) delete params.fecha_inicio;
      if (!params.fecha_fin) delete params.fecha_fin;
      if (!params.busqueda) delete params.busqueda;

      const response = await getEntregas(params);
      if (response.status === 'success') {
        setEntregas(response.data.data || []);
        setPagination(response.data);
      }
    } catch (error) {
      console.error('Error cargando entregas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: { class: 'badge-warning', label: 'Pendiente' },
      entregado: { class: 'badge-success', label: 'Entregado' },
      cancelado: { class: 'badge-danger', label: 'Cancelado' }
    };
    return badges[estado] || { class: 'badge-secondary', label: estado };
  };

  const canCreate = hasPermission('Producción', 'crear');
  const canEdit = hasPermission('Producción', 'editar');

  return (
    <div className="produccion-container">
      <div className="produccion-header">
        <h1>Gestión de Producción</h1>
        {canCreate && (
          <button 
            className="btn-primary"
            onClick={() => navigate('/produccion/crear')}
          >
            <FaPlus /> Nueva Entrega
          </button>
        )}
      </div>

      <div className="produccion-filters">
        <div className="filter-group">
          <FaSearch className="filter-icon" />
          <input
            type="text"
            placeholder="Buscar por número o motivo..."
            value={filters.busqueda}
            onChange={(e) => handleFilterChange('busqueda', e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <select
            value={filters.usuario_asignado_id}
            onChange={(e) => handleFilterChange('usuario_asignado_id', e.target.value)}
            className="filter-select"
          >
            <option value="">Todos los usuarios</option>
            {usuarios.map(usr => (
              <option key={usr.id} value={usr.id}>{usr.nombre}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select
            value={filters.estado}
            onChange={(e) => handleFilterChange('estado', e.target.value)}
            className="filter-select"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div className="filter-group">
          <input
            type="date"
            value={filters.fecha_inicio}
            onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
            className="filter-input"
            placeholder="Fecha inicio"
          />
        </div>

        <div className="filter-group">
          <input
            type="date"
            value={filters.fecha_fin}
            onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
            className="filter-input"
            placeholder="Fecha fin"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">Cargando entregas...</div>
      ) : entregas.length === 0 ? (
        <div className="no-data">No se encontraron entregas</div>
      ) : (
        <>
          <div className="produccion-table-container">
            <table className="produccion-table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Usuario Asignado</th>
                  <th>Fecha Entrega</th>
                  <th>Motivo</th>
                  <th>Productos</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {entregas.map(entrega => {
                  const estadoBadge = getEstadoBadge(entrega.estado);
                  return (
                    <tr key={entrega.id}>
                      <td><strong>{entrega.numero_entrega}</strong></td>
                      <td>{entrega.usuario_asignado?.nombre || '-'}</td>
                      <td>{new Date(entrega.fecha_entrega).toLocaleDateString('es-ES')}</td>
                      <td className="motivo-cell">{entrega.motivo || '-'}</td>
                      <td>{entrega.detalles?.length || 0} producto(s)</td>
                      <td>
                        <span className={`badge ${estadoBadge.class}`}>
                          {estadoBadge.label}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon btn-view"
                            onClick={() => navigate(`/produccion/${entrega.id}`)}
                            title="Ver detalle"
                          >
                            <FaEye />
                          </button>
                          {canEdit && entrega.estado === 'pendiente' && (
                            <>
                              <button
                                className="btn-icon btn-success"
                                onClick={async () => {
                                  if (confirm('¿Procesar esta entrega? Se descontarán los productos del inventario.')) {
                                    try {
                                      const response = await procesarEntrega(entrega.id);
                                      if (response.status === 'success') {
                                        alert('Entrega procesada correctamente');
                                        fetchEntregas();
                                      } else {
                                        alert(response.message || 'Error al procesar entrega');
                                      }
                                    } catch (error) {
                                      console.error('Error:', error);
                                      alert('Error al procesar la entrega');
                                    }
                                  }
                                }}
                                title="Procesar entrega"
                              >
                                <FaCheck />
                              </button>
                              <button
                                className="btn-icon btn-danger"
                                onClick={async () => {
                                  if (confirm('¿Cancelar esta entrega?')) {
                                    try {
                                      const response = await cancelarEntrega(entrega.id);
                                      if (response.status === 'success') {
                                        alert('Entrega cancelada correctamente');
                                        fetchEntregas();
                                      } else {
                                        alert(response.message || 'Error al cancelar entrega');
                                      }
                                    } catch (error) {
                                      console.error('Error:', error);
                                      alert('Error al cancelar la entrega');
                                    }
                                  }
                                }}
                                title="Cancelar"
                              >
                                <FaTimes />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination.last_page > 1 && (
            <div className="pagination">
              <button
                disabled={pagination.current_page === 1}
                onClick={() => handlePageChange(pagination.current_page - 1)}
              >
                Anterior
              </button>
              <span>
                Página {pagination.current_page} de {pagination.last_page}
              </span>
              <button
                disabled={pagination.current_page === pagination.last_page}
                onClick={() => handlePageChange(pagination.current_page + 1)}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ListadoProduccion;

