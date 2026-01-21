// src/pages/Reportes.jsx
import React, { useState, useEffect } from "react";
import { getReportes, exportReportesExcel } from "../../api/reportes";
import { getClientes } from "../../api/clientesApi";
import { useAuth } from "../../hooks/useAuth";
import {
  getClienteId,
  getEmpleadoId,
  getClienteNombre,
  getEmpleadoNombre,
} from "../../utils/proyectoHelpers";
import "../../styles/reportes.css";

export default function Reportes() {
  const { user } = useAuth();
  const esAdmin = user?.rolID === 1;

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

  const [clientes, setClientes] = useState([]);
  const [diseñadores, setDiseñadores] = useState([]);

  const [filtro, setFiltro] = useState({
    fechaInicio: "",
    fechaFin: "",
    clienteID: "",
    diseñadorID: "",
  });

  const [mostrarReporte, setMostrarReporte] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        // === Reportes ===
        const dataReportes = await getReportes();
        if (!isMounted) return;
        setDashboard(dataReportes.dashboard || {});
        setReportes(dataReportes.report || []);
      } catch (err) {
        console.error("Error cargando reportes:", err);
        alert("Error al cargar reportes");
      }

      try {
        // === Clientes ===
        const resClientes = await getClientes();
        let listaClientes = [];

        // Formatos posibles
        if (Array.isArray(resClientes)) listaClientes = resClientes;
        else if (Array.isArray(resClientes?.data)) listaClientes = resClientes.data;
        else if (Array.isArray(resClientes?.clientes)) listaClientes = resClientes.clientes;

        if (isMounted) setClientes(listaClientes);
      } catch (err) {
        console.error("Error cargando clientes:", err);
      }

      try {
        // === Diseñadores / Usuarios ===
        const token = localStorage.getItem("auth_token");
        const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
        const respuesta = await fetch(`${API_BASE}/api/usuarios`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await respuesta.json().catch(() => ({}));
        const todosUsuarios = Array.isArray(data.data) ? data.data : [];
        const listaDiseñadores = todosUsuarios.filter((u) => {
          const rolId = u.rolID || u.rol?.rolID;
          return rolId === 1 || rolId === 2; // Admin o diseñador
        });
        if (isMounted) setDiseñadores(listaDiseñadores);
      } catch (err) {
        console.error("Error cargando diseñadores:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleGenerarReporte = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtro.fechaInicio) params.append('fecha_inicio', filtro.fechaInicio);
      if (filtro.fechaFin) params.append('fecha_fin', filtro.fechaFin);
      if (filtro.clienteID) params.append('clienteID', filtro.clienteID);
      if (filtro.diseñadorID) params.append('empleadoID', filtro.diseñadorID);

      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const token = localStorage.getItem("auth_token");
      const url = `${API_BASE}/api/reportes?${params.toString()}`;
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      
      setDashboard(data.dashboard || {});
      setReportes(data.report || []);
      setMostrarReporte(true);
    } catch (err) {
      console.error("Error generando reporte:", err);
      alert("Error al generar el reporte");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      // Pasar los filtros actuales al exportar
      const exportFilters = {
        fechaInicio: filtro.fechaInicio,
        fechaFin: filtro.fechaFin,
        clienteID: filtro.clienteID,
        diseñadorID: filtro.diseñadorID,
      };
      
      const blob = await exportReportesExcel(exportFilters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reportes_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exportando reportes:", err);
      alert(err.message || "No se pudo exportar el archivo");
    }
  };

  if (loading) return <p>Cargando reportes...</p>;

  return (
    <div className="reportes-container">
      <div className="reportes-header">
        <h2>Reportes</h2>
        <button 
          className="btn-dashboard" 
          onClick={() => window.location.href = '/reportes/dashboard'}
        >
          Ver Dashboard
        </button>
      </div>

      <h2>Filtros</h2>
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

      <div className="botones-accion">
        <button className="btn-generar" onClick={handleGenerarReporte}>
          Generar Reporte
        </button>
        {mostrarReporte && (
          <button className="btn-limpiar" onClick={() => {
            setFiltro({
              fechaInicio: "",
              fechaFin: "",
              clienteID: "",
              diseñadorID: "",
            });
            setMostrarReporte(false);
            setReportes([]);
          }}>
            Limpiar Filtros
          </button>
        )}
      </div>

      {mostrarReporte && (
        <>
          {/* Indicadores de Facturación */}
          <div className="indicadores-facturacion">
            <div className="indicador-card">
              <div className="indicador-icon">💰</div>
              <div className="indicador-content">
                <h4>Total Facturación</h4>
                <p className="indicador-valor">${dashboard.total_facturacion?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</p>
                <span className="indicador-unidades">{dashboard.total_unidades} unidades</span>
              </div>
            </div>
            <div className="indicador-card">
              <div className="indicador-icon">💵</div>
              <div className="indicador-content">
                <h4>Total Comisiones</h4>
                <p className="indicador-valor">${dashboard.total_comisiones?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</p>
                <span className="indicador-unidades">35% del total</span>
              </div>
            </div>
            <div className="indicador-card">
              <div className="indicador-icon">📊</div>
              <div className="indicador-content">
                <h4>Promedio por Unidad</h4>
                <p className="indicador-valor">
                  ${dashboard.total_unidades > 0 
                    ? (dashboard.total_facturacion / dashboard.total_unidades).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '0.00'}
                </p>
                <span className="indicador-unidades">Por unidad</span>
              </div>
            </div>
          </div>

          <button className="btn-export" onClick={handleExport}>
            Exportar a Excel
          </button>

          <div className="reportes-table-wrapper">
            <table className="reportes-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Documento</th>
                  <th>Fecha Inicio</th>
                  <th>Fecha Límite</th>
                  <th>Paciente</th>
                  <th>Detalle Proyecto</th>
                  <th>Unidades</th>
                  <th>Diseñador</th>
                  <th>Notas</th>
                  {esAdmin && <th>Precio Total</th>}
                  {esAdmin && <th>Comisión Diseñador</th>}
                </tr>
              </thead>
              <tbody>
              {reportes.length === 0 ? (
                <tr>
                  <td colSpan={esAdmin ? 12 : 10} style={{ textAlign: "center" }}>
                    No hay reportes disponibles
                  </td>
                </tr>
              ) : (
                reportes.map((r, idx) => (
                  <tr key={`reporte-${r.idReporte || idx}`}>
                    <td>{r.idReporte}</td>
                    <td>{r.Cliente}</td>
                    <td>{r.Documento_Cliente}</td>
                    <td>{r.FechaInicio}</td>
                    <td>
                      {r.FechaLimite
                        ? new Date(r.FechaLimite).toLocaleDateString()
                        : ""}
                    </td>
                    <td>{r.Paciente}</td>
                    <td>{r.Detalle_Proyecto}</td>
                    <td>{r.Unidades}</td>
                    <td>{r.NombreDiseñador}</td>
                    <td>{r.Notas}</td>
                    {esAdmin && <td>${r.PrecioTotal ? parseFloat(r.PrecioTotal).toFixed(2) : '0.00'}</td>}
                    {esAdmin && <td>${r.ComisionDiseñador ? parseFloat(r.ComisionDiseñador).toFixed(2) : '0.00'}</td>}
                  </tr>
                ))
              )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
