import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProducto, getMovimientos, registrarMovimiento } from '../../api/inventario';
import { FaArrowLeft, FaPlus, FaArrowUp, FaArrowDown, FaSync } from 'react-icons/fa';
import './MovimientosInventario.css';

const MovimientosInventario = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [movimientoForm, setMovimientoForm] = useState({
    tipo: 'entrada',
    cantidad: '',
    motivo: '',
    referencia: ''
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0
  });

  useEffect(() => {
    fetchProducto();
    fetchMovimientos();
  }, [id]);

  const fetchProducto = async () => {
    try {
      const response = await getProducto(id);
      if (response.status === 'success') {
        setProducto(response.data);
      }
    } catch (error) {
      console.error('Error cargando producto:', error);
    }
  };

  const fetchMovimientos = async (page = 1) => {
    try {
      setLoading(true);
      const response = await getMovimientos(id, { page, per_page: 15 });
      if (response.status === 'success') {
        setMovimientos(response.data.data || []);
        setPagination(response.data);
      }
    } catch (error) {
      console.error('Error cargando movimientos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMovimientoChange = (e) => {
    const { name, value } = e.target;
    setMovimientoForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRegistrarMovimiento = async (e) => {
    e.preventDefault();
    if (!movimientoForm.cantidad || !movimientoForm.motivo) {
      alert('Complete todos los campos requeridos');
      return;
    }

    try {
      const response = await registrarMovimiento({
        producto_id: parseInt(id),
        tipo: movimientoForm.tipo,
        cantidad: parseFloat(movimientoForm.cantidad),
        motivo: movimientoForm.motivo,
        referencia: movimientoForm.referencia || null
      });

      if (response.status === 'success') {
        alert('Movimiento registrado correctamente');
        setShowModal(false);
        setMovimientoForm({ tipo: 'entrada', cantidad: '', motivo: '', referencia: '' });
        fetchProducto();
        fetchMovimientos();
      } else {
        alert(response.message || 'Error al registrar movimiento');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al registrar movimiento');
    }
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'entrada':
        return <FaArrowUp className="icon-entrada" />;
      case 'salida':
        return <FaArrowDown className="icon-salida" />;
      case 'ajuste':
        return <FaSync className="icon-ajuste" />;
      default:
        return null;
    }
  };

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case 'entrada':
        return 'Entrada';
      case 'salida':
        return 'Salida';
      case 'ajuste':
        return 'Ajuste';
      default:
        return tipo;
    }
  };

  if (loading && !producto) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="movimientos-container">
      <div className="movimientos-header">
        <button className="btn-back" onClick={() => navigate('/inventario')}>
          <FaArrowLeft /> Volver
        </button>
        <div>
          <h1>Movimientos de Inventario</h1>
          {producto && (
            <p className="producto-info">
              <strong>{producto.nombre}</strong> ({producto.codigo}) - 
              Stock actual: <strong>{producto.stock_actual} {producto.unidad_medida}</strong>
            </p>
          )}
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <FaPlus /> Nuevo Movimiento
        </button>
      </div>

      {loading ? (
        <div className="loading">Cargando movimientos...</div>
      ) : movimientos.length === 0 ? (
        <div className="no-data">No hay movimientos registrados</div>
      ) : (
        <>
          <div className="movimientos-table-container">
            <table className="movimientos-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Stock Anterior</th>
                  <th>Stock Nuevo</th>
                  <th>Motivo</th>
                  <th>Referencia</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map(mov => (
                  <tr key={mov.id}>
                    <td>{new Date(mov.created_at).toLocaleString('es-ES')}</td>
                    <td>
                      <span className={`tipo-badge tipo-${mov.tipo}`}>
                        {getTipoIcon(mov.tipo)}
                        {getTipoLabel(mov.tipo)}
                      </span>
                    </td>
                    <td><strong>{mov.cantidad} {producto?.unidad_medida}</strong></td>
                    <td>{mov.stock_anterior} {producto?.unidad_medida}</td>
                    <td><strong>{mov.stock_nuevo} {producto?.unidad_medida}</strong></td>
                    <td>{mov.motivo}</td>
                    <td>{mov.referencia || '-'}</td>
                    <td>{mov.usuario?.nombre || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.last_page > 1 && (
            <div className="pagination">
              <button
                disabled={pagination.current_page === 1}
                onClick={() => fetchMovimientos(pagination.current_page - 1)}
              >
                Anterior
              </button>
              <span>
                Página {pagination.current_page} de {pagination.last_page}
              </span>
              <button
                disabled={pagination.current_page === pagination.last_page}
                onClick={() => fetchMovimientos(pagination.current_page + 1)}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Registrar Movimiento</h2>
            <form onSubmit={handleRegistrarMovimiento}>
              <div className="form-group">
                <label>Tipo de Movimiento *</label>
                <select
                  name="tipo"
                  value={movimientoForm.tipo}
                  onChange={handleMovimientoChange}
                  required
                >
                  <option value="entrada">Entrada</option>
                  <option value="salida">Salida</option>
                  <option value="ajuste">Ajuste</option>
                </select>
              </div>

              <div className="form-group">
                <label>Cantidad *</label>
                <input
                  type="number"
                  name="cantidad"
                  value={movimientoForm.cantidad}
                  onChange={handleMovimientoChange}
                  min="0.01"
                  step="0.01"
                  required
                />
                <small>Unidad: {producto?.unidad_medida}</small>
              </div>

              <div className="form-group">
                <label>Motivo *</label>
                <textarea
                  name="motivo"
                  value={movimientoForm.motivo}
                  onChange={handleMovimientoChange}
                  rows="3"
                  required
                />
              </div>

              <div className="form-group">
                <label>Referencia</label>
                <input
                  type="text"
                  name="referencia"
                  value={movimientoForm.referencia}
                  onChange={handleMovimientoChange}
                  placeholder="Número de factura, orden, etc."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovimientosInventario;

