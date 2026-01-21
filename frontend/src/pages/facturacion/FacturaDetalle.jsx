import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFacturaById } from '../../api/facturacion';
import { FaArrowLeft, FaFilePdf, FaPrint } from 'react-icons/fa';
import { generarPDF } from '../../utils/pdfGenerator';
import logoImage from '../../assets/logo.jpeg';
import '../../styles/FacturaDetalle.css';

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

export default function FacturaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [factura, setFactura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFactura();
  }, [id]);

  const fetchFactura = async () => {
    try {
      setLoading(true);
      const response = await getFacturaById(id);
      const data = response?.data || response;
      setFactura(data);
      setError('');
    } catch (err) {
      console.error('Error cargando factura:', err);
      setError(err.message || 'Error al cargar la factura');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!factura) return;
    await generarPDF();
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="factura-detalle-container">
        <div className="loading">Cargando factura...</div>
      </div>
    );
  }

  if (error || !factura) {
    return (
      <div className="factura-detalle-container">
        <div className="error-message">{error || 'Factura no encontrada'}</div>
        <button onClick={() => navigate('/facturacion')} className="btn-volver">
          <FaArrowLeft /> Volver
        </button>
      </div>
    );
  }

  const proyecto = factura.proyecto || {};
  const cliente = factura.cliente || {};
  const empleado = proyecto.empleado || {};
  const detalles = factura.detalles || [];

  return (
    <div className="factura-detalle-container">
      <div className="factura-header-actions">
        <button onClick={() => navigate('/facturacion')} className="btn-volver">
          <FaArrowLeft /> Volver
        </button>
        <div className="action-buttons">
          <button onClick={handleExportPDF} className="btn-export-pdf">
            <FaFilePdf /> Exportar PDF
          </button>
          <button onClick={handlePrint} className="btn-print">
            <FaPrint /> Imprimir
          </button>
        </div>
      </div>

      <div className="factura-content" id="factura-content">
        {/* Encabezado con logo */}
        <div className="factura-encabezado">
          <div className="logo-container">
            <img src={logoImage} alt="Logo" className="logo-factura" />
          </div>
          <div className="empresa-info">
            <h1>{factura.tipo === 'Grupal' ? 'FACTURA GRUPAL' : 'FACTURA'}</h1>
            <p className="numero-factura">N° {factura.numero_factura}</p>
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
            <p><strong>Nombre:</strong> {cliente.nombre || 'N/A'}</p>
            <p><strong>Documento:</strong> {cliente.dni_ruc || 'N/A'}</p>
            <p><strong>Dirección:</strong> {cliente.direccion || 'N/A'}</p>
            <p><strong>Email:</strong> {cliente.email || 'N/A'}</p>
          </div>
        </div>

        {/* Información del proyecto/paciente - Solo para facturas individuales */}
        {factura.tipo !== 'Grupal' && proyecto && (
          <div className="proyecto-info-section">
            <h3>Información del Proyecto</h3>
            <div className="proyecto-grid">
              <div>
                <p><strong>Nombre del Proyecto:</strong> {proyecto.nombre || 'N/A'}</p>
                <p><strong>Número de Proyecto:</strong> #{proyecto.proyectoID || 'N/A'}</p>
              </div>
              <div>
                <p><strong>Diseñador:</strong> {empleado.nombre || 'N/A'}</p>
                <p><strong>Fecha de Emisión:</strong> {formatFecha(factura.fecha_emision)}</p>
              </div>
              <div>
                <p><strong>Fecha de Inicio:</strong> {formatFecha(proyecto.fecha_inicio)}</p>
                <p><strong>Fecha de Entrega:</strong> {formatFecha(proyecto.fecha_entrega)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Detalles de la factura */}
        <div className="factura-detalles-section">
          <h3>
            {factura.tipo === 'Grupal' 
              ? 'Detalle de Facturación (Agrupado por Proyecto)' 
              : 'Detalle de Piezas y Tratamientos'}
          </h3>
          <table className="factura-detalles-table">
            <thead>
              <tr>
                {factura.tipo === 'Grupal' ? (
                  <>
                    <th>Proyecto</th>
                    <th>Tratamientos</th>
                    <th>Cantidad de Piezas</th>
                    <th>Precio Unitario</th>
                    <th>Subtotal</th>
                  </>
                ) : (
                  <>
                    <th>Pieza</th>
                    <th>Tratamiento</th>
                    <th>Cantidad</th>
                    <th>Precio Unitario</th>
                    <th>Subtotal</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {detalles.length > 0 ? (
                (() => {
                  if (factura.tipo === 'Grupal') {
                    // Agrupar detalles por proyecto
                    const detallesPorProyecto = {};
                    
                    detalles.forEach((detalle) => {
                      // Formato: "Proyecto #X - Tratamiento1, Tratamiento2, ..."
                      const partes = detalle.descripcion?.split(' - ') || [];
                      const proyectoParte = partes[0] || '';
                      const tratamientos = partes[1] || '';
                      
                      if (!detallesPorProyecto[proyectoParte]) {
                        detallesPorProyecto[proyectoParte] = {
                          proyecto: proyectoParte,
                          tratamientos: [],
                          piezas: 0,
                          subtotal: 0,
                          precios: []
                        };
                      }
                      
                      // Agregar tratamientos únicos
                      const tratamientosArray = tratamientos.split(', ').filter(t => t.trim());
                      tratamientosArray.forEach(t => {
                        if (!detallesPorProyecto[proyectoParte].tratamientos.includes(t.trim())) {
                          detallesPorProyecto[proyectoParte].tratamientos.push(t.trim());
                        }
                      });
                      
                      // Sumar piezas y subtotal
                      detallesPorProyecto[proyectoParte].piezas += detalle.cantidad || 0;
                      detallesPorProyecto[proyectoParte].subtotal += parseFloat(detalle.subtotal) || 0;
                      detallesPorProyecto[proyectoParte].precios.push(parseFloat(detalle.precio_unitario) || 0);
                    });
                    
                    // Ordenar tratamientos numéricamente y renderizar
                    return Object.values(detallesPorProyecto).map((grupo, index) => {
                      // Ordenar tratamientos numéricamente
                      grupo.tratamientos.sort((a, b) => {
                        const numA = parseInt(a) || 0;
                        const numB = parseInt(b) || 0;
                        return numA - numB;
                      });
                      
                      const tratamientosConcatenados = grupo.tratamientos.join(', ');
                      const precioPromedio = grupo.precios.length > 0 
                        ? grupo.precios.reduce((sum, p) => sum + p, 0) / grupo.precios.length 
                        : 0;
                      
                      return (
                        <tr key={index}>
                          <td><strong>{grupo.proyecto}</strong></td>
                          <td>{tratamientosConcatenados}</td>
                          <td>{grupo.piezas}</td>
                          <td>{formatMoneda(precioPromedio)}</td>
                          <td><strong>{formatMoneda(grupo.subtotal)}</strong></td>
                        </tr>
                      );
                    });
                  } else {
                    // Factura individual - formato original
                    return detalles.map((detalle, index) => (
                      <tr key={index}>
                        <td>{detalle.descripcion?.split(' - ')[0] || 'N/A'}</td>
                        <td>{detalle.descripcion?.split(' - ')[1] || detalle.descripcion || 'N/A'}</td>
                        <td>{detalle.cantidad || 1}</td>
                        <td>{formatMoneda(detalle.precio_unitario)}</td>
                        <td>{formatMoneda(detalle.subtotal)}</td>
                      </tr>
                    ));
                  }
                })()
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>No hay detalles registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="factura-totales-section">
          <div className="totales-grid">
            <div className="total-item">
              <span className="total-label">Subtotal:</span>
              <span className="total-value">{formatMoneda(factura.subtotal)}</span>
            </div>
            <div className="total-item">
              <span className="total-label">Impuesto (IGV 18%):</span>
              <span className="total-value">{formatMoneda(factura.impuesto)}</span>
            </div>
            <div className="total-item">
              <span className="total-label">Descuento:</span>
              <span className="total-value">{formatMoneda(factura.descuento)}</span>
            </div>
            <div className="total-item total-final">
              <span className="total-label">Total:</span>
              <span className="total-value">{formatMoneda(factura.total)}</span>
            </div>
          </div>
        </div>

        {/* Estado y observaciones */}
        <div className="factura-footer">
          <div className="estado-section">
            <p><strong>Estado:</strong> 
              <span className={`estado-badge estado-${factura.estado?.toLowerCase()}`}>
                {factura.estado}
              </span>
            </p>
            {factura.fecha_vencimiento && (
              <p><strong>Fecha de Vencimiento:</strong> {formatFecha(factura.fecha_vencimiento)}</p>
            )}
          </div>
          {factura.observaciones && (
            <div className="observaciones-section">
              <p><strong>Observaciones:</strong></p>
              <p>{factura.observaciones}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

