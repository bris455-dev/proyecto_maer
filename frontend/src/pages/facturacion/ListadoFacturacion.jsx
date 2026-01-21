import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFacturas, updateFacturaEstado, getProyectosDisponibles, createFactura } from '../../api/facturacion';
import { getClientes } from '../../api/clientesApi';
import { getUsuarios } from '../../api/usuarios';
import { FaEye, FaFileInvoice, FaCheckCircle, FaTimesCircle, FaClock, FaBan, FaPlus, FaUsers } from 'react-icons/fa';
import '../../styles/facturacion.css';

const formatFecha = (fecha) => {
  if (!fecha) return 'Sin fecha';
  try {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return fecha;
  }
};

const formatMoneda = (valor) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'USD'
  }).format(valor || 0);
};

const getEstadoBadge = (estado) => {
  const estados = {
    'Pendiente': { icon: FaClock, color: '#ffc107', bg: '#fff3cd' },
    'Emitida': { icon: FaFileInvoice, color: '#3498db', bg: '#d1ecf1' },
    'Pagada': { icon: FaCheckCircle, color: '#28a745', bg: '#d4edda' },
    'Cancelada': { icon: FaBan, color: '#dc3545', bg: '#f8d7da' },
  };

  return estados[estado] || estados['Pendiente'];
};

