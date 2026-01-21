import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getReportes } from "../../api/reportes";
import { getClientes } from "../../api/clientesApi";
import {
  getClienteId,
  getEmpleadoId,
  getClienteNombre,
  getEmpleadoNombre,
} from "../../utils/proyectoHelpers";
import "../../styles/dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState({
    total_proyectos: 0,
    total_unidades: 0,
    total_clientes: 0,
    total_disenadores: 0,
    total_facturacion: 0,
    total_comisiones: 0,
  });
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [datosMensuales, setDatosMensuales] = useState([]);
  const [unidadesPorTratamiento, setUnidadesPorTratamiento] = useState([]);
  
  const [clientes, setClientes] = useState([]);
  const [diseñadores, setDiseñadores] = useState([]);
  
  const [filtro, setFiltro] = useState({
    fechaInicio: "",
    fechaFin: "",
    clienteID: "",
    diseñadorID: "",
  });

  const cargarDashboard = async (filtrosActuales = null) => {
    try {
      setLoading(true);
      const filtrosAUsar = filtrosActuales !== null ? filtrosActuales : filtro;
      
      // Construir objeto de filtros, solo incluyendo valores no vacíos
      const filters = {};
      if (filtrosAUsar.fechaInicio && filtrosAUsar.fechaInicio.trim() !== '') {
        filters.fechaInicio = filtrosAUsar.fechaInicio;
      }
      if (filtrosAUsar.fechaFin && filtrosAUsar.fechaFin.trim() !== '') {
        filters.fechaFin = filtrosAUsar.fechaFin;
      }
      if (filtrosAUsar.clienteID && filtrosAUsar.clienteID !== '') {
        filters.clienteID = filtrosAUsar.clienteID;
      }
      if (filtrosAUsar.diseñadorID && filtrosAUsar.diseñadorID !== '') {
        filters.diseñadorID = filtrosAUsar.diseñadorID;
      }
      
      const data = await getReportes(filters);
      
      // Actualizar todos los estados con los datos filtrados
      setDashboard(data.dashboard || {
        total_proyectos: 0,
        total_unidades: 0,
        total_clientes: 0,
        total_disenadores: 0,
        total_facturacion: 0,
        total_comisiones: 0,
      });
      setReportes(data.report || []);
      
      // Calcular datos mensuales basados en reportes filtrados
      const mensual = calcularDatosMensuales(data.report || []);
      setDatosMensuales(mensual);
      
      // Calcular unidades por tratamiento basadas en reportes filtrados
      const porTratamiento = calcularUnidadesPorTratamiento(data.report || []);
      setUnidadesPorTratamiento(porTratamiento);
    } catch (err) {
      console.error("Error cargando dashboard:", err);
      // Si es un error 401 (no autenticado), redirigir al login
      if (err.status === 401 || err.message?.includes('Unauthorized') || err.message?.includes('Unauthenticated')) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");
        navigate("/", { replace: true });
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar clientes y diseñadores
        const resClientes = await getClientes();
        let listaClientes = [];
        if (Array.isArray(resClientes)) listaClientes = resClientes;
        else if (Array.isArray(resClientes?.data)) listaClientes = resClientes.data;
        else if (Array.isArray(resClientes?.clientes)) listaClientes = resClientes.clientes;
        setClientes(listaClientes);

        // Cargar diseñadores
        const token = localStorage.getItem("auth_token");
        const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
        const respuesta = await fetch(`${API_BASE}/api/usuarios`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await respuesta.json().catch(() => ({}));
        const todosUsuarios = Array.isArray(data.data) ? data.data : [];
        const listaDiseñadores = todosUsuarios.filter((u) => {
          const rolId = u.rolID || u.rol?.rolID;
          return rolId === 1 || rolId === 2;
        });
        setDiseñadores(listaDiseñadores);

        // Cargar reportes con filtros
        await cargarDashboard();
      } catch (err) {
        console.error("Error cargando datos:", err);
        // Si es un error 401 (no autenticado), redirigir al login
        if (err.status === 401 || err.message?.includes('Unauthorized') || err.message?.includes('Unauthenticated')) {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_data");
          navigate("/", { replace: true });
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const calcularDatosMensuales = (reportes) => {
    const meses = {};
    
    reportes.forEach((r) => {
      if (r.FechaInicio) {
        try {
          const fecha = new Date(r.FechaInicio);
          if (!isNaN(fecha.getTime())) {
            const año = fecha.getFullYear();
            const mes = fecha.getMonth();
            const clave = `${año}-${String(mes + 1).padStart(2, '0')}`;
            const mesLabel = fecha.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
            
            if (!meses[clave]) {
              meses[clave] = { 
                proyectos: 0, 
                unidades: 0,
                facturacion: 0,
                comisiones: 0,
                mes: mesLabel,
                fecha: fecha
              };
            }
            meses[clave].proyectos++;
            meses[clave].unidades += parseInt(r.Unidades) || 0;
            meses[clave].facturacion += parseFloat(r.PrecioTotal || 0);
            meses[clave].comisiones += parseFloat(r.ComisionDiseñador || 0);
          }
        } catch (e) {
          console.warn("Error procesando fecha:", r.FechaInicio, e);
        }
      }
    });

    return Object.values(meses)
      .sort((a, b) => a.fecha - b.fecha)
      .slice(-6) // Últimos 6 meses
      .map(({ fecha, ...rest }) => rest); // Remover fecha del objeto final
  };

  const calcularUnidadesPorTratamiento = (reportes) => {
    const tratamientos = {};
    
    reportes.forEach((r) => {
      if (r.Detalle_Proyecto && typeof r.Detalle_Proyecto === 'string') {
        // Parsear "pieza+tratamiento, pieza+tratamiento, ..."
        const detalles = r.Detalle_Proyecto.split(',').map(d => d.trim()).filter(d => d);
        detalles.forEach(detalle => {
          // Buscar el último '+' que separa pieza de tratamiento
          const lastPlusIndex = detalle.lastIndexOf('+');
          if (lastPlusIndex > 0 && lastPlusIndex < detalle.length - 1) {
            const tratamiento = detalle.substring(lastPlusIndex + 1).trim();
            // Capitalizar primera letra
            const tratamientoFormateado = tratamiento 
              ? tratamiento.charAt(0).toUpperCase() + tratamiento.slice(1).toLowerCase()
              : '';
            
            if (tratamientoFormateado && tratamientoFormateado !== 'Otro' && tratamientoFormateado !== '') {
              if (!tratamientos[tratamientoFormateado]) {
                tratamientos[tratamientoFormateado] = 0;
              }
              tratamientos[tratamientoFormateado]++;
            }
          }
        });
      }
    });

    return Object.entries(tratamientos)
      .map(([tratamiento, unidades]) => ({ tratamiento, unidades }))
      .sort((a, b) => b.unidades - a.unidades);
  };

  const calcularProyeccion = (datosMensuales) => {
    if (datosMensuales.length < 2) {
      return [];
    }

    // Calcular tendencia lineal simple
    const n = datosMensuales.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    datosMensuales.forEach((d, idx) => {
      const x = idx + 1;
      const y = d.unidades;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });

    const denominador = (n * sumX2 - sumX * sumX);
    if (denominador === 0) {
      // Si no hay variación, usar el promedio
      const promedio = sumY / n;
      const ultimoMes = datosMensuales[datosMensuales.length - 1];
      const ultimaFecha = new Date();
      ultimaFecha.setMonth(ultimaFecha.getMonth() - (n - 1));
      
      const proyecciones = [];
      for (let i = 1; i <= 3; i++) {
        const fechaProyeccion = new Date(ultimaFecha);
        fechaProyeccion.setMonth(ultimaFecha.getMonth() + n + i - 1);
        
        proyecciones.push({
          mes: fechaProyeccion.toLocaleString('es-ES', { month: 'short', year: 'numeric' }),
          unidades: Math.max(0, Math.round(promedio)),
          fecha: fechaProyeccion,
          esProyeccion: true
        });
      }
      return proyecciones;
    }

    const pendiente = (n * sumXY - sumX * sumY) / denominador;
    const intercepto = (sumY - pendiente * sumX) / n;

    // Generar proyección para los próximos 3 meses
    const proyecciones = [];
    const hoy = new Date();
    const ultimoMes = datosMensuales[datosMensuales.length - 1];
    
    // Intentar parsear la fecha del último mes
    let ultimaFecha = new Date();
    try {
      // El formato es "mes año" como "dic 2024"
      const partes = ultimoMes.mes.split(' ');
      if (partes.length >= 2) {
        const meses = {
          'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
          'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
        };
        const mes = meses[partes[0].toLowerCase()] ?? hoy.getMonth();
        const año = parseInt(partes[1]) || hoy.getFullYear();
        ultimaFecha = new Date(año, mes, 1);
      }
    } catch (e) {
      // Si falla, usar la fecha actual menos (n-1) meses
      ultimaFecha = new Date();
      ultimaFecha.setMonth(hoy.getMonth() - (n - 1));
    }
    
    for (let i = 1; i <= 3; i++) {
      const fechaProyeccion = new Date(ultimaFecha);
      fechaProyeccion.setMonth(ultimaFecha.getMonth() + i);
      
      const xProyeccion = n + i;
      const unidadesProyectadas = Math.max(0, Math.round(pendiente * xProyeccion + intercepto));
      
      proyecciones.push({
        mes: fechaProyeccion.toLocaleString('es-ES', { month: 'short', year: 'numeric' }),
        unidades: unidadesProyectadas,
        fecha: fechaProyeccion,
        esProyeccion: true
      });
    }

    return proyecciones;
  };

  // Calcular valores máximos para los gráficos (usando datos filtrados)
  const maxProyectos = datosMensuales.length > 0 
    ? Math.max(...datosMensuales.map(d => d.proyectos || 0), 1) 
    : 1;
  const maxUnidades = datosMensuales.length > 0
    ? Math.max(...datosMensuales.map(d => d.unidades || 0), 1)
    : 1;
  const maxFacturacion = datosMensuales.length > 0
    ? Math.max(...datosMensuales.map(d => (d.facturacion || 0)), 1)
    : 1;
  const totalUnidadesTratamiento = unidadesPorTratamiento.length > 0
    ? unidadesPorTratamiento.reduce((sum, t) => sum + t.unidades, 0)
    : 0;
  
  // Calcular proyección basada en datos filtrados
  const proyecciones = calcularProyeccion(datosMensuales);
  const datosConProyeccion = [...datosMensuales, ...proyecciones];
  const maxUnidadesConProyeccion = datosConProyeccion.length > 0
    ? Math.max(...datosConProyeccion.map(d => d.unidades || 0), 1)
    : 1;

  if (loading) {
    return <div className="dashboard-container"><p>Cargando dashboard...</p></div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard de Reportes</h1>
        <button className="btn-volver" onClick={() => navigate('/reportes')}>
          ← Volver a Reportes
        </button>
      </div>

      <div className="dashboard-filtros">
        <h3>Filtros</h3>
        <div className="filtros-container">
          <label>
            Fecha de Inicio:
            <input
              type="date"
              value={filtro.fechaInicio}
              onChange={(e) =>
                setFiltro({ ...filtro, fechaInicio: e.target.value })
              }
            />
          </label>

          <label>
            Fecha Hasta:
            <input
              type="date"
              value={filtro.fechaFin}
              onChange={(e) =>
                setFiltro({ ...filtro, fechaFin: e.target.value })
              }
            />
          </label>

          <label>
            Cliente:
            <select
              value={filtro.clienteID}
              onChange={(e) => setFiltro({ ...filtro, clienteID: e.target.value })}
            >
              <option value="">-- Seleccionar Cliente --</option>
              {clientes.map((c) => (
                <option key={getClienteId(c)} value={getClienteId(c)}>
                  {getClienteNombre(c)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Diseñador:
            <select
              value={filtro.diseñadorID}
              onChange={(e) =>
                setFiltro({ ...filtro, diseñadorID: e.target.value })
              }
            >
              <option value="">-- Seleccionar Diseñador --</option>
              {diseñadores.map((d, idx) => {
                const empId = getEmpleadoId(d);
                const userId = d.id || d.userID || `user-${idx}`;
                return (
                  <option key={`diseñador-${userId}-${empId}-${idx}`} value={empId}>
                    {getEmpleadoNombre(d)}
                  </option>
                );
              })}
            </select>
          </label>
        </div>

        <div className="dashboard-botones-filtro">
          <button className="btn-aplicar-filtro" onClick={() => {
            // Asegurar que se usen los filtros actuales del estado
            cargarDashboard(filtro);
          }}>
            Aplicar Filtros
          </button>
          <button className="btn-limpiar-filtro" onClick={() => {
            const filtrosLimpios = {
              fechaInicio: "",
              fechaFin: "",
              clienteID: "",
              diseñadorID: "",
            };
            setFiltro(filtrosLimpios);
            cargarDashboard(filtrosLimpios);
          }}>
            Limpiar Filtros
          </button>
        </div>
      </div>

      <div className="dashboard-cards">
        <div className="card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h3>Total Proyectos</h3>
            <p className="card-value">{dashboard.total_proyectos}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-icon">🔢</div>
          <div className="card-content">
            <h3>Total Unidades</h3>
            <p className="card-value">{dashboard.total_unidades}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <h3>Total Clientes</h3>
            <p className="card-value">{dashboard.total_clientes}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-icon">🎨</div>
          <div className="card-content">
            <h3>Total Diseñadores</h3>
            <p className="card-value">{dashboard.total_disenadores}</p>
          </div>
        </div>
        <div className="card card-financial">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>Total Facturación</h3>
            <p className="card-value">${dashboard.total_facturacion?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</p>
          </div>
        </div>
        <div className="card card-financial">
          <div className="card-icon">💵</div>
          <div className="card-content">
            <h3>Total Comisiones</h3>
            <p className="card-value">${dashboard.total_comisiones?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</p>
          </div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-card">
          <h3>Proyectos por Mes (Últimos 6 meses)</h3>
          {datosMensuales.length > 0 ? (
            <div className="bar-chart-container">
              <div className="y-axis">
                {[maxProyectos, Math.ceil(maxProyectos * 0.75), Math.ceil(maxProyectos * 0.5), Math.ceil(maxProyectos * 0.25), 0].map((val, idx) => (
                  <div key={idx} className="y-axis-label">{val}</div>
                ))}
              </div>
              <div className="bar-chart">
                {datosMensuales.map((d, idx) => (
                  <div key={idx} className="bar-item">
                    <div className="bar-value-top">{d.proyectos}</div>
                    <div className="bar-wrapper">
                      <div 
                        className="bar" 
                        style={{ 
                          height: `${(d.proyectos / maxProyectos) * 100}%`,
                          backgroundColor: '#268dcc'
                        }}
                      >
                      </div>
                    </div>
                    <div className="bar-label">
                      <span className="bar-value-bottom">{d.proyectos}</span>
                      <span className="bar-month">{d.mes}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-data-message">No hay datos disponibles</div>
          )}
        </div>

        <div className="chart-card">
          <h3>Unidades por Mes (Últimos 6 meses)</h3>
          {datosMensuales.length > 0 ? (
            <div className="bar-chart-container">
              <div className="y-axis">
                {[maxUnidades, Math.ceil(maxUnidades * 0.75), Math.ceil(maxUnidades * 0.5), Math.ceil(maxUnidades * 0.25), 0].map((val, idx) => (
                  <div key={idx} className="y-axis-label">{val}</div>
                ))}
              </div>
              <div className="bar-chart">
                {datosMensuales.map((d, idx) => (
                  <div key={idx} className="bar-item">
                    <div className="bar-value-top">{d.unidades}</div>
                    <div className="bar-wrapper">
                      <div 
                        className="bar" 
                        style={{ 
                          height: `${(d.unidades / maxUnidades) * 100}%`,
                          backgroundColor: '#27ae60'
                        }}
                      >
                      </div>
                    </div>
                    <div className="bar-label">
                      <span className="bar-value-bottom">{d.unidades}</span>
                      <span className="bar-month">{d.mes}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="no-data-message">No hay datos disponibles</div>
          )}
        </div>

        <div className="chart-card">
          <h3>Facturación por Mes (Últimos 6 meses)</h3>
          {datosMensuales.length > 0 && maxFacturacion > 0 ? (
            <div className="bar-chart-container">
              <div className="y-axis y-axis-money">
                {[maxFacturacion, Math.ceil(maxFacturacion * 0.75), Math.ceil(maxFacturacion * 0.5), Math.ceil(maxFacturacion * 0.25), 0].map((val, idx) => (
                  <div key={idx} className="y-axis-label">${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                ))}
              </div>
              <div className="bar-chart">
                {datosMensuales.map((d, idx) => {
                  const facturacion = d.facturacion || 0;
                  return (
                    <div key={idx} className="bar-item">
                      <div className="bar-value-top">${facturacion.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                      <div className="bar-wrapper">
                        <div 
                          className="bar" 
                          style={{ 
                            height: `${maxFacturacion > 0 ? (facturacion / maxFacturacion) * 100 : 0}%`,
                            backgroundColor: '#f39c12'
                          }}
                        >
                        </div>
                      </div>
                      <div className="bar-label">
                        <span className="bar-value-bottom">${facturacion.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                        <span className="bar-month">{d.mes}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="no-data-message">No hay datos disponibles</div>
          )}
        </div>

        <div className="chart-card">
          <h3>Proyección de Unidades (Próximos 3 meses)</h3>
          {proyecciones.length > 0 ? (
            <div className="projection-chart">
              <div className="projection-info">
                <p className="projection-note">
                  Proyección basada en tendencia histórica
                </p>
              </div>
              <div className="bar-chart-container-projection">
                <div className="y-axis">
                  {[maxUnidadesConProyeccion, Math.ceil(maxUnidadesConProyeccion * 0.75), Math.ceil(maxUnidadesConProyeccion * 0.5), Math.ceil(maxUnidadesConProyeccion * 0.25), 0].map((val, idx) => (
                    <div key={idx} className="y-axis-label">{val}</div>
                  ))}
                </div>
                <div className="bar-chart-projection">
                  {datosMensuales.slice(-3).map((d, idx) => (
                    <div key={`hist-${idx}`} className="bar-item-projection">
                      <div className="bar-value-top-projection">{d.unidades}</div>
                      <div className="bar-wrapper-projection">
                        <div 
                          className="bar-historical" 
                          style={{ 
                            height: `${(d.unidades / maxUnidadesConProyeccion) * 100}%`,
                          }}
                        >
                        </div>
                      </div>
                      <div className="bar-label-projection">
                        <span className="bar-value-bottom-projection">{d.unidades}</span>
                        <span className="bar-month-projection">{d.mes}</span>
                      </div>
                    </div>
                  ))}
                  <div className="projection-divider">
                    <div className="divider-line"></div>
                    <span className="divider-text">Proyección</span>
                    <div className="divider-line"></div>
                  </div>
                  {proyecciones.map((d, idx) => (
                    <div key={`proj-${idx}`} className="bar-item-projection">
                      <div className="bar-value-top-projection">{d.unidades}</div>
                      <div className="bar-wrapper-projection">
                        <div 
                          className="bar-projection" 
                          style={{ 
                            height: `${(d.unidades / maxUnidadesConProyeccion) * 100}%`,
                          }}
                        >
                        </div>
                      </div>
                      <div className="bar-label-projection">
                        <span className="bar-value-bottom-projection">{d.unidades}</span>
                        <span className="bar-month-projection">{d.mes}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="no-data-message">
              Se requieren al menos 2 meses de datos para calcular la proyección
            </div>
          )}
        </div>

        <div className="chart-card">
          <h3>Unidades por Tratamiento</h3>
          {unidadesPorTratamiento.length > 0 ? (
            <div className="pie-chart-container">
              <svg width="100%" height="280" className="pie-chart-svg" viewBox="0 0 280 280">
                <g transform="translate(140, 140)">
                  {(() => {
                    let currentAngle = -90;
                    const colors = ['#268dcc', '#27ae60', '#f39c12', '#e74c3c', '#9b59b6', '#3498db', '#1abc9c', '#e67e22'];
                    const radius = 110;
                    
                    return unidadesPorTratamiento.map((item, idx) => {
                      const porcentaje = totalUnidadesTratamiento > 0 ? (item.unidades / totalUnidadesTratamiento) * 100 : 0;
                      const angle = (porcentaje / 100) * 360;
                      const startAngle = currentAngle;
                      const endAngle = currentAngle + angle;
                      
                      const startAngleRad = (startAngle * Math.PI) / 180;
                      const endAngleRad = (endAngle * Math.PI) / 180;
                      
                      const x1 = radius * Math.cos(startAngleRad);
                      const y1 = radius * Math.sin(startAngleRad);
                      const x2 = radius * Math.cos(endAngleRad);
                      const y2 = radius * Math.sin(endAngleRad);
                      
                      const largeArc = angle > 180 ? 1 : 0;
                      
                      const pathData = [
                        `M 0 0`,
                        `L ${x1} ${y1}`,
                        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                        `Z`
                      ].join(' ');
                      
                      const color = colors[idx % colors.length];
                      currentAngle = endAngle;
                      
                      const labelAngle = (startAngle + endAngle) / 2;
                      const labelRadius = radius * 0.75;
                      const labelAngleRad = (labelAngle * Math.PI) / 180;
                      const labelX = labelRadius * Math.cos(labelAngleRad);
                      const labelY = labelRadius * Math.sin(labelAngleRad);
                      
                      // Posición para el nombre del tratamiento (más cerca del borde)
                      const nameRadius = radius * 0.85;
                      const nameX = nameRadius * Math.cos(labelAngleRad);
                      const nameY = nameRadius * Math.sin(labelAngleRad);
                      
                      return (
                        <g key={idx}>
                          <path
                            d={pathData}
                            fill={color}
                            stroke="#fff"
                            strokeWidth="2"
                            className="pie-slice"
                          >
                            <title>{item.tratamiento}: {item.unidades} unidades ({porcentaje.toFixed(1)}%)</title>
                          </path>
                          {porcentaje > 8 && (
                            <>
                              <text
                                x={labelX}
                                y={labelY}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#fff"
                                fontSize="12"
                                fontWeight="700"
                                className="pie-label-text"
                              >
                                {porcentaje.toFixed(0)}%
                              </text>
                              <text
                                x={nameX}
                                y={nameY + 15}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#fff"
                                fontSize="10"
                                fontWeight="600"
                                className="pie-name-text"
                              >
                                {item.tratamiento}
                              </text>
                            </>
                          )}
                          {porcentaje <= 8 && porcentaje > 3 && (
                            <text
                              x={labelX}
                              y={labelY}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="#fff"
                              fontSize="10"
                              fontWeight="700"
                              className="pie-label-text"
                            >
                              {porcentaje.toFixed(0)}%
                            </text>
                          )}
                        </g>
                      );
                    });
                  })()}
                </g>
              </svg>
              <div className="pie-legend-compact">
                {unidadesPorTratamiento.map((item, idx) => {
                  const porcentaje = totalUnidadesTratamiento > 0 ? (item.unidades / totalUnidadesTratamiento) * 100 : 0;
                  const colors = ['#268dcc', '#27ae60', '#f39c12', '#e74c3c', '#9b59b6', '#3498db', '#1abc9c', '#e67e22'];
                  return (
                    <div key={idx} className="pie-legend-item-compact">
                      <div 
                        className="pie-legend-color-compact" 
                        style={{ backgroundColor: colors[idx % colors.length] }}
                      ></div>
                      <span className="pie-legend-text-compact">
                        {item.tratamiento}: {item.unidades} ({porcentaje.toFixed(1)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="no-data-message">No hay datos disponibles</div>
          )}
        </div>
      </div>
    </div>
  );
}

