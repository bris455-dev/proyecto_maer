import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { getEntrega, procesarEntrega, cancelarEntrega } from '../../api/produccion';
import { FaArrowLeft, FaCheck, FaTimes, FaPrint } from 'react-icons/fa';
import './DetalleEntrega.css';

const DetalleEntrega = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [entrega, setEntrega] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchEntrega();
  }, [id]);

  const fetchEntrega = async () => {
    try {
      setLoading(true);
      const response = await getEntrega(id);
      if (response.status === 'success') {
        setEntrega(response.data);
      }
    } catch (error) {
      console.error('Error cargando entrega:', error);
      alert('Error al cargar la entrega');
    } finally {
      setLoading(false);
    }
  };

  const handleProcesar = async () => {
    if (!confirm('¿Está seguro de procesar esta entrega? Se descontarán los productos del inventario.')) {
      return;
    }

    try {
      setProcessing(true);
      const response = await procesarEntrega(id);
      if (response.status === 'success') {
        alert('Entrega procesada correctamente. Los productos han sido descontados del inventario.');
        fetchEntrega();
      } else {
        alert(response.message || 'Error al procesar entrega');
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error.message || 'Error al procesar la entrega';
      alert(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelar = async () => {
    if (!confirm('¿Está seguro de cancelar esta entrega? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setProcessing(true);
      const response = await cancelarEntrega(id);
      if (response.status === 'success') {
        alert('Entrega cancelada correctamente');
        navigate('/produccion');
      } else {
        alert(response.message || 'Error al cancelar entrega');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cancelar la entrega');
    } finally {
      setProcessing(false);
    }
  };

  const canEdit = hasPermission('Producción', 'editar');

  if (loading) {
    return <div className="loading">Cargando entrega...</div>;
  }

  if (!entrega) {
    return <div className="no-data">Entrega no encontrada</div>;
  }

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: { class: 'badge-warning', label: 'Pendiente' },
      entregado: { class: 'badge-success', label: 'Entregado' },
      cancelado: { class: 'badge-danger', label: 'Cancelado' }
    };
    return badges[estado] || { class: 'badge-secondary', label: estado };
  };

  const estadoBadge = getEstadoBadge(entrega.estado);
  const total = entrega.detalles?.reduce((sum, d) => sum + (d.cantidad * d.precio_unitario), 0) || 0;

  return (
    <div className="detalle-entrega-container">
      <div className="detalle-entrega-header">
        <button className="btn-back" onClick={() => navigate('/produccion')}>
          <FaArrowLeft /> Volver
        </button>
        <div className="header-info">
          <h1>Detalle de Entrega</h1>
          <span className={`badge ${estadoBadge.class}`}>{estadoBadge.label}</span>
        </div>
        {canEdit && entrega.estado === 'pendiente' && (
          <div className="header-actions">
            <button
              className="btn-success"
              onClick={handleProcesar}
              disabled={processing}
            >
              <FaCheck /> Procesar Entrega
            </button>
            <button
              className="btn-danger"
              onClick={handleCancelar}
              disabled={processing}
            >
              <FaTimes /> Cancelar
            </button>
          </div>
        )}
      </div>

      <div className="detalle-entrega-content">
        <div className="info-section">
          <h2>Información General</h2>
          <div className="info-grid">
            <div className="info-item">
              <label>Número de Entrega:</label>
              <span><strong>{entrega.numero_entrega}</strong></span>
            </div>
            <div className="info-item">
              <label>Usuario Asignado:</label>
              <span>{entrega.usuario_asignado?.nombre || '-'}</span>
            </div>
            <div className="info-item">
              <label>Fecha de Entrega:</label>
              <span>{new Date(entrega.fecha_entrega).toLocaleDateString('es-ES')}</span>
            </div>
            {entrega.usuario_entrega && (
              <div className="info-item">
                <label>Entregado por:</label>
                <span>{entrega.usuario_entrega.nombre}</span>
              </div>
            )}
            {entrega.motivo && (
              <div className="info-item full-width">
                <label>Motivo:</label>
                <span>{entrega.motivo}</span>
              </div>
            )}
            {entrega.observaciones && (
              <div className="info-item full-width">
                <label>Observaciones:</label>
                <span>{entrega.observaciones}</span>
              </div>
            )}
          </div>
        </div>

        <div className="productos-section">
          <h2>Productos</h2>
          {entrega.detalles && entrega.detalles.length > 0 ? (
            <div className="productos-table-container">
              <table className="productos-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio Unit.</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {entrega.detalles.map((detalle, index) => (
                    <tr key={index}>
                      <td>{detalle.producto?.codigo || '-'}</td>
                      <td>{detalle.producto?.nombre || '-'}</td>
                      <td>{detalle.cantidad}</td>
                      <td>${detalle.precio_unitario?.toFixed(2) || '0.00'}</td>
                      <td><strong>${(detalle.cantidad * detalle.precio_unitario).toFixed(2)}</strong></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'right', fontWeight: 'bold' }}>Total:</td>
                    <td style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                      ${total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="no-data">No hay productos en esta entrega</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetalleEntrega;

