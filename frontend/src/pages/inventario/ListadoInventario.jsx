import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { getProductos, getCategorias } from '../../api/inventario';
import { FaPlus, FaEdit, FaHistory, FaSearch, FaFilter } from 'react-icons/fa';
import './ListadoInventario.css';

const ListadoInventario = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    busqueda: '',
    categoria_id: '',
    activo: '',
    stock_bajo: false,
    sort_by: 'nombre',
    sort_order: 'asc',
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
    fetchCategorias();
    fetchProductos();
  }, []);

  useEffect(() => {
    fetchProductos();
  }, [filters]);

  const fetchCategorias = async () => {
    try {
      const response = await getCategorias();
      if (response.status === 'success') {
        setCategorias(response.data);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const params = { ...filters };
      if (!params.activo) delete params.activo;
      if (!params.stock_bajo) delete params.stock_bajo;
      
      const response = await getProductos(params);
      if (response.status === 'success') {
        setProductos(response.data.data || []);
        setPagination(response.data);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
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

  const canCreate = hasPermission('Inventario', 'crear');
  const canEdit = hasPermission('Inventario', 'editar');

  return (
    <div className="inventario-container">
      <div className="inventario-header">
        <h1>Inventario de Productos</h1>
        {canCreate && (
          <button 
            className="btn-primary"
            onClick={() => navigate('/inventario/crear')}
          >
            <FaPlus /> Nuevo Producto
          </button>
        )}
      </div>

      <div className="inventario-filters">
        <div className="filter-group">
          <FaSearch className="filter-icon" />
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={filters.busqueda}
            onChange={(e) => handleFilterChange('busqueda', e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <FaFilter className="filter-icon" />
          <select
            value={filters.categoria_id}
            onChange={(e) => handleFilterChange('categoria_id', e.target.value)}
            className="filter-select"
          >
            <option value="">Todas las categorías</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select
            value={filters.activo}
            onChange={(e) => handleFilterChange('activo', e.target.value)}
            className="filter-select"
          >
            <option value="">Todos los estados</option>
            <option value="1">Activos</option>
            <option value="0">Inactivos</option>
          </select>
        </div>

        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={filters.stock_bajo}
            onChange={(e) => handleFilterChange('stock_bajo', e.target.checked)}
          />
          Solo stock bajo
        </label>

        <div className="filter-group">
          <select
            value={`${filters.sort_by}-${filters.sort_order}`}
            onChange={(e) => {
              const [sort_by, sort_order] = e.target.value.split('-');
              handleFilterChange('sort_by', sort_by);
              handleFilterChange('sort_order', sort_order);
            }}
            className="filter-select"
          >
            <option value="nombre-asc">Nombre (A-Z)</option>
            <option value="nombre-desc">Nombre (Z-A)</option>
            <option value="stock_actual-asc">Stock (Menor)</option>
            <option value="stock_actual-desc">Stock (Mayor)</option>
            <option value="created_at-desc">Más recientes</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Cargando productos...</div>
      ) : productos.length === 0 ? (
        <div className="no-data">No se encontraron productos</div>
      ) : (
        <>
          <div className="inventario-table-container">
            <table className="inventario-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Stock Actual</th>
                  <th>Stock Mínimo</th>
                  <th>Unidad</th>
                  <th>Precio Unit.</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map(producto => (
                  <tr 
                    key={producto.id}
                    className={producto.stock_bajo ? 'stock-bajo' : ''}
                  >
                    <td><strong>{producto.codigo}</strong></td>
                    <td>{producto.nombre}</td>
                    <td>{producto.categoria?.nombre || '-'}</td>
                    <td>
                      <span className={`stock-value ${producto.stock_bajo ? 'stock-bajo-value' : ''}`}>
                        {producto.stock_actual} {producto.unidad_medida}
                      </span>
                    </td>
                    <td>{producto.stock_minimo} {producto.unidad_medida}</td>
                    <td>{producto.unidad_medida}</td>
                    <td>${producto.precio_unitario?.toFixed(2) || '0.00'}</td>
                    <td>
                      <span className={`badge ${producto.activo ? 'badge-success' : 'badge-danger'}`}>
                        {producto.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {canEdit && (
                          <>
                            <button
                              className="btn-icon btn-edit"
                              onClick={() => navigate(`/inventario/editar/${producto.id}`)}
                              title="Editar"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="btn-icon btn-history"
                              onClick={() => navigate(`/inventario/${producto.id}/movimientos`)}
                              title="Ver movimientos"
                            >
                              <FaHistory />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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

export default ListadoInventario;