export default function ListadoFacturacion() {
  const navigate = useNavigate();
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clientes, setClientes] = useState([]);
  const [diseñadores, setDiseñadores] = useState([]);
  const [proyectosDisponibles, setProyectosDisponibles] = useState([]);
  const [showModalCrear, setShowModalCrear] = useState(false);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState('');
  const [filters, setFilters] = useState({
    estado: '',
    fecha_desde: '',
    fecha_hasta: '',
    numero_factura: '',
    clienteID: '',
    empleadoID: '',
  });

  useEffect(() => {
    fetchFacturas();
    fetchClientes();
    fetchDiseñadores();
    fetchProyectosDisponibles();
  }, [filters]);

  const fetchFacturas = async () => {
    try {
      setLoading(true);
      const response = await getFacturas(filters);
      const data = response?.data || response || [];
      setFacturas(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      console.error('Error cargando facturas:', err);
      setError(err.message || 'Error al cargar facturas');
      setFacturas([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientes = async () => {
    try {
      const response = await getClientes();
      const data = response?.data || response || [];
      setClientes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando clientes:', err);
    }
  };

  const fetchDiseñadores = async () => {
    try {
      const response = await getUsuarios();
      const data = response?.data || response || [];
      // Filtrar solo usuarios con rolID 2 (diseñadores) y que tengan empleadoID
      const diseñadoresList = Array.isArray(data) 
        ? data.filter(u => u.rolID === 2 && u.empleadoID) 
        : [];
      setDiseñadores(diseñadoresList);
    } catch (err) {
      console.error('Error cargando diseñadores:', err);
    }
  };

  const fetchProyectosDisponibles = async () => {
    try {
      const response = await getProyectosDisponibles();
      const data = response?.data || response || [];
      setProyectosDisponibles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando proyectos disponibles:', err);
    }
  };

  const handleVerDetalle = (id) => {
    navigate(`/facturacion/${id}`);
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    if (!window.confirm(`¿Está seguro de cambiar el estado a "${nuevoEstado}"?`)) {
      return;
    }

    try {
      await updateFacturaEstado(id, nuevoEstado);
      await fetchFacturas();
    } catch (err) {
      alert('Error al actualizar estado: ' + (err.message || 'Error desconocido'));
    }
  };

  const handleCrearFactura = async () => {
    if (!proyectoSeleccionado) {
      alert('Por favor seleccione un proyecto');
      return;
    }

    try {
      await createFactura({
        proyectoID: parseInt(proyectoSeleccionado),
        fecha_emision: new Date().toISOString().split('T')[0],
        estado: 'Pendiente'
      });
      alert('Factura creada exitosamente');
      setShowModalCrear(false);
      setProyectoSeleccionado('');
      await fetchFacturas();
      await fetchProyectosDisponibles();
    } catch (err) {
      alert('Error al crear factura: ' + (err.message || 'Error desconocido'));
    }
  };

  if (loading && facturas.length === 0) {
    return (
      <div className="facturacion-container">
        <div className="loading">Cargando facturas...</div>
      </div>
    );
  }

  return (
    <div className="facturacion-container">
      <div className="facturacion-header">
        <h1>Módulo de Facturación</h1>
        <div className="header-actions">
          <button 
            className="btn-factura-grupal"
            onClick={() => navigate('/facturacion/grupal')}
            title="Facturación grupal por cliente"
          >
            <FaUsers /> Factura Grupal
          </button>
          <button 
            className="btn-crear-factura"
            onClick={() => setShowModalCrear(true)}
            title="Crear factura desde proyecto"
          >
            <FaPlus /> Crear Factura
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Filtros */}
      <div className="facturacion-filtros">
        <div className="filtro-group">
          <label>Estado:</label>
          <select
            value={filters.estado}
            onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
          >
            <option value="">Todos</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Emitida">Emitida</option>
            <option value="Pagada">Pagada</option>
            <option value="Cancelada">Cancelada</option>
          </select>
        </div>

        <div className="filtro-group">
          <label>Fecha desde:</label>
          <input
            type="date"
            value={filters.fecha_desde}
            onChange={(e) => setFilters({ ...filters, fecha_desde: e.target.value })}
          />
        </div>

        <div className="filtro-group">
          <label>Fecha hasta:</label>
          <input
            type="date"
            value={filters.fecha_hasta}
            onChange={(e) => setFilters({ ...filters, fecha_hasta: e.target.value })}
          />
        </div>

        <div className="filtro-group">
          <label>Cliente:</label>
          <select
            value={filters.clienteID}
            onChange={(e) => setFilters({ ...filters, clienteID: e.target.value })}
          >
            <option value="">Todos</option>
            {clientes.map(cliente => (
              <option key={cliente.clienteID} value={cliente.clienteID}>
                {cliente.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="filtro-group">
          <label>Diseñador:</label>
          <select
            value={filters.empleadoID}
            onChange={(e) => setFilters({ ...filters, empleadoID: e.target.value })}
          >
            <option value="">Todos</option>
            {diseñadores.map(diseñador => (
              <option key={diseñador.id} value={diseñador.empleadoID}>
                {diseñador.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="filtro-group">
          <label>Número de factura:</label>
          <input
            type="text"
            placeholder="Buscar..."
            value={filters.numero_factura}
            onChange={(e) => setFilters({ ...filters, numero_factura: e.target.value })}
          />
        </div>
      </div>

      {/* Tabla de facturas */}
      <div className="facturacion-table-container">
        <table className="facturacion-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Proyecto</th>
              <th>Cliente</th>
              <th>Diseñador</th>
              <th>Fecha Emisión</th>
              <th>Fecha Vencimiento</th>
              <th>Subtotal</th>
              <th>Impuesto</th>
              <th>Descuento</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {facturas.length > 0 ? (
              facturas.map((factura) => {
                const estadoInfo = getEstadoBadge(factura.estado);
                const EstadoIcon = estadoInfo.icon;

                return (
                  <tr key={factura.facturacionID}>
                    <td>{factura.numero_factura}</td>
                    <td>
                      {factura.tipo === 'Grupal' 
                        ? 'Grupal' 
                        : `#${factura.proyecto?.proyectoID || 'N/A'} - ${factura.proyecto?.nombre || 'N/A'}`}
                    </td>
                    <td>{factura.cliente?.nombre || 'N/A'}</td>
                    <td>
                      {factura.tipo === 'Grupal' 
                        ? 'Varios' 
                        : factura.proyecto?.empleado?.nombre || 'N/A'}
                    </td>
                    <td>{formatFecha(factura.fecha_emision)}</td>
                    <td>{formatFecha(factura.fecha_vencimiento)}</td>
                    <td>{formatMoneda(factura.subtotal)}</td>
                    <td>{formatMoneda(factura.impuesto)}</td>
                    <td>{formatMoneda(factura.descuento)}</td>
                    <td className="total-cell">{formatMoneda(factura.total)}</td>
                    <td>
                      <span
                        className="estado-badge"
                        style={{
                          backgroundColor: estadoInfo.bg,
                          color: estadoInfo.color,
                        }}
                      >
                        <EstadoIcon style={{ marginRight: '4px' }} />
                        {factura.estado}
                      </span>
                    </td>
                    <td>
                      <div className="facturacion-acciones">
                        <button
                          onClick={() => handleVerDetalle(factura.facturacionID)}
                          className="btn-ver-detalle"
                          title="Ver detalle"
                        >
                          <FaEye />
                        </button>
                        {factura.estado === 'Pendiente' && (
                          <button
                            onClick={() => handleCambiarEstado(factura.facturacionID, 'Emitida')}
                            className="btn-emitir"
                            title="Emitir factura"
                          >
                            <FaFileInvoice />
                          </button>
                        )}
                        {factura.estado === 'Emitida' && (
                          <button
                            onClick={() => handleCambiarEstado(factura.facturacionID, 'Pagada')}
                            className="btn-pagar"
                            title="Marcar como pagada"
                          >
                            <FaCheckCircle />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="12" style={{ textAlign: 'center' }}>
                  No hay facturas registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para crear factura */}
      {showModalCrear && (
        <div className="modal-overlay" onClick={() => setShowModalCrear(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Crear Factura desde Proyecto</h2>
            <div className="modal-body">
              <label>
                Seleccione un proyecto:
                <select
                  value={proyectoSeleccionado}
                  onChange={(e) => setProyectoSeleccionado(e.target.value)}
                >
                  <option value="">-- Seleccione --</option>
                  {proyectosDisponibles.map(proyecto => (
                    <option key={proyecto.proyectoID} value={proyecto.proyectoID}>
                      #{proyecto.proyectoID} - {proyecto.nombre} - {proyecto.cliente?.nombre || 'Sin cliente'} - Total: {formatMoneda(proyecto.total || 0)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="modal-actions">
              <button onClick={handleCrearFactura} className="btn-primary">
                Crear Factura
              </button>
              <button onClick={() => setShowModalCrear(false)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
