import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProyectoById, getProyectoFacturado } from "../../api/proyectos.js";
import "../../styles/ProyectoFacturado.css";

const tratamientosDisponibles = [
  { id: 1, nombre: "Corona", color: "#3498db", precio: 10 },
  { id: 2, nombre: "Puente", color: "#9b59b6", precio: 10 },
  { id: 3, nombre: "Incrustación", color: "#f39c12", precio: 10 },
  { id: 4, nombre: "Carilla", color: "#e74c3c", precio: 10 },
  { id: 5, nombre: "Encerado", color: "#27ae60", precio: 8 },
];

const formatearMoneda = (valor = 0) => {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(valor) || 0);
};

const formatFechaInput = (fecha) => {
  if (!fecha) return "";
  try {
    const d = new Date(fecha);
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mes}-${dia}`;
  } catch {
    return "";
  }
};

export default function ProyectoFacturado() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proyecto, setProyecto] = useState(null);
  const [facturacion, setFacturacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [filtroInicio, setFiltroInicio] = useState("");
  const [filtroFin, setFiltroFin] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const respuestaProyecto = await getProyectoById(id);
        if (!isMounted) return;
        const proyectoData =
          respuestaProyecto?.data || respuestaProyecto?.proyecto || respuestaProyecto || {};
        setProyecto(proyectoData);

        // Inicializar filtros con fechas del proyecto
        setFiltroInicio(formatFechaInput(proyectoData.fecha_inicio));
        setFiltroFin(formatFechaInput(proyectoData.fecha_entrega || proyectoData.fecha_fin));

        try {
          const respuestaFacturacion = await getProyectoFacturado(id);
          if (isMounted) {
            const facturacionData =
              respuestaFacturacion?.data || respuestaFacturacion?.facturacion || respuestaFacturacion || {};
            setFacturacion(facturacionData);
          }
        } catch (err) {
          console.warn("No se pudo cargar facturación:", err);
        }
      } catch (error) {
        console.error("Error cargando proyecto:", error);
        alert("No se pudo cargar el proyecto.");
        navigate("/proyectos", { replace: true });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [id, navigate]);

  if (loading) return <p>Cargando facturación...</p>;
  if (!proyecto) return <p>Proyecto no encontrado</p>;

  const detalles = proyecto.detalles || [];
  
  // Calcular totales basándose en los detalles del proyecto
  const calcularTotales = () => {
    let subtotal = 0;
    detalles.forEach((d) => {
      const tratamiento = tratamientosDisponibles.find((t) => t.id === d.tratamientoID);
      const precio = tratamiento?.precio || d.precio || 0;
      subtotal += precio;
    });
    // Comisión del diseñador es 35% del subtotal (como en el reporte general)
    const comision = Math.round(subtotal * 0.35 * 100) / 100; // Redondear a 2 decimales
    return { subtotal, comision };
  };

  const { subtotal, comision } = calcularTotales();
  
  // Usar valores del backend si están disponibles, sino calcular localmente
  const totalProyecto = facturacion?.total_general || subtotal || 0;
  const comisionDisenador = facturacion?.comision_total || comision || 0;
  const subtotalCalculado = facturacion?.total_general ? (totalProyecto - comisionDisenador) : subtotal;

  const generarReporte = () => setMostrarReporte(true);

  return (
    <div className="proyecto-facturado-container">
      <div className="header-facturacion">
        <h2>Facturación del Proyecto</h2>
        <button className="btn-volver" onClick={() => navigate(`/proyectos/${id}`)}>
          Volver al Detalle
        </button>
      </div>

      {/* Filtro de fechas arriba de los indicadores */}
      <div className="filtro-fechas">
        <label>
          Fecha Inicio:
          <input
            type="date"
            value={filtroInicio}
            onChange={(e) => setFiltroInicio(e.target.value)}
          />
        </label>
        <label>
          Fecha Límite:
          <input
            type="date"
            value={filtroFin}
            onChange={(e) => setFiltroFin(e.target.value)}
          />
        </label>
      </div>

      {/* Indicadores dinámicos */}
      <div className="indicadores-dinamicos">
        <div className="indicador-item indicador-total">
          <strong>Subtotal Proyecto:</strong>
          <span>{formatearMoneda(subtotalCalculado)}</span>
        </div>
        <div className="indicador-item indicador-comision">
          <strong>Comisión Diseñador (35%):</strong>
          <span>{formatearMoneda(comisionDisenador)}</span>
        </div>
        <div className="indicador-item indicador-adicional">
          <strong>Total Tratamientos:</strong>
          <span>{detalles.length}</span>
        </div>
      </div>

      {/* Botón generar reporte */}
      <div className="filtro-descarga">
        <button className="btn-generar-reporte" onClick={generarReporte}>
          Generar Reporte
        </button>
      </div>

      {/* Tabla de Facturación (solo visible después de generar reporte) */}
      {mostrarReporte && (
        <div className="tabla-facturacion-container">
          <h3 className="tabla-titulo">Detalle de Facturación</h3>
          <div className="tabla-wrapper">
            <table className="tabla-facturacion">
              <thead>
                <tr>
                  <th>Pieza</th>
                  <th>Tratamiento</th>
                  <th>Precio Unitario</th>
                  <th>Subtotal</th>
                  <th>Comisión Diseñador (35%)</th>
                </tr>
              </thead>
              <tbody>
                {detalles.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="sin-datos">No hay detalles registrados</td>
                  </tr>
                ) : (
                  detalles.map((d, index) => {
                    const tratamiento = tratamientosDisponibles.find((t) => t.id === d.tratamientoID);
                    const precio = d.precio || tratamiento?.precio || 0;
                    // Comisión del diseñador es 35% del precio (como en el reporte general)
                    const comisionItem = Math.round(precio * 0.35 * 100) / 100;
                    return (
                      <tr key={index}>
                        <td className="pieza-cell">{d.pieza}</td>
                        <td className="tratamiento-cell">{d.tratamiento?.nombre || tratamiento?.nombre || "Sin tratamiento"}</td>
                        <td className="precio-cell">{formatearMoneda(precio)}</td>
                        <td className="subtotal-cell">{formatearMoneda(precio)}</td>
                        <td className="comision-cell">{formatearMoneda(comisionItem)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="fila-subtotal">
                  <td colSpan="3" className="label-total">Subtotal (Suma de tratamientos):</td>
                  <td className="valor-total">{formatearMoneda(subtotalCalculado)}</td>
                  <td className="valor-total">{formatearMoneda(comisionDisenador)}</td>
                </tr>
                <tr className="fila-comision">
                  <td colSpan="3" className="label-comision">Comisión Total Diseñador (35% del subtotal):</td>
                  <td colSpan="2" className="valor-comision">{formatearMoneda(comisionDisenador)}</td>
                </tr>
                <tr className="fila-total-final">
                  <td colSpan="3" className="label-total-final">Total Proyecto:</td>
                  <td colSpan="2" className="valor-total-final">{formatearMoneda(totalProyecto)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
