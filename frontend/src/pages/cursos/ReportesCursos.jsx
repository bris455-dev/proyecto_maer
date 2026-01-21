import React, { useState, useEffect } from 'react';
import { getReportesCursos } from '../../api/cursos';
import { getCursos } from '../../api/cursos';
import { FaChartLine, FaClock, FaGraduationCap, FaDollarSign, FaFileExport, FaDownload } from 'react-icons/fa';
import './ReportesCursos.css';

export default function ReportesCursos() {
  const [reportes, setReportes] = useState({
    kpis: {},
    rankings: {},
    analisis_filtros: {},
    periodo: {}
  });
  
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    fecha_inicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fecha_fin: new Date().toISOString().split('T')[0],
    curso_id: '',
    rango_predefinido: '30dias'
  });

  useEffect(() => {
    fetchCursos();
  }, []);

  useEffect(() => {
    fetchReportes();
  }, [filters]);

  const fetchCursos = async () => {
    try {
      const response = await getCursos();
      if (response.status === 'success') {
        setCursos(response.data || []);
      }
    } catch (error) {
      console.error('Error cargando cursos:', error);
    }
  };

  const fetchReportes = async () => {
    try {
      setLoading(true);
      const response = await getReportesCursos(filters);
      if (response.status === 'success') {
        setReportes(response.data);
      }
    } catch (error) {
      console.error('Error cargando reportes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRangoPredefinido = (rango) => {
    const hoy = new Date();
    let fechaInicio;
    
    switch (rango) {
      case '30dias':
        fechaInicio = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'mes_actual':
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        break;
      case 'mes_anterior':
        fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
        setFilters(prev => ({
          ...prev,
          fecha_inicio: fechaInicio.toISOString().split('T')[0],
          fecha_fin: finMesAnterior.toISOString().split('T')[0],
          rango_predefinido: rango
        }));
        return;
      default:
        fechaInicio = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    setFilters(prev => ({
      ...prev,
      fecha_inicio: fechaInicio.toISOString().split('T')[0],
      fecha_fin: hoy.toISOString().split('T')[0],
      rango_predefinido: rango
    }));
  };

  const handleExportar = (formato) => {
    // Función para exportar reporte (CSV o PDF)
    alert(`Exportando reporte en formato ${formato.toUpperCase()}...`);
    // Aquí se implementaría la lógica de exportación
  };

  return (
    <div className="reportes-cursos-container">
      {/* Filtros de Tiempo y Alcance */}
      <div className="filtros-tiempo-section">
        <div className="filtros-row">
          <div className="filtro-group">
            <label>Rango de Fechas:</label>
            <div className="rangos-rapidos">
              <button
                className={`btn-rango ${filters.rango_predefinido === '30dias' ? 'active' : ''}`}
                onClick={() => handleRangoPredefinido('30dias')}
              >
                Últimos 30 días
              </button>
              <button
                className={`btn-rango ${filters.rango_predefinido === 'mes_actual' ? 'active' : ''}`}
                onClick={() => handleRangoPredefinido('mes_actual')}
              >
                Mes Actual
              </button>
              <button
                className={`btn-rango ${filters.rango_predefinido === 'mes_anterior' ? 'active' : ''}`}
                onClick={() => handleRangoPredefinido('mes_anterior')}
              >
                Mes Anterior
              </button>
            </div>
            <div className="fechas-personalizadas">
              <input
                type="date"
                value={filters.fecha_inicio}
                onChange={(e) => setFilters(prev => ({ ...prev, fecha_inicio: e.target.value, rango_predefinido: 'personalizado' }))}
                className="date-input"
              />
              <span>hasta</span>
              <input
                type="date"
                value={filters.fecha_fin}
                onChange={(e) => setFilters(prev => ({ ...prev, fecha_fin: e.target.value, rango_predefinido: 'personalizado' }))}
                className="date-input"
              />
            </div>
          </div>
          
          <div className="filtro-group">
            <label>Filtro por Curso:</label>
            <select
              value={filters.curso_id || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, curso_id: e.target.value }))}
              className="curso-select"
            >
              <option value="">Todos los Cursos</option>
              {cursos.map(curso => (
                <option key={curso.cursoID} value={curso.cursoID}>
                  {curso.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filtro-group">
            <label>Exportar Reporte:</label>
            <div className="export-buttons">
              <button
                className="btn-export"
                onClick={() => handleExportar('csv')}
              >
                <FaDownload /> CSV
              </button>
              <button
                className="btn-export"
                onClick={() => handleExportar('pdf')}
              >
                <FaFileExport /> PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Cargando reportes...</div>
      ) : (
        <>
          {/* Tablero de KPIs */}
          <div className="kpis-panel">
            <div className="kpi-card">
              <div className="kpi-icon kpi-icon-blue">
                <FaChartLine />
              </div>
              <div className="kpi-content">
                <h3>{reportes.kpis?.tasa_finalizacion || 0}%</h3>
                <p>Tasa de Finalización Promedio</p>
              </div>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-icon kpi-icon-green">
                <FaClock />
              </div>
              <div className="kpi-content">
                <h3>{reportes.kpis?.tiempo_promedio_leccion || 0} min</h3>
                <p>Tiempo Promedio por Lección</p>
              </div>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-icon kpi-icon-purple">
                <FaGraduationCap />
              </div>
              <div className="kpi-content">
                <h3>{reportes.kpis?.puntuacion_promedio || 0}%</h3>
                <p>Puntuación Promedio de Cuestionarios</p>
              </div>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-icon kpi-icon-orange">
                <FaDollarSign />
              </div>
              <div className="kpi-content">
                <h3>${(reportes.kpis?.ingreso_total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                <p>Ingreso Total Generado</p>
              </div>
            </div>
          </div>

          {/* Reportes por Detalle */}
          <div className="reportes-detalle">
            {/* Ranking de Rendimiento */}
            <div className="ranking-section">
              <h2>Cursos Más Populares</h2>
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th>Curso</th>
                    <th>Inscritos</th>
                    <th>Tasa de Finalización</th>
                  </tr>
                </thead>
                <tbody>
                  {reportes.rankings?.cursos_populares?.length > 0 ? (
                    reportes.rankings.cursos_populares.map((curso, index) => (
                      <tr key={curso.cursoID}>
                        <td>
                          <span className="ranking-number">{index + 1}</span>
                          {curso.nombre}
                        </td>
                        <td>{curso.total_inscritos}</td>
                        <td>
                          <div className="progress-bar-container">
                            <div 
                              className="progress-bar"
                              style={{ width: `${curso.tasa_finalizacion}%` }}
                            >
                              {curso.tasa_finalizacion}%
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="no-data">No hay datos disponibles</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="ranking-section">
              <h2>Cursos Menos Completados</h2>
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th>Curso</th>
                    <th>Inscritos</th>
                    <th>Tasa de Abandono</th>
                  </tr>
                </thead>
                <tbody>
                  {reportes.rankings?.cursos_menos_completados?.length > 0 ? (
                    reportes.rankings.cursos_menos_completados.map((curso, index) => (
                      <tr key={curso.cursoID}>
                        <td>
                          <span className="ranking-number warning">{index + 1}</span>
                          {curso.nombre}
                        </td>
                        <td>{curso.total_inscritos}</td>
                        <td>
                          <div className="progress-bar-container">
                            <div 
                              className="progress-bar warning"
                              style={{ width: `${curso.tasa_abandono}%` }}
                            >
                              {curso.tasa_abandono}%
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="no-data">No hay datos disponibles</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="ranking-section">
              <h2>Mejores Cursos por Calificación</h2>
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th>Curso</th>
                    <th>Calificación</th>
                    <th>Número de Reseñas</th>
                  </tr>
                </thead>
                <tbody>
                  {reportes.rankings?.mejores_calificados?.length > 0 ? (
                    reportes.rankings.mejores_calificados.map((curso, index) => (
                      <tr key={curso.cursoID}>
                        <td>
                          <span className="ranking-number success">{index + 1}</span>
                          {curso.nombre}
                        </td>
                        <td>
                          <div className="rating-display">
                            <span className="stars">{'★'.repeat(Math.floor(curso.calificacion))}</span>
                            <span className="rating-value">{curso.calificacion}/5</span>
                          </div>
                        </td>
                        <td>{curso.num_resenas}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="no-data">No hay datos disponibles</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Análisis de Filtros */}
          <div className="analisis-filtros">
            <div className="analisis-section">
              <h2>Popularidad por Software</h2>
              <div className="chart-container">
                {reportes.analisis_filtros?.popularidad_software?.length > 0 ? (
                  <div className="bar-chart">
                    {reportes.analisis_filtros.popularidad_software.map((item, index) => {
                      const maxInscripciones = Math.max(...reportes.analisis_filtros.popularidad_software.map(i => i.total_inscripciones));
                      const porcentaje = maxInscripciones > 0 ? (item.total_inscripciones / maxInscripciones) * 100 : 0;
                      return (
                        <div key={item.id} className="bar-item">
                          <div className="bar-label">{item.nombre}</div>
                          <div className="bar-wrapper">
                            <div 
                              className="bar"
                              style={{ width: `${porcentaje}%` }}
                            >
                              <span className="bar-value">{item.total_inscripciones}</span>
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

            <div className="analisis-section">
              <h2>Éxito por Nivel</h2>
              <table className="analisis-table">
                <thead>
                  <tr>
                    <th>Nivel</th>
                    <th>Inscripciones</th>
                    <th>Finalizados</th>
                    <th>Tasa de Finalización</th>
                  </tr>
                </thead>
                <tbody>
                  {reportes.analisis_filtros?.exito_por_nivel?.length > 0 ? (
                    reportes.analisis_filtros.exito_por_nivel.map((nivel) => (
                      <tr key={nivel.id}>
                        <td><strong>{nivel.nombre}</strong></td>
                        <td>{nivel.total_inscripciones}</td>
                        <td>{nivel.total_finalizados}</td>
                        <td>
                          <div className="progress-bar-container">
                            <div 
                              className="progress-bar"
                              style={{ width: `${nivel.tasa_finalizacion}%` }}
                            >
                              {nivel.tasa_finalizacion}%
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="no-data">No hay datos disponibles</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

