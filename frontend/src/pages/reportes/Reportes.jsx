// src/pages/Reportes.jsx
import React, { useState, useEffect } from "react";
import { getReportes, exportReportesExcel } from "../../api/reportes";
import { getClientes } from "../../api/clientesApi";
import {
  getClienteId,
  getEmpleadoId,
  getClienteNombre,
  getEmpleadoNombre,
} from "../../utils/proyectoHelpers";
import "../../styles/reportes.css";

export default function Reportes() {
  const [dashboard, setDashboard] = useState({
    total_proyectos: 0,
    total_unidades: 0,
    total_clientes: 0,
    total_disenadores: 0,
  });

  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [clientes, setClientes] = useState([]);
  const [diseñadores, setDiseñadores] = useState([]);
  const [tiposTratamiento] = useState([
    "Corona",
    "Puente",
    "Incrustación",
    "Carilla",
    "Encerado",
  ]);

  const [filtro, setFiltro] = useState({
    fechaInicio: "",
    clienteID: "",
    diseñadorID: "",
    tipoPieza: "",
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
        const respuesta = await fetch("/api/usuarios", {
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

  const handleGenerarReporte = () => setMostrarReporte(true);

  const handleExport = async () => {
    try {
      const blob = await exportReportesExcel();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "reportes.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exportando reportes:", err);
      alert("No se pudo exportar el archivo");
    }
  };

  if (loading) return <p>Cargando reportes...</p>;

  return (
    <div className="reportes-container">
      <h2>Dashboard de Reportes</h2>

      <div className="dashboard-cards">
        <div className="card">Proyectos: {dashboard.total_proyectos}</div>
        <div className="card">Unidades: {dashboard.total_unidades}</div>
        <div className="card">Clientes: {dashboard.total_clientes}</div>
        <div className="card">Diseñadores: {dashboard.total_disenadores}</div>
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
            {diseñadores.map((d) => (
              <option key={getEmpleadoId(d)} value={getEmpleadoId(d)}>
                {getEmpleadoNombre(d)}
              </option>
            ))}
          </select>
        </label>

        <label>
          Tipo de Pieza:
          <select
            value={filtro.tipoPieza}
            onChange={(e) => setFiltro({ ...filtro, tipoPieza: e.target.value })}
          >
            <option value="">-- Seleccionar Tipo --</option>
            {tiposTratamiento.map((t, idx) => (
              <option key={idx} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button className="btn-generar" onClick={handleGenerarReporte}>
        Generar Reporte
      </button>

      {mostrarReporte && (
        <>
          <button className="btn-export" onClick={handleExport}>
            Exportar a Excel
          </button>

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
                <th>Precio Total</th>
                <th>Comisión Diseñador</th>
              </tr>
            </thead>
            <tbody>
              {reportes.length === 0 ? (
                <tr>
                  <td colSpan="12" style={{ textAlign: "center" }}>
                    No hay reportes disponibles
                  </td>
                </tr>
              ) : (
                reportes.map((r) => (
                  <tr key={r.idReporte}>
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
                    <td>{r.PrecioTotal}</td>
                    <td>{r.ComisionDiseñador}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
