import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardKPIs, getResumenPorNivel, getUltimosCursos } from '../../api/cursos';
import { FaPlus, FaCheckCircle, FaFileAlt, FaChartLine, FaGraduationCap, FaEdit, FaEye } from 'react-icons/fa';
import './DashboardCursos.css';

export default function DashboardCursos() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  
  const [kpis, setKpis] = useState({
    total_publicados: 0,
    cursos_borrador: 0,
    nuevas_inscripciones_hoy: 0,
    nuevas_inscripciones_semana: 0,
    tasa_finalizacion_promedio: 0,
    curso_mas_popular: null
  });
  
  const [resumenNivel, setResumenNivel] = useState([]);
  const [ultimosCursos, setUltimosCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kpisLoading, setKpisLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setKpisLoading(true);
      
      // Cargar KPIs
      const kpisResponse = await getDashboardKPIs();
      if (kpisResponse.status === 'success') {
        setKpis(kpisResponse.data);
      }
      
      // Cargar resumen por nivel
      const resumenResponse = await getResumenPorNivel();
      if (resumenResponse.status === 'success') {
        setResumenNivel(resumenResponse.data);
      }
      
      // Cargar últimos cursos
      const ultimosResponse = await getUltimosCursos(5);
      if (ultimosResponse.status === 'success') {
        setUltimosCursos(ultimosResponse.data);
      }
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setLoading(false);
      setKpisLoading(false);
    }
  };

  const handleEdit = (cursoID) => {
    navigate(`/cursos/editar/${cursoID}`);
  };

  const handlePreview = (cursoID) => {
    window.open(`/cursos/preview/${cursoID}`, '_blank');
  };

  // Calcular altura máxima para el gráfico de barras
  const maxInscritos = resumenNivel.length > 0 
    ? Math.max(...resumenNivel.map(r => r.total_inscritos))
    : 1;
  const maxCursos = resumenNivel.length > 0
    ? Math.max(...resumenNivel.map(r => r.total_cursos))
    : 1;

  return (
    <div className="dashboard-cursos-container">
      {/* KPIs Destacados */}
      <div className="kpis-panel">
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-green">
            <FaCheckCircle />
          </div>
          <div className="kpi-content">
            <h3>{kpisLoading ? '...' : kpis.total_publicados}</h3>
            <p>Cursos Totales Publicados</p>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-blue">
            <FaFileAlt />
          </div>
          <div className="kpi-content">
            <h3>{kpisLoading ? '...' : kpis.cursos_borrador}</h3>
            <p>Cursos en Borrador</p>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-orange">
            <FaChartLine />
          </div>
          <div className="kpi-content">
            <h3>{kpisLoading ? '...' : kpis.nuevas_inscripciones_hoy}</h3>
            <p>Nuevas Inscripciones (Hoy)</p>
            <small className="kpi-subtext">Semana: {kpis.nuevas_inscripciones_semana}</small>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-icon kpi-icon-purple">
            <FaGraduationCap />
          </div>
          <div className="kpi-content">
            <h3>{kpisLoading ? '...' : kpis.tasa_finalizacion_promedio}%</h3>
            <p>Tasa de Finalización Promedio</p>
          </div>
        </div>
      </div>

      {/* Acción Rápida */}
      <div className="accion-rapida-section">
        <button 
          className="btn-crear-curso-principal"
          onClick={() => navigate('/cursos/nuevo')}
        >
          <FaPlus /> Crear Nuevo Curso
        </button>
      </div>

      {/* Resumen por Nivel */}
      <div className="resumen-nivel-section">
        <h2>Resumen por Nivel</h2>
        <div className="resumen-nivel-chart">
          {resumenNivel.length > 0 ? (
            <div className="chart-bars">
              {resumenNivel.map((nivel) => {
                const porcentajeInscritos = maxInscritos > 0 ? (nivel.total_inscritos / maxInscritos) * 100 : 0;
                const porcentajeCursos = maxCursos > 0 ? (nivel.total_cursos / maxCursos) * 100 : 0;
                
                return (
                  <div key={nivel.nivel_id} className="chart-bar-group">
                    <div className="bar-label">{nivel.nivel_nombre}</div>
                    <div className="bars-container">
                      <div className="bar-wrapper">
                        <div className="bar-label-small">Cursos: {nivel.total_cursos}</div>
                        <div className="bar-container">
                          <div 
                            className="bar bar-cursos"
                            style={{ width: `${porcentajeCursos}%` }}
                          >
                            <span className="bar-value">{nivel.total_cursos}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bar-wrapper">
                        <div className="bar-label-small">Inscritos: {nivel.total_inscritos}</div>
                        <div className="bar-container">
                          <div 
                            className="bar bar-inscritos"
                            style={{ width: `${porcentajeInscritos}%` }}
                          >
                            <span className="bar-value">{nivel.total_inscritos}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-data">No hay datos disponibles</div>
          )}
        </div>
      </div>

      {/* Tabla de Últimos Cursos */}
      <div className="ultimos-cursos-section">
        <h2>Últimos Cursos Modificados</h2>
        {loading ? (
          <div className="loading">Cargando cursos...</div>
        ) : ultimosCursos.length === 0 ? (
          <div className="no-cursos">No hay cursos modificados recientemente</div>
        ) : (
          <table className="ultimos-cursos-table">
            <thead>
              <tr>
                <th>Título del Curso</th>
                <th>Nivel</th>
                <th>Estado</th>
                <th>Inscritos</th>
                <th>Última Actualización</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ultimosCursos.map((curso) => (
                <tr key={curso.cursoID}>
                  <td>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handleEdit(curso.cursoID);
                      }}
                      className="curso-link"
                    >
                      {curso.nombre}
                    </a>
                  </td>
                  <td>{curso.nivel}</td>
                  <td>
                    <span className={`badge badge-${curso.estado.toLowerCase()}`}>
                      {curso.estado}
                    </span>
                  </td>
                  <td>{curso.total_inscritos}</td>
                  <td>{curso.ultima_actualizacion}</td>
                  <td>
                    <div className="acciones-cell">
                      <button
                        className="btn-action btn-edit"
                        onClick={() => handleEdit(curso.cursoID)}
                        title="Editar"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="btn-action btn-preview"
                        onClick={() => handlePreview(curso.cursoID)}
                        title="Previsualizar"
                      >
                        <FaEye />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
