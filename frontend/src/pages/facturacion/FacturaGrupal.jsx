import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProyectosDisponibles, createFacturaGrupal } from '../../api/facturacion';
import { getClientes } from '../../api/clientesApi';
import { FaArrowLeft, FaFilePdf, FaSearch, FaCheckSquare, FaSquare } from 'react-icons/fa';
import { generarPDFGrupal } from '../../utils/pdfGeneratorGrupal';
import logoImage from '../../assets/logo.jpeg';
import '../../styles/FacturaGrupal.css';

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

export default function FacturaGrupal() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [proyectosSeleccionados, setProyectosSeleccionados] = useState([]);
  const [facturaGenerada, setFacturaGenerada] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    clienteID: '',
    fecha_desde: '',
    fecha_hasta: '',
  });

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      setLoadingClientes(true);
      const response = await getClientes();
      console.log('📋 Respuesta de getClientes:', response);
      
      // La API devuelve { status: 'success', clientes: [...] }
      let clientesData = [];
      if (response?.clientes && Array.isArray(response.clientes)) {
        clientesData = response.clientes;
      } else if (Array.isArray(response)) {
        clientesData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        clientesData = response.data;
      } else if (response?.status === 'success' && Array.isArray(response.data)) {
        clientesData = response.data;
      }
      
      console.log('📋 Clientes extraídos:', clientesData.length);
      setClientes(clientesData);
      
      if (clientesData.length === 0) {
        console.warn('⚠️ No se encontraron clientes en la respuesta');
        setError('No se encontraron clientes. Verifique que tenga permisos para ver clientes.');
      } else {
        setError('');
      }
    } catch (err) {
      console.error('❌ Error cargando clientes:', err);
      setError('Error al cargar la lista de clientes: ' + (err.message || 'Error desconocido'));
      setClientes([]);
    } finally {
      setLoadingClientes(false);
    }
  };

  const handleBuscar = async () => {
    if (!filters.clienteID) {
      alert('Por favor seleccione un cliente');
      return;
    }

    if (!filters.fecha_desde || !filters.fecha_hasta) {
      alert('Por favor seleccione un rango de fechas');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setProyectosSeleccionados([]);
      setFacturaGenerada(null);
      
      // Obtener proyectos disponibles filtrados
      const response = await getProyectosDisponibles({
        clienteID: filters.clienteID,
        fecha_desde: filters.fecha_desde,
        fecha_hasta: filters.fecha_hasta,
      });

      const proyectosData = response?.data || response || [];
      
      if (!Array.isArray(proyectosData) || proyectosData.length === 0) {
        setError('No se encontraron proyectos disponibles para el cliente y rango de fechas seleccionados');
        setProyectos([]);
        return;
      }

      setProyectos(proyectosData);
    } catch (err) {
      console.error('Error buscando proyectos:', err);
      setError(err.message || 'Error al buscar proyectos');
      setProyectos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProyecto = (proyectoID) => {
    setProyectosSeleccionados(prev => {
      if (prev.includes(proyectoID)) {
        return prev.filter(id => id !== proyectoID);
      } else {
        return [...prev, proyectoID];
      }
    });
  };

  const handleSeleccionarTodos = () => {
    if (proyectosSeleccionados.length === proyectos.length) {
      setProyectosSeleccionados([]);
    } else {
      setProyectosSeleccionados(proyectos.map(p => p.proyectoID));
    }
  };

  const handleGenerarFactura = async () => {
    if (proyectosSeleccionados.length === 0) {
      alert('Por favor seleccione al menos un proyecto');
      return;
    }

    if (!window.confirm(`¿Está seguro de generar una factura grupal para ${proyectosSeleccionados.length} proyecto(s)?`)) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const facturaData = {
        proyectoIDs: proyectosSeleccionados,
        fecha_emision: new Date().toISOString().split('T')[0],
        estado: 'Pendiente'
      };

      const response = await createFacturaGrupal(facturaData);
      
      if (response?.status === 'success') {
        setFacturaGenerada(response.data);
        alert('Factura grupal creada exitosamente');
        // Limpiar selección y recargar proyectos
        setProyectosSeleccionados([]);
        await handleBuscar(); // Recargar para actualizar la lista
      } else {
        throw new Error(response?.message || 'Error al crear la factura');
      }
    } catch (err) {
      console.error('Error generando factura:', err);
      alert('Error al generar factura: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!facturaGenerada) {
      alert('Primero debe generar una factura');
      return;
    }
    // Recargar la factura completa con todos los detalles
    try {
      const facturaCompleta = facturaGenerada;
      await generarPDFGrupal(facturaCompleta, filters);
    } catch (err) {
      console.error('Error exportando PDF:', err);
      alert('Error al exportar PDF: ' + (err.message || 'Error desconocido'));
    }
  };

  const clienteSeleccionado = clientes.find(c => c.clienteID === parseInt(filters.clienteID));
  
  // Calcular totales de proyectos seleccionados
  const proyectosSeleccionadosData = proyectos.filter(p => proyectosSeleccionados.includes(p.proyectoID));
  const subtotalSeleccionado = proyectosSeleccionadosData.reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
  const impuestoSeleccionado = subtotalSeleccionado * 0.18;
  const totalSeleccionado = subtotalSeleccionado + impuestoSeleccionado;

  return (
    <div className="factura-grupal-container">
      <div className="factura-grupal-header">
        <button onClick={() => navigate('/facturacion')} className="btn-volver">
          <FaArrowLeft /> Volver
        </button>
        <h1>Facturación Grupal por Cliente</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Filtros */}
      <div className="filtros-section">
        <h3>Filtros de Búsqueda</h3>
        <div className="filtros-grid">
          <div className="filtro-item">
            <label>Cliente:</label>
            {loadingClientes ? (
              <select disabled>
                <option>Cargando clientes...</option>
              </select>
            ) : clientes.length === 0 ? (
              <select disabled>
                <option>No hay clientes disponibles</option>
              </select>
            ) : (
              <select
                value={filters.clienteID}
                onChange={(e) => setFilters({ ...filters, clienteID: e.target.value })}
              >
                <option value="">-- Seleccione un cliente --</option>
                {clientes.map(cliente => (
                  <option key={cliente.clienteID} value={cliente.clienteID}>
                    {cliente.nombre} - {cliente.dni_ruc || 'Sin documento'}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="filtro-item">
            <label>Fecha Desde:</label>
            <input
              type="date"
              value={filters.fecha_desde}
              onChange={(e) => setFilters({ ...filters, fecha_desde: e.target.value })}
            />
          </div>

          <div className="filtro-item">
            <label>Fecha Hasta:</label>
            <input
              type="date"
              value={filters.fecha_hasta}
              onChange={(e) => setFilters({ ...filters, fecha_hasta: e.target.value })}
            />
          </div>

          <div className="filtro-item">
            <button onClick={handleBuscar} className="btn-buscar" disabled={loading}>
              <FaSearch /> {loading ? 'Buscando...' : 'Buscar Proyectos'}
            </button>
          </div>
        </div>
      </div>

      {/* Lista de proyectos disponibles */}
      {proyectos.length > 0 && (
        <div className="proyectos-section">
          <div className="proyectos-header">
            <h3>Proyectos Disponibles ({proyectos.length})</h3>
            <button onClick={handleSeleccionarTodos} className="btn-seleccionar-todos">
              {proyectosSeleccionados.length === proyectos.length ? (
                <>Desmarcar Todos</>
              ) : (
                <>Seleccionar Todos</>
              )}
            </button>
          </div>

          <div className="proyectos-list">
            <table className="proyectos-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Diseñador</th>
                  <th>Fecha Inicio</th>
                  <th>Fecha Entrega</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {proyectos.map(proyecto => {
                  const isSelected = proyectosSeleccionados.includes(proyecto.proyectoID);
                  return (
                    <tr 
                      key={proyecto.proyectoID}
                      className={isSelected ? 'selected' : ''}
                      onClick={() => handleToggleProyecto(proyecto.proyectoID)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        {isSelected ? <FaCheckSquare style={{ color: '#117b9b' }} /> : <FaSquare />}
                      </td>
                      <td>#{proyecto.proyectoID}</td>
                      <td>{proyecto.nombre || 'N/A'}</td>
                      <td>{proyecto.empleado?.nombre || 'N/A'}</td>
                      <td>{formatFecha(proyecto.fecha_inicio)}</td>
                      <td>{formatFecha(proyecto.fecha_entrega)}</td>
                      <td>{formatMoneda(proyecto.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Resumen de selección */}
          {proyectosSeleccionados.length > 0 && (
            <div className="resumen-seleccion">
              <h4>Resumen de Selección</h4>
              <div className="resumen-datos">
                <p><strong>Proyectos seleccionados:</strong> {proyectosSeleccionados.length}</p>
                <p><strong>Subtotal:</strong> {formatMoneda(subtotalSeleccionado)}</p>
                <p><strong>Impuesto (18%):</strong> {formatMoneda(impuestoSeleccionado)}</p>
                <p><strong>Total:</strong> {formatMoneda(totalSeleccionado)}</p>
              </div>
              <button onClick={handleGenerarFactura} className="btn-generar-factura" disabled={loading}>
                {loading ? 'Generando...' : 'Generar Factura Grupal'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Factura generada */}
      {facturaGenerada && (
        <div className="factura-generada-section" id="factura-grupal-content">
          <div className="factura-grupal-content">
            {/* Encabezado con logo */}
            <div className="factura-encabezado">
              <div className="logo-container">
                <img src={logoImage} alt="Logo" className="logo-factura" />
              </div>
              <div className="empresa-info">
                <h1>FACTURA GRUPAL</h1>
                <p className="numero-factura">N° {facturaGenerada.numero_factura}</p>
                <p className="periodo-factura">
                  Cliente: {clienteSeleccionado?.nombre || 'N/A'}
                </p>
              </div>
            </div>

            {/* Información de la empresa y cliente */}
            <div className="factura-info-section">
              <div className="empresa-datos">
                <h3>Datos de la Empresa</h3>
                <p><strong>MAER</strong></p>
                <p>Servicios Odontológicos</p>
                <p>Lima, Perú</p>
              </div>

              <div className="cliente-datos">
                <h3>Datos del Cliente</h3>
                <p><strong>Nombre:</strong> {clienteSeleccionado?.nombre || 'N/A'}</p>
                <p><strong>Documento:</strong> {clienteSeleccionado?.dni_ruc || 'N/A'}</p>
                <p><strong>Dirección:</strong> {clienteSeleccionado?.direccion || 'N/A'}</p>
                <p><strong>Email:</strong> {clienteSeleccionado?.email || 'N/A'}</p>
              </div>
            </div>

            {/* Detalle completo agrupado por proyecto */}
              <div className="detalles-completos-section">
                <h3>Detalle Completo de Facturación (Agrupado por Proyecto)</h3>
                <table className="factura-detalles-table">
                  <thead>
                    <tr>
                      <th>Proyecto</th>
                      <th>Tratamientos</th>
                      <th>Cantidad de Piezas</th>
                      <th>Precio Unitario Promedio</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facturaGenerada.detalles && facturaGenerada.detalles.length > 0 ? (
                      facturaGenerada.detalles.map((detalle, idx) => {
                        const descripcion = detalle.descripcion || '';
                        // Formato: "Proyecto #X - Tratamiento1, Tratamiento2, ..."
                        const partes = descripcion.split(' - ');
                        const proyectoParte = partes[0] || '';
                        const tratamientos = partes[1] || 'N/A';
                        
                        return (
                          <tr key={idx}>
                            <td><strong>{proyectoParte}</strong></td>
                            <td>{tratamientos}</td>
                            <td>{detalle.cantidad || 1}</td>
                            <td>{formatMoneda(detalle.precio_unitario)}</td>
                            <td><strong>{formatMoneda(detalle.subtotal)}</strong></td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center' }}>No hay detalles</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            {/* Totales consolidados */}
            <div className="factura-totales-section">
              <div className="totales-grid">
                <div className="total-item">
                  <span className="total-label">Subtotal Consolidado:</span>
                  <span className="total-value">{formatMoneda(facturaGenerada.subtotal)}</span>
                </div>
                <div className="total-item">
                  <span className="total-label">Impuesto Consolidado (IGV 18%):</span>
                  <span className="total-value">{formatMoneda(facturaGenerada.impuesto)}</span>
                </div>
                <div className="total-item">
                  <span className="total-label">Descuento Consolidado:</span>
                  <span className="total-value">{formatMoneda(facturaGenerada.descuento)}</span>
                </div>
                <div className="total-item total-final">
                  <span className="total-label">Total Consolidado:</span>
                  <span className="total-value">{formatMoneda(facturaGenerada.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botón exportar PDF */}
          <div className="export-section">
            <button onClick={handleExportPDF} className="btn-export-pdf">
              <FaFilePdf /> Exportar Factura Grupal a PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
